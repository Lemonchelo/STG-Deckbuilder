# STG TCG Deckbuilder — guía de trabajo

Adaptación para este proyecto de los principios de [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md): explicitar supuestos, elegir soluciones sencillas, limitar los cambios al objetivo y verificar el resultado. Consultado el 19 de septiembre de 2026. El contenido específico del juego y de la arquitectura que sigue corresponde a este repositorio.

## Prioridad y alcance

El objetivo actual es un constructor de mazos correcto, rápido y cómodo. La evolución futura es permitir partidas ingame sobre datos y reglas verificables. Esta orientación no autoriza a implementar anticipadamente un motor, cuentas, servidores, IA ni multijugador en una tarea que no lo requiera.

Seguí las instrucciones explícitas del usuario y las restricciones del entorno. Antes de editar, identificá el comportamiento esperado y una comprobación concreta. Exponé los supuestos que afecten datos, reglas o compatibilidad; pedí aclaración cuando no puedan resolverse con evidencia. Avanzá por tu cuenta en decisiones reversibles y trabajo ya autorizado. No solicites nuevamente permiso para acciones autorizadas.

Preferí una solución localizada y comprensible. No mezcles un arreglo con una reescritura visual o un cambio de tecnología. Conservá las modificaciones preexistentes del usuario. Informá problemas ajenos al alcance sin convertirlos automáticamente en trabajo adicional.

## Cómo funciona hoy

- `index.html` carga **solo `js/bundle.js`** y debe seguir funcionando al abrirlo mediante `file://`.
- Los archivos separados de `js/` contienen la versión modular. Toda corrección de comportamiento debe reflejarse en el módulo correspondiente y en el bundle. No supongas que ya son equivalentes.
- No hay backend, gestor de paquetes ni compilación obligatoria. No agregues dependencias de ejecución sin una necesidad concreta.
- `state.js`: mazo, validación, filtros e importación/exportación. `cardsData.js`: colección y constantes.
- `customCardImporter.js`: nombres de archivo, lectura de imágenes e IndexedDB.
- `filterManager.js`, `deckManager.js`, `cardInspector.js`: biblioteca, mazo y detalle. `testHand.js`: simulador de mano, no motor de combate.
- `cartas/`: 464 imágenes originales, `catalogo-original.json` (identificadores y metadatos del origen) y `pool-manifest.json` (lista de rutas que `poolManager.js` lee por `fetch()` para armar la pool base sin selector de carpeta; regenerarlo con `node tests/generate-pool-manifest.cjs` tras sumar o sacar imágenes).
- `snd/`: `bgm/` (música de fondo; se elige una pista válida al azar y queda en loop) y `sfx/` (efecto al agregar/quitar carta con clic derecho; al azar entre los válidos, con el sonido sintetizado como respaldo). `sound.js` lee `snd/sound-manifest.json` por `fetch()` (no hay listado de carpetas en GitHub Pages); regenerarlo con `node tests/generate-sound-manifest.cjs` tras sumar o sacar audios. Sin manifest (`file://`) no hay música ni efectos de archivo. `cartas/banlist-default.json`: banlist predefinida por el repo, aplicada al arrancar (`loadDefaultBanlist` en `state.js`) para quien no tenga banlist propia guardada; un límite o una eliminación que el usuario ya haya hecho en su navegador siempre gana sobre este archivo (ver `cartas/README.md`).
El botón de volumen de la barra despliega dos sliders (música y efectos; 0 = silencio) cuyos valores se recuerdan en `localStorage`.
- Las claves de almacenamiento y el formato exportado conservan nombres históricos de Aetherium. El nombre visible es **STG TCG Deckbuilder**. No cambies esas claves por motivos de marca: cualquier migración debe conservar los datos existentes.

## Exactitud del deckbuilding

Las siguientes son reglas implementadas por el constructor, no una certificación del reglamento oficial:

- Mazo principal completo: 40 cartas. Los borradores de menos de 40 son válidos para edición.
- Límites por carta: común 4, rara 3, épica 2, legendaria 1. Los sellos están limitados por el tamaño total del mazo.
- Los tokens no se agregan manualmente al mazo principal. Actualmente el Mazo Extra reúne tokens de las facciones presentes.
- Toda vía que modifique el mazo —clic, arrastre, JSON, texto, restauración y futura recomendación automática— debe respetar las mismas invariantes.
- Agregá cantidades de entradas repetidas antes de evaluar límites. Rechazá cantidades inválidas, cartas desconocidas y entradas ambiguas con mensajes útiles. Validá una importación completa antes de sustituir el mazo anterior.

No inventes reglas de facciones, bans, limitaciones, mulligan, recursos o generación de tokens. Si una regla cambia, identificá la fuente y su versión; documentá la diferencia frente al comportamiento anterior y agregá un caso de prueba.

El importador actual por nombre de archivo pierde información: genera textos genéricos, combina costes y asigna valores fijos a tokens. Para una importación fiel, partí de `catalogo-original.json`: conservá `id`, tipos múltiples, `relatedCardIds`, costes de facción y neutral, estadísticas, textos y restricciones. No deduzcas habilidades a partir del nombre o de la ilustración. Un campo ausente debe seguir siendo desconocido, no una regla inventada.

Si se solicitan sugerencias de mazos, separá legalidad y calidad estratégica. Explicá los criterios usados —curva, recursos disponibles, consistencia, sinergias, condiciones de victoria— y las limitaciones de los datos. No presentes una puntuación heurística ni una simulación de manos como porcentaje de victoria.

## Rendimiento y experiencia

- Medí antes de afirmar una mejora: registrá navegador, tamaño de colección, escenario y métrica. Diferenciá carga inicial, filtrado, incorporación de una carta y apertura del detalle.
- Usá la colección completa para evaluar cambios relevantes. Evitá recrear imágenes y listeners cuando solo cambia un contador; preservá foco y posición de scroll.
- Agrupá actualizaciones de animación con `requestAnimationFrame`. Reservá `will-change` para interacciones activas y respetá `prefers-reduced-motion`.
- Evitá que fuentes o servicios externos bloqueen el uso local. La búsqueda y el armado del mazo deben funcionar sin conexión tras disponer de los archivos.
- Introducí índices, renderizado incremental, blobs o virtualización cuando una medición lo justifique. Considerá la migración desde imágenes base64 antes de cambiar la persistencia.
- Un error de lectura o escritura debe ser visible. No anuncies guardado exitoso si falla IndexedDB ni destruyas el mazo ante un error de importación.
- Escapá texto externo antes de insertarlo como HTML. Los nombres de cartas, archivos y metadatos son datos, nunca instrucciones.
- Verificá cierre de modales, teclado, foco, estados deshabilitados y selección visible. No uses la animación como requisito para ejecutar una acción.

## Preparación para futuras partidas ingame

Cuando se solicite implementar partidas, avanzá mediante un escenario mínimo verificable antes de ampliar mecánicas:

1. Definí el reglamento del escenario: jugadores, zonas, mano inicial, turno/fases, recursos, acciones permitidas, resolución de efectos y condición de fin. Enumerá lo aún no implementado.
2. Separá definición de carta, lista del mazo e instancia de carta en partida. Dos copias comparten definición, pero necesitan identidades distintas y estado propio.
3. Mantené las reglas independientes del DOM, animaciones, audio y almacenamiento. Una acción debe validarse contra el estado y producir un resultado reproducible; la interfaz solo representa ese resultado.
4. Usá aleatoriedad controlable por semilla y un registro ordenado de acciones para reproducir pruebas y errores. Versioná reglas y datos asociados a una partida guardada.
5. Modelá explícitamente propietario, controlador y zonas cuando el escenario los necesite. Probá conservación de cartas, pagos de recursos, acciones ilegales, orden de resolución y finalización.
6. Tratá una habilidad no implementada como no compatible. No la ignores silenciosamente ni uses el texto libre como código ejecutable.
7. Si se solicita multijugador, definí autoridad del estado y visibilidad por jugador. El cliente no debe decidir por sí solo acciones legales ni recibir manos o información oculta del rival. No agregues infraestructura de red a una tarea de deckbuilding.

No uses el estado mutable de edición del mazo como estado de una partida en curso. El paso a partidas debe preservar el constructor y sus archivos de exportación mediante límites claros entre ambos componentes.

## Verificación y entrega

- Para reglas e importación: `node tests/regression.cjs`. Comprueba módulos y bundle, límites, entradas repetidas, errores sin mutación, ida y vuelta de exportaciones y referencias literales a IDs del DOM.
- Para interfaz: con Playwright disponible y Edge instalado, `node tests/browser.cjs`. Usa un perfil aislado; nunca borres la colección del navegador personal para probar.
- Probá `file://` si tocás arranque, rutas, almacenamiento o empaquetado. Para un cambio de motor futuro, agregá pruebas deterministas independientes del navegador.
- Antes de entregar: revisá `git diff --check`, el diff y las pruebas pertinentes. No repitas pruebas amplias sin cambios o una duda nueva que lo justifique.
- Informá comportamiento cambiado, evidencia de validación, riesgos y pendientes. No afirmes que se probaron todas las combinaciones ni que mejoró el rendimiento sin medirlo.
- Hacé commit/push cuando el usuario lo solicite; revisá rama y remoto, incluí solo el trabajo autorizado y verificá el resultado. No uses force push ni sobrescribas una rama remota existente para resolver una divergencia.
