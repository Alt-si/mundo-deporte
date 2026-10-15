// Genera data/epg.json de DEMOSTRACIÓN (títulos genéricos, no es programación real).
import { readFileSync, writeFileSync } from "node:fs";
const { channels } = JSON.parse(readFileSync(new URL("../data/channels.json", import.meta.url)));
const TZ = -3 * 3600, now = Math.floor(Date.now() / 1000);
const start = Math.floor((now + TZ) / 86400) * 86400 - TZ;
const POOL = {
  news: ["Noticiero central", "Edición de la mañana", "Debate político", "Último momento", "Panorama económico", "Noche de noticias"],
  sports: ["Fútbol en vivo", "Resumen de la fecha", "Mundo deportivo", "Tenis: partido destacado", "Básquet en vivo", "Automovilismo"],
  movies: ["Película de acción", "Cine clásico", "Estreno de comedia", "Thriller de la noche", "Drama romántico", "Ciencia ficción"],
  series: ["Serie policial", "Maratón de comedia", "Drama médico", "Serie de aventuras", "Capítulo doble", "Temporada completa"],
  kids: ["Dibujos animados", "Aventuras animadas", "Cuentos y canciones", "Maratón infantil", "Clásicos animados"],
  docs: ["Misterios del planeta", "Historias de la humanidad", "Vida salvaje", "Ingeniería extrema", "Investigación criminal"],
  music: ["Hits del momento", "Videoclips", "Rock nacional", "Top 20", "Conciertos"],
  ent: ["Magazine de la tarde", "Show de talentos", "Cocina en casa", "Reality", "Humor y variedades", "Telenovela"],
};
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const programs = {};
for (const ch of channels) {
  const pool = POOL[ch.cat] || POOL.ent, list = [];
  let t = start - 3600 * Math.floor(rnd() * 3 * 1);
  const end = start + 5 * 86400;
  while (t < end) {
    const dur = (ch.cat === "movies" ? [90, 105, 120] : [30, 45, 60, 90])[Math.floor(rnd() * (ch.cat === "movies" ? 3 : 4))] * 60;
    const title = pool[Math.floor(rnd() * pool.length)];
    list.push([t, t + dur, title, "Descripción de ejemplo (datos de demostración).", ch.cat]);
    t += dur;
  }
  programs[ch.id] = list;
}
writeFileSync(new URL("../data/epg.json", import.meta.url), JSON.stringify({ meta: { generated: now, demo: true, days: 5 }, programs }));
console.log("demo ok");
