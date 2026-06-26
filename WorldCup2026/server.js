import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Configuración API-Football (api-sports.io) ----------
const AF_BASE = "https://v3.football.api-sports.io";
const afHeaders = { "x-apisports-key": process.env.APISPORTS_KEY };

// ID de la Copa del Mundo en API-Football. Pon null para NO filtrar por liga.
const WORLD_CUP_LEAGUE_ID = 1;

// ---------- Utilidades ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const formCache = new Map();

async function afFetch(endpoint, retries = 2) {
  const url = `${AF_BASE}${endpoint}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const r = await fetch(url, { headers: afHeaders });

    if (r.status === 429) {
      const wait = 6000 * (attempt + 1);
      console.warn(`429 (rate limit). Esperando ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }

    if (!r.ok) throw new Error(`API-Football respondió ${r.status} en ${endpoint}`);

    const data = await r.json();

    // API-Football mete los errores dentro del cuerpo, no en el status HTTP
    if (data.errors && Object.keys(data.errors).length > 0) {
      const msg = JSON.stringify(data.errors);
      // El límite diario suele venir aquí
      throw new Error(`API-Football error: ${msg}`);
    }

    return data.response || [];
  }
  throw new Error(`Demasiados 429 seguidos en ${endpoint}`);
}

// ---------- Forma de un equipo (últimos partidos) ----------
// ---------- Tabla de fuerza de selecciones (estilo Elo, ~2026) ----------
// Valores aproximados. Ajústalos a tu gusto. Más alto = más fuerte.
const TEAM_RATINGS = {
  "France": 2050, "Spain": 2040, "Argentina": 2035, "England": 2010,
  "Brazil": 2000, "Portugal": 1990, "Netherlands": 1980, "Belgium": 1950,
  "Italy": 1945, "Germany": 1940, "Croatia": 1910, "Uruguay": 1900,
  "Colombia": 1890, "Morocco": 1880, "USA": 1820, "Mexico": 1810,
  "Senegal": 1800, "Japan": 1790, "Switzerland": 1785, "Denmark": 1780,
  "Norway": 1770, "Australia": 1720, "South Korea": 1715, "Türkiye": 1710,
  "Turkey": 1710, "Poland": 1705, "Ecuador": 1700, "Paraguay": 1660,
  "Saudi Arabia": 1640, "Iraq": 1600, "Iran": 1690, "Nigeria": 1750,
  "Cape Verde Islands": 1560, "Cape Verde": 1560,
};

const DEFAULT_RATING = 1650; // para selecciones que no estén en la tabla

function getRating(teamName) {
  return TEAM_RATINGS[teamName] ?? DEFAULT_RATING;
}

// ---------- Predicción basada en ratings ----------
function predictMatch(homeName, awayName) {
  const homeRating = getRating(homeName) + 35; // pequeña ventaja de "local"/neutral
  const awayRating = getRating(awayName);

  // Probabilidad de victoria local con fórmula Elo
  const diff = homeRating - awayRating;
  const expHome = 1 / (1 + Math.pow(10, -diff / 400));

  // Goles esperados según la diferencia (modelo simple)
  const base = 1.3;
  const homeGoals = Math.max(0, Math.round(base + diff / 250));
  const awayGoals = Math.max(0, Math.round(base - diff / 250));

  let predictedResult, winner;
  let hg = homeGoals, ag = awayGoals;

  if (Math.abs(diff) < 60) {
    predictedResult = "DRAW";
    winner = "—";
    ag = hg; // empate coherente
  } else if (diff > 0) {
    predictedResult = "HOME_WIN";
    winner = homeName;
    if (hg <= ag) hg = ag + 1;
  } else {
    predictedResult = "AWAY_WIN";
    winner = awayName;
    if (ag <= hg) ag = hg + 1;
  }

  // Confianza = qué tan lejos de 50/50 está
  const confidence = Number((0.5 + Math.abs(expHome - 0.5)).toFixed(2));

  return {
    predictedScore: `${hg}-${ag}`,
    predictedResult,
    winner,
    confidence,
    homeWinProb: Number(expHome.toFixed(2)),
  };
}

// ---------- Ruta principal ----------
app.get("/api/predictions", async (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "Falta el parámetro 'date'." });

  try {
    // Solo lo que el free tier permite: partidos de la fecha. Filtramos Mundial en código.
    const allFixtures = await afFetch(`/fixtures?date=${date}`);
    const fixtures = allFixtures.filter((f) => f.league.id === WORLD_CUP_LEAGUE_ID);

    if (fixtures.length === 0) {
      return res.json({ date, predictions: [], message: "No hay partidos del Mundial esta fecha." });
    }

    const predictions = fixtures.map((f) => {
      const homeName = f.teams.home.name;
      const awayName = f.teams.away.name;
      const p = predictMatch(homeName, awayName);

      const reasoning =
        `Basado en rating de fuerza — ${homeName}: ${getRating(homeName)}, ` +
        `${awayName}: ${getRating(awayName)}. ` +
        `Probabilidad de victoria local: ${Math.round(p.homeWinProb * 100)}%.`;

      return {
        matchId: f.fixture.id,
        homeTeam: homeName,
        awayTeam: awayName,
        predictedScore: p.predictedScore,
        predictedResult: p.predictedResult,
        winner: p.winner,
        confidence: p.confidence,
        reasoning,
      };
    });

    res.json({ date, predictions });
  } catch (err) {
    console.error("ERROR /api/predictions:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ruta de diagnóstico: mira cuántos partidos hay y cuántas peticiones te quedan
app.get("/api/debug", async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  try {
    const r = await fetch(`${AF_BASE}/fixtures?date=${date}`, { headers: afHeaders });
    const data = await r.json();

    // Agrupamos por liga para ver IDs y nombres únicos
     const worldCup = (data.response || [])
      .filter((f) => f.league.id === 1)
      .map((f) => ({
        home: f.teams.home.name,
        away: f.teams.away.name,
        season: f.league.season,
        round: f.league.round,
      }));

    res.json({ worldCup });
  } catch (e) {
    res.json({ error: e.message });
  }
});


app.get("/api/ping", (req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`Servidor en http://localhost:${port}`));