"use strict";
// Utilidades compartidas. Argentina no usa horario de verano: UTC-3 fijo (todos los horarios se muestran en ART).
const TZ = -3 * 3600;
const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const $ = (s) => document.querySelector(s);
const nowSec = () => Math.floor(Date.now() / 1000);
const midnightOf = (sec) => Math.floor((sec + TZ) / 86400) * 86400 - TZ;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fmtTime = (sec) => {
  const d = new Date((sec + TZ) * 1000);
  return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0");
};
