// Uso: node tools/xmltv-to-json.mjs guia.xml [guia2.xml ...]
// Convierte uno o más XMLTV a data/epg.json (ventana: hoy 00:00 ART + 5 días).
import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);
if (!files.length) { console.error("Falta el archivo XMLTV"); process.exit(1); }

const TZ = -3 * 3600, DAYS = 5;
const now = Math.floor(Date.now() / 1000);
const from = Math.floor((now + TZ) / 86400) * 86400 - TZ;
const to = from + DAYS * 86400;
import { loadChannels, buildMaps, resolve } from "./match.mjs";
const channels = loadChannels();
const maps = buildMaps(channels);

const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&").replace(/<!\[CDATA\[|\]\]>/g, "").trim();

function ts(s) { // 20261014213000 -0300
  const m = /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)?\s*([+-]\d{4})?/.exec(s || "");
  if (!m) return NaN;
  const off = m[7] ? (m[7][0] === "-" ? -1 : 1) * (+m[7].slice(1, 3) * 3600 + +m[7].slice(3, 5) * 60) : 0;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)) / 1000 - off;
}
const tag = (body, name) => { const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(body); return m ? unesc(m[1]) : ""; };

function mapCat(raw) {
  const c = raw.toLowerCase();
  if (/news|noticia|informativ/.test(c)) return "news";
  if (/sport|deport|f[uú]tbol|soccer/.test(c)) return "sports";
  if (/movie|film|pel[ií]cula|cine/.test(c)) return "movies";
  if (/series|serie|drama|telenovela/.test(c)) return "series";
  if (/kid|child|infantil|animaci|cartoon/.test(c)) return "kids";
  if (/document|nature|science|history|educat/.test(c)) return "docs";
  if (/music|m[uú]sica/.test(c)) return "music";
  return "";
}

const programs = Object.fromEntries(channels.map((c) => [c.id, []]));
const seen = new Set();
let total = 0, unknown = new Set();
for (const f of files) {
  const xml = readFileSync(f, "utf8");
  const names = new Map();
  for (const c of xml.matchAll(/<channel\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/channel>/g)) names.set(c[1], tag(c[2], "display-name"));
  const re = /<programme\s([^>]*)>([\s\S]*?)<\/programme>/g;
  let m;
  while ((m = re.exec(xml))) {
    const a = m[1];
    const start = ts((/start="([^"]*)"/.exec(a) || [])[1]);
    const stop = ts((/stop="([^"]*)"/.exec(a) || [])[1]);
    const xid = (/channel="([^"]*)"/.exec(a) || [])[1];
    const id = resolve(maps, xid, names.get(xid));
    if (!id) { unknown.add(xid); continue; }
    if (!(stop > start) || stop <= from || start >= to) continue;
    const key = id + start;
    if (seen.has(key)) continue;
    seen.add(key);
    const title = tag(m[2], "title") || "Sin título";
    const sub = tag(m[2], "sub-title");
    programs[id].push([start, stop, sub ? `${title}: ${sub}` : title, tag(m[2], "desc"), mapCat(tag(m[2], "category"))]);
    total++;
  }
}
for (const id in programs) programs[id].sort((x, y) => x[0] - y[0]);

// La fuente (mi.tv) trae cruzadas estas señales: la grilla de una es la de la otra. Se intercambian antes de fusionar.
const SWAP = [["ESPN.ar", "ESPN2.ar"]];
for (const [a, b] of SWAP) if (programs[a] && programs[b]) [programs[a], programs[b]] = [programs[b], programs[a]];

// Fusionar con lo ya guardado: la fuente cuenta los días en UTC, así que una corrida de noche (después de las 21 h de
// Argentina) ya no trae el final del día actual. Conservamos lo viejo que no se superpone con lo nuevo.
const outUrl = new URL("../data/epg.json", import.meta.url);
let old = null;
try { old = JSON.parse(readFileSync(outUrl, "utf8")); if (old.meta && old.meta.demo) old = null; } catch {}
if (old && total > 0) {
  for (const id in programs) {
    const n = programs[id], o = ((old.programs || {})[id] || []).filter((p) => p[1] > from && p[0] < to);
    if (!n.length) { programs[id] = o; continue; }
    const nMin = n[0][0], nMax = n[n.length - 1][1];
    programs[id] = [...o.filter((p) => p[1] <= nMin || p[0] >= nMax), ...n].sort((x, y) => x[0] - y[0]);
  }
}

if (total === 0) { console.error("No se encontró ningún programa; no se sobreescribe epg.json"); process.exit(2); }
let withData = 0;
for (const id in programs) if (programs[id].length) withData++;
writeFileSync(outUrl, JSON.stringify({ meta: { generated: now, demo: false, days: DAYS }, programs }));
console.log(`${total} programas, ${withData}/${channels.length} canales con datos`);
const miss = channels.filter((c) => !programs[c.id].length).map((c) => c.id);
if (miss.length) console.log("Canales sin datos (revisar id/alias en make-channels.mjs):", miss.join(", "));
if (unknown.size) console.log("Ids de la fuente sin mapear (muestra):", [...unknown].slice(0, 25).join(", "));
