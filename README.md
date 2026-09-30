# STG TCG Deckbuilder

Deckbuilder personalizado para el TCG Argentino "Rise of Gods"

## Contenido

- [Inicio rápido](#inicio-rápido)
- [Reglas del mazo](#reglas-del-mazo)
- [Importar cartas](#importar-cartas)
- [Construir el mazo](#construir-el-mazo)
- [Biblioteca, búsqueda y filtros](#biblioteca-búsqueda-y-filtros)
- [Análisis del mazo](#análisis-del-mazo)
- [Inspector de cartas](#inspector-de-cartas)
- [Probar mano (Mulligan)](#probar-mano-mulligan)
- [Mis mazos guardados](#mis-mazos-guardados)
- [Pool base y actualizaciones](#pool-base-y-actualizaciones)
- [Exportar e importar mazos](#exportar-e-importar-mazos)
- [Dónde se guardan los datos](#dónde-se-guardan-los-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Problemas frecuentes](#problemas-frecuentes)

---

## Inicio rápido

1. Cloná o descargá el repo.
2. Abrí `index.html` en el navegador (doble clic). No necesita servidor ni instalación.
   - Alternativa con servidor local: `python -m http.server 8000` y entrá a `http://localhost:8000`.
   - Las tipografías vienen de Google Fonts; sin internet la app funciona igual, con tipografías de reemplazo.
3. La app arranca **sin cartas**. Hacé clic en **📁 Importar Cartas → Seleccionar Carpeta** y elegí la carpeta `cartas` incluida en el repositorio para cargar las **464 cartas de Rise of Gods**, o cargá tus propias imágenes (ver [Importar cartas](#importar-cartas)). Consultá [los formatos y límites del catálogo incluido](cartas/README.md).
4. Armá tu mazo de 40 cartas desde la biblioteca de la derecha.

---

## Reglas del mazo

| Regla | Detalle |
|---|---|
| Tamaño del mazo principal | **40 cartas** exactas |
| Copias por rareza | Común: **4** · Rara: **3** · Épica: **2** · Legendaria: **1** |
| Sellos | Sin rareza y **sin límite de copias** (hasta completar las 40) |
| Tokens | No se agregan a mano: forman el **Mazo Extra**, que es automático |
| Facciones | Marte, Neptuno, Júpiter, Tierra, Saturno, Mercurio, Plutón, más **Arcano** (neutral) |
| Tipos de carta | Criatura, Hechizo Rápido, Hechizo Lento, Estructura, Artefacto, Sello, Terreno (y Token) |

El indicador de la barra superior muestra el estado del mazo: **Incompleto** (menos de 40), **Listo (40/40)** o **Exceso** (más de 40).

---

## Importar cartas

Las cartas se crean a partir de **imágenes**: el *nombre del archivo* define sus datos (nombre, tipo, rareza, planeta, ataque, defensa y coste). No hay que escribir ningún JSON.

### Cómo importar

1. Clic en **📁 Importar Cartas** (barra superior). También podés abrir el importador con el botón del estado vacío de la biblioteca.
2. Elegí una de estas opciones:
   - **Seleccionar Carpeta**: importa todas las imágenes de una carpeta (incluye subcarpetas).
   - **Seleccionar Imágenes**: elegís archivos sueltos.
   - **Arrastrar y soltar** carpetas o archivos sobre el área punteada.
3. Se muestra una barra de progreso y, al terminar, la lista de **cartas detectadas**. Revisala para confirmar que cada archivo se interpretó bien.
4. Cerrá el modal con **Cerrar**, con la ✕ o haciendo clic fuera.

Se aceptan todos los formatos de imagen que soporte el navegador (`png`, `jpg`, `webp`, etc.). Los archivos que no sean imágenes se ignoran.

### Formato de nombre de archivo

Los campos se separan con guion bajo (`_`) y **no** llevan espacios ni guiones bajos internos. La extensión no importa.

#### 1. Carta estándar

```
Nombre_Tipo_Rareza_Planeta_ATK_DEF_Coste.png
```

| Campo | Ejemplos válidos | Notas |
|---|---|---|
| `Nombre` | `Ares`, `GuerreroMarciano`, `Rayo-Dorado` | `CamelCase` y guiones se convierten en espacios: `GuerreroMarciano` → "Guerrero Marciano" |
| `Tipo` | `Criatura`, `HechizoRapido`, `HechizoLento`, `Estructura`, `Artefacto`, `Sello`, `Terreno` | **Sin tildes ni espacios.** También se aceptan alias: `Hechizo` (= Lento), `Rapido`, `Lento`, `Monstruo`, `Unidad`, `Reliquia`, `Objeto`, `Campo`, y equivalentes en inglés (`Creature`, `Instant`, `Sorcery`, `Structure`, `Artifact`, `Field`) |
| `Rareza` | `Comun`, `Rara`, `Epica`, `Legendaria` | Con o sin tilde. También `Common`, `Rare`, `Epic`, `Legendary`, `Mitica` (= Legendaria) |
| `Planeta` | `Marte`, `Neptuno`, `Jupiter`, `Tierra`, `Saturno`, `Mercurio`, `Pluton`, `Neutral` | Con o sin tilde. Alias por elemento o color: `Fuego`/`Rojo` (Marte), `Agua`/`Azul` (Neptuno), `Oro`/`Dorado` (Júpiter), `Verde`/`Naturaleza` (Tierra), `Morado`/`Violeta` (Saturno), `Plata`/`Gris` (Mercurio), `Vacio`/`Sombra`/`Negro` (Plutón), `Arcano`/`Incoloro` (Neutral) |
| `ATK` | `8` | Solo se usa en **Criaturas** (mínimo 0) |
| `DEF` | `6` | Solo se usa en **Criaturas** (mínimo 1) |
| `Coste` | `7` | Coste de maná, de 0 a 20 |

Ejemplos:

```
Ares_Criatura_Legendaria_Marte_8_6_7.png
Rayo_HechizoRapido_Comun_Jupiter_0_0_1.png
TorreDeMareas_Estructura_Rara_Neptuno_0_0_4.png
```

> **Tip:** aunque la carta no sea una Criatura, completá siempre los 7 campos (usá `0_0` para ATK/DEF). Si faltan campos, el último valor del nombre se interpreta como coste y podés obtener resultados inesperados.

#### 2. Sello (recurso de maná)

```
Sello_Planeta.png
Sello_Nombre_Planeta.png
```

```
Sello_Marte.png              → "Sello de Marte"
Sello_MagmaAncestral_Marte.png → "Sello de Magma Ancestral"
```

Los sellos no tienen rareza ni límite de copias, y su coste es 0. Cada uno provee 1 punto de maná de su planeta.

#### 3. Token (Mazo Extra)

```
Token_Nombre_Planeta.png
Token_Planeta.png
```

```
Token_GuerreroMarciano_Marte.png   → token "Guerrero Marciano" (Marte)
Token_Marte.png                    → "Token de Marte"
```

Los tokens se crean como 1/1 de coste 0 y **no aparecen en la biblioteca**: van directo al [Mazo Extra](#mazo-extra-tokens) cuando su planeta está en el mazo.

### Valores por defecto

Si un campo falta o no se reconoce, la app usa un valor por defecto en lugar de fallar:

| Campo | Por defecto |
|---|---|
| Tipo | Criatura |
| Rareza | Común |
| Planeta | Neutral (Arcano) |
| ATK / DEF (Criatura) | 1 / 1 |
| Coste | 0 |

Por eso conviene revisar la lista de **cartas detectadas** tras importar: un error tipográfico en el nombre del archivo (por ejemplo `HechizoRápido` con tilde) no da error, simplemente cae en el valor por defecto.

### Cosas a tener en cuenta

- **Importar dos veces la misma imagen crea dos cartas distintas.** Para empezar de cero usá **🗑️ Borrar Cartas Personalizadas** dentro del importador.
- **Borrar cartas personalizadas también vacía el mazo actual** (previa confirmación), porque las cartas del mazo dejan de existir.
- Las imágenes se guardan en el navegador (IndexedDB), así que las cartas siguen ahí al recargar la página. Ver [Dónde se guardan los datos](#dónde-se-guardan-los-datos).

---

## Construir el mazo

Hay varias formas de agregar y quitar cartas:

| Acción | Cómo |
|---|---|
| Agregar una carta | **Clic derecho** sobre la carta en la biblioteca, o **arrastrarla** a la zona del mazo |
| Ver detalle de una carta | **Clic** sobre la carta, en la biblioteca o en el mazo |
| Sumar una copia | Botón **+** que aparece al pasar el mouse sobre una carta del mazo |
| Quitar una copia | Botón **−** sobre la carta, **doble clic** sobre ella, o arrastrarla a la **papelera** (aparece abajo al arrastrar una carta del mazo) |
| Reordenar | Arrastrar una carta del mazo y soltarla sobre otra |
| Renombrar el mazo | Clic en el nombre de la barra superior (hasta 32 caracteres) |
| Vaciar el mazo | **🗑️ Limpiar** (pide confirmación) |

Cada carta del mazo muestra una insignia **x N** con la cantidad de copias, y en la biblioteca una insignia **N/máx** indica cuántas copias llevás sobre el máximo de su rareza (para Sellos muestra solo **xN**).

Si intentás agregar una carta que rompe una regla (límite de rareza alcanzado, mazo lleno, token), aparece un aviso explicando el motivo.

### Tamaño de las cartas y ventana

El Mazo Principal, el Side Deck y el Mazo Extra se muestran **siempre completos y a la vez**, sin scroll. Al agregar o quitar cartas, o al cambiar el tamaño de la ventana, el tamaño de las cartas se recalcula para que quepan todas: con pocas cartas son más grandes (hasta 150 px de ancho) y con muchas se achican. Los tokens se muestran un 25 % más chicos que el resto. Para que los controles sigan siendo usables, el botón 🔍 Inspeccionar solo aparece en cartas grandes; en las chicas alcanza con hacer clic sobre la carta.

Si la ventana es tan chica que las cartas quedarían por debajo de 44 px de ancho (por ejemplo, un mazo completo en 1024×600), el panel pasa a tener scroll vertical como último recurso.

### Mazo Extra (Tokens)

Debajo del mazo principal, el panel **⚡ Mazo Extra** se completa solo: por cada planeta presente en el mazo principal se agregan los tokens de esa facción que hayas importado. Si sacás todas las cartas de un planeta, sus tokens desaparecen. Las cartas neutrales (Arcano) no generan tokens. El contador de la barra superior muestra cuántos tokens hay activos.

---

## Biblioteca, búsqueda y filtros

La columna derecha muestra todas las cartas importadas y cuántas coinciden con los filtros (**Mostrando X / Y**).

- **Búsqueda:** por nombre, descripción o texto de ambientación. Botón ✕ para limpiar.
- **Zoom:** deslizador de 75 % a 135 % para el tamaño de las cartas (se recuerda entre sesiones).
- **Planetas / Facciones:** un botón por planeta, o Todos.
- **Tipos de carta:** Criatura, H. Rápido, H. Lento, Estructura, Artefacto, Sello, Terreno.
- **Coste de maná máximo:** deslizador de 0 a 10+.
- **Rareza:** Común, Rara, Épica, Legendaria. Los Sellos no aparecen al filtrar por rareza.
- **Ordenar:** coste (asc/desc), nombre (A–Z / Z–A), rareza, ataque o vida.
- **Restablecer filtros:** vuelve todo a su valor inicial.

Los filtros se combinan entre sí.

---

## Análisis del mazo

En la parte superior del área del mazo:

- **Curva de maná & Sellos:** gráfico de barras con la cantidad de cartas por coste (0 a 7+) y una columna aparte de Sellos (💎S). Muestra el **coste medio** de las cartas (sin contar Sellos). Hacer **clic en una barra** filtra la biblioteca por ese coste máximo; clic en 💎S filtra por Sellos.
- **Composición del mazo:** cantidad de cartas por tipo (Criaturas, H. Rápido, H. Lento, Estructuras, Artefactos, Sellos, Terrenos).
- **Distribución planetaria:** cuántas cartas tenés de cada planeta.

---

## Inspector de cartas

Abre una vista ampliada de la carta con efecto 3D (se inclina al mover el mouse), más:

- Planeta, tipo, rareza y coste.
- Ataque y vida (solo Criaturas).
- Descripción y texto de ambientación.
- Botón **Agregar al Mazo** con el contador de copias actual.

Se abre con clic sobre una carta de la biblioteca o del mazo, o con **🔍 Inspeccionar**. El clic en la biblioteca solo inspecciona: nunca modifica el mazo. Los tokens del Mazo Extra también se pueden inspeccionar.

---

## Probar mano (Mulligan)

**🎴 Probar Mano** simula el inicio de una partida con tu mazo (requiere al menos 5 cartas):

1. Se baraja el mazo y se reparte una mano de **5 cartas**.
2. Hacé **clic en las cartas** que querés descartar (quedan marcadas).
3. **Hacer Mulligan** devuelve las marcadas al mazo, lo baraja y roba reemplazos.
4. **Robar 1 Carta** suma una carta de la parte superior del mazo.
5. **Nueva Mano** baraja todo de nuevo y reparte otra mano.

---

## Pool base y actualizaciones

El botón **🔄 Buscar Actualizaciones** (barra superior) carga la pool base del juego directamente desde la carpeta `cartas/SET-N` del proyecto, sin tener que importar las imágenes a mano. Es independiente de **📁 Importar Cartas**, que sigue siendo el camino para tus propias cartas personalizadas.

### Primer uso

1. Hacé clic en **🔄 Buscar Actualizaciones**.
2. El navegador te pide elegir una carpeta: seleccioná la carpeta `cartas` del proyecto (la que contiene `SET-1`, `SET-2`, etc.).
3. La app recorre todas las subcarpetas, interpreta cada imagen con el mismo formato de nombre de archivo que **Importar Cartas** (ver [Formato de nombre de archivo](#formato-de-nombre-de-archivo)), y si existe `catalogo-original.json` en la raíz de esa carpeta, lo usa para completar la descripción y el texto de ambientación de las cartas que coincidan — nunca para cambiar su tipo, rareza, planeta o estadísticas, que siempre salen del nombre del archivo.
4. Las cartas quedan guardadas en el navegador (en IndexedDB, aparte de tus cartas personalizadas). **No hace falta repetir este paso en cada apertura**: la próxima vez que abras la app, la pool base ya está ahí.

### Buscar cartas nuevas (sets agregados después)

Si el proyecto suma una carpeta `SET-N` nueva, alcanza con volver a hacer clic en **🔄 Buscar Actualizaciones**. La app vuelve a leer la carpeta vinculada y agrega solo las imágenes que no había visto antes (compara por su ruta relativa, por ejemplo `SET-7/Carta_Criatura_Rara_Marte_2_2_2.webp`). Si no hay nada nuevo, te avisa que la pool ya está actualizada.

Cada carta de la pool tiene un identificador que sale de su ruta de archivo, no al azar: la misma imagen conserva siempre el mismo identificador entre reinicios y actualizaciones, así que un mazo que ya armaste no se rompe cuando aparece un set nuevo.

### Limitaciones

- Esta función usa una API del navegador (`showDirectoryPicker`) disponible en **Chrome y Edge**, no en Firefox ni Safari. En esos navegadores, el botón avisa que no está disponible; la pool base ahí se carga con **Importar Cartas**, seleccionando manualmente la carpeta `cartas`.
- El navegador puede volver a pedir el permiso de la carpeta en algún momento (por ejemplo, si lo revocaste desde su configuración). En ese caso, el próximo clic en el botón simplemente vuelve a pedir la carpeta.
- Las cartas de la pool base no se pueden borrar con **Borrar Cartas Personalizadas** (ese botón es solo para tus imágenes importadas a mano). Por ahora, quitarlas requiere borrar los datos del sitio en el navegador.

---

## Mis mazos guardados

**💾 Mis mazos** (barra superior) guarda el mazo actual —principal y side deck— en el navegador, con un nombre, y lo vuelve a cargar cuando quieras, sin pasar por exportar e importar. Exportar / Importar sigue disponible y sirve para respaldar mazos o llevarlos a otro equipo.

| Acción | Cómo |
|---|---|
| Guardar | Escribí un nombre (hasta 32 caracteres; viene con el nombre del mazo actual) y presioná **Guardar mazo actual** o Enter. El mazo activo toma ese nombre |
| Sobrescribir | Guardar con un nombre que ya existe (sin distinguir mayúsculas) pide confirmación |
| Cargar | **Cargar** en la fila del mazo. Reemplaza el mazo actual y cierra el modal |
| Eliminar | **Eliminar** en la fila del mazo, con confirmación. No afecta al mazo actual |

Detalles a tener en cuenta:

- Cada mazo guardado usa el mismo formato que el JSON exportado, y **cargar pasa por las mismas validaciones que importar**: límites por rareza, banlist actual, side deck de hasta 15 cartas y tamaño máximo. Si una carga falla (por ejemplo, porque cambiaste la banlist o borraste cartas de la biblioteca), se muestra el motivo y el mazo actual no cambia.
- Las cartas se buscan por identificador y, si no se encuentra, por nombre. Los mazos guardados necesitan que esas cartas estén en la biblioteca.
- Si cargás un mazo mientras el actual tiene cartas y no coincide con ninguno guardado, se pide confirmación antes de reemplazarlo. No se pide si el mazo actual ya está guardado.
- No se puede guardar un mazo vacío.
- Los mazos guardados están **en este navegador**: no se sincronizan ni se comparten. Si el almacenamiento está lleno, bloqueado o los datos guardados están dañados, la app lo informa y no sobrescribe nada.

---

## Exportar e importar mazos

**📥 Exportar / Importar** abre un modal con dos pestañas. Al abrirlo, ya viene cargado con el mazo actual, listo para copiar con **📋 Copiar al Portapapeles**. Para cargar un mazo, pegá el contenido en la pestaña correspondiente y presioná **⚡ Cargar este Mazo**.

> Importar un mazo **reemplaza** el mazo actual. Las cartas del mazo deben existir antes en tu biblioteca (importá primero las imágenes).

### Lista de texto

Formato legible, una carta por línea:

```
// Deck: Mazo Planetario de Batalla
// Main Deck (40/40 cartas):
4x Rayo [Common] (JUPITER)
3x Ares [Rare] (MARTE)
1x Torre De Mareas [Legendary] (NEPTUNO)
12x Sello De Marte [Sello] (MARTE)

// Extra Deck (Tokens Automáticos):
1x Guerrero Marciano [Token] (MARTE)
```

Reglas de lectura al importar:

- Cada línea es `<cantidad>x <Nombre>`; lo que esté entre `[ ]` y `( )` se ignora.
- El nombre debe coincidir con el de una carta de tu biblioteca (sin distinguir mayúsculas). También se acepta el `id` de la carta.
- Las líneas que empiezan con `//` o `#` son comentarios. `// Deck: Nombre` define el nombre del mazo.
- Las cantidades se recortan al máximo permitido por rareza.
- Los tokens se ignoran (se generan solos).
- Las líneas cuyo nombre no coincide con ninguna carta se **omiten sin aviso**. Si el contador de cartas cargadas es menor al esperado, revisá los nombres.
- El total de 40 no se valida al importar: si el mazo tiene más o menos cartas, el indicador de estado te lo marca.

### Código JSON

Formato pensado para respaldar o compartir mazos:

```json
{
  "format": "aetherium-tcg-v1",
  "deckName": "Mazo Planetario de Batalla",
  "createdAt": "2026-09-18T12:00:00.000Z",
  "deck": [
    { "cardId": "custom_ab12cd3_lx9k2", "name": "Rayo", "count": 4 },
    { "cardId": "custom_ef45gh6_lx9k3", "name": "Ares", "count": 1 }
  ]
}
```

Al importar, cada entrada se busca primero por `cardId` y, si no se encuentra, por `name`. Como los `cardId` se generan al azar cuando se importan las imágenes, **un mazo compartido con otra persona (u otro navegador) se reconstruye por nombre**: ambos deben tener las cartas importadas con el mismo nombre. Lo único obligatorio es el arreglo `deck`. Las cantidades se recortan al máximo por rareza.

---

## Dónde se guardan los datos

Todo queda **en tu navegador**; no se envía nada a ningún servidor.

| Dato | Dónde | Clave |
|---|---|---|
| Cartas importadas (con sus imágenes) | IndexedDB | base `AetheriumTCG_CustomCardsDB` |
| Mazo activo, nombre y zoom | localStorage | `aetherium_tcg_active_deck` |
| Mazos guardados con nombre | localStorage | `aetherium_tcg_saved_decks` |
| Pool base (cartas/SET-N) y sus imágenes | IndexedDB | store `pool_cards`, separado de tus cartas personalizadas |
| Carpeta vinculada para buscar actualizaciones | IndexedDB | store `app_config` (solo en Chrome/Edge) |

Consecuencias:

- Los datos son **por navegador y por perfil**. Otro navegador u otra computadora empieza vacío.
- Si borrás los datos del sitio desde el navegador, perdés cartas y mazo. **Exportá tus mazos** (texto o JSON) como respaldo y conservá tus imágenes originales.
- Abrir la app desde `file://` y desde `http://localhost` cuenta como sitios distintos, así que no comparten cartas ni mazos.

---

## Estructura del proyecto

```
tcg-deckbuilder/
├── index.html          # Interfaz completa (carga solo js/bundle.js)
├── css/                # main, navbar, deck-grid, library-sidebar, card, modals
└── js/
    ├── bundle.js       # Aplicación unificada que ejecuta index.html
    ├── app.js          # Punto de entrada (versión modular)
    ├── state.js        # Estado del mazo, reglas y export/import
    ├── customCardImporter.js  # Parser de nombres de archivo + IndexedDB
    ├── cardsData.js    # Constantes de planetas y tipos
    ├── deckManager.js  # Vista del mazo y Mazo Extra
    ├── savedDecksManager.js  # Modal "Mis mazos" (guardar, cargar, eliminar)
    ├── poolManager.js  # Pool base desde cartas/SET-N ("Buscar Actualizaciones")
    ├── filterManager.js, dragAndDrop.js, manaCurve.js,
    │   cardInspector.js, testHand.js, sound.js
```

`index.html` carga únicamente `js/bundle.js`, un bundle sin dependencias pensado para funcionar abriendo el archivo con doble clic (los módulos ES no cargan desde `file://`). Los archivos sueltos de `js/` son la versión modular del mismo código: si modificás uno, replicá el cambio en `bundle.js`, o el navegador no lo va a ver.

Al cambiar IDs o estructura del HTML, verificá que los `getElementById` del bundle sigan apuntando a elementos existentes; si no, el botón o la función afectada dejará de responder sin mostrar ningún error.

---


## Verificación de regresiones

Ejecutá `node tests/regression.cjs` para comprobar, tanto en los módulos como en el bundle, los límites de importación, las entradas repetidas y la conservación del mazo ante errores.

Con Playwright disponible y Microsoft Edge instalado, `node tests/browser.cjs` verifica la importación del catálogo, los cierres del inspector, la persistencia, los límites y la selección de cartas en la mano. Usa un perfil aislado. La variable opcional `SCREENSHOT_PATH` permite guardar una captura del detalle.

La identidad visual es STG TCG Deckbuilder. Se mantienen las claves históricas de almacenamiento y el identificador de exportación para conservar la compatibilidad con las colecciones y mazos existentes.

El tema visual de `css/rog-theme.css` está inspirado en [Rise of Gods](https://www.riseofgodstcg.store/): fondos azul noche, acciones coral, controles redondeados y tipografía del sistema disponible sin conexión. Se carga después de los estilos de componentes; mantiene los colores de facción y rareza. En pantallas de hasta 760 px, la biblioteca queda debajo del constructor y la página permite desplazamiento vertical.
