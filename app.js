"use strict";
// Mundo Deporte · Fútbol argentino. Todos los horarios en hora de Argentina (UTC-3 fijo, sin horario de verano).
const TZ = -3 * 3600;
const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], DOWL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const nowSec = () => Math.floor(Date.now() / 1000);
const dayKey = (sec) => Math.floor((sec + TZ) / 86400);
const fmtTime = (sec) => { const d = new Date((sec + TZ) * 1000); return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0"); };
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/";
const OFFS = [-1, 0, 1, 2, 3, 4, 5];

const S = { data: null, off: 0, tour: "all", tabTour: "", q: "", live: false, view: "partidos" };

// Estado real del partido: los datos pueden tener unas horas; si ya pasó la hora de inicio se considera en juego.
function mstate(m, now) {
  if (m.st === "post") return "post";
  if (m.st === "in") return now > m.s + 4 * 3600 ? "post" : "in";
  if (now >= m.s + 3 * 3600) return "post";
  return now >= m.s ? "in" : "pre";
}

async function load() {
  try {
    S.data = await fetch("data/fixtures.json?t=" + Math.floor(Date.now() / 600000)).then((r) => r.json());
    S.data.matches.sort((x, y) => x.s - y.s);
    S.byLg = {};
    for (const t of S.data.tournaments) S.byLg[t.key] = t;
    S.data.tournaments.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
    S.tabTour = S.data.tournaments.find((t) => (S.data.tables || {})[t.key])?.key || "";
  } catch { $("#main").innerHTML = '<div class="empty">No se pudieron cargar los partidos. Revisá tu conexión.</div>'; return false; }
  return true;
}

function crest(url, name) {
  const ini = esc(String(name).split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase());
  return url ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;ph&quot;>${ini}</span>'">` : `<span class="ph">${ini}</span>`;
}

function filtered(opts = {}) {
  const now = nowSec(), today = dayKey(now), toks = norm(S.q).split(" ").filter(Boolean);
  return S.data.matches.filter((m) => {
    if (!opts.anyDay && dayKey(m.s) !== today + S.off) return false;
    if (!opts.anyTour && S.tour !== "all" && m.lg !== S.tour) return false;
    if (S.live && mstate(m, now) !== "in") return false;
    if (toks.length) { const h = norm(m.a + " " + m.b); if (!toks.every((t) => h.includes(t))) return false; }
    return true;
  });
}

function render() {
  if (!S.data) return;
  const now = nowSec(), today = dayKey(now);
  $("#tabM").setAttribute("aria-selected", S.view === "partidos");
  $("#tabT").setAttribute("aria-selected", S.view === "tablas");
  $("#days").hidden = $("#q").hidden = S.view !== "partidos";
  $("#liveBtn").style.visibility = S.view === "partidos" ? "" : "hidden";

  const liveN = S.data.matches.filter((m) => mstate(m, now) === "in").length;
  $("#liveBtn").setAttribute("aria-pressed", S.live); $("#liveN").textContent = liveN;

  if (S.view === "tablas") return renderTables();

  const cnt = {};
  for (const m of S.data.matches) cnt[dayKey(m.s) - today] = (cnt[dayKey(m.s) - today] || 0) + 1;
  $("#days").innerHTML = OFFS.map((o) => {
    const d = new Date((today + o) * 86400000);
    return `<button data-o="${o}" aria-pressed="${S.off === o}"><b>${o === -1 ? "Ayer" : o === 0 ? "Hoy" : o === 1 ? "Mañana" : DOW[d.getUTCDay()]}</b><small>${d.getUTCDate()} ${MON[d.getUTCMonth()]}</small></button>`;
  }).join("");

  const perTour = {};
  for (const m of filtered({ anyTour: true })) perTour[m.lg] = (perTour[m.lg] || 0) + 1;
  const total = Object.values(perTour).reduce((a, b) => a + b, 0);
  $("#tours").innerHTML = `<button class="chip" data-t="all" aria-pressed="${S.tour === "all"}">Todos<small>${total}</small></button>` +
    S.data.tournaments.map((t) => `<button class="chip${perTour[t.key] ? "" : " zero"}" data-t="${esc(t.key)}" aria-pressed="${S.tour === t.key}">${esc(t.name)}${perTour[t.key] ? `<small>${perTour[t.key]}</small>` : ""}</button>`).join("");

  const list = filtered(), groups = new Map();
  for (const m of list) { if (!groups.has(m.lg)) groups.set(m.lg, []); groups.get(m.lg).push(m); }
  const order = [...groups.keys()].sort((a, b) => (S.byLg[a]?.rank ?? 99) - (S.byLg[b]?.rank ?? 99));
  const d = new Date((today + S.off) * 86400000);
  let h = `<p class="note" style="margin-top:10px">${DOWL[d.getUTCDay()][0].toUpperCase() + DOWL[d.getUTCDay()].slice(1)} ${d.getUTCDate()} de ${["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][d.getUTCMonth()]} · horario de Argentina</p>`;
  for (const lg of order) {
    const t = S.byLg[lg] || { name: lg };
    h += `<section class="grp"><h2><span>${esc(t.name)}</span>${(S.data.tables || {})[lg] ? `<button data-tab="${esc(lg)}">Ver tabla</button>` : ""}</h2><div class="card">`;
    for (const m of groups.get(lg)) h += matchRow(m, now);
    h += "</div></section>";
  }
  if (!list.length) h += `<div class="empty">${!S.data.matches.length ? "Todavía no hay datos. Se cargan con la actualización automática." : S.live ? "No hay partidos en juego ahora." : "No hay partidos ese día con esos filtros."}</div>`;
  $("#main").innerHTML = h;
}

function matchRow(m, now) {
  const st = mstate(m, now), live = st === "in", post = st === "post";
  const g = (n) => (live || post ? esc(m.sc && m.sc[n] !== "" && m.sc[n] != null ? m.sc[n] : "–") : "");
  const left = live ? `<div class="st live"><b>${esc(m.ck && m.ck !== "FT" ? m.ck : "En juego")}</b><small>EN VIVO</small></div>`
    : post ? `<div class="st"><b>Final</b><small>${fmtTime(m.s)} hs</small></div>`
    : `<div class="st"><b>${fmtTime(m.s)}</b><small>hs</small></div>`;
  return `<button class="mx${live ? " is-live" : ""}${post ? " past" : ""}" data-id="${esc(m.lg + "|" + m.id)}">${left}<div class="teams">
    <div class="tm">${crest(m.la, m.a)}<span class="n">${esc(m.a)}</span><span class="g">${g(0)}</span></div>
    <div class="tm">${crest(m.lb, m.b)}<span class="n">${esc(m.b)}</span><span class="g">${g(1)}</span></div></div></button>`;
}

function renderTables() {
  const tabs = S.data.tournaments.filter((t) => (S.data.tables || {})[t.key]);
  $("#tours").innerHTML = tabs.map((t) => `<button class="chip" data-tt="${esc(t.key)}" aria-pressed="${S.tabTour === t.key}">${esc(t.name)}</button>`).join("");
  const groups = (S.data.tables || {})[S.tabTour];
  if (!groups) { $("#main").innerHTML = '<div class="empty">Todavía no hay tablas disponibles.</div>'; return; }
  const cols = [["pj", "PJ"], ["g", "G"], ["e", "E"], ["p", "P"], ["dg", "DG"], ["pts", "Pts"]].filter(([k]) => groups.some((g) => g.rows.some((r) => r[k] !== "" && r[k] != null)));
  $("#main").innerHTML = groups.map((g) => `<div class="tb-wrap">${g.g ? `<h2 class="note" style="margin:0 0 6px">${esc(g.g)}</h2>` : ""}<table class="tb"><thead><tr><th>#</th><th>Equipo</th>${cols.map(([, l]) => `<th>${l}</th>`).join("")}</tr></thead><tbody>${g.rows.map((r, i) => `<tr><td>${i + 1}</td><td class="nm">${r.lg ? `<img src="${esc(r.lg)}" alt="" loading="lazy" onerror="this.remove()">` : ""}${esc(r.n)}</td>${cols.map(([k]) => `<td>${esc(r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`).join("") + '<p class="note">Tablas de ESPN.</p>';
}

function sheet(key) {
  const [lg, id] = key.split("|"), m = S.data.matches.find((x) => x.lg === lg && x.id === id); if (!m) return;
  const now = nowSec(), st = mstate(m, now), t = S.byLg[lg] || { name: lg };
  const dd = new Date((m.s + TZ) * 1000), has = st !== "pre";
  const score = has ? `${esc(m.sc?.[0] ?? "–")} - ${esc(m.sc?.[1] ?? "–")}` : "vs";
  const status = st === "in" ? `En vivo${m.ck && m.ck !== "FT" ? " · " + esc(m.ck) : ""}` : st === "post" ? "Finalizado" : "Todavía no empezó";
  const rows = [["Estado", status], ["Torneo", esc(t.name)], m.r && ["Fase", esc(m.r)], ["Día", `${DOWL[dd.getUTCDay()]} ${dd.getUTCDate()} de ${MON[dd.getUTCMonth()]}`], ["Horario", `${fmtTime(m.s)} hs (Argentina)`], m.v && ["Estadio", esc(m.v)], ["País", "Argentina"]].filter(Boolean);
  $("#sheetBody").innerHTML = `<div class="sh-teams"><div class="t">${m.la ? `<img src="${esc(m.la)}" alt="" onerror="this.remove()">` : ""}${esc(m.a)}</div><div class="sc${st === "in" ? " live" : ""}">${score}</div><div class="t">${m.lb ? `<img src="${esc(m.lb)}" alt="" onerror="this.remove()">` : ""}${esc(m.b)}</div></div>
  <div class="rows">${rows.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join("")}</div>
  ${(S.data.tables || {})[lg] ? `<p><button class="chip" id="shTab">Ver tabla de ${esc(t.name)}</button></p>` : ""}`;
  const b = $("#shTab"); if (b) b.onclick = () => { $("#sheet").close(); S.view = "tablas"; S.tabTour = lg; render(); window.scrollTo(0, 0); };
  $("#sheet").showModal();
}

// Resultados y reloj en vivo: se consultan a ESPN desde el navegador, solo para las ligas con partidos en juego.
let busy = false;
async function refreshLive() {
  if (!S.data || busy) return;
  const now = nowSec(), lgs = new Set();
  for (const m of S.data.matches) if (m.st !== "post" && m.s - 900 <= now && now < m.s + 4 * 3600) lgs.add(m.lg);
  if (!lgs.size) return;
  busy = true; let changed = false;
  try {
    await Promise.all([...lgs].slice(0, 10).map(async (lg) => {
      try {
        const j = await fetch(`${ESPN}${lg}/scoreboard`).then((r) => r.json());
        for (const ev of j.events || []) {
          const m = S.data.matches.find((x) => x.lg === lg && x.id === String(ev.id)); const c = ev.competitions?.[0]; if (!m || !c) continue;
          const t = (c.status || ev.status)?.type || {}, st = t.state === "in" ? "in" : t.state === "post" ? "post" : "pre", cs = c.competitors || [];
          const h = cs.find((q) => q.homeAway === "home") || cs[0], a = cs.find((q) => q.homeAway === "away") || cs[1];
          const sc = st !== "pre" && h && a ? [h.score ?? "", a.score ?? ""] : m.sc, ck = st === "in" ? t.shortDetail || (c.status || ev.status)?.displayClock || "" : "";
          if (st !== m.st || ck !== m.ck || JSON.stringify(sc) !== JSON.stringify(m.sc)) { m.st = st; m.ck = ck; m.sc = sc; changed = true; }
        }
      } catch {}
    }));
  } finally { busy = false; }
  if (changed && !$("#sheet").open) render();
}

document.addEventListener("click", (e) => {
  const o = e.target.closest("[data-o]"); if (o) { S.off = +o.dataset.o; return render(); }
  const t = e.target.closest("[data-t]"); if (t) { S.tour = t.dataset.t; return render(); }
  const tt = e.target.closest("[data-tt]"); if (tt) { S.tabTour = tt.dataset.tt; return render(); }
  const tab = e.target.closest("[data-tab]"); if (tab) { S.view = "tablas"; S.tabTour = tab.dataset.tab; render(); return window.scrollTo(0, 0); }
  const r = e.target.closest(".mx"); if (r) sheet(r.dataset.id);
});
$("#tabM").onclick = () => { S.view = "partidos"; render(); };
$("#tabT").onclick = () => { S.view = "tablas"; render(); };
$("#liveBtn").onclick = () => { S.live = !S.live; if (S.live) S.off = 0; render(); };
$("#q").oninput = (e) => { S.q = e.target.value; render(); };

(async () => {
  if (await load()) { render(); refreshLive(); }
  setInterval(() => { if (S.data && !document.hidden) { render(); refreshLive(); } }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { render(); refreshLive(); } });
})();
