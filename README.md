# Mundo Deporte · Fútbol argentino

App web (PWA) con los partidos del día del fútbol argentino: horarios de Argentina, escudos, resultados en vivo con el tiempo de juego y resultado final. Agrupados por torneo, con tablas de posiciones.

- `tools/fetch-espn.mjs`: baja de ESPN (API pública, sin clave) los partidos de ayer a +5 días y las tablas de todas las ligas argentinas que encuentra (`arg.*`) y de las copas internacionales (solo partidos con equipos argentinos). Escribe `data/fixtures.json` y deja un registro por liga en `meta.diag`.
- `.github/workflows/update.yml`: lo corre cada 3 horas (o a mano con "Run workflow").
- `app.js`: además consulta ESPN desde el navegador cada minuto para los partidos en juego (resultado parcial y reloj).
- Para sumar torneos: agregar su identificador de ESPN en `KNOWN` dentro de `tools/fetch-espn.mjs`.
