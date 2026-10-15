"use strict";
// Sección Deportes. Usa globals de app.js: $, esc, norm, fmtTime, nowSec, midnightOf, DOW, MON, TZ.
const ss = { data: null, sport: "all", tournament: "all", round: "all", day: "all", scope: "all", q: "", hideDone: true, live: false, limit: 120 };
let spHay = [];

async function spLoad() {
  if (ss.data) return true;
  try {
    const bust = "?t=" + Math.floor(Date.now() / 600000);
    ss.data = await fetch("data/sports.json" + bust).then((r) => r.json());
    spHay = ss.data.events.map((e) => {
      const ch = ss.data.channels[e[4]] || {};
      const sp = ss.data.sports[e[5]] || {};
      return norm([e[2], e[3], e[6], sp.n, ch.n, ch.c].join(" "));
    });
    return true;
  } catch {
    $("#sports").innerHTML = '<div class="empty">No se pudo cargar la programación deportiva.</div>';
    return false;
  }
}

function spFiltered(skip) {
  const d = ss.data, now = nowSec(), t0 = midnightOf(now);
  const toks = norm(ss.q).split(" ").filter(Boolean);
  const out = [];
  for (let i = 0; i < d.events.length; i++) {
    const e = d.events[i], ch = d.channels[e[4]] || {};
    if (skip !== "live" && ss.live && !(e[0] <= now && now < e[1])) continue;
    if (skip !== "sport" && ss.sport !== "all" && e[5] !== ss.sport) continue;
    if (skip !== "tournament" && ss.tournament !== "all" && e[6] !== ss.tournament) continue;
    if (ss.day !== "all") { const a = t0 + ss.day * 86400; if (e[1] <= a || e[0] >= a + 86400) continue; }
    if (ss.scope === "ar" && ch.c !== "Argentina") continue;
    if (ss.scope === "world" && ch.c === "Argentina") continue;
    if (ss.hideDone && !ss.live && e[1] <= now) continue;
    if (toks.length && !toks.every((t) => spHay[i].includes(t))) continue;
    out.push(i);
  }
  return out;
}

function spShell() {
  const d = ss.data;
  $("#sports").innerHTML = `
  <div class="sp-bar" id="spBar">
    <input id="spQ" type="search" list="spSugg" placeholder="Buscar equipo, jugador, torneo o canal…" autocomplete="off" aria-label="Buscar deportes">
    <datalist id="spSugg">${d.suggest.map((s) => `<option value="${esc(s[0])}">`).join("")}</datalist>
    <button class="live-btn" id="spLive" aria-pressed="false"><span class="dot"></span> En vivo ahora <small id="spLiveN"></small></button>
    <div class="sp-chips" id="spChips" role="group" aria-label="Deporte"></div>
    <div class="sp-row">
      <select id="spTour" aria-label="Torneo"></select>
      <select id="spDay" aria-label="Día"></select>
      <select id="spScope" aria-label="Origen del canal">
        <option value="all">Todo el mundo</option><option value="ar">Solo canales de Argentina</option><option value="world">Solo canales de otros países</option>
      </select>
      <label><input type="checkbox" id="spDone" checked> Ocultar terminados</label>
    </div>
  </div>
  <div id="spList"></div>`;
  const sel = $("#spDay");
  const t0 = midnightOf(nowSec());
  sel.add(new Option("Todos los días", "all"));
  for (let i = 0; i < 5; i++) {
    const dt = new Date((t0 + i * 86400 + TZ) * 1000);
    sel.add(new Option((i === 0 ? "Hoy" : i === 1 ? "Mañana" : DOW[dt.getUTCDay()]) + ` ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`, String(i)));
  }
  let t;
  $("#spQ").oninput = (e) => { clearTimeout(t); t = setTimeout(() => {
    const v = norm(e.target.value), hit = v && spTourNames().find((n) => norm(n) === v);
    if (hit) { ss.tournament = hit; ss.round = "all"; ss.q = ""; e.target.value = ""; } else ss.q = e.target.value;
    ss.limit = 120; spRender();
  }, 150); };
  $("#spLive").onclick = () => { ss.live = !ss.live; ss.limit = 120; spRender(); };
  $("#spTour").onchange = (e) => { ss.tournament = e.target.value; ss.round = "all"; ss.limit = 120; spRender(); };
  sel.onchange = (e) => { ss.day = e.target.value === "all" ? "all" : +e.target.value; ss.limit = 120; spRender(); };
  $("#spScope").onchange = (e) => { ss.scope = e.target.value; ss.limit = 120; spRender(); };
  $("#spDone").onchange = (e) => { ss.hideDone = e.target.checked; ss.limit = 120; spRender(); };
  $("#spList").addEventListener("click", (e) => {
    const tg = e.target.closest("[data-t]");
    if (tg) { ss.tournament = tg.dataset.t; ss.round = "all"; ss.sport = "all"; ss.limit = 120; spRender(); window.scrollTo(0, 0); return; }
    const rd = e.target.closest("[data-r]");
    if (rd) { ss.round = rd.dataset.r; spRender(); return; }
    if (e.target.closest(".tv-back")) { ss.tournament = "all"; ss.round = "all"; spRender(); return; }
    const mb = e.target.closest(".mt");
    if (mb) { spMatchSheet(+mb.dataset.m); return; }
    if (e.target.closest(".sp-more")) { ss.limit += 150; spRender(); return; }
    const b = e.target.closest(".ev");
    if (b) spSheet(+b.dataset.i);
  });
  new ResizeObserver(() => $("#sports").style.setProperty("--sp-bar-h", $("#spBar").offsetHeight + "px")).observe($("#spBar"));
}

function spRender() {
  if (!ss.data) return;
  const d = ss.data, now = nowSec();

  // Botón "En vivo ahora" (cuenta respetando los demás filtros)
  let liveN = 0;
  for (const i of spFiltered("live")) { const e = d.events[i]; if (e[0] <= now && now < e[1]) liveN++; }
  $("#spLive").setAttribute("aria-pressed", ss.live);
  $("#spLiveN").textContent = liveN;
  $("#spDone").disabled = ss.live;

  // Chips de deporte con conteo (respeta los demás filtros)
  const bySport = {};
  for (const i of spFiltered("sport")) bySport[d.events[i][5]] = (bySport[d.events[i][5]] || 0) + 1;
  const total = Object.values(bySport).reduce((a, b) => a + b, 0);
  const order = Object.keys(d.sports).filter((k) => bySport[k] || k === ss.sport);
  $("#spChips").innerHTML =
    `<button class="chip" data-s="all" aria-pressed="${ss.sport === "all"}">Todos<small>${total}</small></button>` +
    order.map((k) => `<button class="chip" data-s="${k}" aria-pressed="${ss.sport === k}">${d.sports[k].e} ${esc(d.sports[k].n)}<small>${bySport[k] || 0}</small></button>`).join("");
  $("#spChips").onclick = (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    ss.sport = b.dataset.s; ss.tournament = "all"; ss.limit = 120; spRender();
  };

  // Torneos disponibles (respeta deporte y demás filtros)
  const tours = {};
  for (const i of spFiltered("tournament")) { const t = d.events[i][6]; if (t) tours[t] = (tours[t] || 0) + 1; }
  const tsel = $("#spTour");
  tsel.innerHTML = "";
  tsel.add(new Option("Todos los torneos", "all"));
  if (ss.tournament !== "all" && !tours[ss.tournament]) tours[ss.tournament] = 0;
  Object.entries(tours).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => tsel.add(new Option(`${t} (${n})`, t)));
  tsel.value = ss.tournament;

  // Vista de torneo (estilo Google): fases + partidos en línea de tiempo
  if (ss.tournament !== "all") { $("#spList").innerHTML = spTournament(); return; }

  // Lista agrupada por día
  const idx = spFiltered();
  let html = `<div class="sp-sum">${idx.length} ${idx.length === 1 ? "evento" : "eventos"}${ss.live ? " en vivo ahora" : ""} · todos los horarios son de Argentina (ART, UTC−3)</div>`;
  let lastDay = null;
  for (const i of idx.slice(0, ss.limit)) {
    const e = d.events[i], ch = d.channels[e[4]] || {}, sp = d.sports[e[5]] || {};
    const dayKey = Math.floor((Math.max(e[0], midnightOf(now)) + TZ) / 86400);
    if (dayKey !== lastDay) {
      lastDay = dayKey;
      const dt = new Date(dayKey * 86400 * 1000);
      const rel = dayKey - Math.floor((now + TZ) / 86400);
      html += `<h3 class="sp-day">${rel === 0 ? "Hoy" : rel === 1 ? "Mañana" : DOW[dt.getUTCDay()]} · ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}</h3>`;
    }
    const live = e[0] <= now && now < e[1], past = e[1] <= now;
    html += `<button class="ev s-${e[5]}${past ? " past" : ""}" data-i="${i}">
      <span class="when"><b>${fmtTime(e[0])}</b><small>${fmtTime(e[1])} ARG</small></span>
      <span class="what"><span class="ttl">${sp.e || ""} ${esc(e[2])}</span>
        <span class="sub">${e[6] ? `<span class="tg" data-t="${esc(e[6])}">${esc(e[6])}</span>` : ""}<span class="ch">${esc(ch.n || "")}</span><span>${esc(ch.c || "")}</span></span></span>
      ${live ? '<span class="live">EN VIVO</span>' : ""}</button>`;
  }
  if (!idx.length) html += `<div class="empty">${ss.live ? "No hay eventos en vivo con esos filtros en este momento." : "No hay eventos con esos filtros. Probá con otro deporte, otro día o desmarcá \"Ocultar terminados\"."}</div>`;
  if (idx.length > ss.limit) html += `<button class="sp-more">Mostrar más (${idx.length - ss.limit})</button>`;
  html += `<p class="sp-note">Los deportes y torneos se detectan a partir de la información de cada canal; algunos partidos pueden aparecer sin torneo. Equipos y jugadores se buscan por el texto del título y la descripción.</p>`;
  $("#spList").innerHTML = html;
}

function spTourNames() {
  if (!ss.tNames) ss.tNames = [...new Set(ss.data.events.map((e) => e[6]).filter(Boolean))];
  return ss.tNames;
}

const RANK = ["Fase de liga", "Fase de grupos", "Primera ronda", "Ronda 1", "Segunda ronda", "Ronda 2", "Tercera ronda", "Ronda 3", "Dieciseisavos de final", "Octavos de final", "Cuartos de final", "Semifinal", "Tercer puesto", "Final"];
function rrank(r) { const k = RANK.findIndex((x) => norm(x) === norm(r)); if (k >= 0) return k; return /^(jornada|fecha|ronda)/i.test(r) ? 3 : 50; }

function spTournament() {
  const d = ss.data, now = nowSec(), t0 = midnightOf(now), T = ss.tournament;
  const okTime = (s, e) => {
    if (ss.live) return s <= now && now < e;
    if (ss.hideDone && e <= now) return false;
    if (ss.day !== "all") { const a = t0 + ss.day * 86400; if (e <= a || s >= a + 86400) return false; }
    return true;
  };
  const toks = norm(ss.q).split(" ").filter(Boolean);
  const chOk = (id) => { const c = (d.channels[id] || {}).c; return ss.scope === "all" || (ss.scope === "ar") === (c === "Argentina"); };
  const ms = [], mi = [];
  d.matches.forEach((m, i) => { if (m.t === T) mi.push(i); });
  const evs = [];
  d.events.forEach((e, i) => { if (e[6] === T) evs.push(i); });
  const allRounds = {};
  for (const i of mi) allRounds[d.matches[i].r || "Sin fase"] = 1;
  for (const i of evs) allRounds[d.events[i][7] || "Sin fase"] = 1;
  const rounds = Object.keys(allRounds).sort((a, b) => rrank(a) - rrank(b));
  const sp = d.sports[(d.matches[mi[0]] || {}).sp || (d.events[evs[0]] || [])[5]] || {};
  const sid = (d.matches[mi[0]] || {}).sp || (d.events[evs[0]] || [])[5] || "";
  const keep = (r) => ss.round === "all" || (r || "Sin fase") === ss.round;
  const mm = mi.filter((i) => { const m = d.matches[i]; return keep(m.r) && okTime(m.s, m.e) && m.ch.some(chOk) && (!toks.length || toks.every((t) => norm([m.a, m.b, m.r, T].join(" ") + " " + m.ch.map((c) => (d.channels[c] || {}).n).join(" ")).includes(t))); });
  const hasPlayers = mm.filter((i) => d.matches[i].a && d.matches[i].b);
  const rest = evs.filter((i) => { const e = d.events[i]; return !e[8] && keep(e[7]) && okTime(e[0], e[1]) && chOk(e[4]) && (!toks.length || toks.every((t) => spHay[i].includes(t))); });
  const all = [...mi.map((i) => d.matches[i].s), ...evs.map((i) => d.events[i][0])];
  const ends = [...mi.map((i) => d.matches[i].e), ...evs.map((i) => d.events[i][1])];
  const fd = (t) => { const x = new Date((t + TZ) * 1000); return x.getUTCDate() + " " + MON[x.getUTCMonth()]; };
  const chs = new Set(); mi.forEach((i) => d.matches[i].ch.forEach((c) => chs.add(c))); evs.forEach((i) => chs.add(d.events[i][4]));
  const cur = rounds.filter((r) => mi.some((i) => (d.matches[i].r || "Sin fase") === r && d.matches[i].e > now) || evs.some((i) => (d.events[i][7] || "Sin fase") === r && d.events[i][1] > now));
  const venue = (evs.map((i) => d.events[i][10]).find(Boolean)) || "";
  let h = `<button class="tv-back">← Todos los torneos</button>
  <div class="tv-head s-${sid}"><div class="tv-name">${sp.e || ""} ${esc(T)}</div>
    <div class="tv-meta">${esc(sp.n || "")}${venue ? " · " + esc(venue) : ""}${all.length ? " · " + fd(Math.min(...all)) + " – " + fd(Math.max(...ends) - 1) : ""}</div>
    ${cur[0] && cur[0] !== "Sin fase" ? `<div class="tv-phase">Fase actual: <b>${esc(cur[0])}</b></div>` : ""}
    <div class="tv-ch">Se emite en: ${[...chs].map((c) => esc((d.channels[c] || {}).n || c)).join(", ")}</div></div>`;
  if (rounds.length > 1) h += `<div class="sp-chips tv-rounds"><button class="chip" data-r="all" aria-pressed="${ss.round === "all"}">Todas las fases</button>${rounds.map((r) => `<button class="chip" data-r="${esc(r)}" aria-pressed="${ss.round === r}">${esc(r)}</button>`).join("")}</div>`;
  h += `<div class="sp-sum">${hasPlayers.length} ${hasPlayers.length === 1 ? "partido" : "partidos"}${rest.length ? ` · ${rest.length} transmisiones` : ""} · horarios de Argentina (ART, UTC−3)</div>`;
  const dayHead = (t) => { const k = Math.floor((Math.max(t, t0) + TZ) / 86400), dt = new Date(k * 86400000), rel = k - Math.floor((now + TZ) / 86400); return `<h3 class="sp-day">${rel === 0 ? "Hoy" : rel === 1 ? "Mañana" : DOW[dt.getUTCDay()]} · ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}</h3>`; };
  const chNames = (ids) => ids.map((c) => esc((d.channels[c] || {}).n || c)).join(" · ");
  let last = null;
  h += '<div class="tl">';
  for (const i of hasPlayers.sort((a, b) => d.matches[a].s - d.matches[b].s)) {
    const m = d.matches[i], k = Math.floor((Math.max(m.s, t0) + TZ) / 86400);
    if (k !== last) { last = k; h += dayHead(m.s); }
    const live = m.s <= now && now < m.e;
    h += `<button class="mt s-${m.sp}${m.e <= now ? " past" : ""}" data-m="${i}">
      <span class="when"><b>${fmtTime(m.s)}</b><small>ARG</small></span>
      <span class="vs"><span class="rd">${esc(m.r || "")}</span><span class="side">${esc(m.a)}</span><span class="x">vs</span><span class="side">${esc(m.b)}</span>
      <span class="sub"><span class="ch">${chNames(m.ch)}</span></span></span>${live ? '<span class="live">EN VIVO</span>' : ""}</button>`;
  }
  h += "</div>";
  if (rest.length) {
    h += `<h3 class="sp-day">${hasPlayers.length ? "Otras transmisiones" : "Transmisiones y resúmenes"}</h3>`;
    last = null;
    for (const i of rest.sort((a, b) => d.events[a][0] - d.events[b][0])) {
      const e = d.events[i], ch = d.channels[e[4]] || {}, live = e[0] <= now && now < e[1], k = Math.floor((Math.max(e[0], t0) + TZ) / 86400);
      if (k !== last) { last = k; h += dayHead(e[0]); }
      h += `<button class="ev s-${e[5]}${e[1] <= now ? " past" : ""}" data-i="${i}"><span class="when"><b>${fmtTime(e[0])}</b><small>${fmtTime(e[1])} ARG</small></span>
        <span class="what"><span class="ttl">${e[7] ? `<span class="rd">${esc(e[7])}</span> ` : ""}${esc(e[2])}</span><span class="sub"><span class="ch">${esc(ch.n || "")}</span><span>${esc(ch.c || "")}</span></span></span>${live ? '<span class="live">EN VIVO</span>' : ""}</button>`;
    }
  }
  if (!hasPlayers.length && !rest.length) h += `<div class="empty">No hay partidos con esos filtros.</div>`;
  h += `<p class="sp-note">Los enfrentamientos se toman de la programación de los canales; cuando está disponible, se completan con el fixture oficial del torneo.</p>`;
  return h;
}

function spMatchSheet(i) {
  const d = ss.data, m = d.matches[i], dd = new Date((m.s + TZ) * 1000), sp = d.sports[m.sp] || {};
  $("#sheetBody").innerHTML = `<div class="s-${m.sp}"><span class="tag" style="background:var(--cat)">${sp.e || ""} ${esc(m.t)}${m.r ? " · " + esc(m.r) : ""}</span></div>
    <h2>${esc(m.a)} vs ${esc(m.b)}</h2>
    <div class="meta">${DOW[dd.getUTCDay()]} ${dd.getUTCDate()} ${MON[dd.getUTCMonth()]}, ${fmtTime(m.s)} (hora de Argentina)</div>
    <div class="meta"><b>Dónde verlo:</b></div><ul>${m.ch.map((c) => { const ch = d.channels[c] || {}; return `<li>${esc(ch.n || c)} (${esc(ch.c || "—")})</li>`; }).join("")}</ul>`;
  $("#sheet").showModal();
}

function spSheet(i) {
  const d = ss.data, e = d.events[i], ch = d.channels[e[4]] || {}, sp = d.sports[e[5]] || {};
  const dd = new Date((e[0] + TZ) * 1000), now = nowSec();
  const status = e[1] <= now ? "Ya terminó" : e[0] <= now ? "En emisión ahora" : "Más tarde";
  $("#sheetBody").innerHTML =
    `<div class="s-${e[5]}"><span class="tag" style="background:var(--cat)">${sp.e || ""} ${esc(sp.n || "")}${e[6] ? " · " + esc(e[6]) : ""}</span></div>` +
    `<h2>${esc(e[2])}</h2>` +
    `<div class="meta">${DOW[dd.getUTCDay()]} ${dd.getUTCDate()} ${MON[dd.getUTCMonth()]}, ${fmtTime(e[0])} – ${fmtTime(e[1])} (hora de Argentina) · ${status}</div>` +
    (e[3] ? `<p>${esc(e[3])}</p>` : "") +
    `<div class="meta"><b>Canal:</b> ${esc(ch.n || "—")} (${esc(ch.c || "—")})</div>` +
    (ch.c && ch.c !== "Argentina" ? `<div class="meta">Es un canal de otro país: puede no estar disponible en tu proveedor.</div>` : "");
  $("#sheet").showModal();
}

async function showView(v) {
  const sports = v === "sports";
  document.body.dataset.view = sports ? "sports" : "guide";
  $("#tabGuide").setAttribute("aria-selected", !sports);
  $("#tabSports").setAttribute("aria-selected", sports);
  $("#grid").hidden = sports;
  $("#sports").hidden = !sports;
  try { history.replaceState(null, "", sports ? "#deportes" : location.pathname + location.search); } catch {}
  if (sports) {
    if (await spLoad()) { if (!$("#spBar")) spShell(); spRender(); }
  } else if (typeof render === "function") render(true);
}

$("#tabGuide").onclick = () => showView("guide");
$("#tabSports").onclick = () => showView("sports");
setInterval(() => { if (document.body.dataset.view === "sports" && ss.data) spRender(); }, 60000);
showView("sports");
