# Cartas de Rise of Gods

464 imágenes originales del catálogo público https://www.riseofgodstcg.store/cartas, organizadas por set y preparadas para el importador existente.

En la aplicación, seleccioná **Importar Cartas → Seleccionar Carpeta** y elegí esta carpeta `cartas`. El importador recorre sus subcarpetas e ignora los archivos JSON y Markdown. Las cartas se guardan en el navegador después de importarlas. Una imagen ya importada con el mismo nombre, tipo y facción se omite; los duplicados históricos no se eliminan automáticamente.

## Pool base servida por HTTP (`pool-manifest.json`)

`pool-manifest.json` es una lista plana de las rutas de imagen relativas a esta carpeta. `js/poolManager.js` la lee con `fetch()` al arrancar la app para armar la pool base sin pedirle a nadie que elija una carpeta — así funciona en GitHub Pages, Netlify, un servidor local o el navegador de un celular (donde `showDirectoryPicker` no existe). Si abrís `index.html` con `file://`, el `fetch()` falla silenciosamente y la pool queda vacía hasta usar "Buscar Actualizaciones" (requiere Chrome o Edge de escritorio).

Después de agregar o sacar imágenes de `SET-N/`, corré `node tests/generate-pool-manifest.cjs` y commiteá el `pool-manifest.json` actualizado junto con las imágenes. Si te olvidás, la app servida por HTTP sigue mostrando la pool anterior — nada se rompe, pero las cartas nuevas no aparecen hasta regenerarlo.

## Banlist predefinida (`banlist-default.json`)

`cartas/banlist-default.json` fija de antemano límites de copias por carta para
quien todavía no tenga una banlist propia guardada en el navegador — pensado para
publicar un formato competitivo (o cualquier lista de restricciones) sin que cada
usuario tenga que cargarla a mano desde el botón "Banlist".

Es un objeto plano `{ "Nombre de la carta": límite }`, con el nombre tal como se
muestra en la app (espacios, no guiones — ver "Formatos" más abajo) y el límite
como entero entre 0 (prohibida) y el tamaño máximo de mazo. Por ejemplo:

```json
{
  "Avaricia": 1,
  "Cañón de Zagh": 0
}
```

Se edita a mano — no hay que regenerarlo con ningún script — y se commitea junto
con el resto de los cambios. `js/state.js` (`loadDefaultBanlist`) lo lee por
`fetch()` al arrancar, igual que `pool-manifest.json`: si el archivo falta o
`index.html` se abre con `file://`, la app sigue funcionando solo con la banlist
propia de cada usuario.

Un límite de acá **nunca pisa** lo que el usuario ya haya definido: si alguien fija
su propio límite para una carta, o la quita explícitamente de su banlist activa,
esa decisión queda guardada en su navegador y gana siempre, incluso si después se
suma o se cambia esa misma carta en este archivo. Los nombres que no coinciden con
ninguna carta del pool actual, o que ya tienen un valor propio, se ignoran en
silencio.

## Formatos

- 438 cartas estándar: `Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.webp`. El coste es el total de sellos de facción más coste neutral.
- 19 tokens: `Token_Nombre_Faccion.webp`.
- 7 sellos: `Sello_Faccion.webp`.

Se usan guiones entre las palabras del nombre; el importador los transforma en espacios. Las imágenes no fueron convertidas ni modificadas.

## Límites del importador actual

Los tokens importados reciben coste 0, ataque 1, defensa 1 y rareza común. Sus tipos secundarios no pueden expresarse en este formato. Los sellos reciben coste 0 y no tienen rareza. El importador solo conserva ataque y defensa para criaturas y genera textos genéricos de descripción y ambientación.

`catalogo-original.json` conserva los datos originales, los tipos múltiples, el coste desglosado, los textos y la URL de origen de cada carta, junto con su ruta local.
