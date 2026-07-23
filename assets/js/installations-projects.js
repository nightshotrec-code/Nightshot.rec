(function renderInstallationsProjects(){
  const root=document.querySelector('[data-installations-projects]');
  if(!root)return;

  const installationsProjects=[
    {
      id:'halloween',
      index:'01',
      title:'HALLOWEEN',
      showHeader:false,
      chapters:[
        {
          id:'televisions',
          index:'01',
          title:'HALLOWEEN',
          showIndex:false,
          media:[
            {
              type:'image',
              phase:'01',
              label:{es:'IDEANDO',en:'PLANNING'},
              src:'assets/media/images/instalations/hallowen%20tv%201%20-%20ideando.webp',
              fallback:'assets/media/images/instalations/hallowen%20tv%201%20-%20ideando.png',
              width:977,
              height:1307,
              alt:{
                es:'Composición inicial de la instalación Halloween con televisores CRT y estructuras de truss',
                en:'Initial composition of the Halloween installation with CRT televisions and truss structures'
              }
            },
            {
              type:'video',
              phase:'02',
              label:{es:'MODIFICANDO',en:'MODIFYING'},
              src:'assets/media/video/Instalaciones/hallowen%20tv%202%20-%20modificando.webm',
              fallback:'assets/media/video/Instalaciones/hallowen%20tv%202%20-%20modificando.mp4',
              width:606,
              height:1080,
              alt:{
                es:'Modificación de los televisores para la instalación Halloween',
                en:'Modification of the televisions for the Halloween installation'
              }
            },
            {
              type:'video',
              phase:'03',
              label:{es:'PRESENTADA',en:'PRESENTED'},
              src:'assets/media/video/Instalaciones/hallowen%20tv%203%20-%20presentada.webm',
              fallback:'assets/media/video/Instalaciones/hallowen%20tv%203%20-%20presentada.mp4',
              width:606,
              height:1080,
              alt:{
                es:'Presentación final de la instalación Halloween con televisores',
                en:'Final presentation of the Halloween television installation'
              }
            },
            {
              type:'image',
              phase:'04',
              label:{es:'MONTANDO',en:'ASSEMBLING'},
              aspect:'landscape',
              colorEffect:'hover',
              src:'assets/media/images/instalations/hallowen%20pantalla%201%20-%20montando.webp',
              fallback:'assets/media/images/instalations/hallowen%20pantalla%201%20-%20montando.png',
              width:784,
              height:918,
              alt:{
                es:'Montaje de los módulos visuales para la instalación Halloween',
                en:'Assembly of the visual modules for the Halloween installation'
              }
            },
            {
              type:'image',
              phase:'05',
              label:{es:'RESULTADO',en:'RESULT'},
              aspect:'landscape',
              src:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_59_02.webp',
              fallback:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_59_02.webp',
              width:1448,
              height:1086,
              alt:{
                es:'Instalación Halloween — resultado final',
                en:'Halloween installation — final result'
              }
            }
          ]
        }
      ]
    },
    {
      id:'otras',
      index:'02',
      title:'OTRAS',
      showHeader:false,
      chapters:[
        {
          id:'otras',
          index:'01',
          title:'OTRAS',
          showIndex:false,
          layout:'carousel',
          media:[
            {
              type:'image',
              phase:'01',
              src:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_20_58.webp',
              fallback:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_20_58.webp',
              width:941,
              height:1527,
              alt:{
                es:'Instalación Otras, imagen 01',
                en:'Other installations, image 01'
              }
            },
            {
              type:'image',
              phase:'02',
              src:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_15_34.webp',
              fallback:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_15_34.webp',
              width:1024,
              height:1536,
              alt:{
                es:'Instalación Otras, imagen 02',
                en:'Other installations, image 02'
              }
            },
            {
              type:'image',
              phase:'03',
              src:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_09_12.webp',
              fallback:'assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_09_12.webp',
              width:941,
              height:1672,
              alt:{
                es:'Instalación Otras, imagen 03',
                en:'Other installations, image 03'
              }
            },
            {
              type:'image',
              phase:'04',
              src:'assets/media/images/instalations/vlcsnap-2026-07-17-04h43m24s889.webp',
              fallback:'assets/media/images/instalations/vlcsnap-2026-07-17-04h43m24s889.webp',
              width:2160,
              height:3840,
              alt:{
                es:'Instalación Otras, imagen 04',
                en:'Other installations, image 04'
              }
            }
          ]
        }
      ]
    }
  ];

  function localizedAttributes(content){
    return `data-es="${content.es}" data-en="${content.en}"`;
  }

  function renderVisual(item){
    return item.type==='video'
      ?`<video width="${item.width}" height="${item.height}" muted loop playsinline preload="metadata" data-installation-video aria-label="${item.alt.es}" ${localizedAttributes(item.alt)}>
          <source data-src="${item.src}" type="video/webm">
          <source data-src="${item.fallback}" type="video/mp4">
        </video>`
      :item.src===item.fallback
        ?`<img src="${item.src}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async" alt="${item.alt.es}" ${localizedAttributes(item.alt)}>`
        :`<picture>
            <source srcset="${item.src}" type="image/webp">
            <img src="${item.fallback}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async" alt="${item.alt.es}" ${localizedAttributes(item.alt)}>
          </picture>`;
  }

  function renderMedia(item){
    const visual=renderVisual(item);
    return `
      <figure class="installation-process-item${item.aspect==='landscape' ? ' installation-process-item--landscape' : ''}${item.colorEffect==='hover' ? ' installation-process-item--color-hover' : ''} reveal">
        <div class="installation-process-image">
          ${visual}
        </div>
        <figcaption class="installation-process-caption">
          <span>${item.phase}</span>
          ${item.label ? `<span ${localizedAttributes(item.label)}>${item.label.es}</span>` : ''}
        </figcaption>
      </figure>`;
  }

  function renderCarousel(chapter){
    const total=String(chapter.media.length).padStart(2,'0');
    return `
      <div class="installation-carousel reveal" data-installation-carousel>
        <button class="installation-carousel-control installation-carousel-control--previous" type="button" data-carousel-previous aria-label="Fotografía anterior">
          <span aria-hidden="true">←</span>
        </button>
        <div class="installation-carousel-viewport" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="Galería Otras">
          ${chapter.media.map((item,index)=>`
            <figure class="installation-carousel-slide" data-carousel-slide aria-hidden="${index===0?'false':'true'}"${index===0?'':' hidden'}>
              <div class="installation-process-image">
                ${renderVisual(item)}
              </div>
            </figure>`).join('')}
        </div>
        <button class="installation-carousel-control installation-carousel-control--next" type="button" data-carousel-next aria-label="Fotografía siguiente">
          <span aria-hidden="true">→</span>
        </button>
        <div class="installation-carousel-counter" aria-live="polite" aria-atomic="true">
          <span data-carousel-current>01</span> / ${total}
        </div>
      </div>`;
  }

  function renderChapter(chapter){
    const content=chapter.layout==='carousel'
      ?renderCarousel(chapter)
      :`<div class="installation-process installation-process--${chapter.id}">
          ${chapter.media.map(renderMedia).join('')}
        </div>`;
    return `
      <section class="installation-chapter installation-chapter--${chapter.id}" aria-labelledby="installation-${chapter.id}-title">
        <header class="installation-chapter-header reveal">
          ${chapter.showIndex===false ? '' : `<span class="installation-chapter-index">${chapter.index}</span>`}
          <h4 id="installation-${chapter.id}-title">${chapter.title}</h4>
        </header>
        ${content}
      </section>`;
  }

  root.innerHTML=installationsProjects.map(project=>`
    <article class="installation-project installation-project--${project.id}" id="installation-${project.id}" aria-labelledby="${project.showHeader===false ? `installation-${project.chapters[0].id}-title` : `installation-${project.id}-title`}">
      ${project.showHeader===false ? '' : `<header class="installation-project-header reveal">
        <span class="installation-project-index">${project.index} —</span>
        <h3 id="installation-${project.id}-title">${project.title}</h3>
      </header>`}
      <div class="installation-project-chapters">
        ${project.chapters.map(renderChapter).join('')}
      </div>
    </article>`).join('');

  root.querySelectorAll('[data-installation-carousel]').forEach(carousel=>{
    const slides=Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    const previous=carousel.querySelector('[data-carousel-previous]');
    const next=carousel.querySelector('[data-carousel-next]');
    const viewport=carousel.querySelector('.installation-carousel-viewport');
    const current=carousel.querySelector('[data-carousel-current]');
    if(!slides.length||!previous||!next||!viewport||!current)return;

    let activeIndex=0;
    let touchStartX=0;
    let touchStartY=0;

    function showSlide(index){
      activeIndex=((index%slides.length)+slides.length)%slides.length;
      slides.forEach((slide,slideIndex)=>{
        const active=slideIndex===activeIndex;
        slide.hidden=!active;
        slide.setAttribute('aria-hidden',String(!active));
      });
      current.textContent=String(activeIndex+1).padStart(2,'0');
    }

    previous.addEventListener('click',()=>showSlide(activeIndex-1));
    next.addEventListener('click',()=>showSlide(activeIndex+1));
    carousel.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();
      showSlide(activeIndex+(event.key==='ArrowRight'?1:-1));
    });
    viewport.addEventListener('touchstart',event=>{
      const touch=event.changedTouches[0];
      touchStartX=touch.clientX;
      touchStartY=touch.clientY;
    },{passive:true});
    viewport.addEventListener('touchend',event=>{
      const touch=event.changedTouches[0];
      const deltaX=touch.clientX-touchStartX;
      const deltaY=touch.clientY-touchStartY;
      if(Math.abs(deltaX)<40||Math.abs(deltaX)<=Math.abs(deltaY))return;
      showSlide(activeIndex+(deltaX<0?1:-1));
    },{passive:true});
  });

})();
