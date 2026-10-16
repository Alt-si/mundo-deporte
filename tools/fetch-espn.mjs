// Fútbol argentino desde la API pública de ESPN (sin clave). Escribe data/fixtures.json.
// Si no consigue ningún partido, conserva el archivo anterior. Uso: node tools/fetch-espn.mjs
import fs from "node:fs";

const BASE = process.env.ESPN_BASE || "https://site.api.espn.com/apis";
const CORE = process.env.ESPN_CORE || "https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=1000";
const OUT = "data/fixtures.json";

// [slug, nombre, orden, ¿solo partidos con equipos argentinos?, región/país del torneo]
const KNOWN = JSON.parse(fs.readFileSync("data/leagues.json", "utf8")).map((l) => [l.slug, l.name, l.rank, l.onlyArg, l.co]);
const SELECCION_ID = "202"; // Argentina en ESPN
const get = async (u) => { const r = await fetch(u, { headers: { "user-agent": "mundo-deporte" } }); if (!r.ok) throw new Error(r.status + " " + u); return r.json(); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
const sec = (x) => { const t = Date.parse(x); return t ? Math.floor(t / 1000) : 0; };
const diag = [], lines = [], log = (...a) => { const t = a.join(" "); lines.push(t); console.log(t); };

// 1) Ligas: las conocidas + cualquier "arg.*" que ESPN tenga
const leagues = new Map(KNOWN.map(([slug, name, rank, onlyArg, co]) => [slug, { slug, name, rank, onlyArg, co }]));
try {
  const j = await get(CORE);
  const found = (j.items || []).map((i) => /\/leagues\/([^/?]+)/.exec(i.$ref || "")?.[1]).filter(Boolean);
  for (const slug of found) if (/^arg\./.test(slug) && !leagues.has(slug)) leagues.set(slug, { slug, name: "", rank: 30, onlyArg: false, co: "Argentina" });
  log(`Ligas argentinas en ESPN: ${found.filter((s) => /^arg\./.test(s)).join(", ") || "(ninguna)"}`);
} catch (e) { log("No se pudo listar ligas de ESPN:", e.message); }

// 2) Equipos argentinos (para filtrar las copas internacionales)
const argTeams = new Set([SELECCION_ID]);
for (const l of [...leagues.values()].filter((l) => /^arg\./.test(l.slug))) {
  try {
    const j = await get(`${BASE}/site/v2/sports/soccer/${l.slug}/teams?limit=300`);
    for (const t of j.sports?.[0]?.leagues?.[0]?.teams || []) if (t.team?.id) argTeams.add(String(t.team.id));
  } catch {}
  await sleep(300);
}
log(`Equipos argentinos conocidos: ${argTeams.size}`);

// 3) Partidos de ayer a +5 días y tablas
const from = new Date(Date.now() - 2 * 86400e3), to = new Date(Date.now() + 6 * 86400e3);
const ES = [[/round of 32/i, "Dieciseisavos de final"], [/round of 16/i, "Octavos de final"], [/quarter/i, "Cuartos de final"], [/semi/i, "Semifinal"], [/third|3rd/i, "Tercer puesto"], [/^final$/i, "Final"], [/group/i, "Fase de grupos"], [/league phase|regular/i, "Fase de liga"], [/play-?off/i, "Playoffs"], [/first round/i, "Primera ronda"], [/second round/i, "Segunda ronda"], [/qualif/i, "Fase previa"]];
const roundEs = (r) => { for (const [re, t] of ES) if (re.test(r || "")) return t; return r || ""; };
const state = (o) => { const s = o?.status?.type?.state; return s === "in" ? "in" : s === "post" ? "post" : "pre"; };
const clock = (o) => { const t = o?.status?.type; return t?.state === "in" ? t.shortDetail || o.status.displayClock || "" : ""; };
const num = (st, ...k) => { for (const n of k) { const s = (st || []).find((x) => x.name === n); if (s) return s.displayValue ?? s.value; } return ""; };

const matches = [], tournaments = [], tables = {}, seen = new Set();
for (const l of leagues.values()) {
  let nev = 0, kept = 0, err = "", name = l.name;
  try {
    const j = await get(`${BASE}/site/v2/sports/soccer/${l.slug}/scoreboard?dates=${ymd(from)}-${ymd(to)}&limit=400`);
    name ||= j.leagues?.[0]?.name || l.slug;
    for (const ev of j.events || []) {
      nev++;
      const comp = ev.competitions?.[0]; if (!comp) continue;
      const cs = comp.competitors || [];
      const home = cs.find((x) => x.homeAway === "home") || cs[0], away = cs.find((x) => x.homeAway === "away") || cs[1];
      if (!home || !away) continue;
      if (l.onlyArg && !argTeams.has(String(home.team?.id)) && !argTeams.has(String(away.team?.id))) continue;
      const id = String(ev.id), st = state(comp.status ? comp : ev);
      if (seen.has(l.slug + id)) continue; seen.add(l.slug + id);
      const v = comp.venue || {};
      matches.push({
        id, lg: l.slug, t: name, cs: l.co === "Argentina" ? ["Argentina"] : ["Argentina", l.co], s: sec(ev.date), st,
        ...(st !== "pre" ? { sc: [home.score ?? "", away.score ?? ""] } : {}),
        ck: clock(comp.status ? comp : ev),
        a: home.team?.displayName || "", b: away.team?.displayName || "",
        la: home.team?.logo || "", lb: away.team?.logo || "",
        r: roundEs(comp.notes?.[0]?.headline) || "",
        v: [v.fullName, v.address?.city].filter(Boolean).join(", "),
      });
      kept++;
    }
  } catch (e) { err = e.message; log("ERROR", l.slug, e.message); }
  if (!err || kept) tournaments.push({ key: l.slug, name: name || l.slug, rank: l.rank, co: l.co, cs: l.co === "Argentina" ? ["Argentina"] : ["Argentina", l.co] });
  diag.push({ lg: l.slug, ev: nev, kept, err });
  await sleep(500);
  try {
    const j = await get(`${BASE}/v2/sports/soccer/${l.slug}/standings`);
    const groups = [];
    const walk = (n) => {
      if (n?.standings?.entries) groups.push({ g: n.name || "", rows: n.standings.entries.map((en) => ({ n: en.team?.displayName || "", lg: en.team?.logos?.[0]?.href || "", pj: num(en.stats, "gamesPlayed"), g: num(en.stats, "wins"), e: num(en.stats, "ties"), p: num(en.stats, "losses"), dg: num(en.stats, "pointDifferential"), pts: num(en.stats, "points"), k: +num(en.stats, "rank") || 99 })).sort((a, b) => a.k - b.k) });
      (n?.children || []).forEach(walk);
    };
    walk(j);
    if (groups.length) tables[l.slug] = groups.slice(0, 16);
  } catch {}
  await sleep(500);
}
log(`ESPN: ${matches.length} partidos, ${tournaments.length} torneos, ${Object.keys(tables).length} tablas`);
for (const d of diag) log(`  ${d.lg}: ${d.ev} eventos, ${d.kept} usados${d.err ? " ERROR " + d.err : ""}`);
// Estado de la última corrida (siempre se escribe, para poder diagnosticar)
fs.writeFileSync("data/status.json", JSON.stringify({ at: new Date().toISOString(), matches: matches.length, tournaments: tournaments.length, node: process.version, diag, log: lines.slice(-60) }, null, 1));
if (matches.length) fs.writeFileSync(OUT, JSON.stringify({ meta: { at: Date.now() }, tournaments, matches, tables }));
else log("Sin partidos: se conserva data/fixtures.json anterior");
