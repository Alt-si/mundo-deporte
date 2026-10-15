// Uso: node tools/filter-channels.mjs entrada.channels.xml salida.channels.xml
// Deja solo los canales de la fuente que están en data/channels.json (por id o por nombre).
import { readFileSync, writeFileSync } from "node:fs";
import { loadChannels, buildMaps, resolve } from "./match.mjs";
const [inp, out] = process.argv.slice(2);
const xml = readFileSync(inp, "utf8");
const maps = buildMaps(loadChannels());
const re = /<channel\b([^>]*)>([\s\S]*?)<\/channel>/g;
let m, keep = [], skip = [];
while ((m = re.exec(xml))) {
  const id = (/xmltv_id="([^"]*)"/.exec(m[1]) || [])[1] || "";
  const name = m[2].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
  const ours = resolve(maps, id, name);
  if (ours) {
    // Reescribimos el xmltv_id con el id propio: así la salida del grabber ya viene con nuestros ids.
    const attrs = /xmltv_id="[^"]*"/.test(m[1]) ? m[1].replace(/xmltv_id="[^"]*"/, `xmltv_id="${ours}"`) : m[1] + ` xmltv_id="${ours}"`;
    keep.push(`<channel${attrs}>${m[2]}</channel>`);
  } else skip.push(name);
}
const head = (xml.match(/^[\s\S]*?<channels[^>]*>/) || ['<?xml version="1.0" encoding="UTF-8"?>\n<channels>'])[0];
writeFileSync(out, head + "\n  " + keep.join("\n  ") + "\n</channels>\n");
console.log(`${inp}: ${keep.length} canales coinciden, ${skip.length} no.`);
console.log("Sin coincidencia (por si querés sumarlos a channels.json):", skip.slice(0, 400).join(" | "));
