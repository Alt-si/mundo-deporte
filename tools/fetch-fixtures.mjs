// Descarga partidos del día (TheSportsDB, clave gratuita "3") para completar jugadores/equipos.
// Es opcional: si falla, no pisa data/fixtures.json.
import fs from "node:fs";
import { classify } from "./sports-taxonomy.mjs";
const SPORTS = { Tennis: "tenis", Soccer: "futbol", Basketball: "basquet", Volleyball: "voley", "Ice Hockey": "hockey", Rugby: "rugby", "American Football": "nfl", Baseball: "beisbol", Motorsport: "automovilismo", Golf: "golf", Fighting: "combate" };
const OUT = "data/fixtures.json", ART = -3 * 3600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const matches = [], seen = new Set();
const day0 = new Date(Date.now() + ART * 1000);
let fails = 0, calls = 0;
for (let k = 0; k < 5; k++) {
  const d = new Date(day0.getTime() + k * 86400000).toISOString().slice(0, 10);
  for (const [api, sp] of Object.entries(SPORTS)) {
    calls++;
    try {
      const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${d}&s=${encodeURIComponent(api)}`);
      const txt = await r.text();
      let j; try { j = JSON.parse(txt); } catch { fails++; if (fails < 3) console.log("Respuesta no JSON:", r.status, txt.slice(0, 150)); continue; }
      for (const ev of j.events || []) {
        const a = ev.strHomeTeam || ev.strEvent?.split(/ vs /i)[0], b = ev.strAwayTeam || ev.strEvent?.split(/ vs /i)[1];
        if (!a || !b || !ev.strTimestamp) continue;
        const s = Math.floor(Date.parse(ev.strTimestamp.endsWith("Z") ? ev.strTimestamp : ev.strTimestamp + "Z") / 1000);
        if (!s) continue;
        const t = classify(ev.strLeague || "", "", true)?.tournament || ev.strLeague || "";
        const key = [s, a, b].join("|"); if (seen.has(key)) continue; seen.add(key);
        const m = { s, sp, t, a, b };
        if (ev.intRound) m.r = /^\d+$/.test(ev.intRound) ? "Fecha " + ev.intRound : ev.intRound;
        matches.push(m);
      }
    } catch (e) { fails++; if (fails < 3) console.log("Error:", e.message); }
    await sleep(2200);
  }
}
console.log(`Fixtures: ${matches.length} partidos (${fails} de ${calls} consultas fallaron)`);
if (matches.length) fs.writeFileSync(OUT, JSON.stringify({ meta: { at: Date.now() }, matches }));
