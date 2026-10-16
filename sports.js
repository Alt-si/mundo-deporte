"use strict";
// Mundo Deporte. Usa util.js: $, esc, norm, fmtTime, nowSec, midnightOf, DOW, MON, TZ.
// Modelo: una lista de "items" (partidos y eventos del mundo). Los canales y el horario de Argentina son un dato más.
const SPORT_ORDER = ["futbol", "tenis", "basquet", "automovilismo", "nfl", "voley", "rugby", "padel", "golf", "combate", "hockey", "beisbol", "ciclismo", "handball", "lucha", "futsal", "atletismo", "natacion", "esqui", "surf", "polo", "tenis_mesa", "otros"];
const spRank = (k) => { const i = SPORT_ORDER.indexOf(k); return i < 0 ? 99 : i; };
// Programas que no son un evento en vivo (repeticiones, resúmenes, magazines)
const REPLAY = /repetici|compact|resumen|diferido|compacto|lo mejor|melhores|replay|highlights|reprise|archivo|clasicos? de|historia|sportscenter|goles de|weekly|show de|programa/;
const ss = { data: null, items: [], hay: [], sport: "all", tournament: "all", round: "all", day: "all", country: "all", seen: "all", view: "partidos", q: "", hideDone: true, live: false, limit: 100 };

const isLive = (it, now) => (it.st === "in" ? now < it.e + 1800 : it.st === "post" ? false : it.s <= now && now < it.e);

async function spLoad() {
  if (ss.data) return true;
  try {
    const bust = "?t=" + Math.floor(Date.now() / 600000);
    const d = (ss.data = await fetch("data/sports.json" + bust).then((r) => r.json()));
    const tm = d.tmeta || {}, items = [];
    const fxT = new Set(d.matches.filter((m) => m.fx).map((m) => m.t));
    d.matches.forEach((m, i) => items.push({ k: "m", i, s: m.s, e: m.e, sp: m.sp, t: m.t, r: m.r || "", a: m.a || "", b: m.b || "", n: m.n || "", ch: m.ch || [], bc: m.bc || [], v: m.v || "", st: m.st, sc: m.sc, d: m.d || "", co: m.co || (tm[m.t] || {}).co || "", id: m.id || "", lg: m.lg || "", ck: m.ck || "" }));
    const merged = new Map();
    d.events.forEach((e, i) => {
      if (e[8] || REPLAY.test(norm(e[2] + " " + (e[3] || "").slice(0, 60)))) return;   // con rivales: ya están en d.matches
      if (e[6] && fxT.has(e[6])) return;                                              // torneo con fixture oficial
      if (!e[6] && (e[5] === "futbol" || e[5] === "otros")) return;                   // programas sueltos sin torneo
      const key = [e[5], e[6], norm(e[2]), Math.round(e[0] / 3600)].join("|");
      const o = merged.get(key);
      if (o) { if (!o.ch.includes(e[4])) o.ch.push(e[4]); return; }
      const it = { k: "e", i, s: e[0], e: e[1], sp: e[5], t: e[6], r: e[7] || "", a: "", b: "", n: e[2], ch: [e[4]], bc: [], v: "", st: "", sc: null, d: "", co: (tm[e[6]] || {}).co || "", desc: e[3] };
      merged.set(key, it); items.push(it);
    });
    items.sort((x, y) => x.s - y.s);
    ss.items = items;
    ss.hay = items.map((it) => {
      const sp = d.sports[it.sp] || {};
      const chs = spChannels(it);
      return norm([it.a, it.b, it.n, it.t, it.r, it.v, it.co, sp.n, it.desc || "", chs.map((c) => c.n + " " + c.c).join(" ")].join(" "));
    });
    return true;
  } catch {
    $("#sports").innerHTML = '<div class="empty">No se pudo cargar la información deportiva.</div>';
    return false;
  }
}

// Canales donde se ve: [{n, c}] (los de ESPN son de EE.UU.)
function spChannels(it) {
  const d = ss.data, out = [], seen = new Set();
  for (const id of it.ch) { const c = d.channels[id]; if (!c) continue; const nm = c.n.replace(/\s+(HD|Básico)$/i, ""), k = nm + "|" + c.c; if (!seen.has(k)) { seen.add(k); out.push({ n: nm, c: c.c }); } }
  for (const b of it.bc) { const k = b + "|Estados Unidos"; if (!seen.has(k)) { seen.add(k); out.push({ n: b, c: "Estados Unidos" }); } }
  return out.sort((x, y) => (x.c === "Argentina" ? 0 : 1) - (y.c === "Argentina" ? 0 : 1));
}
// "ESPN (Argentina, Chile) · Fox Sports (México)"
function chText(list, max) {
  const g = new Map();
  for (const c of list) { if (!g.has(c.n)) g.set(c.n, []); g.get(c.n).push(c.c); }
  const parts = [...g].map(([n, cs]) => `${n} (${[...new Set(cs)].join(", ")})`);
  return parts.slice(0, max || 99).join(" · ") + (max && parts.length > max ? ` · +${parts.length - max}` : "");
}

function spFiltered(skip) {
  const now = nowSec(), t0 = midnightOf(now);
  const toks = norm(ss.q).split(" ").filter(Boolean);
  const out = [];
  for (let i = 0; i < ss.items.length; i++) {
    const it = ss.items[i];
    if (skip !== "live" && ss.live && !isLive(it, now)) continue;
    if (skip !== "sport" && ss.sport !== "all" && it.sp !== ss.sport) continue;
    if (skip !== "tournament" && ss.tournament !== "all" && it.t !== ss.tournament) continue;
    if (ss.day !== "all") { const a = t0 + ss.day * 86400; if (it.e <= a || it.s >= a + 86400) continue; }
    if (skip !== "country" && ss.country !== "all" && it.co !== ss.country) continue;
    if (skip !== "seen" && ss.seen !== "all" && !spChannels(it).some((c) => c.c === ss.seen)) continue;
    if (ss.hideDone && !ss.live && (it.st === "post" || it.e <= now)) continue;
    if (toks.length && !toks.every((t) => ss.hay[i].includes(t))) continue;
    out.push(i);
  }
  return out;
}

function spTourNames() {
  if (!ss.tNames) ss.tNames = [...new Set(ss.items.map((it) => it.t).filter(Boolean))];
  return ss.tNames;
}

function spShell() {
  const d = ss.data;
  $("#sports").innerHTML = `
  <div class="sp-bar" id="spBar">
    <input id="spQ" type="search" list="spSugg" placeholder="Buscar equipo, jugador, torneo, país o canal…" autocomplete="off" aria-label="Buscar deportes">
    <datalist id="spSugg">${spTourNames().map((t) => `<option value="${esc(t)}">`).join("")}${d.suggest.map((s) => `<option value="${esc(s[0])}">`).join("")}</datalist>
    <button class="live-btn" id="spLive" aria-pressed="false"><span class="dot"></span> En vivo ahora <small id="spLiveN"></small></button>
    <div class="sp-chips" id="spChips" role="group" aria-label="Deporte"></div>
    <div class="sp-row">
      <select id="spTour" aria-label="Torneo"></select>
      <select id="spCountry" aria-label="País del evento"></select>
      <select id="spDay" aria-label="Día"></select>
      <select id="spSeen" aria-label="Se ve en"></select>
      <label><input type="checkbox" id="spDone" checked> Ocultar terminados</label>
    </div>
  </div>
  <div id="spList"></div>`;
  const sel = $("#spDay"), t0 = midnightOf(nowSec());
  sel.add(new Option("Próximos 5 días", "all"));
  for (let i = 0; i < 5; i++) {
    const dt = new Date((t0 + i * 86400 + TZ) * 1000);
    sel.add(new Option((i === 0 ? "Hoy" : i === 1 ? "Mañana" : DOW[dt.getUTCDay()]) + ` ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`, String(i)));
  }
  const go = () => { ss.limit = 100; spRender(); };
  let t;
  $("#spQ").oninput = (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      const v = norm(e.target.value), hit = v && spTourNames().find((n) => norm(n) === v);
      if (hit) { ss.tournament = hit; ss.round = "all"; ss.view = "partidos"; ss.q = ""; e.target.value = ""; } else ss.q = e.target.value;
      go();
    }, 150);
  };
  $("#spLive").onclick = () => { ss.live = !ss.live; go(); };
  $("#spTour").onchange = (e) => { ss.tournament = e.target.value; ss.round = "all"; ss.view = "partidos"; go(); };
  $("#spCountry").onchange = (e) => { ss.country = e.target.value; go(); };
  $("#spSeen").onchange = (e) => { ss.seen = e.target.value; go(); };
  sel.onchange = (e) => { ss.day = e.target.value === "all" ? "all" : +e.target.value; go(); };
  $("#spDone").onchange = (e) => { ss.hideDone = e.target.checked; go(); };
  $("#spChips").onclick = (e) => { const b = e.target.closest(".chip"); if (!b) return; ss.sport = b.dataset.s; ss.tournament = "all"; ss.round = "all"; go(); };
  $("#spList").addEventListener("click", (e) => {
    const tg = e.target.closest("[data-t]");
    if (tg) { ss.tournament = tg.dataset.t; ss.round = "all"; ss.sport = "all"; ss.view = "partidos"; ss.limit = 100; spRender(); window.scrollTo(0, 0); return; }
    const vw = e.target.closest("[data-v]"); if (vw) { ss.view = vw.dataset.v; spRender(); return; }
    const rd = e.target.closest("[data-r]"); if (rd) { ss.round = rd.dataset.r; spRender(); return; }
    if (e.target.closest(".tv-back")) { ss.tournament = "all"; ss.round = "all"; spRender(); return; }
    if (e.target.closest(".sp-more")) { ss.limit += 150; spRender(); return; }
    const b = e.target.closest(".it"); if (b) spSheet(+b.dataset.i);
  });
  new ResizeObserver(() => $("#sports").style.setProperty("--sp-bar-h", $("#spBar").offsetHeight + "px")).observe($("#spBar"));
}

function fillSelect(id, allLabel, counts, current, first) {
  const el = $(id); el.innerHTML = "";
  el.add(new Option(allLabel, "all"));
  if (current !== "all" && !(current in counts)) counts[current] = 0;
  Object.entries(counts).sort((a, b) => (a[0] === first ? -1 : b[0] === first ? 1 : b[1] - a[1])).forEach(([k, n]) => el.add(new Option(`${k} (${n})`, k)));
  el.value = current;
}

function spRender() {
  if (!ss.data) return;
  const d = ss.data, now = nowSec(), it = ss.items;

  let liveN = 0;
  for (const i of spFiltered("live")) if (isLive(it[i], now)) liveN++;
  $("#spLive").setAttribute("aria-pressed", ss.live);
  $("#spLiveN").textContent = liveN;
  $("#spDone").disabled = ss.live;

  const bySport = {};
  for (const i of spFiltered("sport")) bySport[it[i].sp] = (bySport[it[i].sp] || 0) + 1;
  const total = Object.values(bySport).reduce((a, b) => a + b, 0);
  const order = Object.keys(d.sports).filter((k) => bySport[k] || k === ss.sport).sort((a, b) => spRank(a) - spRank(b));
  $("#spChips").innerHTML =
    `<button class="chip" data-s="all" aria-pressed="${ss.sport === "all"}">Todos<small>${total}</small></button>` +
    order.map((k) => `<button class="chip" data-s="${k}" aria-pressed="${ss.sport === k}">${d.sports[k].e} ${esc(d.sports[k].n)}<small>${bySport[k] || 0}</small></button>`).join("");

  const tours = {}, cos = {}, seen = {};
  for (const i of spFiltered("tournament")) if (it[i].t) tours[it[i].t] = (tours[it[i].t] || 0) + 1;
  for (const i of spFiltered("country")) cos[it[i].co || "Sin país"] = (cos[it[i].co || "Sin país"] || 0) + 1;
  for (const i of spFiltered("seen")) for (const c of new Set(spChannels(it[i]).map((x) => x.c))) seen[c] = (seen[c] || 0) + 1;
  fillSelect("#spTour", "Todos los torneos", tours, ss.tournament);
  const real = {}; for (const k in cos) if (k !== "Sin país") real[k] = cos[k];
  fillSelect("#spCountry", "🌎 Todos los países", real, ss.country);
  fillSelect("#spSeen", "📺 Se ve en cualquier país", seen, ss.seen, "Argentina");

  if (ss.tournament !== "all") { $("#spList").innerHTML = spTournament(); return; }

  const idx = spFiltered();
  const qt = norm(ss.q).split(" ").filter(Boolean);
  const tHits = qt.length ? spTourNames().filter((n) => qt.every((t) => norm(n).includes(t))).slice(0, 6) : [];
  let html = tHits.length ? `<div class="sp-chips tv-hits"><span class="tv-lbl">Torneos:</span>${tHits.map((n) => `<button class="chip" data-t="${esc(n)}">🏆 ${esc(n)}</button>`).join("")}</div>` : "";
  html += `<div class="sp-sum">${idx.length} ${idx.length === 1 ? "evento" : "eventos"}${ss.live ? " en vivo ahora" : ""} · horario de Argentina</div>`;
  html += spCards(idx.slice(0, ss.limit), now);
  if (!idx.length) html += `<div class="empty">${ss.live ? "No hay eventos en vivo con esos filtros en este momento." : "No hay eventos con esos filtros. Probá con otro deporte, país o día, o desmarcá \"Ocultar terminados\"."}</div>`;
  if (idx.length > ss.limit) html += `<button class="sp-more">Mostrar más (${idx.length - ss.limit})</button>`;
  html += `<p class="sp-note">Fixture y resultados de ESPN; canales y horarios de las grillas de TV. Algunos eventos pueden no tener canal informado.</p>`;
  $("#spList").innerHTML = html;
}

function dayHead(t, now) {
  const k = Math.floor((Math.max(t, midnightOf(now)) + TZ) / 86400), dt = new Date(k * 86400000), rel = k - Math.floor((now + TZ) / 86400);
  return [k, `<h3 class="sp-day">${rel === 0 ? "Hoy" : rel === 1 ? "Mañana" : DOW[dt.getUTCDay()]} · ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}</h3>`];
}
const scoreRow = (sc, n) => {
  if (!sc || sc[n] == null || sc[n] === "") return "";
  const v = String(sc[n]);
  return `<span class="pt">${esc(v.includes("-") ? v.split("-").join(" ") : v)}</span>`;
};

function spCards(list, now) {
  let last = null, h = "";
  for (const i of list) {
    const x = ss.items[i], [k, head] = dayHead(x.s, now);
    if (k !== last) { last = k; h += head; }
    const live = isLive(x, now), done = x.st === "post" || (!live && x.e <= now);
    const chs = spChannels(x), pair = x.a && x.b;
    const sub = [x.t ? `<span class="tg" data-t="${esc(x.t)}">${esc(x.t)}</span>` : "", [x.r, x.d].filter(Boolean).map(esc).join(" · ")].filter(Boolean).join(" ");
    const started = live || done || x.st === "post";
    const sc = (n) => `<b class="pt">${started && x.sc && x.sc[n] !== "" && x.sc[n] != null ? esc(String(x.sc[n]).replace(/-/g, " ")) : "–"}</b>`;
    const clk = live ? `<span class="ck">⏱ ${esc(x.ck || "En juego")}</span>` : "";
    h += `<button class="it s-${x.sp}${done ? " past" : ""}" data-i="${i}">
      <span class="when"><b>${fmtTime(x.s)}</b><small>hs</small></span>
      <span class="ico" title="${esc((ss.data.sports[x.sp] || {}).n || "")}" aria-hidden="true">${(ss.data.sports[x.sp] || {}).e || "🏅"}</span>
      <span class="body">
        ${pair ? `<span class="vsl"><span class="side">${esc(x.a)} ${sc(0)}</span><span class="vs">vs</span><span class="side">${esc(x.b)} ${sc(1)}</span></span>` : `<span class="ttl">${esc(x.n || x.t)}</span>`}
        <span class="meta">${sub}${clk}${live ? '<span class="live">EN VIVO</span>' : done && x.st === "post" ? '<span class="fin">Final</span>' : ""}</span>
      </span></button>`;
  }
  return h;
}

const RANK = ["Fase de liga", "Fase de grupos", "Primera ronda", "Ronda 1", "Segunda ronda", "Ronda 2", "Tercera ronda", "Ronda 3", "Dieciseisavos de final", "Octavos de final", "Cuartos de final", "Semifinal", "Tercer puesto", "Final"];
function rrank(r) { const k = RANK.findIndex((x) => norm(x) === norm(r)); if (k >= 0) return k; return /^(jornada|fecha|ronda)/i.test(r) ? 3 : 50; }

function spTournament() {
  const d = ss.data, now = nowSec(), T = ss.tournament, tm = (d.tmeta || {})[T] || {};
  const all = ss.items.filter((x) => x.t === T);
  const idx = spFiltered().filter((i) => ss.round === "all" || (ss.items[i].r || "Sin fase") === ss.round);
  const rounds = [...new Set(all.map((x) => x.r || "Sin fase"))].sort((a, b) => rrank(a) - rrank(b));
  const sid = (all[0] || {}).sp || tm.sp || "", sp = d.sports[sid] || {};
  const fd = (t) => { const x = new Date((t + TZ) * 1000); return x.getUTCDate() + " " + MON[x.getUTCMonth()]; };
  const dMin = tm.s || Math.min(...all.map((x) => x.s)), dMax = tm.e || Math.max(...all.map((x) => x.e));
  const cur = rounds.find((r) => r !== "Sin fase" && all.some((x) => (x.r || "Sin fase") === r && x.e > now));
  const chs = spChannels({ ch: [...new Set(all.flatMap((x) => x.ch))], bc: [...new Set(all.flatMap((x) => x.bc))] });
  const tbl = (d.tables || {})[T];
  let h = `<button class="tv-back">← Todos los torneos</button>
  <div class="tv-head s-${sid}"><div class="tv-name"><span class="ico">${sp.e || "🏅"}</span> ${esc(T)}</div>
    <div class="tv-meta">${esc(sp.n || "")}${tm.co ? " · " + esc(tm.co) : ""}${tm.v ? " · " + esc(tm.v) : ""}${isFinite(dMin) && isFinite(dMax) ? " · " + fd(dMin) + " – " + fd(dMax - 1) : ""}</div>
    ${tm.stage ? `<div class="tv-phase">Etapa: <b>${esc(tm.stage)}</b></div>` : cur ? `<div class="tv-phase">Fase actual: <b>${esc(cur)}</b></div>` : ""}
    ${chs.length ? `<div class="tv-ch">📺 Se ve en: ${esc(chText(chs, 8))}</div>` : ""}</div>`;
  if (tbl) h += `<div class="sp-chips tv-views"><button class="chip" data-v="partidos" aria-pressed="${ss.view !== "tabla"}">Partidos</button><button class="chip" data-v="tabla" aria-pressed="${ss.view === "tabla"}">Tabla de posiciones</button></div>`;
  if (tbl && ss.view === "tabla") return h + spTable(tbl) + `<p class="sp-note">Tablas de ESPN, actualizadas con cada carga de datos.</p>`;
  if (rounds.length > 1) h += `<div class="sp-chips tv-rounds"><button class="chip" data-r="all" aria-pressed="${ss.round === "all"}">Todas las fases</button>${rounds.map((r) => `<button class="chip" data-r="${esc(r)}" aria-pressed="${ss.round === r}">${esc(r)}</button>`).join("")}</div>`;
  h += `<div class="sp-sum">${idx.length} ${idx.length === 1 ? "partido" : "partidos"} · horario de Argentina</div>`;
  h += spCards(idx.slice(0, ss.limit), now);
  if (!idx.length) h += `<div class="empty">No hay partidos con esos filtros.</div>`;
  if (idx.length > ss.limit) h += `<button class="sp-more">Mostrar más (${idx.length - ss.limit})</button>`;
  return h;
}

function spTable(groups) {
  const cols = [["pj", "PJ"], ["g", "G"], ["e", "E"], ["p", "P"], ["dg", "DG"], ["pts", "Pts"]].filter(([k]) => groups.some((g) => g.rows.some((r) => r[k] !== "" && r[k] != null)));
  return groups.map((g) => `<div class="tb-wrap">${g.g ? `<h3 class="sp-day">${esc(g.g)}</h3>` : ""}<table class="tb"><thead><tr><th>#</th><th>Equipo</th>${cols.map(([, l]) => `<th>${l}</th>`).join("")}</tr></thead><tbody>${g.rows.map((r, n) => `<tr><td>${n + 1}</td><td class="nm">${esc(r.n)}</td>${cols.map(([k]) => `<td>${esc(r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`).join("");
}

function spAbout(x, sp, status) {
  const par = x.a && x.b ? `${x.a} y ${x.b}` : "";
  const bits = [sp.n ? `${par ? "Partido" : "Evento"} de ${sp.n.toLowerCase()}` : "Evento deportivo", x.t ? `de ${x.t}` : "", x.r ? `(${x.r})` : "", par ? `entre ${par}` : "", x.v ? `en ${x.v}` : x.co ? `en ${x.co}` : ""].filter(Boolean);
  return bits.join(" ") + ". " + (status === "En vivo ahora" ? "Se está jugando ahora." : status === "Próximo" ? "Todavía no empezó." : "Ya terminó.");
}

function spSheet(i) {
  const d = ss.data, x = ss.items[i], sp = d.sports[x.sp] || {}, now = nowSec();
  const dd = new Date((x.s + TZ) * 1000), live = isLive(x, now);
  const chs = spChannels(x), sc = x.sc;
  const status = live ? "En vivo ahora" : x.st === "post" || x.e <= now ? "Finalizado" : "Próximo";
  const title = x.a && x.b ? `${esc(x.a)} vs ${esc(x.b)}` : esc(x.n || x.t);
  $("#sheetBody").innerHTML =
    `<div class="s-${x.sp}"><span class="tag" style="background:var(--cat)">${sp.e || ""} ${esc(sp.n || "")}${x.t ? " · " + esc(x.t) : ""}</span></div>` +
    `<h2>${title}</h2>` +
    `<div class="meta">${DOW[dd.getUTCDay()]} ${dd.getUTCDate()} ${MON[dd.getUTCMonth()]}, ${fmtTime(x.s)} hs (hora de Argentina) · ${status}</div>` +
    (sc && x.a ? `<div class="meta"><b>Resultado:</b> ${esc(x.a)} ${esc(String(sc[0]).replace(/-/g, " "))} · ${esc(x.b)} ${esc(String(sc[1]).replace(/-/g, " "))}</div>` : "") +
    (x.r || x.d ? `<div class="meta"><b>Fase:</b> ${esc([x.r, x.d].filter(Boolean).join(" · "))}</div>` : "") +
    (x.co ? `<div class="meta"><b>País:</b> ${esc(x.co)}</div>` : "") +
    (x.v ? `<div class="meta">📍 ${esc(x.v)}</div>` : "") +
    (isLive(x, now) && x.ck ? `<div class="meta"><b>Tiempo de juego:</b> ${esc(x.ck)}</div>` : "") +
    `<p>${esc(x.desc || spAbout(x, sp, status))}</p>` +
    `<div class="meta"><b>Dónde verlo:</b></div>` +
    (chs.length ? `<ul>${chs.map((c) => `<li>${esc(c.n)} <span class="meta">(${esc(c.c)})</span></li>`).join("")}</ul>` : `<div class="meta">Sin transmisión informada.</div>`) +
    (chs.length && !chs.some((c) => c.c === "Argentina") ? `<div class="meta">No figura en canales de Argentina: puede verse por plataformas de otros países.</div>` : "") +
    (x.t ? `<p><button class="chip" id="sheetT">🏆 Ver torneo: ${esc(x.t)}</button></p>` : "");
  const b = $("#sheetT");
  if (b) b.onclick = () => { $("#sheet").close(); ss.tournament = x.t; ss.round = "all"; ss.sport = "all"; ss.view = "partidos"; spRender(); window.scrollTo(0, 0); };
  $("#sheet").showModal();
}

// Resultados y reloj en vivo: se consultan a ESPN desde el navegador cada minuto, solo para las ligas con partidos en juego.
let spBusy = false;
async function spLiveRefresh() {
  if (!ss.data || spBusy) return;
  const now = nowSec(), lgs = new Set();
  for (const x of ss.items) if (x.lg && x.id && x.st !== "post" && x.s - 600 <= now && now < x.e + 1800) lgs.add(x.lg);
  if (!lgs.size) return;
  spBusy = true;
  let changed = false;
  try {
    await Promise.all([...lgs].slice(0, 12).map(async (lg) => {
      try {
        const j = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${lg}/scoreboard`).then((r) => r.json());
        const byId = new Map();
        for (const ev of j.events || []) {
          if (ev.groupings) for (const g of ev.groupings) for (const c of g.competitions || []) byId.set(String(c.id), { c, o: c });
          else byId.set(String(ev.id), { c: ev.competitions?.[0], o: ev });
        }
        for (const x of ss.items) {
          if (x.lg !== lg || !x.id) continue;
          const r = byId.get(x.id); if (!r || !r.c) continue;
          const t = (r.c.status || r.o.status)?.type || {}, cs = r.c.competitors || [];
          const st = t.state === "in" ? "in" : t.state === "post" ? "post" : "pre";
          let sc = x.sc;
          if (cs.length >= 2 && st !== "pre") {
            if (x.sp === "tenis") sc = cs.slice(0, 2).map((q) => (q.linescores || []).map((l) => l.value).join("-"));
            else { const h = cs.find((q) => q.homeAway === "home") || cs[0], a = cs.find((q) => q.homeAway === "away") || cs[1]; sc = [h.score, a.score]; }
          }
          const ck = st === "in" ? t.shortDetail || (r.c.status || r.o.status)?.displayClock || "" : "";
          if (st !== x.st || ck !== x.ck || JSON.stringify(sc) !== JSON.stringify(x.sc)) { x.st = st; x.ck = ck; x.sc = sc; changed = true; }
        }
      } catch {}
    }));
  } finally { spBusy = false; }
  if (changed && !$("#sheet").open) spRender();
}

async function init() {
  if (await spLoad()) { spShell(); spRender(); }
}
setInterval(() => { if (ss.data) { spRender(); spLiveRefresh(); } }, 60000);
setTimeout(() => spLiveRefresh(), 1500);
init();
