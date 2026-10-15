# Mundo Deporte

PWA (se instala en Android y Mac/Chrome/Safari) con la programación de canales de DIRECTV, Flow y Telecentro en una línea de tiempo, para 5 días.

## Cómo se usa
1. Subí esta carpeta a un repositorio de GitHub y activá **GitHub Pages** (Settings → Pages → rama `main`, carpeta raíz).
2. Abrí la URL en Android (Chrome → "Instalar app") o en Mac (Chrome → ícono instalar; Safari → Archivo → Agregar al Dock).
3. Probar local: `python3 -m http.server 8123` y abrir http://localhost:8123

## Programación real (actualización automática)
La app lee `data/epg.json`. Ahora trae **datos de demostración** (aparece un cartel amarillo).
`.github/workflows/update-epg.yml` corre cada 6 horas, baja las grillas con [iptv-org/epg](https://github.com/iptv-org/epg), las convierte con `tools/xmltv-to-json.mjs` (hoy + 4 días) y hace commit de `data/epg.json`.

**Pendiente de verificar en la primera ejecución** (no pude probarlo desde mi entorno, sin acceso a esos sitios):
- `tools/sites.txt`: sitios fuente (`directv.com.ar`, `mi.tv`). Si alguno falla, mirá el log y cambialo por otro de iptv-org/epg.
- Los ids de canal en `tools/make-channels.mjs` (ej. `Telefe.ar`) pueden no coincidir con los de la fuente. El log lista "Canales sin datos" e "Ids sin mapear"; agregá `alias` y corré `node tools/make-channels.mjs`.
- Qué canal está en qué proveedor (`providers`) es una suposición razonable: corregila contra las grillas oficiales.

## Archivos
- `app.js`, `styles.css`, `index.html`: la app. `sw.js`: modo offline (última grilla guardada).
- `tools/make-channels.mjs`: lista de canales. `tools/make-demo.mjs`: datos de demo.

## Google Play
Ver `play/GUIA-GOOGLE-PLAY.md`. Importante: nombrá el repositorio `TU-USUARIO.github.io` para que la app quede en la raíz del dominio.

## Deportes
La pestaña **Deportes** busca por deporte, torneo, equipo/jugador o canal, y muestra canal y horario (hora de Argentina).
- `tools/sports-taxonomy.mjs`: deportes y torneos (palabras clave). Agregá lo que falte ahí.
- `tools/build-sports.mjs`: arma `data/sports.json` desde los canales argentinos y los deportivos de otros países.
- `tools/sports-sites.txt`: fuentes de canales deportivos de otros países (hoy mi.tv de MX, BR, CL, CO, PE, PY). Para sumar más países o fuentes, agregá líneas `ruta|País|código`. El flujo imprime la lista de fuentes disponibles en iptv-org.
- Un evento solo aparece si algún canal lo transmite y está en esas fuentes; Europa/EE.UU. necesitan otra fuente.
