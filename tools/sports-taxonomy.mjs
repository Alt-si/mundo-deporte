// Taxonomía de deportes y torneos (es / en / pt). Editá libremente para sumar palabras.
export const norm = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&amp;/g, "&").replace(/[^a-z0-9]+/g, " ").trim();

// [id, nombre, emoji, palabras clave]  — el orden importa: lo más específico primero.
export const SPORTS = [
  ["tenis_mesa", "Tenis de mesa", "🏓", ["tenis de mesa", "ping pong", "table tennis"]],
  ["padel", "Pádel", "🥎", ["padel", "premier padel", "world padel tour", "wpt"]],
  ["tenis", "Tenis", "🎾", ["tenis", "tennis", "atp", "wta", "itf"]],
  ["futsal", "Futsal", "⚽", ["futsal", "futbol sala", "futebol de salao"]],
  ["futbol", "Fútbol", "⚽", ["futbol", "soccer", "football", "futebol", "calcio", "fussball", "goles", "gol"]],
  ["voley", "Vóley", "🏐", ["voley", "volley", "volleyball", "volei", "voleibol", "vnl"]],
  ["basquet", "Básquet", "🏀", ["basquet", "basquetbol", "basket", "basketball", "baloncesto", "nba", "wnba", "euroliga", "fiba"]],
  ["automovilismo", "Automovilismo y motos", "🏎️", ["formula 1", "f1", "formula 2", "formula 3", "formula e", "motogp", "moto2", "moto3", "wrc", "rally", "rallye", "turismo carretera", "tc2000", "super tc2000", "nascar", "indycar", "dakar", "automovilismo", "motociclismo", "superbike", "wsbk", "imsa", "le mans", "stock car", "karting", "top race", "formula renault", "gran premio de"]],
  ["rugby", "Rugby", "🏉", ["rugby", "pumas", "urba"]],
  ["hockey", "Hockey", "🏑", ["hockey", "nhl", "leonas"]],
  ["golf", "Golf", "⛳", ["golf", "pga", "ryder cup", "presidents cup"]],
  ["lucha", "Lucha libre (WWE/AEW)", "🤼", ["wwe", "aew", "lucha libre", "wrestling"]],
  ["combate", "Boxeo y MMA", "🥊", ["boxeo", "boxing", "boxe", "ufc", "mma", "kickboxing", "muay thai", "bellator", "pelea", "combate"]],
  ["ciclismo", "Ciclismo", "🚴", ["ciclismo", "cycling", "ciclismo de ruta", "vuelta a", "giro d italia", "tour de france"]],
  ["nfl", "Fútbol americano", "🏈", ["nfl", "super bowl", "futbol americano", "american football", "ncaa football", "cfl"]],
  ["beisbol", "Béisbol", "⚾", ["beisbol", "baseball", "mlb", "grandes ligas", "beisbol"]],
  ["handball", "Handball", "🤾", ["handball", "balonmano", "andebol"]],
  ["atletismo", "Atletismo", "🏃", ["atletismo", "athletics", "diamond league", "maraton", "marathon", "atletica"]],
  ["natacion", "Natación", "🏊", ["natacion", "swimming", "natacao", "clavados", "waterpolo"]],
  ["esqui", "Deportes de invierno", "⛷️", ["esqui", "ski", "snowboard", "biathlon", "biatlon"]],
  ["surf", "Surf y skate", "🏄", ["surf", "wsl", "skate", "skateboarding"]],
  ["polo", "Polo", "🐎", ["polo", "abierto argentino de polo", "triple corona"]],
  ["cricket", "Cricket", "🏏", ["cricket", "ipl"]],
  ["esports", "eSports", "🎮", ["esports", "e sports", "league of legends", "counter strike", "valorant", "dota"]],
  ["olimpico", "Juegos y multideporte", "🥇", ["juegos olimpicos", "olympics", "olympic", "jjoo", "juegos panamericanos", "panamericanos", "juegos paralimpicos", "juegos suramericanos", "odesur"]],
  ["otros", "Otros deportes", "🏆", []],
];

// [nombre, deporte, palabras, {needs, not}] — se evalúa primero por palabra más larga.
export const TOURNAMENTS = [
  ["Champions League", "futbol", ["champions league", "liga de campeones", "uefa champions"]],
  ["Europa League", "futbol", ["europa league", "liga europa", "uefa europa"]],
  ["Conference League", "futbol", ["conference league", "liga conferencia"]],
  ["Copa Libertadores", "futbol", ["copa libertadores", "libertadores"]],
  ["Copa Sudamericana", "futbol", ["copa sudamericana", "sudamericana"]],
  ["Recopa Sudamericana", "futbol", ["recopa"]],
  ["Liga Profesional", "futbol", ["liga profesional", "lpf", "torneo apertura", "torneo clausura", "superliga argentina"]],
  ["Copa Argentina", "futbol", ["copa argentina"]],
  ["Copa de la Liga", "futbol", ["copa de la liga"]],
  ["Primera Nacional", "futbol", ["primera nacional", "primera b nacional"]],
  ["Premier League", "futbol", ["premier league", "liga premier"]],
  ["LaLiga", "futbol", ["laliga", "la liga", "liga espanola", "primera division de espana"], { not: ["justicia", "liga de la"] }],
  ["Copa del Rey", "futbol", ["copa del rey"], { not: ["baloncesto", "basquet"] }],
  ["Serie A (Italia)", "futbol", ["serie a tim", "calcio serie a", "serie a de italia", "serie a"], { needs: ["futbol", "calcio", "goles", "fecha", "juventus", "milan", "inter", "napoli", "roma", "lazio", "partido", "vs"] }],
  ["Bundesliga", "futbol", ["bundesliga"]],
  ["Ligue 1", "futbol", ["ligue 1"]],
  ["Eredivisie", "futbol", ["eredivisie"]],
  ["Liga Portugal", "futbol", ["liga portugal", "primeira liga"]],
  ["Brasileirão", "futbol", ["brasileirao", "campeonato brasileiro", "serie a brasil", "copa do brasil"]],
  ["Liga MX", "futbol", ["liga mx"]],
  ["MLS", "futbol", ["mls", "major league soccer"]],
  ["Eliminatorias", "futbol", ["eliminatorias", "clasificatorias"]],
  ["Copa del Mundo (fútbol)", "futbol", ["copa del mundo", "world cup", "mundial 2026", "mundial de futbol", "mundial sub"], { not: ["rugby", "hockey", "voley", "basquet", "handball"] }],
  ["Copa América", "futbol", ["copa america"]],
  ["Eurocopa", "futbol", ["eurocopa", "uefa euro"]],
  ["Mundial de Clubes", "futbol", ["mundial de clubes", "club world cup"]],
  ["Amistosos", "futbol", ["amistoso", "amistosos", "friendly", "fecha fifa"]],
  ["FA Cup", "futbol", ["fa cup"]],
  ["Roland Garros", "tenis", ["roland garros", "french open"]],
  ["Wimbledon", "tenis", ["wimbledon"]],
  ["US Open (golf)", "golf", ["us open"], { needs: ["golf", "pga"] }],
  ["US Open (tenis)", "tenis", ["us open"], { not: ["golf", "pga"] }],
  ["Australian Open", "tenis", ["australian open", "abierto de australia"]],
  ["ATP Masters 1000", "tenis", ["masters 1000", "atp masters", "rolex shanghai", "rolex paris", "madrid open", "miami open", "indian wells", "monte carlo masters", "internazionali", "cincinnati"]],
  ["ATP Finals", "tenis", ["atp finals", "nitto atp"]],
  ["ATP 500 / 250", "tenis", ["atp 500", "atp 250", "argentina open", "rio open", "abierto de buenos aires"]],
  ["ATP Challenger", "tenis", ["challenger"]],
  ["Copa Davis", "tenis", ["copa davis", "davis cup"]],
  ["Billie Jean King Cup", "tenis", ["billie jean king", "fed cup"]],
  ["WTA", "tenis", ["wta"]],
  ["Laver Cup", "tenis", ["laver cup"]],
  ["Premier Padel", "padel", ["premier padel"]],
  ["World Padel Tour", "padel", ["world padel tour", "wpt"]],
  ["NBA", "basquet", ["nba"], { not: ["wnba"] }],
  ["WNBA", "basquet", ["wnba"]],
  ["Euroliga", "basquet", ["euroliga", "euroleague"]],
  ["Liga Nacional de Básquet", "basquet", ["liga nacional de basquet", "liga nacional"], { needs: ["basquet", "basket", "baloncesto"] }],
  ["Basketball Champions League Americas", "basquet", ["bcl americas", "liga de las americas"]],
  ["Mundial de Básquet (FIBA)", "basquet", ["fiba", "mundial de basquet"]],
  ["NCAA Basketball", "basquet", ["march madness", "ncaa basketball"]],
  ["Liga de Naciones de Vóley (VNL)", "voley", ["vnl", "volleyball nations league", "liga de naciones de voley"]],
  ["Liga Argentina de Vóley", "voley", ["liga argentina de voley", "superliga voley", "lav"]],
  ["Mundial de Vóley", "voley", ["mundial de voley", "volleyball world championship"]],
  ["Fórmula 1", "automovilismo", ["formula 1", "f1", "gran premio de formula"]],
  ["Fórmula 2 / 3", "automovilismo", ["formula 2", "formula 3"]],
  ["Fórmula E", "automovilismo", ["formula e"]],
  ["MotoGP", "automovilismo", ["motogp", "moto2", "moto3"]],
  ["WRC (Rally)", "automovilismo", ["wrc", "rally mundial"]],
  ["Turismo Carretera", "automovilismo", ["turismo carretera"]],
  ["TC2000 / Súper TC2000", "automovilismo", ["tc2000", "super tc2000"]],
  ["NASCAR", "automovilismo", ["nascar"]],
  ["IndyCar", "automovilismo", ["indycar", "indy 500"]],
  ["Dakar", "automovilismo", ["dakar"]],
  ["Superbike (WSBK)", "automovilismo", ["wsbk", "superbike"]],
  ["Top Race", "automovilismo", ["top race"]],
  ["Super Rugby", "rugby", ["super rugby"]],
  ["The Rugby Championship", "rugby", ["rugby championship"]],
  ["Seis Naciones", "rugby", ["seis naciones", "six nations"]],
  ["Mundial de Rugby", "rugby", ["mundial de rugby", "rugby world cup"]],
  ["URBA / Top 12", "rugby", ["urba", "top 12"]],
  ["Top 14", "rugby", ["top 14"]],
  ["NHL", "hockey", ["nhl"]],
  ["PGA Tour", "golf", ["pga tour"]],
  ["LIV Golf", "golf", ["liv golf"]],
  ["DP World Tour", "golf", ["dp world tour"]],
  ["Masters de Augusta", "golf", ["masters de augusta", "augusta"]],
  ["Ryder Cup", "golf", ["ryder cup"]],
  ["UFC", "combate", ["ufc"]],
  ["Bellator", "combate", ["bellator"]],
  ["WWE", "lucha", ["wwe"]],
  ["Tour de Francia", "ciclismo", ["tour de france", "tour de francia"]],
  ["Giro de Italia", "ciclismo", ["giro d italia", "giro de italia"]],
  ["Vuelta a España", "ciclismo", ["vuelta a espana"]],
  ["NFL", "nfl", ["nfl", "super bowl"]],
  ["MLB", "beisbol", ["mlb", "grandes ligas", "world series"]],
  ["Juegos Olímpicos", "olimpico", ["juegos olimpicos", "olympics", "jjoo"]],
  ["Juegos Panamericanos", "olimpico", ["panamericanos"]],
  ["Abierto Argentino de Polo", "polo", ["abierto argentino de polo", "triple corona", "abierto de palermo"]],
];

const pad = (s) => " " + s + " ";
const has = (hay, w) => hay.includes(pad(norm(w)));
const longest = [...TOURNAMENTS].sort((a, b) =>
  Math.max(...b[2].map((w) => w.length)) - Math.max(...a[2].map((w) => w.length)));

function tournamentIn(hay) {
  for (const [name, sport, words, o] of longest) {
    if (!words.some((w) => has(hay, w))) continue;
    if (o?.needs && !o.needs.some((w) => has(hay, w))) continue;
    if (o?.not && o.not.some((w) => has(hay, w))) continue;
    return { sport, tournament: name };
  }
  return null;
}
function sportIn(hay) {
  for (const [id, , , words] of SPORTS) if (words.some((w) => has(hay, w))) return id;
  return null;
}

// strong = el canal es deportivo: se mira también la descripción y no se descarta nada.
export function classify(title, desc, strong) {
  const t = pad(norm(title)), d = pad(norm(String(desc || "").slice(0, 320)));
  let r = tournamentIn(t);
  if (!r && strong) r = tournamentIn(d);
  const sport = r?.sport || sportIn(t) || (strong ? sportIn(d) : null);
  if (r) return r;
  if (sport) return { sport, tournament: "" };
  return strong ? { sport: "otros", tournament: "" } : null;
}

// Equipos / jugadores a partir de títulos tipo "Boca vs. River", "Alcaraz - Sinner".
export function participants(title) {
  let t = String(title || "").replace(/\(.*?\)|\[.*?\]/g, " ").replace(/\b(en vivo|en directo|ao vivo|live)\b/gi, " ");
  if (/:/.test(t)) t = t.slice(t.lastIndexOf(":") + 1);
  const parts = t.split(/\s+(?:vs\.?|v\.?|x|contra|-|–|—)\s+/i).map((s) => s.replace(/\s+/g, " ").trim());
  if (parts.length !== 2 || /,/.test(t)) return [];
  return parts.filter((p) => p.length >= 3 && p.length <= 40 && p.split(" ").length <= 5 && /^\p{L}/u.test(p) && !/\d{3,}/.test(p));
}

// Fase / ronda a partir de título + descripción (es/en/pt).
const ROUNDS = [
  [/\bdieciseisavos de final\b|\bround of 32\b/, "Dieciseisavos de final"],
  [/\boctavos de final\b|\bround of 16\b|\boitavas de final\b/, "Octavos de final"],
  [/\bcuartos de final\b|\bquarter ?finals?\b|\bquartas de final\b/, "Cuartos de final"],
  [/\bsemifinal(?:es)?\b|\bsemi ?finals?\b/, "Semifinal"],
  [/\btercer (?:puesto|lugar)\b|\bthird place\b/, "Tercer puesto"],
  [/\bfase de (?:liga|grupos)\b|\bleague phase\b|\bgroup stage\b|\bfase de grupos\b/, "Fase de liga / grupos"],
  [/\b(?:primera|1ra|1st) ronda\b|\bfirst round\b/, "Primera ronda"],
  [/\b(?:segunda|2da|2nd) ronda\b|\bsecond round\b/, "Segunda ronda"],
  [/\b(?:tercera|3ra|3rd) ronda\b|\bthird round\b/, "Tercera ronda"],
  [/\bplay ?offs?\b|\brepechaje\b/, "Playoffs"],
  [/\bfinal\b/, "Final"],
];
export function roundOf(text) {
  const t = norm(text);
  for (const [re, label] of ROUNDS) if (re.test(t)) return label;
  let m = /\bjornada (\d{1,2})\b/.exec(t); if (m) return "Jornada " + m[1];
  m = /\bfecha (\d{1,2})\b/.exec(t); if (m) return "Fecha " + m[1];
  m = /\b(?:ronda|round) (\d{1,2})\b/.exec(t); if (m) return "Ronda " + m[1];
  return "";
}
export const ROUND_RANK = ["Fase de liga / grupos", "Primera ronda", "Segunda ronda", "Tercera ronda", "Dieciseisavos de final", "Octavos de final", "Cuartos de final", "Semifinal", "Tercer puesto", "Final"];

// ¿Es el mismo equipo/jugador? (comparte una palabra de 4+ letras, ignorando palabras genéricas)
const GENERIC = new Set(["club", "city", "united", "real", "deportivo", "sporting", "athletic", "futbol", "football", "team", "juniors", "jrs", "club"]);
const toks = (s) => norm(s).split(" ").filter((w) => w.length >= 4 && !GENERIC.has(w));
export function sameName(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const tb = new Set(toks(b));
  return toks(a).some((w) => tb.has(w));
}
