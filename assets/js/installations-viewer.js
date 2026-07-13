
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let initialized=false;

export function initInstallationsViewer(){
const section = document.getElementById('installations');
const canvas  = document.getElementById('inst-canvas');
const scrollSafePanel = document.querySelector('.inst-hud-bottom');
if(initialized||!section||!canvas) return;
initialized=true;

const t0 = Date.now();
const loading = document.getElementById('inst-loading');
const fillEl  = document.getElementById('inst-fill');
const hint    = document.getElementById('inst-hint');
const tc      = document.getElementById('inst-tc');
let sectionVisible=true,rafId=0;
let renderer,scene,cam,controls;
const NORMAL_DPR_CAP=1.5;
const INTERACTION_DPR_CAP=1.0;
const QUALITY_RESTORE_DELAY=350;
const NORMAL_RENDER_FPS=30;
const INTERACTION_RENDER_FPS=45;
let currentPixelRatio=0,interactionRestoreTimer=0,interactionActive=false,interactionRenderActive=false;
let lastRenderWidth=0,lastRenderHeight=0;
let lastRenderTime=0,renderRequested=true;

function updateTC(){
  if(!tc) return;
  const s = Math.floor((Date.now()-t0)/1000);
  tc.textContent =
    String(Math.floor(s/3600)).padStart(2,'0')+':'+
    String(Math.floor((s%3600)/60)).padStart(2,'0')+':'+
    String(s%60).padStart(2,'0');
}

function getTargetFrameInterval(){
  return 1000/(interactionActive||interactionRenderActive?INTERACTION_RENDER_FPS:NORMAL_RENDER_FPS);
}
function requestViewerRender(){
  renderRequested=true;
}
function animate(timestamp){
  rafId=0;
  if(!initialized||!sectionVisible||document.hidden) return;
  rafId=requestAnimationFrame(animate);
  const controlsChanged=controls.update()===true;
  updateTC();
  const interval=getTargetFrameInterval();
  const elapsed=timestamp-lastRenderTime;
  if(lastRenderTime&&elapsed<interval)return;
  const requiresContinuousRender=controls.autoRotate||interactionActive||interactionRenderActive||controlsChanged;
  if(!requiresContinuousRender&&!renderRequested)return;
  lastRenderTime=lastRenderTime?timestamp-(elapsed%interval):timestamp;
  renderRequested=false;
  renderer.render(scene,cam);
}
function startRenderLoop(){
  if(!initialized||!sectionVisible||document.hidden||rafId) return;
  lastRenderTime=0;
  requestViewerRender();
  rafId=requestAnimationFrame(animate);
}
function stopRenderLoop(){
  if(rafId) cancelAnimationFrame(rafId);
  rafId=0;
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
  function updateControlsEnabled(){
    controls.enabled=!pointerOverScrollSafePanel;
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

      wireRoot = solidRoot.clone();
      solidRoot.traverse(c=>{ if(c.isMesh){ c.material=matSolid; c.castShadow=true; c.receiveShadow=true; }});
      wireRoot.traverse(c=>{ if(c.isMesh){ c.material=matWire; c.castShadow=false; c.receiveShadow=false; }});

      scene.add(solidRoot);
      scene.add(wireRoot);
      freezeStaticTransforms(solidRoot);
      freezeStaticTransforms(wireRoot);
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
    interactionActive=true;
    interactionRenderActive=true;
    requestViewerRender();
    clearTimeout(interactionRestoreTimer);
    interactionRestoreTimer=0;
    applyPixelRatio(INTERACTION_DPR_CAP);
  }
  function scheduleNormalQuality(){
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
    if(!interactionActive&&!interactionRestoreTimer)applyPixelRatio(NORMAL_DPR_CAP);
    resizeRenderer();
  }
  applyPixelRatio(NORMAL_DPR_CAP);
  new ResizeObserver(()=>resizeRenderer()).observe(canvas);
  window.addEventListener('resize',handleViewerResize);

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
    sectionVisible=entries[0].isIntersecting;
    if(sectionVisible){
      lastRenderTime=0;
      requestViewerRender();
      startRenderLoop();
    }else{
      stopRenderLoop();
    }
  },{rootMargin:'700px 0px'}).observe(section);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      clearTimeout(interactionRestoreTimer);
      interactionRestoreTimer=0;
      interactionActive=false;
      interactionRenderActive=false;
      stopRenderLoop();
      return;
    }
    applyPixelRatio(NORMAL_DPR_CAP);
    resizeRenderer();
    lastRenderTime=0;
    requestViewerRender();
    startRenderLoop();
  });
  startRenderLoop();
}
