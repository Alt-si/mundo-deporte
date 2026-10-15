// Genera data/channels.json. Editá esta lista para agregar/quitar canales
// o cambiar en qué proveedor está cada uno.
// id      = identificador interno (y el id XMLTV por defecto)
// alias   = otros ids con los que puede aparecer en la fuente de datos
// cat     = categoría por defecto
// providers = directv | flow | telecentro  (VERIFICAR contra cada grilla oficial)
import { writeFileSync } from "node:fs";
const ALL = ["directv", "flow", "telecentro"];
const L = [
  // [id, nombre, cat, providers?]
  ["Telefe.ar", "Telefe", "ent"], ["ElTrece.ar", "El Trece", "ent"], ["AmericaTV.ar", "América TV", "ent"],
  ["ElNueve.ar", "El Nueve", "ent"], ["TVPublica.ar", "TV Pública", "ent"], ["NetTV.ar", "Net TV", "ent"],
  ["TN.ar", "TN", "news"], ["C5N.ar", "C5N", "news"], ["A24.ar", "A24", "news"], ["LN+.ar", "LN+", "news"],
  ["Canal26.ar", "Canal 26", "news"], ["CronicaTV.ar", "Crónica TV", "news"], ["IPNoticias.ar", "IP Noticias", "news"],
  ["CNNenEspanol.us", "CNN en Español", "news"],
  ["ESPN.ar", "ESPN", "sports"], ["ESPN2.ar", "ESPN 2", "sports"], ["ESPN3.ar", "ESPN 3", "sports"],
  ["ESPNPremium.ar", "ESPN Premium", "sports"], ["FoxSports.ar", "Fox Sports", "sports"],
  ["FoxSports2.ar", "Fox Sports 2", "sports"], ["FoxSports3.ar", "Fox Sports 3", "sports"],
  ["TyCSports.ar", "TyC Sports", "sports"], ["TNTSports.ar", "TNT Sports", "sports"],
  ["DSports.ar", "DSports", "sports", ["directv"]], ["DSports2.ar", "DSports 2", "sports", ["directv"]],
  ["TNT.ar", "TNT", "movies"], ["Space.ar", "Space", "movies"], ["Warner.ar", "Warner Channel", "series"],
  ["AXN.ar", "AXN", "series"], ["StudioUniversal.ar", "Studio Universal", "movies"], ["Cinecanal.ar", "Cinecanal", "movies"],
  ["Cinemax.ar", "Cinemax", "movies"], ["FX.ar", "FX", "series"], ["StarChannel.ar", "Star Channel", "series"],
  ["TCM.ar", "TCM", "movies"], ["ParamountChannel.ar", "Paramount Channel", "movies"], ["FilmArts.ar", "Film&Arts", "movies"],
  ["ComedyCentral.ar", "Comedy Central", "series"], ["TNTSeries.ar", "TNT Series", "series"], ["Sony.ar", "Sony Channel", "series"],
  ["UniversalTV.ar", "Universal TV", "series"], ["AE.ar", "A&E", "docs"], ["Lifetime.ar", "Lifetime", "series"],
  ["TLC.ar", "TLC", "ent"], ["FoodNetwork.ar", "Food Network", "ent"],
  ["Discovery.ar", "Discovery Channel", "docs"], ["NatGeo.ar", "National Geographic", "docs"], ["History.ar", "History", "docs"],
  ["AnimalPlanet.ar", "Animal Planet", "docs"], ["InvestigationDiscovery.ar", "Investigation Discovery", "docs"],
  ["CartoonNetwork.ar", "Cartoon Network", "kids"], ["DisneyChannel.ar", "Disney Channel", "kids"], ["Nickelodeon.ar", "Nickelodeon", "kids"],
  ["DiscoveryKids.ar", "Discovery Kids", "kids"], ["DisneyJunior.ar", "Disney Junior", "kids"], ["PakaPaka.ar", "Paka Paka", "kids"],
  ["Tooncast.ar", "Tooncast", "kids"], ["Cartoonito.ar", "Cartoonito", "kids"],
  ["MTV.ar", "MTV", "music"], ["QuieroMusica.ar", "Quiero Música", "music"],
];
// Canales extra (id, nombre, cat, providers, nombres alternativos en las fuentes)
const X = [
  ["DeporTV.ar", "DeporTV", "sports"], ["Encuentro.ar", "Encuentro", "docs"], ["ElGourmet.ar", "El Gourmet", "ent"],
  ["CanalCiudad.ar", "Canal de la Ciudad", "ent", ALL, ["TV Ciudad"]], ["CineAr.ar", "Cine.Ar", "movies", ALL, ["CineAr", "CINE.AR (ARG)"]],
  ["HBO.us", "HBO", "movies"], ["HBO2.us", "HBO 2", "movies", ALL, ["HBO2"]], ["HBOFamily.us", "HBO Family", "movies"],
  ["HBOPlus.us", "HBO Plus", "movies", ALL, ["HBO Plus Este", "HBO Plus Panregional"]], ["HBOSignature.us", "HBO Signature", "movies"],
  ["HBOXtreme.us", "HBO Xtreme", "movies"], ["HBOMundi.us", "HBO Mundi", "movies"], ["HBOPop.us", "HBO Pop", "movies"],
  ["StarSeries.ar", "Star Series", "series"], ["StarAction.ar", "Star Action", "movies"], ["StarCinema.ar", "Star Cinema", "movies"],
  ["StarComedy.ar", "Star Comedy", "series"], ["StarLife.ar", "Star Life", "series"], ["StarHits.ar", "Star Hits", "series"],
  ["StarFun.ar", "Star Fun", "series"], ["StarClassics.ar", "Star Classics", "movies"],
  ["DiscoveryHH.ar", "Discovery Home & Health", "docs"], ["DiscoveryTheater.ar", "Discovery Theater", "docs"],
  ["DiscoveryWorld.ar", "Discovery World", "docs"], ["DiscoveryScience.ar", "Discovery Science", "docs"],
  ["DiscoveryTurbo.ar", "Discovery Turbo", "docs"], ["History2.ar", "History 2", "docs", ALL, ["H2"]],
  ["GolfChannel.ar", "Golf Channel", "sports"], ["NBATV.ar", "NBA TV", "sports"], ["ESPNExtra.ar", "ESPN Extra", "sports"],
  ["NatGeoWild.ar", "National Geographic Wild", "docs", ALL, ["Nat Geo Wild"]], ["NatGeoKids.ar", "Nat Geo Kids", "kids"],
  ["Syfy.ar", "Syfy", "series"], ["AMC.ar", "AMC", "series"], ["ENTV.ar", "E! Entertainment", "ent", ALL, ["E!"]],
  ["HGTV.ar", "HGTV", "ent", ALL, ["Home & Garden TV"]], ["Pasiones.ar", "Pasiones", "series"], ["TLNovelas.ar", "TLNovelas", "series"],
  ["Volver.ar", "Volver", "ent"], ["HolaTV.ar", "Hola TV", "ent"], ["CanalRural.ar", "Canal Rural", "docs"],
  ["Bloomberg.ar", "Bloomberg", "news"], ["CNNInternational.ar", "CNN International", "news"], ["DWEspanol.ar", "Deutsche Welle", "news"],
  ["France24.ar", "France 24 en Español", "news"], ["TyCSports2.ar", "TyC Sports 2", "sports", ALL, ["TyC Sports2"]],
  ["FoxSportsPremium.ar", "Fox Sports Premium", "sports"], ["DisneyXD.ar", "Disney XD", "kids"], ["BabyTV.ar", "Baby TV", "kids"],
  ["Nick2.ar", "Nick 2", "kids"], ["NickToons.ar", "NickToons", "kids"], ["TruTV.ar", "TruTV", "ent"], ["TBS.ar", "TBS", "series"],
  ["MuchMusic.ar", "MuchMusic", "music"], ["MTVHits.ar", "MTV Hits", "music"], ["Telehit.ar", "Telehit", "music"],
  ["TNTNovelas.ar", "TNT Novelas", "series"], ["AdultSwim.ar", "Adult Swim", "series"], ["Cinelatino.ar", "Cinelatino", "movies"],
  ["DePelicula.ar", "De Película", "movies"], ["Glitz.ar", "Glitz", "ent"], ["Metro.ar", "Metro", "music"],
];
const NAMES = { // nombres alternativos para canales de la lista principal
  "TVPublica.ar": ["Televisión Pública", "La TV Pública (ARG)"], "Nickelodeon.ar": ["Nick"],
  "QuieroMusica.ar": ["Quiero", "Quiero Música en mi Idioma"], "DSports.ar": ["DSPORTS (ARG)", "DIRECTV Sports", "Directv Sports"],
  "DSports2.ar": ["DSPORTS +", "DSPORTS Fight"], "ParamountChannel.ar": ["Paramount Network"],
  "Lifetime.ar": ["Lifetime Latin America"], "Cartoonito.ar": ["Cartoonito Latin America"],
  "IPNoticias.ar": ["IP", "IP Noticias Argentina"], "Telefe.ar": ["Telefe (ARG)"], "ElTrece.ar": ["El Trece (ARG)", "Canal 13 (Satelital)"],
  "AmericaTV.ar": ["América TV (ARG)"], "ElNueve.ar": ["Canal 9 (ARG)", "CANAL 9"], "TN.ar": ["TN Todo Noticias", "TN Noticias"],
  "C5N.ar": ["C5N Canal 5 Noticias (ARG)"], "CronicaTV.ar": ["Crónica TV (ARG)"], "Canal26.ar": ["Canal 26 (ARG)."],
  "NetTV.ar": ["NET TV (ARG)"], "FoxSports.ar": ["FOX Sports (ARG)", "FOX Sports Cono Sur"], "ESPN2.ar": ["ESPN 2 Latin Sur"],
  "ESPN3.ar": ["ESPN 3 Sur"], "ESPNPremium.ar": ["ESPN Premium Arg (SD)"], "PakaPaka.ar": ["PAKA PAKA (ARG)"],
};
const channels = [...L, ...X].map(([id, name, cat, providers, names]) => ({
  id, name, cat, providers: providers || ALL, ...((names || NAMES[id]) ? { names: names || NAMES[id] } : {})
}));
writeFileSync(new URL("../data/channels.json", import.meta.url), JSON.stringify({ channels }, null, 1));
console.log(channels.length, "canales");
