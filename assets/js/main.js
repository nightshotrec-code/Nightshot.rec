
// ── FILM GRAIN ────────────────────────────────
if(new URLSearchParams(window.location.search).get('perf')==='1'){
  import('./performance-monitor.js').catch(error=>{
    console.error('Performance monitor failed to load:',error);
  });
}

(function(){
const gc=document.getElementById('grain');
if(!gc) return;
const gx=gc.getContext('2d');
if(!gx) return;
const grainMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const grainMobile=window.matchMedia('(max-width: 768px)');
const GRAIN_FRAME_MS=1000/12;
const grainTileSize=window.innerWidth<=768?384:512;
const grainPatterns=[];
let gw,gh,grainTimer=0,grainVariant=0,grainStarted=false;
for(let tileIndex=0;tileIndex<2;tileIndex++){
  const tile=document.createElement('canvas'),tileCtx=tile.getContext('2d');
  if(!tileCtx)continue;
  tile.width=tile.height=grainTileSize;
  const img=tileCtx.createImageData(grainTileSize,grainTileSize),d=img.data;
  for(let i=0;i<d.length;i+=4){
    const v=128+(Math.random()-.5)*120|0;
    d[i]=d[i+1]=d[i+2]=v;d[i+3]=45;
  }
  tileCtx.putImageData(img,0,0);
  const pattern=gx.createPattern(tile,'repeat');
  if(pattern)grainPatterns.push(pattern);
}
function resizeGrain(){
  gw=gc.width=window.innerWidth;gh=gc.height=window.innerHeight;
  drawGrainFrame();
  syncGrainAnimation(false);
}
function drawGrainFrame(){
  if(!grainPatterns.length)return;
  const shiftX=Math.random()*25-12|0,shiftY=Math.random()*25-12|0;
  gx.clearRect(0,0,gw,gh);gx.imageSmoothingEnabled=false;
  gx.save();gx.translate(shiftX,shiftY);gx.fillStyle=grainPatterns[grainVariant];
  gx.fillRect(-grainTileSize,-grainTileSize,gw+grainTileSize*2,gh+grainTileSize*2);gx.restore();
  grainVariant=(grainVariant+1)%grainPatterns.length;
}
function stopGrainAnimation(){
  clearTimeout(grainTimer);grainTimer=0;
}
function shouldAnimateGrain(){
  return grainStarted&&grainPatterns.length&&!document.hidden&&!grainMotion.matches&&!grainMobile.matches;
}
function queueGrainFrame(){
  if(!shouldAnimateGrain())return;
  grainTimer=window.setTimeout(()=>{
    grainTimer=0;
    if(!shouldAnimateGrain())return;
    drawGrainFrame();
    queueGrainFrame();
  },GRAIN_FRAME_MS);
}
function syncGrainAnimation(drawImmediately=true){
  if(!grainStarted)return;
  stopGrainAnimation();
  if(drawImmediately)drawGrainFrame();
  queueGrainFrame();
}
function setGrainVisibility(){
  syncGrainAnimation(!document.hidden);
}
function startMainGrain(){
  if(grainStarted)return;
  grainStarted=true;
  resizeGrain();
  window.addEventListener('resize',resizeGrain);
  grainMotion.addEventListener('change',()=>syncGrainAnimation());
  grainMobile.addEventListener('change',()=>syncGrainAnimation());
  document.addEventListener('visibilitychange',setGrainVisibility);
}
if(document.getElementById('page-loader')){
  document.addEventListener('nightshot:loader-hidden',startMainGrain,{once:true});
}else{
  startMainGrain();
}
})();

// ── CURSOR ────────────────────────────────────
const cur=document.getElementById('cur'),curDot=document.getElementById('curDot');
let mx=-100,my=-100,cx2=-100,cy2=-100;
const cursorMotion=window.matchMedia('(hover: hover) and (pointer: fine)');
let cursorRaf=0;
if(cur&&curDot&&cursorMotion.matches){
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;curDot.style.left=mx+'px';curDot.style.top=my+'px'});
  function animateCursor(){
    cursorRaf=0;
    if(document.hidden) return;
    cx2+=(mx-cx2)*.13;cy2+=(my-cy2)*.13;cur.style.left=cx2+'px';cur.style.top=cy2+'px';
    cursorRaf=requestAnimationFrame(animateCursor);
  }
  function startCursor(){if(!cursorRaf&&!document.hidden)cursorRaf=requestAnimationFrame(animateCursor)}
  function stopCursor(){if(cursorRaf)cancelAnimationFrame(cursorRaf);cursorRaf=0}
  document.addEventListener('visibilitychange',()=>{document.hidden?stopCursor():startCursor()});
  document.querySelectorAll('a,button,.tec-card').forEach(el=>{
    el.addEventListener('mouseenter',()=>cur.classList.add('big'));
    el.addEventListener('mouseleave',()=>cur.classList.remove('big'));
  });
  startCursor();
}

// ── NETWORK CANVAS ────────────────────────────
(function(){
  const nc=document.getElementById('net');if(!nc) return;
  const ctx=nc.getContext('2d'),hero=document.getElementById('hero');
  if(!hero) return;
  function resize(){nc.width=hero.offsetWidth;nc.height=hero.offsetHeight}
  resize();window.addEventListener('resize',resize);
  const COUNT=55,MAX_DIST=160;
  const nodes=Array.from({length:COUNT},()=>({x:Math.random()*nc.width,y:Math.random()*nc.height,vx:(Math.random()-.5)*.55,vy:(Math.random()-.5)*.55}));
  let networkVisible=false,networkRaf=0;
  function tick(){
    networkRaf=0;
    if(!networkVisible||document.hidden) return;
    ctx.clearRect(0,0,nc.width,nc.height);
    const W=nc.width,H=nc.height;
    for(let i=0;i<COUNT;i++)for(let j=i+1;j<COUNT;j++){
      const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<MAX_DIST){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=`rgba(255,255,255,${(1-d/MAX_DIST)*.15})`;ctx.lineWidth=.6;ctx.stroke()}
    }
    nodes.forEach(n=>{ctx.fillStyle='rgba(255,255,255,.24)';ctx.fillRect(n.x-2.5,n.y-2.5,5,5);n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1});
    if(Math.random()<.004){const n=nodes[Math.random()*COUNT|0];ctx.font='8px Space Mono,monospace';ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillText(`${n.x|0},${n.y|0}`,n.x+6,n.y-4)}
    networkRaf=requestAnimationFrame(tick);
  }
  function startNetwork(){if(networkVisible&&!document.hidden&&!networkRaf)networkRaf=requestAnimationFrame(tick)}
  function stopNetwork(){if(networkRaf)cancelAnimationFrame(networkRaf);networkRaf=0}
  new IntersectionObserver(entries=>{
    networkVisible=entries[0].isIntersecting;
    networkVisible?startNetwork():stopNetwork();
  }).observe(hero);
  document.addEventListener('visibilitychange',()=>{document.hidden?stopNetwork():startNetwork()});
})();

// ── TITLE HOVER VIDEO FEEDBACK ────────────────────
(function(){
  function initFeedback(el){
    if(!el||!el.parentElement) return;
    const parent=el.parentElement;
    if(getComputedStyle(parent).position==='static') parent.style.position='relative';
    el.style.position='relative';
    el.style.zIndex='1';

    // visible canvas
    const cv=document.createElement('canvas');
    cv.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .35s;z-index:0;mix-blend-mode:screen';
    parent.insertBefore(cv,el);

    // offscreen buffer for double-buffering
    const buf=document.createElement('canvas');
    const bx=buf.getContext('2d');
    const ctx=cv.getContext('2d');

    let W=0,H=0,raf=null,active=false;

    function init(){
      W=cv.width=buf.width=el.offsetWidth||500;
      H=cv.height=buf.height=el.offsetHeight||120;
      ctx.clearRect(0,0,W,H);
      // seed: gentle luminous band across midheight
      ctx.fillStyle='rgba(228,224,216,.22)';
      ctx.fillRect(0,H*.15,W,H*.7);
    }

    function tick(){
      if(!active){raf=null;return}
      // snapshot current cv into buffer
      bx.clearRect(0,0,W,H);
      bx.drawImage(cv,0,0);
      // clear cv, draw buffer scaled inward (feedback zoom)
      ctx.clearRect(0,0,W,H);
      ctx.save();
      ctx.globalAlpha=.84;
      const sc=.963;
      ctx.translate(W*(1-sc)/2, H*(1-sc)/2);
      ctx.scale(sc,sc);
      ctx.drawImage(buf,0,0);
      ctx.restore();
      // fresh glowing input at center so feedback doesn't die out
      const cy=H*.42;
      const g=ctx.createRadialGradient(W*.5,cy,0,W*.5,cy,W*.55);
      g.addColorStop(0,`rgba(228,224,216,.07)`);
      g.addColorStop(.55,'rgba(200,190,255,.02)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=1;
      ctx.fillStyle=g;
      ctx.fillRect(0,0,W,H);
      raf=requestAnimationFrame(tick);
    }

    el.addEventListener('mouseenter',()=>{
      active=true;
      init();
      cv.style.opacity='1';
      if(!raf) raf=requestAnimationFrame(tick);
    });
    el.addEventListener('mouseleave',()=>{
      active=false;
      cv.style.opacity='0';
      setTimeout(()=>{if(!active) ctx.clearRect(0,0,W,H)},400);
    });
  }

  // targets: inst-title + first sec-title per section
  document.querySelectorAll('.inst-title').forEach(el=>initFeedback(el));
  ['#camera-works','#art','#tecnica'].forEach(id=>{
    const el=document.querySelector(id+' .sec-title');
    if(el) initFeedback(el);
  });
})();

// ── CAMERA REVEAL ──────────────────────────────
(function(){
  const sec=document.getElementById('camera');
  const split=sec&&sec.querySelector('.cam-split');
  const line=document.getElementById('camLine');
  const ol=split&&split.querySelector('.cam-ol');
  if(!sec||!split||!line||!ol) return;

  function setX(pct){
    const p=Math.max(0,Math.min(100,pct)).toFixed(1);
    ol.style.clipPath='inset(0 0 0 '+p+'%)';
    line.style.left=p+'%';
  }

  split.addEventListener('mousemove',function(e){
    const r=split.getBoundingClientRect();
    setX((e.clientX-r.left)/r.width*100);
    line.classList.add('visible');
  });

  split.addEventListener('mouseleave',function(){
    ol.style.clipPath='inset(0 0 0 38%)';
    line.style.left='38%';
    line.classList.remove('visible');
  });

  new IntersectionObserver(function(entries){
    sec.classList.toggle('cam-active',entries[0].isIntersecting);
  },{threshold:0.05}).observe(sec);
})();

// ── VISUALS TITLE SCROLL PARALLAX ─────────────────────────────
(function(){
  const sec = document.getElementById('visuals');
  const titleEl = sec && sec.querySelector('#visuals .sec-title');
  if(!sec || !titleEl) return;
  function update(){
    if(window.innerWidth <= 900){ titleEl.style.transform=''; return; }
    const rect = sec.getBoundingClientRect();
    const secH = sec.offsetHeight;
    const vH = window.innerHeight;
    const scrollRange = secH - vH;
    if(scrollRange <= 0){ titleEl.style.transform='translateX(-50%)'; return; }
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(1, scrolled / scrollRange);
    const titleH = titleEl.offsetHeight;
    const excess = Math.max(0, titleH - vH);
    const offset = (progress * excess).toFixed(1);
    titleEl.style.transform = 'translateX(-50%) translateY(-'+offset+'px)';
  }
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
})();

// ── PAGE LOADER ──────────────────────────────────────────────
(function(){
  const ldr  = document.getElementById('page-loader');
  const fill = document.getElementById('ldrFill');
  const pct  = document.getElementById('ldrPct');
  if(!ldr||!fill){
    document.dispatchEvent(new CustomEvent('nightshot:loader-hidden'));
    return;
  }

  // Grain canvas inside loader
  const lgc = document.getElementById('ldrGrain');
  const LG_SCALE = 0.5, LG_FRAME_MS = 1000/18;
  let lgx, lgw, lgh, lgBuffer, lgBufferCtx, lgImageData, lgRaf = 0, lgLastUpdate = 0, lgActive = true;
  let resizeLg, setLoaderGrainVisibility;
  if(lgc){
    lgx = lgc.getContext('2d');
    lgBuffer = document.createElement('canvas');
    lgBufferCtx = lgBuffer.getContext('2d');
    resizeLg = function(){
      lgw=lgc.width=window.innerWidth;lgh=lgc.height=window.innerHeight;
      lgBuffer.width=Math.max(1,Math.round(lgw*LG_SCALE));
      lgBuffer.height=Math.max(1,Math.round(lgh*LG_SCALE));
      lgImageData=lgBufferCtx.createImageData(lgBuffer.width,lgBuffer.height);
      if(lgActive&&!document.hidden) drawLgFrame();
    };
    function drawLgFrame(){
      if(!lgImageData||!lgBufferCtx||!lgx)return;
      const d=lgImageData.data;
      for(let i=0;i<d.length;i+=4){const v=128+(Math.random()-.5)*90|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=24}
      lgBufferCtx.putImageData(lgImageData,0,0);
      lgx.clearRect(0,0,lgw,lgh);lgx.imageSmoothingEnabled=false;lgx.drawImage(lgBuffer,0,0,lgw,lgh);
    }
    function drawLg(time){
      lgRaf=0;
      if(!lgActive||document.hidden)return;
      if(time-lgLastUpdate>=LG_FRAME_MS){drawLgFrame();lgLastUpdate=time}
      startLoaderGrain();
    }
    function startLoaderGrain(){
      if(lgActive&&!document.hidden&&!lgRaf)lgRaf=requestAnimationFrame(drawLg);
    }
    setLoaderGrainVisibility = function(){
      if(document.hidden){
        if(lgRaf)cancelAnimationFrame(lgRaf);
        lgRaf=0;
      }else{
        startLoaderGrain();
      }
    };
    resizeLg();
    window.addEventListener('resize',resizeLg);
    document.addEventListener('visibilitychange',setLoaderGrainVisibility);
    startLoaderGrain();
  }

  function stopLoaderGrain(){
    lgActive=false;
    if(lgRaf)cancelAnimationFrame(lgRaf);
    lgRaf=0;
    if(resizeLg)window.removeEventListener('resize',resizeLg);
    if(setLoaderGrainVisibility)document.removeEventListener('visibilitychange',setLoaderGrainVisibility);
    lgImageData=null;
    if(lgBuffer){lgBuffer.width=1;lgBuffer.height=1}
    lgBufferCtx=null;lgBuffer=null;lgx=null;
  }

  let p = 0;
  const startTime = Date.now();
  const MIN_MS = 1700;
  const SAFETY_MS = 5000;
  const COMPLETE_PAUSE_MS = 320;
  const FADE_MS = 850;
  let finished = false;
  let safetyTimer = 0;

  function setP(v){
    p = Math.min(100, v);
    fill.style.width = p.toFixed(1)+'%';
    if(pct) pct.textContent = Math.round(p)+'%';
    if(lgc) lgc.style.opacity = (p / 100 * 0.32).toFixed(3);
  }

  // ease to 88% while waiting for real load
  const fakeInterval = setInterval(function(){
    if(p < 88){ setP(p + (88-p)*0.055 + 0.35); }
    else { clearInterval(fakeInterval); }
  }, 40);

  function finish(){
    if(finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    const wait = Math.max(0, MIN_MS - (Date.now()-startTime));
    setTimeout(function(){
      clearInterval(fakeInterval);
      setP(100);
      setTimeout(function(){
        ldr.classList.add('ldr-out');
        stopLoaderGrain();
        setTimeout(function(){
          ldr.style.display='none';
          document.dispatchEvent(new CustomEvent('nightshot:loader-hidden'));
        }, FADE_MS);
      }, COMPLETE_PAUSE_MS);
    }, wait);
  }

  function domReadyPromise(){
    if(document.readyState==='loading'){
      return new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
    }
    return Promise.resolve();
  }

  function fontsReadyPromise(){
    if(!document.fonts||!document.fonts.ready)return Promise.resolve();
    return document.fonts.ready.catch(()=>{});
  }

  function heroVideoReadyPromise(){
    const video=document.querySelector('video[data-video-priority="hero"]');
    if(!video||video.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA)return Promise.resolve();
    return new Promise(resolve=>{
      let resolved=false,timer=0;
      function done(){
        if(resolved)return;
        resolved=true;
        video.removeEventListener('loadeddata',done);
        video.removeEventListener('canplay',done);
        clearTimeout(timer);
        resolve();
      }
      video.addEventListener('loadeddata',done,{once:true});
      video.addEventListener('canplay',done,{once:true});
      timer=setTimeout(done,1800);
    });
  }

  Promise.allSettled([
    domReadyPromise(),
    fontsReadyPromise(),
    heroVideoReadyPromise()
  ]).then(finish);
  safetyTimer=setTimeout(finish,SAFETY_MS-COMPLETE_PAUSE_MS-FADE_MS);
})();
// ── HAMBURGER ─────────────────────────────────
const ham=document.getElementById('ham'),navLinks=document.getElementById('navLinks');
ham.addEventListener('click',()=>{ham.classList.toggle('open');navLinks.classList.toggle('open')});
navLinks.querySelectorAll('a').forEach(a=>{
  a.addEventListener('click',()=>{ham.classList.remove('open');navLinks.classList.remove('open')});
});
const navClose=document.getElementById('navClose');
if(navClose) navClose.addEventListener('click',()=>{ham.classList.remove('open');navLinks.classList.remove('open')});

// ── LANGUAGE SELECTOR ─────────────────────────
const langBtns=document.querySelectorAll('.lang-btn[data-lang]');
let lang='es';

function applyLang(l){
  lang=l;
  document.documentElement.lang=l;
  langBtns.forEach(btn=>{
    const active=btn.dataset.lang===l;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  });
  try{localStorage.setItem('nightshot-lang',l)}catch(e){}
  document.querySelectorAll('[data-es]').forEach(el=>{
    if(el.hasAttribute('data-language-cipher')||el.classList.contains('inst-title')||el.classList.contains('sec-title')) return;
    const val=el.dataset[l];
    if(!val) return;
    if(el instanceof HTMLImageElement){el.alt=val;return;}
    if(el instanceof HTMLVideoElement){el.setAttribute('aria-label',val);return;}
    el.innerHTML=val;
  });
  // cipher decode on section titles
  document.querySelectorAll('.inst-title[data-es],.sec-title[data-es],[data-language-cipher]').forEach(el=>{
    const glitchKey='glitch'+l.charAt(0).toUpperCase()+l.slice(1);
    const val=el.dataset[l]||el.dataset[glitchKey];
    if(val) cipherDecode(el,val);
  });
  // update cta-title glitch pseudo-element text
  const ctaTitle=document.querySelector('.cta-title');
  if(ctaTitle){
    const t=ctaTitle.dataset[l]||ctaTitle.textContent.trim();
    ctaTitle.dataset.text=t;
    ctaTitle.textContent=t;
  }
  // update glitch intros and retrigger if visible
  document.querySelectorAll('.sec-intro:not([data-language-cipher])').forEach(el=>{
    const key='glitch'+l.charAt(0).toUpperCase()+l.slice(1);
    if(el.dataset[key]){
      el.dataset.glitch=el.dataset[key];
      el.dataset.typed='';
      const r=el.getBoundingClientRect();
      if(r.top<window.innerHeight&&r.bottom>0) glitchType(el);
    }
  });
}

langBtns.forEach(btn=>btn.addEventListener('click',()=>applyLang(btn.dataset.lang)));
let savedLang;
try{savedLang=localStorage.getItem('nightshot-lang')}catch(e){}
applyLang(savedLang==='en'?'en':'es');

// ── SCROLL REVEAL ─────────────────────────────
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')});
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// ── ABOUT CAROUSEL ────────────────────────────
(function(){
  const slides=document.querySelectorAll('.about-carousel-slide');
  if(!slides.length) return;
  let cur=0;
  setInterval(function(){
    slides[cur].classList.remove('active');
    cur=(cur+1)%slides.length;
    slides[cur].classList.add('active');
  },8000);
})();

// ── CIPHER DECODE (for titles on lang switch) ─
const TCHARS='█▓▒░|/\\#@%ABCDEFGHIJKLMNOPQRSTUVWXYZ01';
function cipherDecode(el,newHTML){
  if(el._languageCipherTimer)clearInterval(el._languageCipherTimer);
  const plain=newHTML.replace(/<br\s*\/?>/gi,'\n');
  let frame=0;
  const total=plain.replace(/\n/g,'').length*1.6+6;
  const iv=setInterval(function(){
    frame++;
    let out='';
    let revealed=0;
    for(let i=0;i<plain.length;i++){
      if(plain[i]==='\n'){out+='<br>';continue;}
      if(revealed<Math.floor(frame/1.5)){
        out+=plain[i];revealed++;
      } else {
        out+=Math.random()>.35?TCHARS[Math.random()*TCHARS.length|0]:'_';
        revealed++;
      }
    }
    el.innerHTML=out;
    if(frame>=total){el.innerHTML=newHTML;clearInterval(iv);delete el._languageCipherTimer;}
  },32);
  el._languageCipherTimer=iv;
}

// ── GLITCH TYPE (once on scroll) ─────────────
const GCHARS='█▓▒░|/\\#@%';
function glitchType(el){
  if(el.dataset.typed==='1') return;
  el.dataset.typed='1';
  const text=el.dataset.glitch||'';
  if(!text) return;
  let i=0;
  const iv=setInterval(()=>{
    const gc2=Math.random()>.65?GCHARS[Math.random()*GCHARS.length|0]:'';
    el.textContent=text.slice(0,i)+gc2+(i<text.length?'_':'');
    if(Math.random()>.4) i++;
    if(i>text.length){el.textContent=text;clearInterval(iv)}
  },38);
}

document.querySelectorAll('.sec-intro:not([data-language-cipher])').forEach(el=>{
  el.dataset.glitch=el.dataset.glitchEs||'';
});

const glitchObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting) glitchType(e.target)});
},{threshold:.4});
document.querySelectorAll('.sec-intro:not([data-language-cipher])').forEach(el=>glitchObs.observe(el));

// ── VISUALS CATEGORY PREVIEW ─────────────────────────────
(function initVisualsCategoryPreview(){
  const ROTATION_INTERVAL=10000;
  const visualsSources={
    'live-camera':{
      src:'assets/media/video/visuals/live-camera-1.webm',
      type:'video/webm'
    },
    'rescan':{
      src:'assets/media/video/visuals/rescan-1.webm',
      type:'video/webm'
    },
    'analog-mixers':{
      src:'assets/media/video/visuals/analog-mixers.mp4',
      type:'video/mp4'
    },
    'touchdesigner':{
      src:'assets/media/video/visuals/touch.webm',
      type:'video/webm'
    },
    'video-feedback':{
      src:'assets/media/video/visuals/ia.webm',
      type:'video/webm'
    },
    'favorites':{
      src:'assets/media/video/visuals/favs.webm',
      type:'video/webm'
    }
  };
  const visualRotationOrder=[
    'live-camera',
    'touchdesigner',
    'rescan',
    'video-feedback',
    'analog-mixers',
    'favorites'
  ];
  const section=document.getElementById('artworks');
  const cards=Array.from(document.querySelectorAll('#artworks .tec-card'));
  const preview=document.querySelector('[data-visuals-preview]');
  const homeMirror=document.querySelector('[data-visuals-home-mirror]');
  if(!section||!cards.length||!preview||preview.dataset.autoplayInitialized==='1')return;
  preview.dataset.autoplayInitialized='1';

  const videos=Array.from(preview.querySelectorAll('.visuals-preview-video'));
  const mirrorContext=homeMirror&&homeMirror.getContext('2d');
  let activeKey='';
  let sectionVisible=false;
  let homeMirrorVisible=false;
  let rotationTimer=0;
  let mirrorVideo=null;
  let mirrorFrameCallback=0;
  let mirrorAnimationFrame=0;
  let mirrorWidth=0;
  let mirrorHeight=0;
  let lastMirrorDraw=0;

  function playbackNeeded(){
    return sectionVisible||homeMirrorVisible;
  }

  function resizeHomeMirror(){
    if(!homeMirror||!mirrorContext)return;
    const rect=homeMirror.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    const width=Math.max(1,Math.round(rect.width*dpr));
    const height=Math.max(1,Math.round(rect.height*dpr));
    if(width===mirrorWidth&&height===mirrorHeight)return;
    mirrorWidth=homeMirror.width=width;
    mirrorHeight=homeMirror.height=height;
    drawMirrorFrame();
  }

  function drawMirrorFrame(){
    if(!mirrorContext||!mirrorVideo||!mirrorWidth||!mirrorHeight||mirrorVideo.readyState<HTMLMediaElement.HAVE_CURRENT_DATA)return;
    const sourceWidth=mirrorVideo.videoWidth;
    const sourceHeight=mirrorVideo.videoHeight;
    if(!sourceWidth||!sourceHeight)return;
    const scale=Math.max(mirrorWidth/sourceWidth,mirrorHeight/sourceHeight);
    const cropWidth=mirrorWidth/scale;
    const cropHeight=mirrorHeight/scale;
    const cropX=(sourceWidth-cropWidth)/2;
    const cropY=(sourceHeight-cropHeight)/2;
    mirrorContext.clearRect(0,0,mirrorWidth,mirrorHeight);
    mirrorContext.drawImage(mirrorVideo,cropX,cropY,cropWidth,cropHeight,0,0,mirrorWidth,mirrorHeight);
  }

  function cancelMirrorFrames(){
    if(mirrorFrameCallback&&mirrorVideo&&typeof mirrorVideo.cancelVideoFrameCallback==='function'){
      mirrorVideo.cancelVideoFrameCallback(mirrorFrameCallback);
    }
    if(mirrorAnimationFrame)cancelAnimationFrame(mirrorAnimationFrame);
    mirrorFrameCallback=0;
    mirrorAnimationFrame=0;
  }

  function queueMirrorFrame(){
    if(!homeMirrorVisible||document.hidden||!mirrorVideo)return;
    if(typeof mirrorVideo.requestVideoFrameCallback==='function'){
      mirrorFrameCallback=mirrorVideo.requestVideoFrameCallback(()=>{
        mirrorFrameCallback=0;
        drawMirrorFrame();
        queueMirrorFrame();
      });
      return;
    }
    mirrorAnimationFrame=requestAnimationFrame(timestamp=>{
      mirrorAnimationFrame=0;
      if(timestamp-lastMirrorDraw>=1000/30){
        lastMirrorDraw=timestamp;
        drawMirrorFrame();
      }
      queueMirrorFrame();
    });
  }

  function syncMirrorVideo(video){
    if(mirrorVideo===video&&mirrorFrameCallback+mirrorAnimationFrame>0)return;
    cancelMirrorFrames();
    mirrorVideo=video;
    drawMirrorFrame();
    queueMirrorFrame();
  }

  function clearRotationTimer(){
    if(!rotationTimer)return;
    clearTimeout(rotationTimer);
    rotationTimer=0;
  }

  function pauseVideos(){
    videos.forEach(video=>video.pause());
  }

  function ensureVideoSource(video,key){
    if(video.dataset.videoLoaded==='1')return;
    const sourceConfig=visualsSources[key];
    const source=video.querySelector('source');
    if(!sourceConfig||!source)return;
    source.setAttribute('src',sourceConfig.src);
    source.setAttribute('type',sourceConfig.type);
    video.dataset.videoLoaded='1';
    video.load();
  }

  function getActiveVisualVideo(){
    return activeKey?preview.querySelector(`[data-visual-media="${activeKey}"]`):null;
  }

  function syncActiveMenu(key){
    cards.forEach(card=>{
      const active=card.dataset.visualPreview===key;
      card.classList.toggle('is-active',active);
      card.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function playActiveVideo(){
    if(!playbackNeeded()||document.hidden||!activeKey)return;
    const video=getActiveVisualVideo();
    if(!video)return;
    ensureVideoSource(video,activeKey);
    video.hidden=false;
    video.muted=true;
    video.loop=true;
    video.playsInline=true;
    syncMirrorVideo(video);
    const playPromise=video.play();
    if(playPromise&&typeof playPromise.catch==='function')playPromise.catch(()=>{});
  }

  function scheduleRotation(){
    clearRotationTimer();
    if(!playbackNeeded()||document.hidden||!activeKey)return;
    rotationTimer=window.setTimeout(()=>{
      rotationTimer=0;
      const currentIndex=visualRotationOrder.indexOf(activeKey);
      const nextIndex=(currentIndex+1)%visualRotationOrder.length;
      activateVideo(visualRotationOrder[nextIndex]);
    },ROTATION_INTERVAL);
  }

  function activateVideo(key){
    if(!visualRotationOrder.includes(key))return;
    const video=preview.querySelector(`[data-visual-media="${key}"]`);
    const card=cards.find(item=>item.dataset.visualPreview===key);
    if(!video||!card||!visualsSources[key])return;

    pauseVideos();
    videos.forEach(item=>{item.hidden=item!==video});
    activeKey=key;
    syncMirrorVideo(video);
    syncActiveMenu(activeKey);
    playActiveVideo();
    scheduleRotation();
  }

  cards.forEach(card=>{
    card.addEventListener('click',()=>activateVideo(card.dataset.visualPreview));
  });

  const visibilityObserver=new IntersectionObserver(entries=>{
    const entry=entries[0];
    sectionVisible=Boolean(entry?.isIntersecting);
    if(!sectionVisible){
      if(!homeMirrorVisible){
        clearRotationTimer();
        pauseVideos();
      }
      return;
    }
    if(!activeKey)activateVideo(visualRotationOrder[0]);
    else{
      playActiveVideo();
      scheduleRotation();
    }
  },{threshold:0});
  visibilityObserver.observe(section);

  if(homeMirror&&mirrorContext){
    const mirrorVisibilityObserver=new IntersectionObserver(entries=>{
      homeMirrorVisible=Boolean(entries[0]?.isIntersecting);
      if(!homeMirrorVisible){
        cancelMirrorFrames();
        if(!sectionVisible){
          clearRotationTimer();
          pauseVideos();
        }
        return;
      }
      if(!activeKey)activateVideo(visualRotationOrder[0]);
      else{
        playActiveVideo();
        scheduleRotation();
      }
    },{threshold:0});
    mirrorVisibilityObserver.observe(homeMirror);

    const mirrorResizeObserver=new ResizeObserver(resizeHomeMirror);
    mirrorResizeObserver.observe(homeMirror);
    resizeHomeMirror();
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      clearRotationTimer();
      pauseVideos();
      cancelMirrorFrames();
      return;
    }
    if(playbackNeeded()){
      playActiveVideo();
      scheduleRotation();
    }
  });
})();

// ── TIMECODE ──────────────────────────────────
(function(){
  let f=0;
  const els=['timecode','camtc'].map(id=>document.getElementById(id)).filter(Boolean);
  setInterval(()=>{
    f++;
    const fr=f%25,ss=Math.floor(f/25)%60,mm=Math.floor(f/1500)%60,hh=Math.floor(f/90000)%24;
    const txt=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')+':'+String(fr).padStart(2,'0');
    els.forEach(el=>el.textContent=txt);
  },40);
})();


// ── HERO VID-PANELS PARALLAX ────────────────────────────────────
(function(){
  const hero   = document.getElementById('hero');
  const panels = hero && hero.querySelectorAll('.vid-panel');
  if(!hero || !panels.length) return;
  const maxPx = [62, 40, 20];
  function update(){
    const p = Math.min(1, window.scrollY / hero.offsetHeight);
    panels.forEach(function(panel, i){
      panel.style.transform = 'translateY(' + (-(p * maxPx[i]).toFixed(1)) + 'px)';
    });
  }
  window.addEventListener('scroll', update, {passive:true});
})();

// ── VIDEO LOADING AND PLAYBACK LIFECYCLE ────────────────────────
(function initVideoLifecycle(){
  const root=document.documentElement;
  if(root.dataset.videoLifecycleInitialized==='1')return;
  root.dataset.videoLifecycleInitialized='1';

  const videos=Array.from(document.querySelectorAll('video')).filter(video=>!video.closest('#camera'));
  const priorityVideos=videos.filter(video=>video.dataset.videoPriority==='hero');
  const lazyVideos=videos.filter(video=>video.dataset.videoPriority!=='hero'&&hasUsableSources(video));
  const managedVideos=[...priorityVideos,...lazyVideos];
  const playPendingVideos=new WeakSet();
  const lifecyclePausedVideos=new WeakSet();
  const lifecycleStartedVideos=new WeakSet();
  const userPausedVideos=new WeakSet();
  const internalPauseEvents=new WeakSet();

  function hasUsableSources(video){
    return Array.from(video.querySelectorAll('source')).some(source=>{
      return Boolean(source.dataset.src||source.getAttribute('src'));
    });
  }

  function safePlay(video){
    if(document.hidden||video.dataset.videoVisible!=='1'||userPausedVideos.has(video)||!video.paused||playPendingVideos.has(video))return;
    playPendingVideos.add(video);
    const handlePlayStarted=()=>{
      playPendingVideos.delete(video);
      if(video.paused)return;
      lifecycleStartedVideos.add(video);
      lifecyclePausedVideos.delete(video);
    };
    try{
      const playPromise=video.play();
      if(playPromise&&typeof playPromise.then==='function'){
        playPromise.then(
          handlePlayStarted,
          ()=>playPendingVideos.delete(video)
        );
      }else{
        handlePlayStarted();
      }
    }catch{
      playPendingVideos.delete(video);
    }
  }

  function resumeVideo(video){
    if(video.dataset.videoLoaded!=='1'||video.dataset.videoVisible!=='1'||document.hidden)return;
    if(lifecycleStartedVideos.has(video)&&!lifecyclePausedVideos.has(video))return;
    safePlay(video);
  }

  function pauseVideo(video){
    const playWasPending=playPendingVideos.delete(video);
    if(video.paused&&!playWasPending)return;
    lifecyclePausedVideos.add(video);
    internalPauseEvents.add(video);
    video.pause();
  }

  function loadVideoSources(video){
    if(video.dataset.videoLoaded==='1')return true;
    const sources=Array.from(video.querySelectorAll('source[data-src]'));
    if(!sources.length)return false;
    sources.forEach(source=>source.setAttribute('src',source.dataset.src));
    video.dataset.videoLoaded='1';
    video.load();
    resumeVideo(video);
    return true;
  }

  const preloadObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      loadVideoSources(entry.target);
      preloadObserver.unobserve(entry.target);
    });
  },{
    rootMargin:'500px 0px',
    threshold:0
  });

  const playbackObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const video=entry.target;
      const visible=entry.isIntersecting&&entry.intersectionRatio>=0.15;
      video.dataset.videoVisible=visible?'1':'0';
      if(!visible){
        pauseVideo(video);
        return;
      }
      resumeVideo(video);
    });
  },{threshold:0.15});

  priorityVideos.forEach(video=>{
    if(!hasUsableSources(video))return;
    video.dataset.videoLoaded='1';
  });

  managedVideos.forEach(video=>{
    video.dataset.videoVisible='0';
    if(!video.paused)lifecycleStartedVideos.add(video);
    video.addEventListener('play',()=>{
      userPausedVideos.delete(video);
      lifecycleStartedVideos.add(video);
      lifecyclePausedVideos.delete(video);
    });
    video.addEventListener('pause',()=>{
      if(internalPauseEvents.has(video)){
        internalPauseEvents.delete(video);
        return;
      }
      lifecyclePausedVideos.delete(video);
      if(!document.hidden&&video.dataset.videoVisible==='1')userPausedVideos.add(video);
    });
    playbackObserver.observe(video);
  });

  let lazyObserversStarted=false;
  function startLazyVideoObservers(){
    if(lazyObserversStarted)return;
    lazyObserversStarted=true;
    lazyVideos.forEach(video=>{
      preloadObserver.observe(video);
    });
  }

  if(document.readyState==='complete'){
    startLazyVideoObservers();
  }else{
    window.addEventListener('load',startLazyVideoObservers,{once:true});
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      managedVideos.forEach(pauseVideo);
      return;
    }
    managedVideos.forEach(resumeVideo);
  });
})();

// ── BALAKAO VIDEO CONTROL ─────────────────────────────────────
(function initBalakaoVideoControl(){
  document.querySelectorAll('[data-balakao-video-control]').forEach(button=>{
    if(button.dataset.videoControlInitialized==='1')return;
    button.dataset.videoControlInitialized='1';
    const video=button.closest('.cam-panel')?.querySelector('video');
    const icon=button.querySelector('.cam-video-toggle-icon');
    if(!video||!icon)return;
    const isCameraVideo=Boolean(video.closest('#camera'));
    const panel=button.closest('.cam-panel');
    const cameraRight=button.closest('.cam-right');
    const sharedRecIndicator=Array.from(cameraRight?.children||[]).find(child=>child.classList.contains('cam-rec-indicator'));
    const recIndicator=panel?.querySelector('.cam-rec-indicator')||(panel?.classList.contains('wide')?sharedRecIndicator:null);
    const videoLabel=(button.getAttribute('aria-label')||'video').replace(/^(Play|Pause)\s+/,'');

    function syncControl(){
      const isPlaying=!video.paused&&!video.ended;
      const iconSrc=isPlaying?button.dataset.pauseIcon:button.dataset.playIcon;
      if(icon.getAttribute('src')!==iconSrc)icon.setAttribute('src',iconSrc);
      button.setAttribute('aria-label',`${isPlaying?'Pause':'Play'} ${videoLabel}`);
      if(isCameraVideo){
        panel?.classList.toggle('is-playing',isPlaying);
        if(recIndicator){
          recIndicator.dataset.recVisible=isPlaying?'true':'false';
        }
      }
    }

    function playVideo(){
      try{
        const playPromise=video.play();
        if(playPromise&&typeof playPromise.catch==='function'){
          playPromise.catch(syncControl);
        }
      }catch{
        syncControl();
      }
    }

    function pauseVideo(){
      video.pause();
      syncControl();
    }

    button.addEventListener('click',()=>{
      if(video.paused||video.ended){
        playVideo();
        return;
      }
      pauseVideo();
    });

    video.addEventListener('play',syncControl);
    video.addEventListener('playing',syncControl);
    video.addEventListener('pause',syncControl);
    video.addEventListener('ended',syncControl);
    video.addEventListener('waiting',syncControl);
    video.addEventListener('camera-video-paused',syncControl);
    syncControl();
  });
})();

// ── CAMERA WORKS PAUSED VIDEO LIFECYCLE ────────────────────────
(function initCameraVideoPausedLifecycle(){
  const section=document.getElementById('camera');
  if(!section)return;
  if(section.dataset.cameraVideoLifecycleInitialized==='1')return;
  section.dataset.cameraVideoLifecycleInitialized='1';
  const videos=Array.from(section.querySelectorAll('.cam-panel video'));
  if(!videos.length)return;

  function loadCameraVideoSources(video){
    if(video.dataset.videoLoaded==='1')return;
    const sources=Array.from(video.querySelectorAll('source[data-src]'));
    if(!sources.length)return;
    sources.forEach(source=>source.setAttribute('src',source.dataset.src));
    video.dataset.videoLoaded='1';
    video.load();
  }

  function pauseCameraVideo(video){
    video.pause();
    video.dispatchEvent(new CustomEvent('camera-video-paused'));
  }

  videos.forEach(video=>{
    video.removeAttribute('autoplay');
    pauseCameraVideo(video);
  });

  const cameraVideoObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const video=entry.target;
      if(entry.isIntersecting){
        loadCameraVideoSources(video);
        return;
      }
      pauseCameraVideo(video);
    });
  },{threshold:0.15});

  videos.forEach(video=>cameraVideoObserver.observe(video));

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)videos.forEach(pauseCameraVideo);
  });
})();
