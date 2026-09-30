# snd/ — audio de la app

- `bgm/`: música de fondo (mp3, wav u ogg). Al abrir la app se elige **una** pista al azar entre las que cargan bien y queda en loop.
- `sfx/`: efectos de sonido (mp3, wav u ogg). Al agregar (clic derecho en la biblioteca) o quitar (clic derecho en el mazo) una carta se reproduce uno al azar. Si la carpeta está vacía suena el efecto sintetizado de siempre.

GitHub Pages no lista carpetas, así que la app lee `sound-manifest.json`. Después de sumar o sacar archivos:

```
node tests/generate-sound-manifest.cjs
```

y commitear el manifest junto con los audios. Los nombres son sensibles a mayúsculas en GitHub Pages.
