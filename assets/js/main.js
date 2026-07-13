
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
      if(d<MAX_DIST){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=`rgba(255,255,255,${(1-d/MAX_DIST)*.12})`;ctx.lineWidth=.6;ctx.stroke()}
    }
    nodes.forEach(n=>{ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(n.x-2.5,n.y-2.5,5,5);n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1});
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

// ── INSTALACIONES — SALA INMERSIVA (perspective room) ────────────────
(function(){
  const cv=document.querySelector('.inst-bg');if(!cv) return;
  const ctx=cv.getContext('2d');
  const sec=document.getElementById('environments');
  if(!sec) return;
  const cta=sec.querySelector('.inst-cta');

  let W=0,H=0;
  // vanishing point (fractional)
  let tvpx=.5,tvpy=.42,vpx=.5,vpy=.42;
  // zoom: 0=normal, 1=fully zoomed in
  let tzoom=0,zoom=0;
  // invert flag for CTA hover
  let inverted=false;
  let roomVisible=false,roomRaf=0;

  function resize(){
    W=cv.width=sec.offsetWidth;
    H=cv.height=sec.offsetHeight;
  }

  sec.addEventListener('mousemove',e=>{
    const r=sec.getBoundingClientRect();
    tvpx=.38+(e.clientX-r.left)/r.width*.24;
    tvpy=.32+(e.clientY-r.top)/r.height*.2;
  });
  sec.addEventListener('mouseleave',()=>{tvpx=.5;tvpy=.42});

  if(cta){
    cta.addEventListener('mouseenter',()=>{tzoom=1;inverted=true});
    cta.addEventListener('mouseleave',()=>{tzoom=0;inverted=false});
  }

  function draw(){
    roomRaf=0;
    if(!roomVisible||document.hidden) return;
    vpx+=(tvpx-vpx)*.045;
    vpy+=(tvpy-vpy)*.045;
    zoom+=(tzoom-zoom)*.04;

    ctx.clearRect(0,0,W,H);

    // invert background on CTA hover
    if(inverted&&zoom>.05){
      ctx.fillStyle=`rgba(228,224,216,${zoom*.08})`;
      ctx.fillRect(0,0,W,H);
    }

    const VX=vpx*W, VY=vpy*H;
    // zoom pulls VP toward center-bottom = forward motion
    const zVX=VX+(W*.5-VX)*zoom*.3;
    const zVY=VY+(H*.62-VY)*zoom*.4;

    // ── RADIAL RAYS from vanishing point ──
    const RAYS=32;
    for(let i=0;i<RAYS;i++){
      const a=(i/RAYS)*Math.PI*2;
      const cos=Math.cos(a),sin=Math.sin(a);
      let tx,ty;
      if(Math.abs(cos)>1e-6&&Math.abs(sin)>1e-6){
        const tx1=cos>0?W:0, ty1=zVY+(tx1-zVX)*sin/cos;
        const ty2=sin>0?H:0, tx2=zVX+(ty2-zVY)*cos/sin;
        // pick whichever hits first
        const d1=(tx1-zVX)**2+(ty1-zVY)**2;
        const d2=(tx2-zVX)**2+(ty2-zVY)**2;
        if(d1<d2){tx=tx1;ty=ty1}else{tx=tx2;ty=ty2}
      }else if(Math.abs(cos)<1e-6){
        tx=zVX;ty=sin>0?H:0;
      }else{
        tx=cos>0?W:0;ty=zVY;
      }
      tx=Math.max(0,Math.min(W,tx));
      ty=Math.max(0,Math.min(H,ty));

      // ray brightness: edges dimmer, floor/ceiling area brighter
      const brightA=.038+zoom*.025;
      ctx.strokeStyle=`rgba(255,255,255,${brightA})`;
      ctx.lineWidth=.5;
      ctx.beginPath();ctx.moveTo(zVX,zVY);ctx.lineTo(tx,ty);ctx.stroke();
    }

    // ── DEPTH RINGS (concentric perspective rects) ──
    const DEPTHS=10;
    for(let d=1;d<=DEPTHS;d++){
      // t ranges 0→1 as rings go outward; zoom pulls rings inward
      const raw=d/DEPTHS;
      const t=Math.max(0,Math.min(1,raw+zoom*.12));

      // rect corners via linear interpolation VP → edges
      const x0=zVX*(1-t);
      const y0=zVY*(1-t);
      const x1=zVX+(W-zVX)*t;
      const y1=zVY+(H-zVY)*t;

      const alpha=(1-raw)*.075+.01+zoom*.02;
      // innermost rings get a cyan tint on zoom
      const r2=inverted?`rgba(0,212,255,${alpha*zoom})`:`rgba(255,255,255,${alpha})`;
      ctx.strokeStyle=r2;
      ctx.lineWidth=.55;
      ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    }

    // ── FLOOR GRID (bottom third, horizontal parallels) ──
    const FLOOR=8;
    for(let f=1;f<=FLOOR;f++){
      const t=f/FLOOR;
      // exponential compression toward horizon
      const yFloor=zVY+(H-zVY)*Math.pow(t,1.6+zoom*.5);
      // width of the floor line at this depth
      const spread=(W*.9)*(1-Math.pow(1-t,2));
      const alpha=t*.06+zoom*.02;
      ctx.strokeStyle=`rgba(255,255,255,${alpha})`;
      ctx.lineWidth=.4;
      ctx.beginPath();
      ctx.moveTo(zVX-spread/2,yFloor);
      ctx.lineTo(zVX+spread/2,yFloor);
      ctx.stroke();
    }

    // ── VP GLOW ──
    const glowR=90+zoom*60;
    const g=ctx.createRadialGradient(zVX,zVY,0,zVX,zVY,glowR);
    g.addColorStop(0,`rgba(0,212,255,${.055+zoom*.12})`);
    g.addColorStop(.45,`rgba(0,212,255,.012)`);
    g.addColorStop(1,'rgba(0,212,255,0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(zVX,zVY,glowR,0,Math.PI*2);ctx.fill();

    roomRaf=requestAnimationFrame(draw);
  }

  function startRoom(){if(roomVisible&&!document.hidden&&!roomRaf)roomRaf=requestAnimationFrame(draw)}
  function stopRoom(){if(roomRaf)cancelAnimationFrame(roomRaf);roomRaf=0}
  resize();window.addEventListener('resize',resize);
  new IntersectionObserver(entries=>{
    roomVisible=entries[0].isIntersecting;
    roomVisible?startRoom():stopRoom();
  },{rootMargin:'200px 0px'}).observe(sec);
  document.addEventListener('visibilitychange',()=>{document.hidden?stopRoom():startRoom()});
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

  // targets: inst-title, about-title + first sec-title per section
  document.querySelectorAll('.inst-title,.about-title').forEach(el=>initFeedback(el));
  ['#camera-works','#art','#tecnica'].forEach(id=>{
    const el=document.querySelector(id+' .sec-title');
    if(el) initFeedback(el);
  });
})();

// ── ARTWORKS REVEAL (difference blend rectangle) ─────────
(function(){
  const zone = document.getElementById('artZone');
  const rect = document.getElementById('artRect');
  if(!zone||!rect) return;

  const RW = 0.42;
  const RH = 0.72;

  function update(cx, cy){
    const W = zone.offsetWidth  * RW;
    const H = zone.offsetHeight * RH;
    const l = Math.max(0, Math.min(cx - W/2, zone.offsetWidth  - W));
    const t = Math.max(0, Math.min(cy - H/2, zone.offsetHeight - H));
    rect.style.left   = l+'px';
    rect.style.top    = t+'px';
    rect.style.width  = W+'px';
    rect.style.height = H+'px';
    rect.classList.add('visible');
  }

  zone.addEventListener('mousemove', function(e){
    const r = zone.getBoundingClientRect();
    update(e.clientX - r.left, e.clientY - r.top);
  });

  zone.addEventListener('mouseleave', function(){
    rect.classList.remove('visible');
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
  const MIN_MS = 700;
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
    clearInterval(fakeInterval);
    clearTimeout(safetyTimer);
    const wait = Math.max(0, MIN_MS - (Date.now()-startTime));
    setTimeout(function(){
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

// ── LANGUAGE TOGGLE ───────────────────────────
let lang='es';
const langBtn=document.getElementById('langToggle');

function applyLang(l){
  lang=l;
  document.documentElement.lang=l;
  langBtn.textContent=l==='es'?'EN':'ES';
  document.querySelectorAll('[data-es]').forEach(el=>{
    if(el===langBtn) return;
    if(el.classList.contains('inst-title')||el.classList.contains('sec-title')||el.classList.contains('cam-big')||el.classList.contains('env-word')) return;
    const val=el.dataset[l];
    if(!val) return;
    el.innerHTML=val;
  });
  // cipher decode on section titles
  document.querySelectorAll('.inst-title[data-es],.sec-title[data-es],.cam-big[data-es],.env-word[data-es]').forEach(el=>{
    const val=el.dataset[l];
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
  document.querySelectorAll('.sec-intro').forEach(el=>{
    const key='glitch'+l.charAt(0).toUpperCase()+l.slice(1);
    if(el.dataset[key]){
      el.dataset.glitch=el.dataset[key];
      el.dataset.typed='';
      const r=el.getBoundingClientRect();
      if(r.top<window.innerHeight&&r.bottom>0) glitchType(el);
    }
  });
}

langBtn.addEventListener('click',()=>applyLang(lang==='es'?'en':'es'));

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
  const plain=newHTML.replace(/<br\s*\/?>/gi,'\n');
  let frame=0;
  const total=plain.replace(/\n/g,'').length*1.6+6;
  let iv=setInterval(function(){
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
    if(frame>=total){el.innerHTML=newHTML;clearInterval(iv);}
  },32);
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

document.querySelectorAll('.sec-intro').forEach(el=>{
  el.dataset.glitch=el.dataset.glitchEs||'';
});

const glitchObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting) glitchType(e.target)});
},{threshold:.4});
document.querySelectorAll('.sec-intro').forEach(el=>glitchObs.observe(el));

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


// ── ENVIRONMENTS PHOTO PARALLAX ────────────────────────────────
(function(){
  const sec    = document.getElementById('environments');
  const photoA = sec && sec.querySelector('.env-photo-a');
  const photoB = sec && sec.querySelector('.env-photo-b');
  if(!sec || !photoA || !photoB) return;
  function update(){
    const r   = sec.getBoundingClientRect();
    const vh  = window.innerHeight;
    const raw = (vh - r.top) / (vh + r.height);
    const p   = Math.max(0, Math.min(1, raw));
    photoA.style.transform = 'translateY(-'+(p*70).toFixed(1)+'px)';
    photoB.style.transform = 'translateY(-'+(p*45).toFixed(1)+'px)';
  }
  window.addEventListener('scroll', update, {passive:true});
  update();
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

  const videos=Array.from(document.querySelectorAll('video'));
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

// ── STAGED INSTALLATIONS 3D MODULE ────────────────────────────
(function stagedInstallationsViewerLoading(){
  const section = document.getElementById('installations');
  if(!section) return;

  let installationsModulePromise = null;
  let viewerInitializationRequested = false;
  let viewerInitializationStarted = false;
  let viewerLoadErrorShown = false;

  function showViewerLoadError(error){
    if(viewerLoadErrorShown) return;
    viewerLoadErrorShown = true;
    console.error('Installations viewer failed to load:', error);
    const loading = document.getElementById('inst-loading');
    const message = loading && loading.querySelector('p');
    if(message) message.textContent = 'MODELO NO DISPONIBLE';
    if(loading){
      setTimeout(()=>{
        loading.style.opacity='0';
        setTimeout(()=>{ loading.style.display='none'; },700);
      },2500);
    }
  }

  function preloadInstallationsModule(){
    if(installationsModulePromise) return installationsModulePromise;
    installationsModulePromise = import('./installations-viewer.js');
    return installationsModulePromise;
  }

  function runWhenIdle(callback){
    if('requestIdleCallback' in window){
      window.requestIdleCallback(callback,{timeout:500});
    }else{
      setTimeout(callback,0);
    }
  }

  function initializeViewer(){
    if(viewerInitializationRequested||viewerInitializationStarted) return;
    viewerInitializationRequested = true;

    preloadInstallationsModule()
      .then(module=>{
        runWhenIdle(()=>{
          if(viewerInitializationStarted) return;
          viewerInitializationStarted = true;
          try{
            if(typeof module.initInstallationsViewer !== 'function'){
              throw new Error('Installations viewer initialization is unavailable');
            }
            module.initInstallationsViewer();
          }catch(error){
            showViewerLoadError(error);
          }
        });
      })
      .catch(showViewerLoadError);
  }

  const preloadObserver = new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting)) return;
    preloadObserver.disconnect();
    preloadInstallationsModule().catch(showViewerLoadError);
  },{
    rootMargin:'1800px 0px',
    threshold:0
  });

  const initializationObserver = new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting)) return;
    initializationObserver.disconnect();
    initializeViewer();
  },{
    rootMargin:'850px 0px',
    threshold:0
  });

  let proximityObserversStarted = false;
  function startProximityObservers(){
    if(proximityObserversStarted) return;
    proximityObserversStarted = true;
    preloadObserver.observe(section);
    initializationObserver.observe(section);
  }

  if(window.scrollY>0){
    startProximityObservers();
  }else{
    window.addEventListener('scroll',startProximityObservers,{once:true,passive:true});
  }
})();
