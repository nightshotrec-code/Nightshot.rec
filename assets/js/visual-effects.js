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

// â”€â”€ HERO VID-PANELS PARALLAX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  let scheduled=false;
  window.addEventListener('scroll',()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{update();scheduled=false});
  },{passive:true});
  update();
})();
