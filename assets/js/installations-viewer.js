let viewerInitialized=false;
const installationSection=document.getElementById('installations');
async function initializeViewer(){
if(viewerInitialized)return;
viewerInitialized=true;
const [THREE,gltfModule,dracoModule,controlsModule]=await Promise.all([
  import('three'),
  import('three/addons/loaders/GLTFLoader.js'),
  import('three/addons/loaders/DRACOLoader.js'),
  import('three/addons/controls/OrbitControls.js')
]);
const {GLTFLoader}=gltfModule,{DRACOLoader}=dracoModule,{OrbitControls}=controlsModule;
const canvas  = document.getElementById('inst-canvas');
const loading = document.getElementById('inst-loading');
const fillEl  = document.getElementById('inst-fill');
const hint    = document.getElementById('inst-hint');
const tc      = document.getElementById('inst-tc');
if(!canvas) throw new Error('inst-canvas not found');

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, innerWidth < 600 ? 1 : 1.5));
renderer.setClearColor(0x040404, 1);
renderer.shadowMap.enabled = false;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x040404, .008);

const cam = new THREE.PerspectiveCamera(42, 1, .1, 2000);
cam.position.set(0, 18, 40);

const controls = new OrbitControls(cam, canvas);
controls.enableDamping   = true;
controls.dampingFactor   = .05;
controls.minDistance     = 0.1;
controls.maxDistance     = 200;
controls.autoRotate      = true;
controls.autoRotateSpeed = .28;
controls.enableZoom      = true;
controls.zoomSpeed       = 1.4;

scene.add(new THREE.AmbientLight(0x080610, 4));
const keyLight = new THREE.DirectionalLight(0xc8b0ff, 2.2);
keyLight.position.set(15, 30, 15);
keyLight.castShadow = false;
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

let initCamPos = null, initTarget = null;

const t0 = Date.now();
function updateTC(){
  if(!tc) return;
  const s = Math.floor((Date.now()-t0)/1000);
  tc.textContent =
    String(Math.floor(s/3600)).padStart(2,'0')+':'+
    String(Math.floor((s%3600)/60)).padStart(2,'0')+':'+
    String(s%60).padStart(2,'0');
}

const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
loader.load(
  'SPOOK/SPOOK%20feli.glb',
  (gltf) => {
    const obj    = gltf.scene;
    const box    = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s      = 22 / maxDim;

    obj.scale.setScalar(s);
    obj.position.copy(center.multiplyScalar(-s));

    const wire = obj.clone();
    obj.traverse(c=>{ if(c.isMesh){ c.material=matSolid; c.castShadow=true; c.receiveShadow=true; }});
    wire.traverse(c=>{ if(c.isMesh) c.material=matWire; });

    scene.add(obj);
    scene.add(wire);

    cam.position.set(maxDim*s*.18, maxDim*s*.42, maxDim*s*.62);
    controls.target.set(0, 0, 0);
    controls.update();

    initCamPos = cam.position.clone();
    initTarget = controls.target.clone();

    if(loading){ loading.style.opacity='0'; setTimeout(()=>{ loading.style.display='none'; },700); }
    if(hint){ setTimeout(()=>{ hint.style.opacity='1'; setTimeout(()=>{ hint.style.opacity='0'; },3200); },900); }
  },
  (xhr) => { if(xhr.lengthComputable && fillEl) fillEl.style.width=(xhr.loaded/xhr.total*100).toFixed(1)+'%'; },
  (err) => {
    console.warn('GLB load error', err);
    if(loading){
      loading.querySelector('p').textContent = 'MODELO NO DISPONIBLE';
      setTimeout(()=>{ loading.style.opacity='0'; setTimeout(()=>{ loading.style.display='none'; },700); }, 2500);
    }
  }
);

function resize(){
  const w=canvas.clientWidth, h=canvas.clientHeight;
  renderer.setSize(w,h,false);
  cam.aspect=w/h;
  cam.updateProjectionMatrix();
}
resize();
new ResizeObserver(resize).observe(canvas);

let xray = true;
const btnXray  = document.getElementById('inst-xray');
const btnReset = document.getElementById('inst-reset');
btnXray && btnXray.classList.add('active');

btnXray && btnXray.addEventListener('click', ()=>{
  xray = !xray;
  matSolid.transparent = xray;
  matSolid.opacity     = xray ? 0.07 : 1;
  matWire.opacity      = xray ? 0.22 : 0.045;
  btnXray.classList.toggle('active', xray);
});

btnReset && btnReset.addEventListener('click', ()=>{
  if(!initCamPos) return;
  cam.position.copy(initCamPos);
  controls.target.copy(initTarget);
  controls.autoRotate = true;
  controls.update();
});

canvas.addEventListener('pointerdown', ()=>{ controls.autoRotate=false; });

(function animate(){
  requestAnimationFrame(animate);
  if(document.hidden || installationSection.classList.contains('viewer-offscreen')) return;
  controls.update();
  renderer.render(scene, cam);
  updateTC();
})();
}
if(installationSection){
  new IntersectionObserver(entries=>installationSection.classList.toggle('viewer-offscreen',!entries[0].isIntersecting)).observe(installationSection);
  const loadObserver=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    loadObserver.disconnect();
    initializeViewer().catch(error=>{
      console.warn('Installation viewer initialization failed',error);
      const message=document.querySelector('#inst-loading p');
      if(message)message.textContent='VISOR 3D NO DISPONIBLE';
    });
  },{rootMargin:'600px 0px'});
  loadObserver.observe(installationSection);
}
