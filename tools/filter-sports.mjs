// Uso: node tools/filter-sports.mjs entrada.channels.xml salida.channels.xml salida.map.json "País" prefijo
// Se queda solo con canales deportivos de la fuente y les asigna un id propio (prefijo_N).
import { readFileSync, writeFileSync } from "node:fs";
import { norm } from "./sports-taxonomy.mjs";
const [inp, out, mapOut, country, prefix] = process.argv.slice(2);
const SPORT_CH = /espn|fox ?sports|tnt ?sports|tudn|dazn|sport|deport|futbol|football|\bgol\b|win ?sports|premiere|combate|eurosport|\bnba\b|\bnfl\b|golf|tyc|claro ?sports|bein|canal del futbol|\bcdf\b|olimp|stadium|racing|motor|fight|\bufc\b|wwe|esporte|\bge tv\b|ver ?sport|liga|caliente|tigo|directv|dsports|gran dt|nbc deportes/i;
const NOT = /radio|\bfm\b|\bam\b|ppv|promo|portal|cinema|novela/i;
const xml = readFileSync(inp, "utf8");
const re = /<channel\b([^>]*)>([\s\S]*?)<\/channel>/g;
let m, i = 0;
const keep = [], channels = {}, seen = new Set();
while ((m = re.exec(xml))) {
  const name = m[2].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").trim();
  if (!SPORT_CH.test(name) || NOT.test(name)) continue;
  const key = norm(name).replace(/\b(hd|sd)\b/g, "").trim();
  if (seen.has(key)) continue;
  seen.add(key);
  const id = `${prefix}_${++i}`;
  const attrs = /xmltv_id="[^"]*"/.test(m[1]) ? m[1].replace(/xmltv_id="[^"]*"/, `xmltv_id="${id}"`) : m[1] + ` xmltv_id="${id}"`;
  keep.push(`<channel${attrs}>${m[2]}</channel>`);
  channels[id] = { name };
}
const head = (xml.match(/^[\s\S]*?<channels[^>]*>/) || ['<?xml version="1.0" encoding="UTF-8"?>\n<channels>'])[0];
writeFileSync(out, head + "\n  " + keep.join("\n  ") + "\n</channels>\n");
writeFileSync(mapOut, JSON.stringify({ country, channels }));
console.log(`${inp} (${country}): ${keep.length} canales deportivos: ${Object.values(channels).map((c) => c.name).join(" | ")}`);
