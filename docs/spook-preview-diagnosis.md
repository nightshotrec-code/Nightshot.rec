# Diagnóstico de la preview 3D de SPOOK

Fecha: 2026-07-22. Alcance: preview normal de SPOOK en `Entornos`.

## Línea base medida en Chrome

- `document.querySelectorAll("canvas").length`: **6** canvas totales de la página.
- Canvas de SPOOK (`#inst-canvas`): **1**.
- Contextos WebGL asociados a SPOOK: **1 WebGL2**, no perdido.
- Loops RAF de SPOOK pendientes: **1** (`animate`).
- Renderers/escenas/modelos cargados por la preview: **1** de cada uno.
- Drawing buffer medido: **747 x 339**, DPR **1**.
- Objetivo de la preview: **30 FPS**.
- Rendimiento real sostenido antes del cambio: **10,5–16 FPS**.
- Trabajo por frame antes del cambio: **3.392 draw calls**, **1.510.110 triángulos** y **848 geometrías GPU**.
- Los recuentos de canvas, contexto y loop permanecieron estables durante la muestra; no se observó acumulación ni reinicialización al reentrar en la sección.

## Causa

No había duplicación del canvas, renderer, escena ni loop. La preview clonaba toda la jerarquía del GLB para dibujar dos capas (sólida y wireframe). El GLB está fragmentado en cientos de meshes; la clonación convertía cada frame en miles de draw calls. La GPU no alcanzaba el límite de 30 FPS, por lo que `OrbitControls` sólo avanzaba en actualizaciones irregulares y la rotación parecía trabarse.

Las dos capas transparentes conservaban además `depthWrite: true`. Al rotar, meshes transparentes separados escribían y competían en el depth buffer según su orden de dibujo; por eso partes del modelo podían ocultarse o reaparecer.

## Corrección aplicada

- Se hornean las transformaciones del modelo estático y se consolidan sus geometrías una sola vez al cargar la preview.
- Las capas sólida y wireframe comparten esa geometría consolidada; se mantienen materiales, escala, posición, cámara y velocidad configurada.
- En modo X-RAY, las capas transparentes usan `depthWrite: false`. En modo sólido, la capa sólida recupera `depthWrite: true`.

## Validación posterior

- Canvas SPOOK: **1**.
- Contexto WebGL: **1**.
- Loop RAF SPOOK: **1**.
- Geometrías GPU: **1** (antes 848).
- Draw calls: **4** (antes 3.392; reducción del 99,88 %).
- Triángulos: **1.510.110**; no se alteró la geometría visible ni se redujo calidad.
- Rendimiento medido en el mismo Chrome headless: **22–25,9 FPS**, aproximadamente el doble de la línea base. Este entorno headless no representa el rendimiento final de una GPU de escritorio, pero permite una comparación A/B idéntica.
- Tras 15 segundos y una salida/reentrada de la sección, los recuentos siguieron estables y no aparecieron contextos, canvas o loops adicionales.
