
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let initialized=false;
const PERF_MODE=new URLSearchParams(window.location.search).get('perf')==='1';

export function initInstallationsViewer(){
const section = document.getElementById('installations');
const canvas  = document.getElementById('inst-canvas');
const scrollSafePanel = document.querySelector('.inst-hud-bottom');
const interactionUnlockButton = document.getElementById('inst-viewer-unlock');
const projectPanel = section&&section.querySelector('.inst-hud-l');
const DEBUG_3D = new URLSearchParams(window.location.search).get('debug3d') === '1';
if(initialized||!section||!canvas) return;
initialized=true;

const t0 = Date.now();
const loading = document.getElementById('inst-loading');
const fillEl  = document.getElementById('inst-fill');
const hint    = document.getElementById('inst-hint');
const tc      = document.getElementById('inst-tc');
let sectionVisible=false,rafId=0;
let renderer,scene,cam,controls;
const NORMAL_DPR_CAP=1.5;
const INTERACTION_DPR_CAP=1.0;
const LOCKED_DPR_CAP=0.6;
const QUALITY_RESTORE_DELAY=350;
const NORMAL_RENDER_FPS=30;
const INTERACTION_RENDER_FPS=45;
const LOCKED_RENDER_FPS=10;
let currentPixelRatio=0,interactionRestoreTimer=0,interactionActive=false,interactionRenderActive=false;
let lastRenderWidth=0,lastRenderHeight=0;
let lastRenderTime=0,renderRequested=true;
let viewerInteractionUnlocked=!section.classList.contains('is-locked');
const renderTimestamps=[];
const drawingBufferSize=new THREE.Vector2();
const diagnostics=DEBUG_3D?{
  model:null,
  network:null,
  renderSnapshots:new Map(),
  latestSnapshot:null,
  initialReportPrinted:false,
  forceFullReport:false,
  forceRenderReport:false
}:null;

function updateTC(){
  if(!tc) return;
  const s = Math.floor((Date.now()-t0)/1000);
  tc.textContent =
    String(Math.floor(s/3600)).padStart(2,'0')+':'+
    String(Math.floor((s%3600)/60)).padStart(2,'0')+':'+
    String(s%60).padStart(2,'0');
}

function getTargetRenderFps(){
  if(!sectionVisible||document.hidden)return 0;
  if(!viewerInteractionUnlocked)return LOCKED_RENDER_FPS;
  return interactionActive||interactionRenderActive?INTERACTION_RENDER_FPS:NORMAL_RENDER_FPS;
}
function getTargetFrameInterval(){
  const targetFps=getTargetRenderFps();
  return targetFps?1000/targetFps:Infinity;
}
function requestViewerRender(){
  renderRequested=true;
  startRenderLoop();
}
function animate(timestamp){
  rafId=0;
  if(!initialized||!sectionVisible||document.hidden) return;
  const interval=getTargetFrameInterval();
  const elapsed=timestamp-lastRenderTime;
  if(lastRenderTime&&elapsed<interval){
    rafId=requestAnimationFrame(animate);
    return;
  }
  const controlsChanged=(controls.enabled||controls.autoRotate)&&controls.update()===true;
  const requiresContinuousRender=controls.autoRotate||interactionActive||interactionRenderActive||controlsChanged;
  if(!requiresContinuousRender&&!renderRequested)return;
  updateTC();
  lastRenderTime=lastRenderTime?timestamp-(elapsed%interval):timestamp;
  renderRequested=false;
  renderer.render(scene,cam);
  if(PERF_MODE){
    renderTimestamps.push(timestamp);
    while(renderTimestamps.length&&renderTimestamps[0]<timestamp-2000)renderTimestamps.shift();
  }
  if(DEBUG_3D)captureDiagnosticRenderSnapshot();
  if(requiresContinuousRender)rafId=requestAnimationFrame(animate);
}
function startRenderLoop(){
  if(!initialized||!sectionVisible||document.hidden||!renderer||!controls||rafId) return;
  rafId=requestAnimationFrame(animate);
}
function stopRenderLoop(){
  if(rafId) cancelAnimationFrame(rafId);
  rafId=0;
  lastRenderTime=0;
}

if(PERF_MODE){
  window.NIGHTSHOT_PERF??={};
  window.NIGHTSHOT_PERF.installations=Object.freeze({
    getMetrics(){
      const now=performance.now();
      while(renderTimestamps.length&&renderTimestamps[0]<now-2000)renderTimestamps.shift();
      if(renderer)renderer.getDrawingBufferSize(drawingBufferSize);
      return {
        initialized,
        visible:sectionVisible&&!document.hidden,
        locked:!viewerInteractionUnlocked,
        interactionActive,
        targetFps:getTargetRenderFps(),
        actualRenderFps:sectionVisible&&renderTimestamps.length>1&&renderTimestamps[renderTimestamps.length-1]>renderTimestamps[0]
          ?(renderTimestamps.length-1)*1000/(renderTimestamps[renderTimestamps.length-1]-renderTimestamps[0])
          :0,
        pixelRatio:renderer?renderer.getPixelRatio():0,
        drawingBufferWidth:renderer?drawingBufferSize.x:0,
        drawingBufferHeight:renderer?drawingBufferSize.y:0,
        drawCalls:renderer?renderer.info.render.calls:0,
        triangles:renderer?renderer.info.render.triangles:0,
        geometries:renderer?renderer.info.memory.geometries:0,
        textures:renderer?renderer.info.memory.textures:0
      };
    }
  });
}

function formatDiagnosticNumber(value){
  return Number(value||0).toLocaleString('en-US');
}
function formatDiagnosticBytes(value){
  if(!Number.isFinite(value)||value<=0)return 'Unavailable';
  const units=['B','KB','MB','GB'];
  let size=value,unit=0;
  while(size>=1024&&unit<units.length-1){size/=1024;unit++;}
  return `${size.toFixed(unit?1:0)} ${units[unit]}`;
}
function collectSourceMaterialResources(root){
  const materials=new Set();
  const textures=new Set();
  const textureProperties=[
    'map','normalMap','roughnessMap','metalnessMap','emissiveMap',
    'alphaMap','aoMap','lightMap','bumpMap','displacementMap'
  ];
  root.traverse(object=>{
    if(!object.isMesh)return;
    const objectMaterials=Array.isArray(object.material)?object.material:[object.material];
    objectMaterials.forEach(material=>{if(material)materials.add(material);});
  });
  materials.forEach(material=>{
    textureProperties.forEach(property=>{
      const texture=material[property];
      if(texture&&texture.isTexture)textures.add(texture);
    });
  });
  return {materials,textures};
}
function getTextureDiagnostic(texture,index){
  const image=texture.image||texture.source?.data;
  const width=Number(image?.naturalWidth||image?.videoWidth||image?.width)||0;
  const height=Number(image?.naturalHeight||image?.videoHeight||image?.height)||0;
  return {
    name:texture.name||`Texture ${index+1}`,
    width,
    height,
    megapixels:width&&height?(width*height)/1000000:0
  };
}
function collectModelDiagnostics(root,gltf,sourceResources){
  const geometries=new Set();
  let meshCount=0,skinnedMeshCount=0,shadowCasters=0,shadowReceivers=0;
  root.traverse(object=>{
    if(!object.isMesh)return;
    meshCount++;
    if(object.isSkinnedMesh)skinnedMeshCount++;
    if(object.castShadow)shadowCasters++;
    if(object.receiveShadow)shadowReceivers++;
    if(object.geometry)geometries.add(object.geometry);
  });
  let vertexCount=0,triangleCount=0;
  geometries.forEach(geometry=>{
    const position=geometry.getAttribute?.('position');
    if(!position)return;
    vertexCount+=position.count;
    triangleCount+=(geometry.index?geometry.index.count:position.count)/3;
  });
  const textureDetails=Array.from(sourceResources.textures,getTextureDiagnostic);
  const largestTexture=textureDetails.reduce((largest,texture)=>{
    return texture.megapixels>(largest?.megapixels||0)?texture:largest;
  },null);
  return {
    meshCount,
    skinnedMeshCount,
    uniqueGeometryCount:geometries.size,
    uniqueMaterialCount:sourceResources.materials.size,
    uniqueTextureCount:sourceResources.textures.size,
    vertexCount,
    triangleCount,
    transparentMaterialCount:Array.from(sourceResources.materials).filter(material=>material.transparent).length,
    shadowCasters,
    shadowReceivers,
    animationClipCount:gltf.animations?.length||0,
    textureDetails,
    largestTexture
  };
}
function collectGLBTiming(){
  const entries=performance.getEntriesByType('resource');
  const entry=entries.find(resource=>{
    try{return decodeURIComponent(resource.name).endsWith('/SPOOK/SPOOK feli.glb');}
    catch{return resource.name.includes('SPOOK%20feli.glb');}
  });
  if(!entry)return {
    'Resource URL':'Unavailable',
    'Transfer size':'Unavailable',
    'Encoded body size':'Unavailable',
    'Decoded body size':'Unavailable',
    'Duration':'Unavailable'
  };
  return {
    'Resource URL':entry.name,
    'Transfer size':formatDiagnosticBytes(entry.transferSize),
    'Encoded body size':formatDiagnosticBytes(entry.encodedBodySize),
    'Decoded body size':formatDiagnosticBytes(entry.decodedBodySize),
    'Duration':Number.isFinite(entry.duration)?`${entry.duration.toFixed(1)} ms`:'Unavailable'
  };
}
function getShadowMapTypeName(type){
  const names={
    [THREE.BasicShadowMap]:'BasicShadowMap',
    [THREE.PCFShadowMap]:'PCFShadowMap',
    [THREE.PCFSoftShadowMap]:'PCFSoftShadowMap',
    [THREE.VSMShadowMap]:'VSMShadowMap'
  };
  return names[type]||String(type);
}
function getRendererDiagnostics(){
  let antialias='Unavailable';
  try{antialias=renderer.getContext().getContextAttributes()?.antialias??'Unavailable';}catch{}
  return {
    'Device pixel ratio':window.devicePixelRatio||1,
    'Renderer pixel ratio':renderer.getPixelRatio(),
    'Canvas CSS size':`${canvas.clientWidth} × ${canvas.clientHeight}`,
    'Drawing-buffer size':`${renderer.domElement.width} × ${renderer.domElement.height}`,
    'Antialias enabled':antialias,
    'Shadow map enabled':renderer.shadowMap.enabled,
    'Shadow map type':getShadowMapTypeName(renderer.shadowMap.type),
    'Shadow map autoUpdate':renderer.shadowMap.autoUpdate,
    'Current X-RAY state':xray?'Enabled':'Disabled',
    'Normal FPS cap':NORMAL_RENDER_FPS,
    'Interaction FPS cap':INTERACTION_RENDER_FPS,
    'Normal DPR cap':NORMAL_DPR_CAP,
    'Interaction DPR cap':INTERACTION_DPR_CAP
  };
}
function printDiagnosticRenderSnapshot(snapshot){
  console.groupCollapsed(`[NIGHTSHOT 3D] ${snapshot.mode} render snapshot`);
  console.table([snapshot]);
  console.groupEnd();
}
function printFullDiagnostics(snapshot){
  const model=diagnostics.model;
  console.groupCollapsed('[NIGHTSHOT 3D] Model diagnostics');
  console.groupCollapsed('Model structure');
  console.table([{
    'Meshes':formatDiagnosticNumber(model.meshCount),
    'Skinned meshes':formatDiagnosticNumber(model.skinnedMeshCount),
    'Animation clips':formatDiagnosticNumber(model.animationClipCount),
    'Shadow casters':formatDiagnosticNumber(model.shadowCasters),
    'Shadow receivers':formatDiagnosticNumber(model.shadowReceivers)
  }]);
  console.groupEnd();
  console.groupCollapsed('Geometry complexity');
  console.table([{
    'Unique geometries':formatDiagnosticNumber(model.uniqueGeometryCount),
    'Vertices':formatDiagnosticNumber(model.vertexCount),
    'Triangles':formatDiagnosticNumber(model.triangleCount)
  }]);
  console.groupEnd();
  console.groupCollapsed('Materials and textures');
  console.table([{
    'Unique materials':formatDiagnosticNumber(model.uniqueMaterialCount),
    'Transparent materials':formatDiagnosticNumber(model.transparentMaterialCount),
    'Unique textures':formatDiagnosticNumber(model.uniqueTextureCount),
    'Largest texture':model.largestTexture?`${model.largestTexture.name} — ${model.largestTexture.width} × ${model.largestTexture.height} (${model.largestTexture.megapixels.toFixed(2)} MP)`:'Unavailable'
  }]);
  if(model.textureDetails.length)console.table(model.textureDetails.map(texture=>({
    'Texture':texture.name,
    'Dimensions':texture.width&&texture.height?`${texture.width} × ${texture.height}`:'Unavailable',
    'Megapixels':texture.megapixels?texture.megapixels.toFixed(2):'Unavailable'
  })));
  console.groupEnd();
  console.groupCollapsed('Renderer configuration');
  console.table([getRendererDiagnostics()]);
  console.groupEnd();
  console.groupCollapsed('GLB network timing');
  console.table([diagnostics.network]);
  console.groupEnd();
  console.groupCollapsed('Current render snapshot');
  console.table([snapshot]);
  console.groupEnd();
  console.groupEnd();
}
function captureDiagnosticRenderSnapshot(){
  if(!diagnostics.model)return;
  const mode=xray?'X-RAY':'Solid';
  const size=`${renderer.domElement.width}x${renderer.domElement.height}`;
  const key=`${mode}:${size}`;
  if(diagnostics.renderSnapshots.has(key)&&!diagnostics.forceRenderReport&&!diagnostics.forceFullReport)return;
  const snapshot={
    mode,
    'Drawing-buffer size':size.replace('x',' × '),
    'Draw calls':formatDiagnosticNumber(renderer.info.render.calls),
    'Triangles':formatDiagnosticNumber(renderer.info.render.triangles),
    'Lines':formatDiagnosticNumber(renderer.info.render.lines),
    'Points':formatDiagnosticNumber(renderer.info.render.points),
    'GPU geometries':formatDiagnosticNumber(renderer.info.memory.geometries),
    'GPU textures':formatDiagnosticNumber(renderer.info.memory.textures)
  };
  diagnostics.renderSnapshots.set(key,snapshot);
  diagnostics.latestSnapshot=snapshot;
  if(!diagnostics.initialReportPrinted||diagnostics.forceFullReport){
    printFullDiagnostics(snapshot);
    diagnostics.initialReportPrinted=true;
  }else{
    printDiagnosticRenderSnapshot(snapshot);
  }
  diagnostics.forceFullReport=false;
  diagnostics.forceRenderReport=false;
}

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
  renderer.setClearColor(0x040404, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040404, .008);

  cam = new THREE.PerspectiveCamera(42, 1, .1, 2000);
  cam.position.set(0, 18, 40);

  controls = new OrbitControls(cam, canvas);
  controls.enableDamping   = true;
  controls.dampingFactor   = .05;
  controls.minDistance     = 0.1;
  controls.maxDistance     = 200;
  controls.autoRotate      = true;
  controls.autoRotateSpeed = .28;
  controls.enableZoom      = true;
  controls.zoomSpeed       = 1.4;

  let pointerOverScrollSafePanel=false;
  function updateInteractionButtonPosition(){
    if(!interactionUnlockButton)return;
    const sectionRect=section.getBoundingClientRect();
    const buttonHeight=interactionUnlockButton.offsetHeight;
    const projectRect=projectPanel&&projectPanel.getBoundingClientRect();
    const projectPanelVisible=projectPanel&&getComputedStyle(projectPanel).display!=='none'&&projectRect.width>0;
    const left=projectPanelVisible?projectRect.left-sectionRect.left:24;
    const top=projectPanelVisible
      ?Math.max(24,projectRect.top-sectionRect.top-buttonHeight-12)
      :Math.max(24,section.clientHeight*.5-buttonHeight*.5);
    interactionUnlockButton.style.setProperty('--inst-lock-left',`${left}px`);
    interactionUnlockButton.style.setProperty('--inst-lock-top',`${top}px`);
  }
  function updateControlsEnabled(){
    controls.enabled=viewerInteractionUnlocked&&sectionVisible&&!document.hidden&&!pointerOverScrollSafePanel;
  }
  function setViewerInteractionState(unlocked){
    viewerInteractionUnlocked=unlocked;
    clearTimeout(interactionRestoreTimer);
    interactionRestoreTimer=0;
    interactionActive=false;
    interactionRenderActive=false;
    section.classList.toggle('is-locked',!unlocked);
    section.classList.toggle('is-interactive',unlocked);
    if(interactionUnlockButton){
      interactionUnlockButton.textContent=unlocked?'LOCK':'VER';
      interactionUnlockButton.setAttribute('aria-pressed',String(unlocked));
      interactionUnlockButton.setAttribute('aria-label',unlocked?'Bloquear interacción 3D':'Ver e interactuar con el modelo 3D');
    }
    updateControlsEnabled();
    applyPixelRatio(unlocked?NORMAL_DPR_CAP:LOCKED_DPR_CAP);
    lastRenderTime=0;
    requestViewerRender();
  }
  if(scrollSafePanel){
    scrollSafePanel.addEventListener('pointerenter',()=>{
      pointerOverScrollSafePanel=true;
      updateControlsEnabled();
    });
    scrollSafePanel.addEventListener('pointerleave',()=>{
      pointerOverScrollSafePanel=false;
      updateControlsEnabled();
    });
  }
  if(interactionUnlockButton){
    updateInteractionButtonPosition();
    interactionUnlockButton.disabled=false;
    interactionUnlockButton.addEventListener('click',()=>{
      setViewerInteractionState(!viewerInteractionUnlocked);
    });
  }
  setViewerInteractionState(viewerInteractionUnlocked);

  scene.add(new THREE.AmbientLight(0x080610, 4));
  const keyLight = new THREE.DirectionalLight(0xc8b0ff, 2.2);
  keyLight.position.set(15, 30, 15);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x70d5e0, 1.1);
  fillLight.position.set(-20, 8, -10);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xe0a860, .7);
  rimLight.position.set(0, -8, -25);
  scene.add(rimLight);
  const botLight = new THREE.DirectionalLight(0xc8b0e0, .4);
  botLight.position.set(0, -20, 0);
  scene.add(botLight);

  const matSolid = new THREE.MeshPhongMaterial({
    color:0x0e0c12, emissive:0x0a0815, specular:0x3a2860, shininess:45, side:THREE.DoubleSide,
    transparent:true, opacity:0.07
  });
  const matWire = new THREE.MeshBasicMaterial({
    color:0xc8b0e0, wireframe:true, transparent:true, opacity:.22, side:THREE.DoubleSide
  });

  let solidRoot = null, wireRoot = null;
  let initCamPos = null, initTarget = null;
  let xray = true;
  const btnXray  = document.getElementById('inst-xray');
  const btnReset = document.getElementById('inst-reset');
  btnXray && btnXray.classList.add('active');

  function applyXrayState(){
    matSolid.transparent = xray;
    matSolid.opacity     = xray ? 0.07 : 1;
    if(wireRoot) wireRoot.visible = xray;
    matWire.opacity = 0.22;
    btnXray && btnXray.classList.toggle('active', xray);
    requestViewerRender();
  }

  function freezeStaticTransforms(root){
    root.traverse(object=>{
      if(object.isSkinnedMesh||object.isBone)return;
      object.updateMatrix();
      object.matrixAutoUpdate=false;
    });
    root.updateMatrixWorld(true);
  }

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/libs/draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.load(
    'SPOOK/SPOOK%20feli.glb',
    (gltf) => {
      solidRoot    = gltf.scene;
      const box    = new THREE.Box3().setFromObject(solidRoot);
      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const s      = 22 / maxDim;

      solidRoot.scale.setScalar(s);
      solidRoot.position.copy(center.multiplyScalar(-s));

      const sourceResources=DEBUG_3D?collectSourceMaterialResources(solidRoot):null;
      wireRoot = solidRoot.clone();
      solidRoot.traverse(c=>{ if(c.isMesh){ c.material=matSolid; c.castShadow=true; c.receiveShadow=true; }});
      wireRoot.traverse(c=>{ if(c.isMesh){ c.material=matWire; c.castShadow=false; c.receiveShadow=false; }});

      scene.add(solidRoot);
      scene.add(wireRoot);
      freezeStaticTransforms(solidRoot);
      freezeStaticTransforms(wireRoot);
      if(DEBUG_3D){
        diagnostics.model=collectModelDiagnostics(solidRoot,gltf,sourceResources);
        diagnostics.network=collectGLBTiming();
      }
      applyXrayState();

      cam.position.set(maxDim*s*.18, maxDim*s*.42, maxDim*s*.62);
      controls.target.set(0, 0, 0);
      controls.update();

      initCamPos = cam.position.clone();
      initTarget = controls.target.clone();
      requestViewerRender();

      if(loading){ loading.style.opacity='0'; setTimeout(()=>{ loading.style.display='none'; },700); }
      if(hint){ setTimeout(()=>{ hint.style.opacity='1'; setTimeout(()=>{ hint.style.opacity='0'; },3200); },900); }
    },
    (xhr) => { if(xhr.lengthComputable && fillEl) fillEl.style.width=(xhr.loaded/xhr.total*100).toFixed(1)+'%'; },
    (err) => {
      console.warn('GLB load error', err);
      if(loading){
        const message=loading.querySelector('p');
        if(message) message.textContent = 'MODELO NO DISPONIBLE';
        setTimeout(()=>{ loading.style.opacity='0'; setTimeout(()=>{ loading.style.display='none'; },700); }, 2500);
      }
    }
  );

  function getDevicePixelRatio(){
    return Math.max(0.1,window.devicePixelRatio||1);
  }
  function resizeRenderer(force=false){
    if(!renderer||!cam)return;
    const w=Math.max(1,Math.round(canvas.clientWidth));
    const h=Math.max(1,Math.round(canvas.clientHeight));
    if(!force&&w===lastRenderWidth&&h===lastRenderHeight)return;
    lastRenderWidth=w;lastRenderHeight=h;
    renderer.setSize(w,h,false);
    cam.aspect=w/h;
    cam.updateProjectionMatrix();
    requestViewerRender();
  }
  function applyPixelRatio(cap){
    if(!renderer)return;
    const nextPixelRatio=Math.min(getDevicePixelRatio(),cap);
    if(Math.abs(nextPixelRatio-currentPixelRatio)<0.01)return;
    currentPixelRatio=nextPixelRatio;
    renderer.setPixelRatio(nextPixelRatio);
    resizeRenderer(true);
  }
  function beginInteractionQuality(){
    if(!viewerInteractionUnlocked||!sectionVisible||document.hidden)return;
    interactionActive=true;
    interactionRenderActive=true;
    requestViewerRender();
    clearTimeout(interactionRestoreTimer);
    interactionRestoreTimer=0;
    applyPixelRatio(INTERACTION_DPR_CAP);
  }
  function scheduleNormalQuality(){
    if(!viewerInteractionUnlocked){
      interactionActive=false;
      interactionRenderActive=false;
      clearTimeout(interactionRestoreTimer);
      interactionRestoreTimer=0;
      applyPixelRatio(LOCKED_DPR_CAP);
      requestViewerRender();
      return;
    }
    interactionActive=false;
    interactionRenderActive=true;
    requestViewerRender();
    clearTimeout(interactionRestoreTimer);
    interactionRestoreTimer=window.setTimeout(()=>{
      interactionRestoreTimer=0;
      interactionRenderActive=false;
      applyPixelRatio(NORMAL_DPR_CAP);
      requestViewerRender();
    },QUALITY_RESTORE_DELAY);
  }
  function handleViewerResize(){
    updateInteractionButtonPosition();
    if(!interactionActive&&!interactionRestoreTimer){
      applyPixelRatio(viewerInteractionUnlocked?NORMAL_DPR_CAP:LOCKED_DPR_CAP);
    }
    resizeRenderer();
  }
  applyPixelRatio(viewerInteractionUnlocked?NORMAL_DPR_CAP:LOCKED_DPR_CAP);
  new ResizeObserver(()=>resizeRenderer()).observe(canvas);
  window.addEventListener('resize',handleViewerResize);

  if(DEBUG_3D){
    window.nightshot3dDiagnostics={
      report(){
        if(diagnostics.model&&diagnostics.latestSnapshot){
          printFullDiagnostics(diagnostics.latestSnapshot);
          return;
        }
        diagnostics.forceFullReport=true;
        requestViewerRender();
      },
      reportRender(){
        diagnostics.forceRenderReport=true;
        requestViewerRender();
      }
    };
  }

  btnXray && btnXray.addEventListener('click', ()=>{
    xray = !xray;
    applyXrayState();
  });

  btnReset && btnReset.addEventListener('click', ()=>{
    if(!initCamPos) return;
    cam.position.copy(initCamPos);
    controls.target.copy(initTarget);
    controls.autoRotate = true;
    controls.update();
    requestViewerRender();
    scheduleNormalQuality();
  });

  controls.addEventListener('start',beginInteractionQuality);
  controls.addEventListener('end',scheduleNormalQuality);
  canvas.addEventListener('wheel',()=>{
    beginInteractionQuality();
    scheduleNormalQuality();
  },{passive:true});
  canvas.addEventListener('pointerdown',()=>{
    controls.autoRotate=false;
    beginInteractionQuality();
  });
  canvas.addEventListener('pointerup',scheduleNormalQuality);
  canvas.addEventListener('pointercancel',scheduleNormalQuality);
  canvas.addEventListener('pointerleave',scheduleNormalQuality);
  new IntersectionObserver(entries=>{
    const entry=entries[0];
    sectionVisible=entry.isIntersecting&&entry.intersectionRatio>=0.1;
    updateControlsEnabled();
    if(sectionVisible){
      lastRenderTime=0;
      applyPixelRatio(viewerInteractionUnlocked?NORMAL_DPR_CAP:LOCKED_DPR_CAP);
      requestViewerRender();
    }else{
      clearTimeout(interactionRestoreTimer);
      interactionRestoreTimer=0;
      interactionActive=false;
      interactionRenderActive=false;
      renderTimestamps.length=0;
      stopRenderLoop();
    }
  },{rootMargin:'0px',threshold:[0,0.1]}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      clearTimeout(interactionRestoreTimer);
      interactionRestoreTimer=0;
      interactionActive=false;
      interactionRenderActive=false;
      renderTimestamps.length=0;
      updateControlsEnabled();
      stopRenderLoop();
      return;
    }
    updateControlsEnabled();
    applyPixelRatio(viewerInteractionUnlocked?NORMAL_DPR_CAP:LOCKED_DPR_CAP);
    resizeRenderer();
    lastRenderTime=0;
    requestViewerRender();
  });
}
