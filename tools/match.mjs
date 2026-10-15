// Utilidades compartidas para emparejar canales de la fuente con channels.json
import { readFileSync } from "node:fs";
export const loadChannels = () =>
  JSON.parse(readFileSync(new URL("../data/channels.json", import.meta.url))).channels;
export const normName = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&amp;/g, "&").replace(/\b(hd|sd|argentina|ar|canal|channel|tv)\b/g, " ")
    .replace(/[^a-z0-9+]/g, "");
export const idKey = (s) => String(s || "").replace(/@.*$/, "").toLowerCase();
export function buildMaps(channels) {
  const byId = new Map(), byName = new Map();
  for (const ch of channels) {
    byId.set(idKey(ch.id), ch.id);
    for (const a of ch.alias || []) byId.set(idKey(a), ch.id);
    for (const n of [ch.name, ...(ch.names || [])]) byName.set(normName(n), ch.id);
  }
  return { byId, byName };
}
export const resolve = (maps, xmltvId, displayName) =>
  maps.byId.get(idKey(xmltvId)) || maps.byName.get(normName(displayName)) || null;
