// Fixture, resultados y tablas desde la API pública de ESPN (sin clave). Opcional: si falla, no pisa data/fixtures.json.
// Salida: { meta, matches:[{s,sp,t,r,a,b,v?,st?,sc?,bc?}], tables:{torneo:[{g,rows:[{n,pj,g,e,p,dg,pts}]}]}, tmeta:{torneo:{sp,v,s,e,stage}} }
import fs from "node:fs";
import { classify } from "./sports-taxonomy.mjs";

const BASE = process.env.ESPN_BASE || "https://site.api.espn.com/apis";
// [deporte ESPN, liga ESPN, id de deporte propio, nombre de respaldo, ¿tiene tabla?]
const LEAGUES = [
  // Europa
  ["soccer", "uefa.champions", "futbol", "Champions League", 1, "Europa"], ["soccer", "uefa.europa", "futbol", "Europa League", 1, "Europa"],
  ["soccer", "uefa.europa.conf", "futbol", "Conference League", 1, "Europa"], ["soccer", "uefa.nations", "futbol", "Liga de Naciones UEFA", 1, "Europa"],
  ["soccer", "eng.1", "futbol", "Premier League", 1, "Inglaterra"], ["soccer", "eng.2", "futbol", "Championship", 1, "Inglaterra"],
  ["soccer", "eng.fa", "futbol", "FA Cup", 0, "Inglaterra"], ["soccer", "eng.league_cup", "futbol", "Copa de la Liga inglesa", 0, "Inglaterra"],
  ["soccer", "esp.1", "futbol", "LaLiga", 1, "España"], ["soccer", "esp.2", "futbol", "LaLiga 2", 1, "España"], ["soccer", "esp.copa_del_rey", "futbol", "Copa del Rey", 0, "España"],
  ["soccer", "ita.1", "futbol", "Serie A (Italia)", 1, "Italia"], ["soccer", "ita.2", "futbol", "Serie B (Italia)", 1, "Italia"], ["soccer", "ita.coppa_italia", "futbol", "Copa Italia", 0, "Italia"],
  ["soccer", "ger.1", "futbol", "Bundesliga", 1, "Alemania"], ["soccer", "ger.2", "futbol", "2. Bundesliga", 1, "Alemania"], ["soccer", "ger.dfb_pokal", "futbol", "Copa de Alemania", 0, "Alemania"],
  ["soccer", "fra.1", "futbol", "Ligue 1", 1, "Francia"], ["soccer", "fra.2", "futbol", "Ligue 2", 1, "Francia"], ["soccer", "fra.coupe_de_france", "futbol", "Copa de Francia", 0, "Francia"],
  ["soccer", "por.1", "futbol", "Liga Portugal", 1, "Portugal"], ["soccer", "ned.1", "futbol", "Eredivisie", 1, "Países Bajos"],
  ["soccer", "bel.1", "futbol", "Liga de Bélgica", 1, "Bélgica"], ["soccer", "tur.1", "futbol", "Superliga de Turquía", 1, "Turquía"],
  ["soccer", "sco.1", "futbol", "Premiership de Escocia", 1, "Escocia"], ["soccer", "gre.1", "futbol", "Superliga de Grecia", 1, "Grecia"],
  // América
  ["soccer", "conmebol.libertadores", "futbol", "Copa Libertadores", 1, "Sudamérica"], ["soccer", "conmebol.sudamericana", "futbol", "Copa Sudamericana", 1, "Sudamérica"],
  ["soccer", "concacaf.champions", "futbol", "Concacaf Champions Cup", 1, "Concacaf"],
  ["soccer", "arg.1", "futbol", "Liga Profesional", 1, "Argentina"], ["soccer", "arg.copa", "futbol", "Copa Argentina", 0, "Argentina"], ["soccer", "arg.2", "futbol", "Primera Nacional", 1, "Argentina"],
  ["soccer", "bra.1", "futbol", "Brasileirão", 1, "Brasil"], ["soccer", "mex.1", "futbol", "Liga MX", 1, "México"], ["soccer", "usa.1", "futbol", "MLS", 1, "Estados Unidos"],
  ["soccer", "col.1", "futbol", "Liga de Colombia", 1, "Colombia"], ["soccer", "chi.1", "futbol", "Liga de Chile", 1, "Chile"], ["soccer", "uru.1", "futbol", "Liga de Uruguay", 1, "Uruguay"],
  ["soccer", "par.1", "futbol", "Liga de Paraguay", 1, "Paraguay"], ["soccer", "per.1", "futbol", "Liga de Perú", 1, "Perú"], ["soccer", "ecu.1", "futbol", "Liga de Ecuador", 1, "Ecuador"],
  // Resto del mundo y selecciones
  ["soccer", "ksa.1", "futbol", "Liga de Arabia Saudita", 1, "Arabia Saudita"], ["soccer", "jpn.1", "futbol", "J1 League", 1, "Japón"], ["soccer", "aus.1", "futbol", "A-League", 1, "Australia"],
  ["soccer", "fifa.world", "futbol", "Copa del Mundo (fútbol)", 1, "Mundial"], ["soccer", "fifa.friendly", "futbol", "Amistosos", 0, "Mundial"],
  ["soccer", "fifa.worldq.conmebol", "futbol", "Eliminatorias", 1, "Sudamérica"], ["soccer", "fifa.worldq.uefa", "futbol", "Clasificación UEFA", 1, "Europa"],
  // Otros deportes
  ["basketball", "nba", "basquet", "NBA", 1, "Estados Unidos"], ["basketball", "wnba", "basquet", "WNBA", 1, "Estados Unidos"], ["football", "nfl", "nfl", "NFL", 1, "Estados Unidos"],
  ["football", "college-football", "nfl", "NCAA Football", 0, "Estados Unidos"], ["hockey", "nhl", "hockey", "NHL", 1, "Estados Unidos"],
  ["baseball", "mlb", "beisbol", "MLB", 1, "Estados Unidos"], ["tennis", "atp", "tenis", "ATP", 0, ""], ["tennis", "wta", "tenis", "WTA", 0, ""],
  ["mma", "ufc", "combate", "UFC", 0, "Estados Unidos"], ["racing", "f1", "automovilismo", "Fórmula 1", 0, "Mundial"], ["golf", "pga", "golf", "PGA Tour", 0, "Estados Unidos"],
  ["golf", "lpga", "golf", "LPGA", 0, "Estados Unidos"],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
const get = async (u) => { const r = await fetch(u, { headers: { "user-agent": "mundo-deporte" } }); if (!r.ok) throw new Error(r.status + " " + u); return r.json(); };
const sec = (x) => { const t = Date.parse(x); return t ? Math.floor(t / 1000) : 0; };
const tname = (n, fallback) => classify(n || "", "", true)?.tournament || n || fallback;
const num = (st, ...k) => { for (const n of k) { const s = (st || []).find((x) => x.name === n); if (s) return s.displayValue ?? s.value; } return ""; };

const from = new Date(Date.now() - 3 * 3600e3), to = new Date(Date.now() + 5 * 86400e3);
const matches = [], tables = {}, tmeta = {}, seen = new Set(), diag = [];
let errors = 0;
const push = (m) => { const k = [m.s, m.a, m.b, m.n || ""].join("|"); if (seen.has(k) || !m.s) return; seen.add(k); matches.push(m); };

const ES = [[/round of 128/i, "Ronda 1"], [/round of 64/i, "Ronda 2"], [/round of 32/i, "Dieciseisavos de final"], [/round of 16/i, "Octavos de final"], [/quarter/i, "Cuartos de final"], [/semi/i, "Semifinal"], [/third|3rd/i, "Tercer puesto"], [/^final$/i, "Final"], [/group/i, "Fase de grupos"], [/league phase|regular/i, "Fase de liga"], [/play-?off/i, "Playoffs"], [/first round/i, "Primera ronda"], [/second round/i, "Segunda ronda"], [/third round/i, "Tercera ronda"]];
const roundEs = (r) => { for (const [re, t] of ES) if (re.test(r || "")) return t; return r || ""; };
function team(c) { return c?.team?.displayName || c?.athlete?.displayName || c?.roster?.displayName || (c?.roster?.athletes || []).map((a) => a.shortName || a.displayName).filter(Boolean).join(" / ") || c?.team?.name || ""; }
function bcast(comp) {
  const a = (comp.broadcasts || []).flatMap((b) => b.names || []), b = (comp.geoBroadcasts || []).map((g) => g.media?.shortName).filter(Boolean);
  return [...new Set([...a, ...b])];
}
function status(o) { const s = o?.status?.type?.state; return s === "in" ? "in" : s === "post" ? "post" : "pre"; }
function venue(comp, ev) { const v = comp?.venue || ev?.venue || {}; return [v.fullName || v.displayName, v.address?.city, v.address?.country].filter(Boolean).join(", "); }

for (const [sport, lg, sp, fb, hasTable, co] of LEAGUES) {
  const before = matches.length; let nev = 0, err = "";
  try {
    const j = await get(`${BASE}/site/v2/sports/${sport}/${lg}/scoreboard?dates=${ymd(from)}-${ymd(to)}&limit=400`);
    const lname = j.leagues?.[0]?.name;
    for (const ev of j.events || []) {
      nev++;
      const evName = sport === "tennis" ? ev.name : lname;
      const t = sport === "tennis" ? tname(evName, fb) : fb;
      if (ev.groupings) { // tenis: torneo -> cuadros -> partidos
        tmeta[t] = { sp, v: venue(null, ev), s: sec(ev.date), e: sec(ev.endDate), stage: "", co: co || "" };
        for (const g of ev.groupings) for (const c of g.competitions || []) {
          const cs = c.competitors || []; if (cs.length < 2) continue;
          const s = sec(c.startDate || c.date); if (!s) continue;
          const st = status(c), sc = cs.map((x) => (x.linescores || []).map((l) => l.value).join("-"));
          push({ s, sp, t, r: roundEs(c.round?.displayName), a: team(cs[0]), b: team(cs[1]), v: venue(c, ev), st, ...(st !== "pre" ? { sc } : {}), ...(g.grouping?.displayName ? { d: g.grouping.displayName } : {}), bc: bcast(c) });
        }
        continue;
      }
      if (sport === "racing") { // Fórmula 1: un evento por sesión (práctica, clasificación, carrera)
        for (const c of ev.competitions || []) {
          const s0 = sec(c.startDate || c.date || ev.date); if (!s0) continue;
          const st = status(c);
          push({ s: s0, sp, t, n: ev.shortName || ev.name, r: c.type?.text || c.type?.abbreviation || "", a: "", b: "", v: venue(c, ev), st, co, bc: bcast(c) });
        }
        tmeta[t] ||= { sp, v: "", s: 0, e: 0, stage: "", co };
        continue;
      }
      if (sport === "golf") { // un evento por torneo
        const s0 = sec(ev.date); if (!s0) continue;
        const comp0 = ev.competitions?.[0] || {};
        push({ s: s0, e: sec(ev.endDate) || s0 + 4 * 86400, sp, t: ev.name || t, n: ev.name, r: "", a: "", b: "", v: venue(comp0, ev), st: status(ev), co, bc: bcast(comp0) });
        continue;
      }
      const comp = ev.competitions?.[0]; if (!comp) continue;
      const cs = comp.competitors || [];
      const home = cs.find((x) => x.homeAway === "home") || cs[0], away = cs.find((x) => x.homeAway === "away") || cs[1];
      if (!home || !away) continue;
      const st = status(comp.status ? comp : ev);
      const r = roundEs(comp.notes?.[0]?.headline) || (j.week?.number ? "Fecha " + j.week.number : "") || (ev.season?.slug === "post-season" ? "Playoffs" : "");
      push({ s: sec(ev.date), sp, t, r, a: team(home), b: team(away), v: venue(comp, ev), st, ...(st !== "pre" ? { sc: [home.score, away.score] } : {}), co, bc: bcast(comp) });
      tmeta[t] ||= { sp, v: "", s: 0, e: 0, stage: "", co };
      const lg0 = j.leagues?.[0]; if (lg0?.season) { tmeta[t].s ||= sec(lg0.season.startDate); tmeta[t].e ||= sec(lg0.season.endDate); }
    }
  } catch (e) { errors++; err = e.message; console.log("scoreboard", lg, e.message); }
  diag.push({ lg, ev: nev, m: matches.length - before, err });
  await sleep(700);
  if (hasTable) {
    try {
      const j = await get(`${BASE}/v2/sports/${sport}/${lg}/standings`);
      const groups = [];
      const walk = (n) => {
        if (n?.standings?.entries) groups.push({ g: n.name || "", rows: n.standings.entries.map((en) => ({ n: en.team?.displayName || "", pj: num(en.stats, "gamesPlayed"), g: num(en.stats, "wins"), e: num(en.stats, "ties", "otLosses"), p: num(en.stats, "losses"), dg: num(en.stats, "pointDifferential", "goalDifferential"), pts: num(en.stats, "points", "winPercent"), k: +num(en.stats, "rank", "playoffSeed") || 99 })).sort((a, b) => a.k - b.k) });
        (n?.children || []).forEach(walk);
      };
      walk(j);
      const t = fb;
      if (groups.length) tables[t] = groups.slice(0, 16);
    } catch (e) { errors++; console.log("tabla", lg, e.message); }
    await sleep(700);
  }
}
console.log(`ESPN: ${matches.length} partidos, ${Object.keys(tables).length} tablas (${errors} errores)`);
if (matches.length) fs.writeFileSync("data/fixtures.json", JSON.stringify({ meta: { at: Date.now(), diag }, matches, tables, tmeta }));
else console.log("Sin partidos: se conserva data/fixtures.json anterior");
