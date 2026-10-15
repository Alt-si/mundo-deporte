// Uso: node tools/build-sports.mjs [carpeta-con-xml-deportivos-de-otros-paises]
// Lee data/epg.json (canales argentinos) y, si existen, los XMLTV de canales deportivos
// de otros países (con su .map.json generado por filter-sports.mjs). Escribe data/sports.json.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { SPORTS, classify, participants, norm, roundOf, sameName } from "./sports-taxonomy.mjs";

const rootUrl = new URL("../", import.meta.url);
const TZ = -3 * 3600, DAYS = 5;
const now = Math.floor(Date.now() / 1000);
const from = Math.floor((now + TZ) / 86400) * 86400 - TZ, to = from + DAYS * 86400;
const dir = process.argv[2];

const epg = JSON.parse(readFileSync(new URL("data/epg.json", rootUrl)));
const chans = JSON.parse(readFileSync(new URL("data/channels.json", rootUrl))).channels;

const channels = {}, events = [], seen = new Set();
const clean = (s) => String(s || "").replace(/\s*\((?:en vivo|en directo|ao vivo|live)\)\s*/gi, " ").replace(/\s+/g, " ").trim();
const FILLER = /^(programacion|sin programacion|a confirmar|transmision|fuera del aire|off air|tba|to be announced)$/;
function add(chId, p, strong, chName) {
  if (p[1] <= from || p[0] >= to) return;
  const nt = norm(p[2]);
  if (!nt || FILLER.test(nt) || nt === norm(chName)) return; // relleno o el nombre del propio canal
  const r = classify(p[2], p[3], strong);
  if (!r) return;
  const key = chId + "|" + p[0] + "|" + p[2];
  if (seen.has(key)) return;
  seen.add(key);
  events.push([p[0], p[1], clean(p[2]), String(p[3] || "").slice(0, 220), chId, r.sport, r.tournament]);
}

// 1) Canales argentinos
for (const ch of chans) {
  const progs = epg.programs[ch.id] || [];
  const before = events.length;
  for (const p of progs) add(ch.id, p, ch.cat === "sports", ch.name);
  if (events.length > before) channels[ch.id] = { n: ch.name, c: "Argentina" };
}

// 2) Canales deportivos de otros países
const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
const tag = (b, n) => { const m = new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`).exec(b); return m ? unesc(m[1]) : ""; };
function ts(s) {
  const m = /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)?\s*([+-]\d{4})?/.exec(s || "");
  if (!m) return NaN;
  const off = m[7] ? (m[7][0] === "-" ? -1 : 1) * (+m[7].slice(1, 3) * 3600 + +m[7].slice(3, 5) * 60) : 0;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)) / 1000 - off;
}
let foreign = 0;
if (dir && existsSync(dir)) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".map.json"))) {
    let map;
    try { map = JSON.parse(readFileSync(`${dir}/${f}`)); } catch { continue; }
    if (!map || !map.channels) continue;
    const xmlPath = `${dir}/${f.replace(".map.json", ".xml")}`;
    if (!existsSync(xmlPath)) continue;
    const xml = readFileSync(xmlPath, "utf8");
    const re = /<programme\s([^>]*)>([\s\S]*?)<\/programme>/g;
    let m;
    while ((m = re.exec(xml))) {
      const id = (/channel="([^"]*)"/.exec(m[1]) || [])[1];
      const info = map.channels[id];
      if (!info) continue;
      const start = ts((/start="([^"]*)"/.exec(m[1]) || [])[1]), stop = ts((/stop="([^"]*)"/.exec(m[1]) || [])[1]);
      if (!(stop > start)) continue;
      const before = events.length;
      add(id, [start, stop, tag(m[2], "title"), tag(m[2], "desc")], true, info.name);
      if (events.length > before) { channels[id] = { n: info.name, c: map.country }; foreign++; }
    }
  }
}

// Fusionar con el sports.json anterior para canales de otros países (misma razón que en epg.json).
const argIds = new Set(chans.map((c) => c.id));
try {
  const old = JSON.parse(readFileSync(new URL("data/sports.json", rootUrl)));
  const range = {};
  for (const e of events) if (!argIds.has(e[4])) { const r = (range[e[4]] ||= [e[0], e[1]]); r[0] = Math.min(r[0], e[0]); r[1] = Math.max(r[1], e[1]); }
  for (const e of old.events || []) {
    if (argIds.has(e[4]) || e[1] <= from || e[0] >= to) continue;
    const r = range[e[4]];
    if (r && !(e[1] <= r[0] || e[0] >= r[1])) continue;
    const key = e[4] + "|" + e[0] + "|" + e[2];
    if (seen.has(key)) continue;
    seen.add(key); events.push(e);
    if (!channels[e[4]] && old.channels[e[4]]) channels[e[4]] = old.channels[e[4]];
  }
} catch {}
events.sort((a, b) => a[0] - b[0]);

// Sugerencias de equipos / jugadores (para autocompletar)
const count = new Map();
for (const e of events) {
  if (e[5] === "otros") continue;
  for (const name of participants(e[2])) {
    const k = name.toLowerCase();
    const o = count.get(k) || { name, n: 0, sport: e[5] };
    o.n++; count.set(k, o);
  }
}
const suggest = [...count.values()].sort((a, b) => b.n - a.n).slice(0, 500).map((o) => [o.name, o.sport]);

// ---- Fase y rivales por evento, y partidos agrupados (varios canales = un solo partido) ----
for (const e of events) {
  const pair = participants(e[2]);
  e[7] = roundOf(e[2] + " " + e[3]);
  e[8] = pair.length === 2 ? pair[0] : "";
  e[9] = pair.length === 2 ? pair[1] : "";
  e.length = 10;
}
const DUR = { futbol: 7200, tenis: 10800, padel: 5400, basquet: 9000, voley: 7200, rugby: 6000, hockey: 7200, nfl: 12600, beisbol: 10800, combate: 10800, automovilismo: 7200, golf: 14400 };
const cands = [];
for (const e of events) {
  if (!e[8] || !e[9] || e[5] === "otros") continue;
  const c = cands.find((x) => x.sp === e[5] && Math.abs(x.s - e[0]) <= 5400 && ((sameName(x.a, e[8]) && sameName(x.b, e[9])) || (sameName(x.a, e[9]) && sameName(x.b, e[8]))));
  if (c) { if (!c.ch.includes(e[4])) c.ch.push(e[4]); c.t ||= e[6]; c.r ||= e[7]; continue; }
  cands.push({ t: e[6], sp: e[5], r: e[7], s: e[0], e: e[1], a: e[8], b: e[9], ch: [e[4]] });
}
let fixtures = [];
try { fixtures = JSON.parse(readFileSync(new URL("data/fixtures.json", rootUrl))).matches || []; } catch {}
const matches = [], used = new Set();
for (const f of fixtures) {
  if (f.s + 3 * 3600 <= from || f.s >= to) continue;
  const i = cands.findIndex((c, k) => !used.has(k) && Math.abs(c.s - f.s) <= 4 * 3600 && ((sameName(f.a, c.a) && sameName(f.b, c.b)) || (sameName(f.a, c.b) && sameName(f.b, c.a))));
  let ch = [];
  if (i >= 0) { used.add(i); ch = cands[i].ch; }
  matches.push({ ...f, r: f.r || (i >= 0 ? cands[i].r : ""), t: f.t || (i >= 0 ? cands[i].t : ""), e: f.s + (DUR[f.sp] || 7200), ch });
}
cands.forEach((c, k) => { if (!used.has(k)) matches.push({ ...c, ch: c.ch }); });
matches.sort((x, y) => x.s - y.s);
const withCh = matches.filter((m) => m.ch.length).length;

const sports = Object.fromEntries(SPORTS.map(([id, n, e]) => [id, { n, e }]));
writeFileSync(new URL("data/sports.json", rootUrl), JSON.stringify({ meta: { generated: now, days: DAYS }, sports, channels, suggest, events, matches }));
console.log(`Partidos: ${matches.length} (${fixtures.length} de fixtures, ${withCh} con canal)`);
const by = {};
for (const e of events) by[e[5]] = (by[e[5]] || 0) + 1;
console.log(`${events.length} eventos deportivos (${foreign} de canales de otros países), ${Object.keys(channels).length} canales`);
console.log("Por deporte:", JSON.stringify(by));
console.log("Sugerencias:", suggest.length);
