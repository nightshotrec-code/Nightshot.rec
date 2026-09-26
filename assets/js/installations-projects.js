(function renderInstallationsProjects(){
  const root=document.querySelector('[data-installations-projects]');
  if(!root)return;

  // Location and event year are undocumented; file export dates are not event dates.
  const projects=[
  {
    "id": "halloween",
    "title": {
      "es": "Halloween in Spook",
      "en": "Halloween in Spook"
    },
    "location": null,
    "year": null,
    "tags": {
      "es": "CRUZ CON TELEVISORES Y PANELES LED",
      "en": "CROSS WITH TELEVISIONS AND LED PANELS"
    },
    "media": [
      {
        "type": "image",
        "phase": "01",
        "label": {
          "es": "IDEANDO",
          "en": "PLANNING"
        },
        "src": "assets/media/images/instalations/hallowen%20tv%201%20-%20ideando.webp",
        "fallback": "assets/media/images/instalations/hallowen%20tv%201%20-%20ideando.png",
        "width": 977,
        "height": 1307,
        "alt": {
          "es": "Composición inicial de la instalación Halloween con televisores CRT y estructuras de truss",
          "en": "Initial composition of the Halloween installation with CRT televisions and truss structures"
        }
      },
      {
        "type": "video",
        "phase": "02",
        "label": {
          "es": "MODIFICANDO",
          "en": "MODIFYING"
        },
        "src": "assets/media/video/Instalaciones/hallowen%20tv%202%20-%20modificando.webm",
        "fallback": "assets/media/video/Instalaciones/hallowen%20tv%202%20-%20modificando.mp4",
        "width": 606,
        "height": 1080,
        "alt": {
          "es": "Modificación de los televisores para la instalación Halloween",
          "en": "Modification of the televisions for the Halloween installation"
        }
      },
      {
        "type": "video",
        "phase": "03",
        "label": {
          "es": "PRESENTADA",
          "en": "PRESENTED"
        },
        "src": "assets/media/video/Instalaciones/hallowen%20tv%203%20-%20presentada.webm",
        "fallback": "assets/media/video/Instalaciones/hallowen%20tv%203%20-%20presentada.mp4",
        "width": 606,
        "height": 1080,
        "alt": {
          "es": "Presentación final de la instalación Halloween con televisores",
          "en": "Final presentation of the Halloween television installation"
        }
      },
      {
        "type": "image",
        "phase": "05",
        "label": {
          "es": "RESULTADO",
          "en": "RESULT"
        },
        "src": "assets/media/images/instalations/halloween2.png",
        "fallback": "assets/media/images/instalations/halloween2.png",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Instalación Halloween — resultado final",
          "en": "Halloween installation — final result"
        }
      },
      {
        "type": "image",
        "phase": "06",
        "src": "assets/media/images/instalations/halloween2.webp",
        "fallback": "assets/media/images/instalations/halloween2.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Imagen adicional de la instalación Halloween en Spook, 01",
          "en": "Additional image from the Halloween in Spook installation, 01"
        }
      }
    ]
  },
  {
    "id": "otras-01",
    "title": {
      "es": "EACC Museo contemporaneo",
      "en": "EACC Museo contemporaneo"
    },
    "location": null,
    "year": null,
    "tags": {
      "es": "Explorando al ser humano y la tecnología",
      "en": "Exploring Humans and Technology"
    },
    "media": [
      {
        "type": "image",
        "phase": "01",
        "src": "assets/media/images/instalations/castellon2.webp",
        "fallback": "assets/media/images/instalations/castellon2.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Instalación Otras, imagen 01",
          "en": "Other installations, image 01"
        }
      },
      {
        "type": "image",
        "phase": "07",
        "src": "assets/media/images/instalations/70A96F18-62B0-40B5-829D-69332027D5A5.webp",
        "fallback": "assets/media/images/instalations/70A96F18-62B0-40B5-829D-69332027D5A5.webp",
        "width": 828,
        "height": 1242,
        "alt": {
          "es": "Imagen adicional del proyecto EACC Museo contemporaneo, 01",
          "en": "Additional image from the EACC Museo contemporaneo project, 01"
        }
      },
      {
        "type": "image",
        "phase": "08",
        "src": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 05_20_04.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 05_20_04.webp",
        "width": 934,
        "height": 1684,
        "alt": {
          "es": "Imagen adicional del proyecto EACC Museo contemporaneo, 02",
          "en": "Additional image from the EACC Museo contemporaneo project, 02"
        }
      }
    ]
  },
  {
    "id": "otras-02",
    "title": {
      "es": "Nightshot.rec & Disforia",
      "en": "Nightshot.rec & Disforia"
    },
    "location": null,
    "year": null,
    "tags": {
      "es": "Instalación de televisores montados en pared",
      "en": "Installation of Wall-Mounted Televisions"
    },
    "media": [
      {
        "type": "image",
        "phase": "02",
        "src": "assets/media/images/instalations/Instalaciones spook 1.webp",
        "fallback": "assets/media/images/instalations/Instalaciones spook 1.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Instalación Otras, imagen 02",
          "en": "Other installations, image 02"
        }
      },
      {
        "type": "image",
        "phase": "09",
        "src": "assets/media/images/instalations/Niebla roja en la pista techno.webp",
        "fallback": "assets/media/images/instalations/Niebla roja en la pista techno.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Niebla roja en la pista techno de Nightshot.rec & Disforia",
          "en": "Red fog on the Nightshot.rec & Disforia techno dance floor"
        }
      }
    ]
  },
  {
    "id": "otras-03",
    "title": {
      "es": "Estotemarea",
      "en": "Estotemarea"
    },
    "location": null,
    "year": null,
    "tags": {
      "es": "VIDEOARTE / CRT / MULTIPANTALLA",
      "en": "VIDEO ART / CRT / MULTISCREEN"
    },
    "media": [
      {
        "type": "image",
        "phase": "03",
        "src": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_09_12.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_09_12.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Instalación Otras, imagen 03",
          "en": "Other installations, image 03"
        }
      }
    ]
  },
  {
    "id": "otras-04",
    "title": {
      "es": "Experimentación",
      "en": "Experimentation"
    },
    "location": null,
    "year": null,
    "tags": {
      "es": "Prueba y error",
      "en": "Trial and error"
    },
    "media": [
      {
        "type": "image",
        "phase": "04",
        "src": "assets/media/images/instalations/Imagen de ChatGPT 26 sept 2026, 09_47_22.webp",
        "fallback": "assets/media/images/instalations/Imagen de ChatGPT 26 sept 2026, 09_47_22.webp",
        "width": 885,
        "height": 1380,
        "alt": {
          "es": "Instalación Otras, imagen 04",
          "en": "Other installations, image 04"
        }
      },
      {
        "type": "image",
        "phase": "10",
        "src": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_15_34.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_15_34.webp",
        "width": 1024,
        "height": 1536,
        "alt": {
          "es": "Imagen de Experimentación, 02",
          "en": "Experimentation image, 02"
        }
      },
      {
        "type": "image",
        "phase": "11",
        "src": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_20_58.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_20_58.webp",
        "width": 941,
        "height": 1527,
        "alt": {
          "es": "Imagen de Experimentación, 03",
          "en": "Experimentation image, 03"
        }
      },
      {
        "type": "image",
        "phase": "12",
        "src": "assets/media/images/instalations/Instalación audiovisual entre niebla y neón.webp",
        "fallback": "assets/media/images/instalations/Instalación audiovisual entre niebla y neón.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Instalación audiovisual entre niebla y neón",
          "en": "Audiovisual installation amid fog and neon"
        }
      },
      {
        "type": "image",
        "phase": "13",
        "src": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_43_02.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_43_02.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Imagen de Experimentación, 05",
          "en": "Experimentation image, 05"
        }
      },
      {
        "type": "image",
        "phase": "14",
        "src": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_48_19.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_48_19.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Imagen de Experimentación, 06",
          "en": "Experimentation image, 06"
        }
      }
    ]
  },
  {
    "id": "montaje-para-rodaje",
    "title": {
      "es": "Montaje para rodaje",
      "en": "Montaje para rodaje"
    },
    "location": null,
    "year": null,
    "tags": {
      "es": "agregando señales dijitales a un montaje digital",
      "en": "agregando señales dijitales a un montaje digital"
    },
    "media": [
      {
        "type": "image",
        "phase": "01",
        "src": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_43_02.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_43_02.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "Montaje para rodaje",
          "en": "Montaje para rodaje"
        }
      }
    ]
  },
  {
    "id": "under-house",
    "title": {
      "es": "UNDER HOUSE",
      "en": "UNDER HOUSE"
    },
    "location": null,
    "year": null,
    "tags": {
      "es": "CRT COLGADOS, CRT MANEJANDO",
      "en": "HANGING CRTS, CONTROLLING CRTS"
    },
    "media": [
      {
        "type": "image",
        "phase": "01",
        "src": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_48_19.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_48_19.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "UNDER HOUSE, imagen 01",
          "en": "UNDER HOUSE, image 01"
        }
      },
      {
        "type": "image",
        "phase": "02",
        "src": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_56_13.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 sept 2026, 08_56_13.webp",
        "width": 941,
        "height": 1672,
        "alt": {
          "es": "UNDER HOUSE, imagen 02",
          "en": "UNDER HOUSE, image 02"
        }
      },
      {
        "type": "image",
        "phase": "03",
        "src": "assets/media/images/instalations/vlcsnap-2026-07-17-02h36m33s642(1).webp",
        "fallback": "assets/media/images/instalations/vlcsnap-2026-07-17-02h36m33s642(1).webp",
        "width": 1080,
        "height": 1920,
        "alt": {
          "es": "UNDER HOUSE, imagen 03",
          "en": "UNDER HOUSE, image 03"
        }
      }
    ]
  }
];

  function localizedAttributes(content){
    return `data-es="${content.es}" data-en="${content.en}"`;
  }

  function renderVisual(item,imageIndex){
    const language=document.documentElement.lang==='en'?'en':'es';
    const img=`<img src="${item.fallback}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async" draggable="false" alt="${item.alt[language]}" data-installation-image-index="${imageIndex}" ${localizedAttributes(item.alt)}>`;
    return item.src===item.fallback?img:`<picture><source srcset="${item.src}" type="image/webp">${img}</picture>`;
  }

  function renderMetadata(project){
    const details=[project.location,project.year].filter(Boolean).join(' / ');
    return `${details?`<p class="installation-card-meta">${details}</p>`:''}
      <p class="installation-card-tags" ${localizedAttributes(project.tags)}>${project.tags.es}</p>`;
  }

  const cardOrder=['halloween','otras-03','otras-04','otras-02','otras-01'];
  // Preserve the curated order and automatically append newly added projects.
  const orderedIds=cardOrder.concat(projects.filter(project=>!cardOrder.includes(project.id)).map(project=>project.id));
  const projectGalleries=new Map();
  orderedIds.forEach(id=>{
    const project=projects.find(candidate=>candidate.id===id);
    const images=project.media.filter(item=>item.type==='image');
    const preview=images.find(item=>item.label?.en==='RESULT')||images[0];
    projectGalleries.set(id,{
      images:preview?[preview,...images.filter(item=>item!==preview)]:[],
      index:0,
      invalid:new Set()
    });
  });

  function renderImageNavigation(project){
    const gallery=projectGalleries.get(project.id);
    const item=gallery.images[gallery.index];
    const previousControl=gallery.images.length>1?`<button class="installation-media-nav installation-media-nav-prev" type="button" data-installation-direction="-1" aria-label="Imagen anterior"></button>`:'';
    const nextControl=gallery.images.length>1?`<button class="installation-media-nav installation-media-nav-next" type="button" data-installation-direction="1" aria-label="Imagen siguiente"></button>`:'';
    return `<span class="installation-card-preview${gallery.images.length>1?' has-gallery':''}" data-installation-preview>
      <span class="installation-card-media" data-installation-media>${item?renderVisual(item,gallery.index):''}</span>
      <span class="installation-media-controls">
        ${previousControl}
        ${renderIndicators(project.id)}
        ${nextControl}
      </span>
    </span>`;
  }

  function renderIndicators(projectId){
    const gallery=projectGalleries.get(projectId);
    const available=gallery.images
      .map((item,index)=>({item,index}))
      .filter(({index})=>!gallery.invalid.has(index));
    return `<span class="installation-image-dots" data-installation-dots aria-label="Imágenes del proyecto">
      ${available.map(({index},position)=>`<button class="installation-image-dot${index===gallery.index?' is-active':''}" type="button" data-installation-dot-index="${index}" aria-label="Imagen ${position+1} de ${available.length}"${index===gallery.index?' aria-current="true"':''}></button>`).join('')}
    </span>`;
  }

  root.innerHTML=orderedIds.map(id=>{
    const project=projects.find(project=>project.id===id);
    return `<article class="installation-card reveal" id="installation-${project.id}" data-installation-project="${project.id}" aria-labelledby="installation-${project.id}-title">
      ${renderImageNavigation(project)}
      <div class="installation-card-heading"><h3 class="installation-card-title" id="installation-${project.id}-title" ${localizedAttributes(project.title)}>${project.title.es}</h3></div>
      <div class="installation-card-info">${renderMetadata(project)}</div>
    </article>`;
  }).join('');

  const cards=Array.from(root.querySelectorAll('.installation-card'));
  const desktop=matchMedia('(min-width:1024px) and (hover:hover) and (pointer:fine)');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const current=document.querySelector('[data-installations-current]');
  document.querySelector('[data-installations-total]').textContent=String(cards.length).padStart(2,'0');
  root.tabIndex=0;
  root.setAttribute('role','region');
  root.setAttribute('aria-labelledby','installations-title');
  const dragThreshold=7;
  let looping=false;
  let cycleWidth=0;
  let paginationFrame=0;
  let activePointer=null;
  let momentumFrame=0;
  let momentumVelocity=0;
  let momentumPreviousTime=0;
  let momentumStartTime=0;

  function updatePagination(){
    paginationFrame=0;
    const closest=cards.reduce((best,card,index)=>
      Math.abs(card.offsetLeft-root.scrollLeft)<Math.abs(cards[best].offsetLeft-root.scrollLeft)?index:best,0);
    const value=String(closest+1).padStart(2,'0');
    if(current.textContent!==value)current.textContent=value;
  }
  function queuePagination(){
    if(!looping&&!paginationFrame)paginationFrame=requestAnimationFrame(updatePagination);
  }
  function normalizeLoopScroll(){
    if(!looping||!cycleWidth)return;
    const position=root.scrollLeft;
    if(position<cycleWidth*.5)root.scrollLeft=position+cycleWidth;
    else if(position>cycleWidth*1.5)root.scrollLeft=position-cycleWidth;
  }
  function handleScroll(){
    normalizeLoopScroll();
    queuePagination();
  }
  function stopMomentum(){
    if(momentumFrame)cancelAnimationFrame(momentumFrame);
    momentumFrame=0;
    momentumVelocity=0;
    momentumPreviousTime=0;
  }
  function continueMomentum(time){
    if(!momentumPreviousTime)momentumPreviousTime=time;
    const elapsed=Math.min(time-momentumPreviousTime,32);
    momentumPreviousTime=time;
    root.scrollLeft+=momentumVelocity*elapsed;
    normalizeLoopScroll();
    momentumVelocity*=Math.pow(.93,elapsed/(1000/60));
    if(Math.abs(momentumVelocity)<.01||time-momentumStartTime>900){
      stopMomentum();
      return;
    }
    momentumFrame=requestAnimationFrame(continueMomentum);
  }
  function startMomentum(velocity){
    stopMomentum();
    if(reducedMotion.matches||Math.abs(velocity)<.025)return;
    momentumVelocity=Math.max(-1.1,Math.min(1.1,velocity));
    momentumStartTime=performance.now();
    momentumFrame=requestAnimationFrame(continueMomentum);
  }
  function moveByProject(direction){
    stopMomentum();
    const renderedCards=Array.from(root.children).filter(element=>element.classList.contains('installation-card'));
    const closest=renderedCards.reduce((best,card,index)=>
      Math.abs(card.offsetLeft-root.scrollLeft)<Math.abs(renderedCards[best].offsetLeft-root.scrollLeft)?index:best,0);
    const target=renderedCards[Math.max(0,Math.min(renderedCards.length-1,closest+direction))];
    if(!target)return;
    root.scrollTo({left:target.offsetLeft,behavior:reducedMotion.matches?'auto':'smooth'});
  }
  function copyCard(card){
    const copy=card.cloneNode(true);
    copy.dataset.installationCopy='';
    copy.classList.remove('reveal');
    copy.setAttribute('aria-hidden','true');
    // Copies are pointer-operable, but only original projects appear in the
    // accessibility tree and keyboard order. Never duplicate document IDs.
    [copy,...copy.querySelectorAll('*')].forEach(element=>{
      element.removeAttribute('id');
      element.removeAttribute('aria-labelledby');
      if(element.matches('a,button,input,select,textarea,[tabindex]'))element.tabIndex=-1;
    });
    return copy;
  }
  function updateProjectIndicators(projectId){
    root.querySelectorAll('.installation-card').forEach(card=>{
      if(card.dataset.installationProject!==projectId)return;
      const dots=card.querySelector('[data-installation-dots]');
      if(!dots)return;
      const replacement=document.createRange().createContextualFragment(renderIndicators(projectId)).firstElementChild;
      if(card.hasAttribute('data-installation-copy'))replacement.querySelectorAll('button').forEach(button=>button.tabIndex=-1);
      dots.replaceWith(replacement);
    });
  }
  function updateProjectImage(projectId){
    const gallery=projectGalleries.get(projectId);
    const item=gallery?.images[gallery.index];
    if(!item)return;
    root.querySelectorAll('.installation-card').forEach(card=>{
      if(card.dataset.installationProject!==projectId)return;
      const media=card.querySelector('[data-installation-media]');
      if(media)media.innerHTML=renderVisual(item,gallery.index);
    });
    updateProjectIndicators(projectId);
  }
  function setProjectImage(projectId,index){
    const gallery=projectGalleries.get(projectId);
    if(!gallery||!gallery.images[index]||gallery.invalid.has(index))return;
    gallery.index=index;
    updateProjectImage(projectId);
  }
  function changeProjectImage(projectId,direction){
    const gallery=projectGalleries.get(projectId);
    if(!gallery||gallery.images.length<2)return;
    for(let step=0;step<gallery.images.length;step++){
      gallery.index=(gallery.index+direction+gallery.images.length)%gallery.images.length;
      if(!gallery.invalid.has(gallery.index))break;
    }
    updateProjectImage(projectId);
  }
  function markInvalidImage(projectId,index){
    const gallery=projectGalleries.get(projectId);
    if(!gallery||gallery.invalid.has(index))return;
    gallery.invalid.add(index);
    if(gallery.index===index)changeProjectImage(projectId,1);
    else updateProjectIndicators(projectId);
  }
  function validateGalleryImages(projectId){
    const gallery=projectGalleries.get(projectId);
    gallery.images.forEach((item,index)=>{
      const sources=item.src===item.fallback?[item.src]:[item.src,item.fallback];
      const probe=new Image();
      let sourceIndex=0;
      probe.onload=()=>{};
      probe.onerror=()=>{
        sourceIndex++;
        if(sourceIndex<sources.length)probe.src=sources[sourceIndex];
        else markInvalidImage(projectId,index);
      };
      probe.src=sources[sourceIndex];
    });
  }
  function configureCarousel(){
    stopMomentum();
    const shouldLoop=desktop.matches;
    let progress=cycleWidth?((root.scrollLeft%cycleWidth)+cycleWidth)%cycleWidth/cycleWidth:0;
    if(progress<.003||progress>.997)progress=0;
    if(shouldLoop!==looping){
      root.querySelectorAll('[data-installation-copy]').forEach(copy=>copy.remove());
      if(shouldLoop){
        root.prepend(...cards.map(copyCard));
        root.append(...cards.map(copyCard));
      }
      looping=shouldLoop;
      root.classList.toggle('is-looping',looping);
    }
    const gap=parseFloat(getComputedStyle(root).columnGap)||0;
    const first=cards[0].getBoundingClientRect();
    // Measure the actual rendered repeat, including fractional flex gaps.
    cycleWidth=looping
      ?first.left-root.firstElementChild.getBoundingClientRect().left
      :cards[cards.length-1].getBoundingClientRect().right-first.left+gap;
    root.scrollLeft=(looping?cycleWidth:0)+progress*cycleWidth;
    queuePagination();
  }
  new ResizeObserver(configureCarousel).observe(root);
  desktop.addEventListener('change',configureCarousel);
  reducedMotion.addEventListener('change',stopMomentum);
  root.addEventListener('scroll',handleScroll,{passive:true});
  document.querySelectorAll('[data-installations-carousel-direction]').forEach(button=>{
    button.addEventListener('click',()=>moveByProject(Number(button.dataset.installationsCarouselDirection)));
  });
  root.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
    stopMomentum();
    const dot=event.target.closest('[data-installation-dot-index]');
    if(dot){
      event.stopPropagation();
      return;
    }
    let control=event.target.closest('[data-installation-direction]');
    if(!control){
      const preview=event.target.closest('[data-installation-preview]');
      const card=preview?.closest('.installation-card');
      const gallery=card&&projectGalleries.get(card.dataset.installationProject);
      if(preview&&gallery?.images.length>1){
        const bounds=preview.getBoundingClientRect();
        const direction=event.clientX<bounds.left+bounds.width/2?-1:1;
        control=preview.querySelector(`[data-installation-direction="${direction}"]`);
      }
    }
    activePointer={
      id:event.pointerId,
      pointerType:event.pointerType,
      startX:event.clientX,
      startY:event.clientY,
      lastX:event.clientX,
      lastY:event.clientY,
      lastTime:event.timeStamp,
      velocity:0,
      control,
      axis:null,
      dragging:false
    };
    if(event.pointerType!=='touch')root.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    if(!activePointer||event.pointerId!==activePointer.id)return;
    const distanceX=event.clientX-activePointer.startX;
    const distanceY=event.clientY-activePointer.startY;
    if(!activePointer.axis&&Math.max(Math.abs(distanceX),Math.abs(distanceY))>dragThreshold){
      activePointer.axis=Math.abs(distanceX)>=Math.abs(distanceY)?'horizontal':'vertical';
      if(activePointer.axis==='horizontal'){
        activePointer.dragging=true;
        root.classList.add('is-dragging');
      }
    }
    if(activePointer.axis==='horizontal'&&activePointer.pointerType!=='touch'){
      event.preventDefault();
      const scrollDelta=activePointer.lastX-event.clientX;
      const elapsed=Math.max(event.timeStamp-activePointer.lastTime,1);
      root.scrollLeft+=scrollDelta;
      const instantVelocity=scrollDelta/elapsed;
      activePointer.velocity=activePointer.velocity*.55+instantVelocity*.45;
      normalizeLoopScroll();
    }
    activePointer.lastX=event.clientX;
    activePointer.lastY=event.clientY;
    activePointer.lastTime=event.timeStamp;
  });
  root.addEventListener('pointerup',event=>{
    if(!activePointer||event.pointerId!==activePointer.id)return;
    const pointer=activePointer;
    const moved=Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY);
    if(!pointer.dragging&&moved<=dragThreshold&&pointer.control){
      event.preventDefault();
      const card=pointer.control.closest('.installation-card');
      changeProjectImage(card.dataset.installationProject,Number(pointer.control.dataset.installationDirection));
      if(document.activeElement===pointer.control)pointer.control.blur();
    }
    if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);
    root.classList.remove('is-dragging');
    activePointer=null;
    if(pointer.dragging&&pointer.pointerType!=='touch'){
      const releaseFactor=Math.max(0,1-(event.timeStamp-pointer.lastTime)/120);
      startMomentum(pointer.velocity*releaseFactor);
    }
  });
  root.addEventListener('pointercancel',event=>{
    if(!activePointer||event.pointerId!==activePointer.id)return;
    if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);
    root.classList.remove('is-dragging');
    activePointer=null;
  });
  root.addEventListener('click',event=>{
    const dot=event.target.closest('[data-installation-dot-index]');
    if(dot){
      event.preventDefault();
      event.stopPropagation();
      const card=dot.closest('.installation-card');
      setProjectImage(card.dataset.installationProject,Number(dot.dataset.installationDotIndex));
      return;
    }
    const control=event.target.closest('[data-installation-direction]');
    if(!control||event.detail!==0)return;
    const card=control.closest('.installation-card');
    changeProjectImage(card.dataset.installationProject,Number(control.dataset.installationDirection));
  });
  root.addEventListener('error',event=>{
    const media=event.target.closest?.('[data-installation-media]');
    const card=media?.closest('.installation-card');
    if(!card)return;
    const failedIndex=Number(event.target.dataset.installationImageIndex);
    markInvalidImage(card.dataset.installationProject,failedIndex);
  },true);
  root.addEventListener('dragstart',event=>event.preventDefault());
  configureCarousel();
  orderedIds.forEach(validateGalleryImages);
})();
