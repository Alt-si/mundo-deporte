"use strict";
// Argentina no usa horario de verano: UTC-3 fijo.
const TZ = -3 * 3600;
const DAYS = 5;
const CATS = {
  all: "Todas las categorías", news: "Noticias", sports: "Deportes", movies: "Películas",
  series: "Series", kids: "Infantil", docs: "Documentales", music: "Música", ent: "Entretenimiento"
};
const PROVIDERS = { all: "Todos", directv: "DIRECTV", flow: "Flow", telecentro: "Telecentro" };
const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

const state = {
  channels: [], epg: null, day: 0, provider: store.get("provider", "all"),
  cat: "all", q: "", favOnly: false, favs: new Set(store.get("favs", [])),
  ppm: store.get("ppm", 4.2), loadedAt: 0
};

const nowSec = () => Math.floor(Date.now() / 1000);
const midnightOf = (sec) => Math.floor((sec + TZ) / 86400) * 86400 - TZ;
const fmtTime = (sec) => {
  const d = new Date((sec + TZ) * 1000);
  return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0");
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

let today0 = midnightOf(nowSec());

async function load() {
  const bust = "?t=" + Math.floor(Date.now() / 600000);
  try {
    const [ch, epg] = await Promise.all([
      fetch("data/channels.json" + bust).then((r) => r.json()),
      fetch("data/epg.json" + bust).then((r) => r.json())
    ]);
    state.channels = ch.channels;
    state.epg = epg;
    state.loadedAt = Date.now();
  } catch (e) {
    $("#grid").innerHTML = '<div class="empty">No se pudo cargar la programación. Revisá tu conexión.</div>';
    return false;
  }
  return true;
}

function buildControls() {
  const days = $("#days");
  days.innerHTML = "";
  for (let i = 0; i < DAYS; i++) {
    const d = new Date((today0 + i * 86400 + TZ) * 1000);
    const b = document.createElement("button");
    b.className = "day";
    b.setAttribute("aria-pressed", i === state.day);
    b.innerHTML = `<b>${i === 0 ? "Hoy" : i === 1 ? "Mañana" : DOW[d.getUTCDay()]}</b><small>${d.getUTCDate()} ${MON[d.getUTCMonth()]}</small>`;
    b.onclick = () => { state.day = i; buildControls(); render(true); };
    days.appendChild(b);
  }
  const prov = $("#providers");
  prov.innerHTML = "";
  for (const [k, label] of Object.entries(PROVIDERS)) {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = label;
    b.setAttribute("aria-pressed", state.provider === k && !state.favOnly);
    b.onclick = () => { state.provider = k; state.favOnly = false; store.set("provider", k); buildControls(); render(); };
    prov.appendChild(b);
  }
  const f = document.createElement("button");
  f.className = "chip";
  f.textContent = "★ Favoritos";
  f.setAttribute("aria-pressed", state.favOnly);
  f.onclick = () => { state.favOnly = !state.favOnly; buildControls(); render(); };
  prov.appendChild(f);
}

function categoryOf(ch, p) {
  const c = p[4];
  return CATS[c] && c !== "all" ? c : ch.cat || "ent";
}

function visibleChannels() {
  const q = norm(state.q.trim());
  const d0 = today0 + state.day * 86400, d1 = d0 + 86400;
  return state.channels.filter((ch) => {
    if (!(state.epg.programs[ch.id] || []).length) return false; // sin datos en toda la ventana: se oculta
    if (state.favOnly && !state.favs.has(ch.id)) return false;
    if (state.provider !== "all" && !(ch.providers || []).includes(state.provider)) return false;
    const progs = (state.epg.programs[ch.id] || []).filter((p) => p[1] > d0 && p[0] < d1);
    if (state.cat !== "all" && !progs.some((p) => categoryOf(ch, p) === state.cat) && ch.cat !== state.cat) return false;
    if (q && !norm(ch.name).includes(q) && !progs.some((p) => norm(p[2]).includes(q))) return false;
    return true;
  });
}

function render(scrollToNow) {
  if (!state.epg) return;
  const grid = $("#grid");
  const keepLeft = grid.scrollLeft, keepTop = grid.scrollTop;
  document.documentElement.style.setProperty("--ppm", state.ppm + "px");
  const d0 = today0 + state.day * 86400, d1 = d0 + 86400, now = nowSec();
  const q = norm(state.q.trim());
  const chans = visibleChannels();

  let html = '<div class="inner"><div class="ruler"><div class="corner"></div><div class="hours">';
  for (let h = 0; h < 24; h++) html += `<div class="hour" style="--m:${h * 60}">${String(h).padStart(2, "0")}:00</div>`;
  html += "</div></div>";

  for (const ch of chans) {
    const progs = (state.epg.programs[ch.id] || []).filter((p) => p[1] > d0 && p[0] < d1);
    html += `<div class="row"><div class="chan"><button class="star" data-ch="${esc(ch.id)}" aria-pressed="${state.favs.has(ch.id)}" aria-label="Favorito">★</button><span class="name">${esc(ch.name)}</span></div><div class="track">`;
    if (!progs.length) html += `<div class="empty" style="padding:16px;text-align:left">Sin datos de programación</div>`;
    for (const p of progs) {
      const s = Math.max(p[0], d0), e = Math.min(p[1], d1);
      const sm = (s - d0) / 60, dm = (e - s) / 60;
      const cls = ["prog", "t-" + categoryOf(ch, p)];
      if (p[1] <= now) cls.push("past");
      if (p[0] <= now && now < p[1]) cls.push("live");
      if (q && norm(p[2]).includes(q)) cls.push("hit");
      html += `<button class="${cls.join(" ")}" style="--s:${sm.toFixed(2)};--d:${dm.toFixed(2)}" data-ch="${esc(ch.id)}" data-s="${p[0]}">` +
        `<span class="in"><b>${esc(p[2])}</b><small>${fmtTime(p[0])} – ${fmtTime(p[1])}</small></span></button>`;
    }
    html += "</div></div>";
  }
  if (!chans.length) html += '<div class="empty">No hay canales que coincidan con los filtros.</div>';
  html += '<div id="nowline" class="nowline" hidden></div></div>';
  grid.innerHTML = html;

  updateNowLine();
  if (scrollToNow) scrollToNowPos();
  else { grid.scrollLeft = keepLeft; grid.scrollTop = keepTop; }

  const demo = state.epg.meta && state.epg.meta.demo;
  const b = $("#banner");
  b.hidden = !demo && !isStale();
  if (demo) b.textContent = "Datos de demostración: la programación real aparece cuando corre el actualizador (ver README).";
  else if (isStale()) b.textContent = "La programación no se actualiza hace más de 24 h. Puede estar desactualizada.";
}

function isStale() {
  const g = state.epg && state.epg.meta && state.epg.meta.generated;
  return g ? nowSec() - g > 24 * 3600 : false;
}

function updateNowLine() {
  const el = $("#nowline");
  if (!el) return;
  const m = (nowSec() - (today0 + state.day * 86400)) / 60;
  el.hidden = !(state.day === 0 && m >= 0 && m < 1440);
  el.style.setProperty("--m", m.toFixed(2));
}

function scrollToNowPos() {
  const grid = $("#grid");
  if (state.day === 0) {
    const m = (nowSec() - today0) / 60;
    grid.scrollLeft = Math.max(0, (m - 30) * state.ppm);
  } else grid.scrollLeft = 7 * 60 * state.ppm; // 07:00
}

function openSheet(chId, start) {
  const ch = state.channels.find((c) => c.id === chId);
  const p = (state.epg.programs[chId] || []).find((x) => x[0] === +start);
  if (!ch || !p) return;
  const cat = categoryOf(ch, p), now = nowSec();
  const status = p[1] <= now ? "Ya terminó" : p[0] <= now ? "En emisión ahora" : "Más tarde";
  const mins = Math.round((p[1] - p[0]) / 60);
  const provs = (ch.providers || []).map((k) => PROVIDERS[k]).join(" · ");
  const dd = new Date((p[0] + TZ) * 1000);
  $("#sheetBody").innerHTML =
    `<div class="t-${cat}"><span class="tag">${esc(CATS[cat])}</span></div>` +
    `<h2>${esc(p[2])}</h2>` +
    `<div class="meta">${esc(ch.name)} · ${DOW[dd.getUTCDay()]} ${dd.getUTCDate()} ${MON[dd.getUTCMonth()]}, ${fmtTime(p[0])} – ${fmtTime(p[1])} (${mins} min) · ${status}</div>` +
    (p[3] ? `<p>${esc(p[3])}</p>` : `<p class="meta">Sin descripción disponible.</p>`) +
    `<div class="meta">Disponible en: ${esc(provs || "—")}</div>`;
  $("#sheet").showModal();
}

function init() {
  const sel = $("#category");
  for (const [k, v] of Object.entries(CATS)) sel.add(new Option(v, k));
  sel.onchange = () => { state.cat = sel.value; render(); };
  let t;
  $("#search").oninput = (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; render(); }, 150); };
  $("#nowBtn").onclick = () => { state.day = 0; buildControls(); render(true); };
  const zoom = (f) => { state.ppm = Math.min(9, Math.max(2.2, state.ppm * f)); store.set("ppm", state.ppm); render(); };
  $("#zoomIn").onclick = () => zoom(1.25);
  $("#zoomOut").onclick = () => zoom(0.8);
  $("#grid").addEventListener("click", (e) => {
    const star = e.target.closest(".star");
    if (star) {
      const id = star.dataset.ch;
      state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id);
      store.set("favs", [...state.favs]);
      star.setAttribute("aria-pressed", state.favs.has(id));
      if (state.favOnly) render();
      return;
    }
    const p = e.target.closest(".prog");
    if (p) openSheet(p.dataset.ch, p.dataset.s);
  });
  $("#sheet").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  setInterval(() => {
    const m = midnightOf(nowSec());
    if (m !== today0) { today0 = m; buildControls(); render(); } else { updateNowLine(); }
  }, 30000);
  setInterval(() => { if (state.epg) render(); }, 5 * 60000); // refresca estados "en vivo"/"pasado"
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && Date.now() - state.loadedAt > 30 * 60000) {
      today0 = midnightOf(nowSec());
      if (await load()) { buildControls(); render(); }
    }
  });
}

(async () => {
  init();
  buildControls();
  if (await load()) { render(true); }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
