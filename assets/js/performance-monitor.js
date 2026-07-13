const HEAP_LIMITATION='JavaScript heap metrics do not represent total browser RAM. Video decoding, WebGL textures, canvas surfaces, GPU resources and browser caches may increase process memory without appearing in performance.memory.';
const MAX_SAMPLES=900;
const MAX_MARKS=200;
const FRAME_WINDOW_MS=10000;
const MAX_FRAME_HISTORY=2400;

const perfRoot=window.NIGHTSHOT_PERF??={};
let destroyed=false;
let sessionActive=false;
let sessionStartedAt=null;
let sessionStoppedAt=null;
let sessionHeapStart=null;
let rafId=0;
let sampleInterval=0;
let panelInterval=0;
let lastFrameTime=0;
let longTaskCount=0;
let longTaskDuration=0;
let currentSection='unknown';
let latestResourceMetrics=null;
const frameHistory=[];
const samples=[];
const marks=[];
const sectionRatios=new Map();

const style=document.createElement('style');
style.dataset.nightshotPerf='';
style.textContent=`
#nightshot-perf{position:fixed;z-index:2147483647;top:8px;right:8px;width:min(360px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;box-sizing:border-box;background:#090909;color:#e8e8e8;border:1px solid #555;font:11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;text-align:left;color-scheme:dark}
#nightshot-perf[hidden]{display:none!important}
#nightshot-perf *{box-sizing:border-box;font:inherit}
#nightshot-perf summary{position:sticky;top:0;z-index:1;padding:7px 9px;background:#111;color:#fff;cursor:pointer;font-weight:700;letter-spacing:.08em}
#nightshot-perf .npm-body{padding:8px}
#nightshot-perf pre{margin:0 0 8px;white-space:pre-wrap;overflow-wrap:anywhere;color:#d8d8d8}
#nightshot-perf .npm-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin-bottom:8px}
#nightshot-perf button{min-width:0;padding:5px;border:1px solid #666;background:#181818;color:#fff;cursor:pointer}
#nightshot-perf button:disabled{color:#777;cursor:default}
#nightshot-perf .npm-note{margin:0;color:#aaa;font-size:9px;line-height:1.35}
`;
document.head.appendChild(style);

const panel=document.createElement('details');
panel.id='nightshot-perf';
panel.open=true;
panel.innerHTML=`<summary>NIGHTSHOT PERFORMANCE</summary><div class="npm-body"><pre aria-live="off"></pre><div class="npm-controls"></div><p class="npm-note"></p></div>`;
document.body.appendChild(panel);
const output=panel.querySelector('pre');
const controls=panel.querySelector('.npm-controls');
panel.querySelector('.npm-note').textContent=HEAP_LIMITATION;

const buttons={};
[
  ['start','START SESSION'],
  ['stop','STOP SESSION'],
  ['reset','RESET SESSION'],
  ['mark','MARK'],
  ['copy','COPY JSON'],
  ['download','DOWNLOAD JSON'],
  ['destroy','DESTROY MONITOR']
].forEach(([name,label])=>{
  const button=document.createElement('button');
  button.type='button';
  button.textContent=label;
  button.dataset.action=name;
  controls.appendChild(button);
  buttons[name]=button;
});

function round(value,digits=1){
  return Number.isFinite(value)?Number(value.toFixed(digits)):null;
}

function bytes(value){
  if(!Number.isFinite(value))return 'n/a';
  const units=['B','KB','MB','GB'];
  let size=value,index=0;
  while(Math.abs(size)>=1024&&index<units.length-1){size/=1024;index++;}
  return `${size.toFixed(index?1:0)} ${units[index]}`;
}

function getFrameMetrics(){
  if(frameHistory.length<2)return {fps:0,averageFrameTime:0,p95FrameTime:0,framesOver50ms:0,framesOver100ms:0};
  const durations=frameHistory.map(frame=>frame.duration);
  const sorted=durations.slice().sort((a,b)=>a-b);
  const elapsed=durations.reduce((sum,value)=>sum+value,0);
  return {
    fps:elapsed>0?durations.length*1000/elapsed:0,
    averageFrameTime:elapsed/durations.length,
    p95FrameTime:sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)]||0,
    framesOver50ms:durations.filter(value=>value>50).length,
    framesOver100ms:durations.filter(value=>value>100).length
  };
}

function getVideoMetrics(){
  const videos=Array.from(document.querySelectorAll('video'));
  let loaded=0,playing=0,offscreenPlaying=0;
  videos.forEach(video=>{
    if(video.readyState>=2)loaded++;
    if(!video.paused&&!video.ended&&video.readyState>=2){
      playing++;
      const rect=video.getBoundingClientRect();
      if(rect.bottom<=0||rect.right<=0||rect.top>=innerHeight||rect.left>=innerWidth)offscreenPlaying++;
    }
  });
  return {total:videos.length,loaded,playing,offscreenPlaying};
}

function getCanvasMetrics(){
  const canvases=Array.from(document.querySelectorAll('canvas'));
  return {count:canvases.length,totalInternalPixels:canvases.reduce((sum,canvas)=>sum+canvas.width*canvas.height,0)};
}

function getHeapMetrics(){
  const memory=performance.memory;
  if(!memory)return {supported:false,used:null,total:null,limit:null,growthSinceSessionStart:null};
  return {
    supported:true,
    used:memory.usedJSHeapSize,
    total:memory.totalJSHeapSize,
    limit:memory.jsHeapSizeLimit,
    growthSinceSessionStart:sessionHeapStart===null?0:memory.usedJSHeapSize-sessionHeapStart
  };
}

function getThreeMetrics(){
  try{return perfRoot.installations?.getMetrics?.()??null;}catch(error){return {error:String(error)};}
}

function collectResourceMetrics(){
  return {
    viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1},
    domElements:document.getElementsByTagName('*').length,
    canvases:getCanvasMetrics(),
    videos:getVideoMetrics(),
    heap:getHeapMetrics(),
    three:getThreeMetrics()
  };
}

function getCurrentMetrics(){
  latestResourceMetrics??=collectResourceMetrics();
  return {
    timestamp:new Date().toISOString(),
    sessionActive,
    frames:getFrameMetrics(),
    longTasks:{supported:Boolean(longTaskObserver),count:longTaskCount,duration:longTaskDuration},
    section:currentSection,
    visibility:document.visibilityState,
    ...latestResourceMetrics
  };
}

function frameLoop(timestamp){
  rafId=0;
  if(!sessionActive||document.hidden||destroyed)return;
  if(lastFrameTime){
    frameHistory.push({timestamp,duration:timestamp-lastFrameTime});
    const cutoff=timestamp-FRAME_WINDOW_MS;
    while(frameHistory.length&&frameHistory[0].timestamp<cutoff)frameHistory.shift();
    if(frameHistory.length>MAX_FRAME_HISTORY)frameHistory.splice(0,frameHistory.length-MAX_FRAME_HISTORY);
  }
  lastFrameTime=timestamp;
  rafId=requestAnimationFrame(frameLoop);
}

function startRaf(){
  if(sessionActive&&!document.hidden&&!rafId&&!destroyed){
    lastFrameTime=0;
    rafId=requestAnimationFrame(frameLoop);
  }
}

function stopRaf(){
  if(rafId)cancelAnimationFrame(rafId);
  rafId=0;
  lastFrameTime=0;
}

function takeSample(){
  if(!sessionActive||destroyed)return;
  latestResourceMetrics=collectResourceMetrics();
  samples.push(getCurrentMetrics());
  if(samples.length>MAX_SAMPLES)samples.splice(0,samples.length-MAX_SAMPLES);
}

function startSession(){
  if(sessionActive||destroyed)return;
  sessionActive=true;
  if(!sessionStartedAt)sessionStartedAt=new Date().toISOString();
  sessionStoppedAt=null;
  if(sessionHeapStart===null)sessionHeapStart=performance.memory?.usedJSHeapSize??null;
  takeSample();
  sampleInterval=window.setInterval(takeSample,2000);
  startRaf();
  renderPanel();
}

function stopSession(){
  if(!sessionActive)return;
  takeSample();
  sessionActive=false;
  sessionStoppedAt=new Date().toISOString();
  clearInterval(sampleInterval);
  sampleInterval=0;
  stopRaf();
  renderPanel();
}

function resetSession(){
  const wasActive=sessionActive;
  if(wasActive)stopSession();
  frameHistory.length=0;
  samples.length=0;
  marks.length=0;
  longTaskCount=0;
  longTaskDuration=0;
  sessionStartedAt=null;
  sessionStoppedAt=null;
  sessionHeapStart=null;
  latestResourceMetrics=collectResourceMetrics();
  if(wasActive)startSession();
  renderPanel();
}

function createExport(){
  latestResourceMetrics=collectResourceMetrics();
  const current=getCurrentMetrics();
  return {
    timestamp:new Date().toISOString(),
    userAgent:navigator.userAgent,
    viewport:current.viewport,
    session:{active:sessionActive,startedAt:sessionStartedAt,stoppedAt:sessionStoppedAt},
    samples:samples.slice(),
    marks:marks.slice(),
    currentVideoMetrics:current.videos,
    currentCanvasMetrics:current.canvases,
    three:current.three,
    browserApiSupport:{
      performanceMemory:Boolean(performance.memory),
      longTasks:Boolean(longTaskObserver),
      intersectionObserver:'IntersectionObserver' in window,
      clipboard:Boolean(navigator.clipboard?.writeText),
      download:Boolean(window.Blob&&window.URL?.createObjectURL)
    },
    limitation:HEAP_LIMITATION
  };
}

function exportText(){return JSON.stringify(createExport(),null,2);}

async function copyJson(){
  const value=exportText();
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
  const textarea=document.createElement('textarea');
  textarea.value=value;
  textarea.style.position='fixed';
  textarea.style.opacity='0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function downloadJson(){
  const blob=new Blob([exportText()],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=`nightshot-performance-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function addMark(){
  const label=window.prompt('Mark label (optional):','')??'';
  latestResourceMetrics=collectResourceMetrics();
  marks.push({label,timestamp:new Date().toISOString(),metrics:getCurrentMetrics()});
  if(marks.length>MAX_MARKS)marks.splice(0,marks.length-MAX_MARKS);
  renderPanel();
}

function renderPanel(){
  if(destroyed||document.hidden)return;
  const metrics=getCurrentMetrics();
  const frame=metrics.frames;
  const heap=metrics.heap;
  const canvas=metrics.canvases;
  const video=metrics.videos;
  const three=metrics.three;
  output.textContent=[
    `SESSION    ${sessionActive?'RUNNING':'STOPPED'}  samples ${samples.length}/${MAX_SAMPLES}`,
    `FPS        ${round(frame.fps)}  avg ${round(frame.averageFrameTime)} ms  p95 ${round(frame.p95FrameTime)} ms`,
    `SLOW       >50 ms ${frame.framesOver50ms}  >100 ms ${frame.framesOver100ms}`,
    `LONG TASKS ${metrics.longTasks.supported?`${metrics.longTasks.count} / ${round(metrics.longTasks.duration)} ms`:'unsupported'}`,
    `SECTION    ${metrics.section}`,
    `PAGE       ${metrics.visibility}`,
    `VIEWPORT   ${metrics.viewport.width}x${metrics.viewport.height}  DPR ${round(metrics.viewport.dpr,2)}`,
    `DOM        ${metrics.domElements} elements`,
    `CANVAS     ${canvas.count} / ${canvas.totalInternalPixels.toLocaleString()} pixels`,
    `VIDEO      ${video.total} total / ${video.loaded} loaded / ${video.playing} playing / ${video.offscreenPlaying} offscreen`,
    `HEAP USED  ${bytes(heap.used)}  growth ${bytes(heap.growthSinceSessionStart)}`,
    `HEAP TOTAL ${bytes(heap.total)}  limit ${bytes(heap.limit)}`,
    three?`THREE      init ${three.initialized} visible ${three.visible} locked ${three.locked}\n           target ${round(three.targetFps)} fps actual ${round(three.actualRenderFps)} fps DPR ${round(three.pixelRatio,2)}\n           buffer ${three.drawingBufferWidth}x${three.drawingBufferHeight} calls ${three.drawCalls} tris ${three.triangles}\n           geometries ${three.geometries} textures ${three.textures} interaction ${three.interactionActive}`:'THREE      unavailable'
  ].join('\n');
  buttons.start.disabled=sessionActive;
  buttons.stop.disabled=!sessionActive;
}

function handleVisibility(){
  if(document.hidden){
    stopRaf();
    clearInterval(panelInterval);
    panelInterval=0;
    return;
  }
  startRaf();
  latestResourceMetrics=collectResourceMetrics();
  renderPanel();
  if(!panelInterval)panelInterval=window.setInterval(renderPanel,500);
}

function handleKeydown(event){
  if(event.key.toLowerCase()!=='p'||event.ctrlKey||event.metaKey||event.altKey)return;
  const target=event.target;
  if(target instanceof Element&&(target.matches('input,textarea,select')||target.isContentEditable))return;
  panel.hidden=!panel.hidden;
}

function destroyMonitor(){
  if(destroyed)return;
  destroyed=true;
  sessionActive=false;
  stopRaf();
  clearInterval(sampleInterval);
  clearInterval(panelInterval);
  sectionObserver?.disconnect();
  longTaskObserver?.disconnect();
  document.removeEventListener('visibilitychange',handleVisibility);
  document.removeEventListener('keydown',handleKeydown);
  panel.removeEventListener('click',handleControlClick);
  panel.remove();
  style.remove();
  if(perfRoot.destroyMonitor===destroyMonitor)delete perfRoot.destroyMonitor;
}

function handleControlClick(event){
  const action=event.target.closest('button')?.dataset.action;
  if(!action)return;
  if(action==='start')startSession();
  if(action==='stop')stopSession();
  if(action==='reset')resetSession();
  if(action==='mark')addMark();
  if(action==='copy')copyJson().catch(error=>console.error('Performance JSON copy failed:',error));
  if(action==='download')downloadJson();
  if(action==='destroy')destroyMonitor();
}

let sectionObserver=null;
if('IntersectionObserver' in window){
  const sections=Array.from(document.querySelectorAll('body > section, main section'));
  sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>sectionRatios.set(entry.target,entry.intersectionRatio));
    let best=null,bestRatio=0;
    sections.forEach(section=>{
      const ratio=sectionRatios.get(section)||0;
      if(ratio>bestRatio){best=section;bestRatio=ratio;}
    });
    if(best)currentSection=best.id||best.getAttribute('aria-label')||best.tagName.toLowerCase();
  },{threshold:[0,.1,.25,.5,.75,1]});
  sections.forEach(section=>sectionObserver.observe(section));
}

let longTaskObserver=null;
if('PerformanceObserver' in window&&PerformanceObserver.supportedEntryTypes?.includes('longtask')){
  longTaskObserver=new PerformanceObserver(list=>{
    if(!sessionActive)return;
    list.getEntries().forEach(entry=>{longTaskCount++;longTaskDuration+=entry.duration;});
  });
  longTaskObserver.observe({type:'longtask'});
}

panel.addEventListener('click',handleControlClick);
document.addEventListener('visibilitychange',handleVisibility);
document.addEventListener('keydown',handleKeydown);
perfRoot.destroyMonitor=destroyMonitor;
latestResourceMetrics=collectResourceMetrics();
panelInterval=window.setInterval(renderPanel,500);
startSession();
