(function renderInstallationsProjects(){
  const root=document.querySelector('[data-installations-projects]');
  const dialog=document.getElementById('installations-gallery');
  if(!root||!dialog)return;

  // Location and event year are undocumented; file export dates are not event dates.
  const projects=[
  {
    "id": "halloween",
    "title": "HALLOWEEN",
    "location": null,
    "year": null,
    "tags": {
      "es": "VIDEOARTE / CRT / ESCENOGRAFÍA",
      "en": "VIDEO ART / CRT / STAGE DESIGN"
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
        "phase": "04",
        "label": {
          "es": "MONTANDO",
          "en": "ASSEMBLING"
        },
        "src": "assets/media/images/instalations/hallowen%20pantalla%201%20-%20montando.webp",
        "fallback": "assets/media/images/instalations/hallowen%20pantalla%201%20-%20montando.png",
        "width": 784,
        "height": 918,
        "alt": {
          "es": "Montaje de los módulos visuales para la instalación Halloween",
          "en": "Assembly of the visual modules for the Halloween installation"
        }
      },
      {
        "type": "image",
        "phase": "05",
        "label": {
          "es": "RESULTADO",
          "en": "RESULT"
        },
        "src": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_59_02.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_59_02.webp",
        "width": 1448,
        "height": 1086,
        "alt": {
          "es": "Instalación Halloween — resultado final",
          "en": "Halloween installation — final result"
        }
      }
    ]
  },
  {
    "id": "otras-01",
    "title": "OTRAS 01",
    "location": null,
    "year": null,
    "tags": {
      "es": "VIDEOARTE / CRT / MULTIPANTALLA",
      "en": "VIDEO ART / CRT / MULTISCREEN"
    },
    "media": [
      {
        "type": "image",
        "phase": "01",
        "src": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_20_58.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_20_58.webp",
        "width": 941,
        "height": 1527,
        "alt": {
          "es": "Instalación Otras, imagen 01",
          "en": "Other installations, image 01"
        }
      }
    ]
  },
  {
    "id": "otras-02",
    "title": "OTRAS 02",
    "location": null,
    "year": null,
    "tags": {
      "es": "VIDEOARTE / CRT / MULTIPANTALLA",
      "en": "VIDEO ART / CRT / MULTISCREEN"
    },
    "media": [
      {
        "type": "image",
        "phase": "02",
        "src": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_15_34.webp",
        "fallback": "assets/media/images/instalations/ChatGPT Image 23 jul 2026, 23_15_34.webp",
        "width": 1024,
        "height": 1536,
        "alt": {
          "es": "Instalación Otras, imagen 02",
          "en": "Other installations, image 02"
        }
      }
    ]
  },
  {
    "id": "otras-03",
    "title": "OTRAS 03",
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
    "title": "OTRAS 04",
    "location": null,
    "year": null,
    "tags": {
      "es": "VIDEOARTE / CRT / MULTIPANTALLA",
      "en": "VIDEO ART / CRT / MULTISCREEN"
    },
    "media": [
      {
        "type": "image",
        "phase": "04",
        "src": "assets/media/images/instalations/vlcsnap-2026-07-17-04h43m24s889.webp",
        "fallback": "assets/media/images/instalations/vlcsnap-2026-07-17-04h43m24s889.webp",
        "width": 2160,
        "height": 3840,
        "alt": {
          "es": "Instalación Otras, imagen 04",
          "en": "Other installations, image 04"
        }
      }
    ]
  }
];

  function localizedAttributes(content){
    return `data-es="${content.es}" data-en="${content.en}"`;
  }

  function renderVisual(item){
    if(item.type==='video')return `<video width="${item.width}" height="${item.height}" controls muted loop playsinline preload="none" data-installation-video aria-label="${item.alt.es}" ${localizedAttributes(item.alt)}>
      <source data-src="${item.src}" type="video/webm">
      <source data-src="${item.fallback}" type="video/mp4">
    </video>`;
    const img=`<img src="${item.fallback}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async" alt="${item.alt.es}" ${localizedAttributes(item.alt)}>`;
    return item.src===item.fallback?img:`<picture><source srcset="${item.src}" type="image/webp">${img}</picture>`;
  }

  function renderMetadata(project){
    const details=[project.location,project.year].filter(Boolean).join(' / ');
    return `${details?`<p class="installation-card-meta">${details}</p>`:''}
      <p class="installation-card-tags" ${localizedAttributes(project.tags)}>${project.tags.es}</p>`;
  }

  const cardOrder=['halloween','otras-03','otras-04','otras-02','otras-01'];
  root.innerHTML=cardOrder.map(id=>{
    const project=projects.find(project=>project.id===id);
    // Keep the numbered archive labels internally until project names are supplied.
    const title=project.id.startsWith('otras-')?'OTRAS':project.title;
    const preview=project.media.find(item=>item.label?.en==='RESULT')||project.media[0];
    return `<article class="installation-card reveal" id="installation-${project.id}" aria-labelledby="installation-${project.id}-title">
      <button class="installation-card-open" type="button" data-installation-open="${project.id}" aria-haspopup="dialog" aria-controls="installations-gallery" aria-labelledby="installation-${project.id}-title">
        <span class="installation-card-preview">${renderVisual(preview)}</span>
        <span class="installation-card-heading"><span class="installation-card-title" id="installation-${project.id}-title" role="heading" aria-level="3">${title}</span><span class="installation-card-arrow" aria-hidden="true">→</span></span>
      </button>
      <div class="installation-card-info">${renderMetadata(project)}</div>
    </article>`;
  }).join('');

  // Native scrolling handles the carousel; JS only reflects its current position.
  const cards=Array.from(root.querySelectorAll('.installation-card'));
  const current=document.querySelector('[data-installations-current]');
  document.querySelector('[data-installations-total]').textContent=String(cards.length).padStart(2,'0');
  let paginationFrame=0;
  function updatePagination(){
    paginationFrame=0;
    const closest=cards.reduce((best,card,index)=>
      Math.abs(card.offsetLeft-root.scrollLeft)<Math.abs(cards[best].offsetLeft-root.scrollLeft)?index:best,0);
    const value=String(closest+1).padStart(2,'0');
    if(current.textContent!==value)current.textContent=value;
  }
  function queuePagination(){
    if(!paginationFrame)paginationFrame=requestAnimationFrame(updatePagination);
  }
  root.addEventListener('scroll',queuePagination,{passive:true});
  new ResizeObserver(queuePagination).observe(root);

  const gallery=dialog.querySelector('[data-installations-gallery-content]');
  gallery.innerHTML=projects.map((project,index)=>`<article class="installation-gallery-project" data-gallery-project="${project.id}" aria-labelledby="gallery-${project.id}-title">
    <header class="installation-gallery-heading"><span class="installation-card-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h3 id="gallery-${project.id}-title">${project.title}</h3>${renderMetadata(project)}</div></header>
    <div class="installation-gallery-media">${project.media.map(item=>`<figure>
      <div class="installation-gallery-visual">${renderVisual(item)}</div>
      ${item.label?`<figcaption><span>${item.phase}</span><span ${localizedAttributes(item.label)}>${item.label.es}</span></figcaption>`:''}
    </figure>`).join('')}</div>
  </article>`).join('');

  function openGallery(projectId){
    gallery.querySelectorAll('[data-gallery-project]').forEach(project=>{
      project.hidden=Boolean(projectId)&&project.dataset.galleryProject!==projectId;
    });
    dialog.showModal();
    dialog.scrollTop=0;
  }

  root.querySelectorAll('[data-installation-open]').forEach(button=>{
    button.addEventListener('click',()=>openGallery(button.dataset.installationOpen));
  });
  document.querySelector('[data-installations-view-all]').addEventListener('click',()=>openGallery());
  dialog.addEventListener('close',()=>{
    dialog.querySelectorAll('video').forEach(video=>video.pause());
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
  });
})();
