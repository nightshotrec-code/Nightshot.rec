// â”€â”€ FILM GRAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const gc=document.getElementById('grain'),gx=gc?.getContext('2d');
let grainTimer=0;
function drawGrain(){
  if(!gx||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img=gx.createImageData(gc.width,gc.height),d=img.data;
  for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=32}
  gx.putImageData(img,0,0);
}
function startGrain(){if(!grainTimer){drawGrain();grainTimer=setInterval(drawGrain,100)}}
function stopGrain(){clearInterval(grainTimer);grainTimer=0}
if(gc){gc.width=180;gc.height=110;startGrain()}
document.addEventListener('visibilitychange',()=>document.hidden?stopGrain():startGrain());

// â”€â”€ CURSOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const cur=document.getElementById('cur'),curDot=document.getElementById('curDot');
let mx=-100,my=-100,cx2=-100,cy2=-100;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;curDot.style.left=mx+'px';curDot.style.top=my+'px'});
(function anim(){cx2+=(mx-cx2)*.13;cy2+=(my-cy2)*.13;cur.style.left=cx2+'px';cur.style.top=cy2+'px';requestAnimationFrame(anim)})();
document.querySelectorAll('a,button,.tec-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>cur.classList.add('big'));
  el.addEventListener('mouseleave',()=>cur.classList.remove('big'));
});

// â”€â”€ HAMBURGER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const navClose=document.getElementById('navClose');
const ham=document.getElementById('ham'),navLinks=document.getElementById('navLinks');
function setMenu(open){
  if(!ham||!navLinks) return;
  ham.classList.toggle('open',open);navLinks.classList.toggle('open',open);
  ham.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);
}
ham?.addEventListener('click',()=>setMenu(!navLinks?.classList.contains('open')));
navClose?.addEventListener('click',()=>setMenu(false));
navLinks?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});

// â”€â”€ LANGUAGE TOGGLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ SCROLL REVEAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')});
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// â”€â”€ ABOUT CAROUSEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ VISUALS PARALLAX TITLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function(){
  const sec=document.getElementById('visuals');
  const title=sec&&sec.querySelector('.sec-title');
  if(!sec||!title) return;
  function tick(){
    const rect=sec.getBoundingClientRect();
    const sH=sec.offsetHeight;
    const vH=window.innerHeight;
    const tH=title.offsetHeight;
    const scrollRoom=sH-vH;
    if(scrollRoom<=0){title.style.transform='translateX(-50%)';return;}
    const progress=Math.max(0,Math.min(1,-rect.top/scrollRoom));
    const maxOffset=Math.max(0,tH-vH);
    title.style.transform=`translateX(-50%) translateY(-${progress*maxOffset}px)`;
  }
  window.addEventListener('scroll',tick,{passive:true});
  tick();
})();

// â”€â”€ CIPHER DECODE (for titles on lang switch) â”€
const TCHARS='â–ˆâ–“â–’â–‘|/\\#@%ABCDEFGHIJKLMNOPQRSTUVWXYZ01';
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

// â”€â”€ GLITCH TYPE (once on scroll) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GCHARS='â–ˆâ–“â–’â–‘|/\\#@%';
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

// â”€â”€ TIMECODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ NETWORK CANVAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function(){
  const nc=document.getElementById('net');if(!nc) return;
  const ctx=nc.getContext('2d'),hero=document.getElementById('hero');
  function resize(){nc.width=hero.offsetWidth;nc.height=hero.offsetHeight}
  resize();window.addEventListener('resize',resize);
  const COUNT=55,MAX_DIST=160;
  const nodes=Array.from({length:COUNT},()=>({x:Math.random()*nc.width,y:Math.random()*nc.height,vx:(Math.random()-.5)*.55,vy:(Math.random()-.5)*.55}));
  function tick(){
    ctx.clearRect(0,0,nc.width,nc.height);
    const W=nc.width,H=nc.height;
    for(let i=0;i<COUNT;i++)for(let j=i+1;j<COUNT;j++){
      const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<MAX_DIST){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=`rgba(255,255,255,${(1-d/MAX_DIST)*.12})`;ctx.lineWidth=.6;ctx.stroke()}
    }
    nodes.forEach(n=>{ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(n.x-2.5,n.y-2.5,5,5);n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1});
    if(Math.random()<.004){const n=nodes[Math.random()*COUNT|0];ctx.font='8px Space Mono,monospace';ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillText(`${n.x|0},${n.y|0}`,n.x+6,n.y-4)}
    requestAnimationFrame(tick);
  }
  tick();
})();

// â”€â”€ RANDOM GLITCH TEAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function glitchTear(){
  setTimeout(()=>{
    const s=(Math.random()-.5)*8;
    document.body.style.transform=`translateX(${s}px)`;
    setTimeout(()=>{document.body.style.transform=''},70);
    setTimeout(()=>{document.body.style.transform=`translateX(${-s*.5}px)`;setTimeout(()=>{document.body.style.transform=''},50)},90);
    glitchTear();
  },2500+Math.random()*6000);
}
glitchTear();

// â”€â”€ INSTALACIONES â€” SALA INMERSIVA (perspective room) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ RADIAL RAYS from vanishing point â”€â”€
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

    // â”€â”€ DEPTH RINGS (concentric perspective rects) â”€â”€
    const DEPTHS=10;
    for(let d=1;d<=DEPTHS;d++){
      // t ranges 0â†’1 as rings go outward; zoom pulls rings inward
      const raw=d/DEPTHS;
      const t=Math.max(0,Math.min(1,raw+zoom*.12));

      // rect corners via linear interpolation VP â†’ edges
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

    // â”€â”€ FLOOR GRID (bottom third, horizontal parallels) â”€â”€
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

    // â”€â”€ VP GLOW â”€â”€
    const glowR=90+zoom*60;
    const g=ctx.createRadialGradient(zVX,zVY,0,zVX,zVY,glowR);
    g.addColorStop(0,`rgba(0,212,255,${.055+zoom*.12})`);
    g.addColorStop(.45,`rgba(0,212,255,.012)`);
    g.addColorStop(1,'rgba(0,212,255,0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(zVX,zVY,glowR,0,Math.PI*2);ctx.fill();

    requestAnimationFrame(draw);
  }

  resize();window.addEventListener('resize',resize);draw();
})();

// â”€â”€ TITLE HOVER VIDEO FEEDBACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ ARTWORKS REVEAL (difference blend rectangle) â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ CAMERA REVEAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ VISUALS TITLE SCROLL PARALLAX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if(scrollRange <= 0) return;
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

// â”€â”€ PAGE LOADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(()=>{
  const loader=document.getElementById('page-loader');
  const fill=document.getElementById('ldrFill');
  const percent=document.getElementById('ldrPct');
  if(!loader)return;
  let finished=false;
  function finish(){if(finished)return;finished=true;if(fill)fill.style.width='100%';if(percent)percent.textContent='100%';requestAnimationFrame(()=>{loader.classList.add('ldr-out');setTimeout(()=>{loader.hidden=true},550)});}
  const hero=document.querySelector('#hero video');
  if(!hero||hero.readyState>=1)finish();else hero.addEventListener('loadedmetadata',finish,{once:true});
  window.addEventListener('load',finish,{once:true});
  setTimeout(finish,3500);
})();
