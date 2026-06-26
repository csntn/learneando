const dateInput = document.getElementById("dateInput");
const loadBtn = document.getElementById("loadBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

// Fecha por defecto: hoy
dateInput.value = new Date().toISOString().split("T")[0];

loadBtn.addEventListener("click", loadPredictions);
window.addEventListener("DOMContentLoaded", loadPredictions);

async function loadPredictions() {
  const date = dateInput.value;
  if (!date) return;

  loadBtn.disabled = true;
  resultsEl.innerHTML = '<div class="spinner"></div>';
  statusEl.textContent = "Calculando predicciones...";

  try {
    const res = await fetch(`/api/predictions?date=${date}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Error desconocido");

    resultsEl.innerHTML = "";

    if (!data.predictions || data.predictions.length === 0) {
      statusEl.textContent = "";
      resultsEl.innerHTML = `<div class="empty">🗓️ ${
        data.message || "No hay partidos del Mundial esta fecha."
      }</div>`;
      return;
    }

    statusEl.textContent = `${data.predictions.length} partido(s) — ${formatDate(date)}`;
    renderPredictions(data.predictions);
  } catch (err) {
    statusEl.textContent = "";
    resultsEl.innerHTML = `<div class="empty">⚠️ Error: ${err.message}</div>`;
  } finally {
    loadBtn.disabled = false;
  }
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// Extrae el rating del texto reasoning (ej. "Equipo: 1660")
function extractRatings(reasoning) {
  const matches = [...reasoning.matchAll(/:\s*(\d{4})/g)];
  return matches.map((m) => m[1]);
}

// Extrae la probabilidad local del reasoning (ej. "local: 46%")
function extractHomeProb(reasoning) {
  const m = reasoning.match(/(\d+)%/);
  return m ? parseInt(m[1], 10) : 50;
}

function renderPredictions(predictions) {
  resultsEl.innerHTML = predictions
    .map((p) => {
      const ratings = extractRatings(p.reasoning);
      const homeRating = ratings[0] || "—";
      const awayRating = ratings[1] || "—";
      const homeProbRaw = extractHomeProb(p.reasoning);
      const conf = p.confidence;

      let drawProb, homeProb, awayProb;

      if (p.predictedResult === "DRAW") {
        drawProb = 38;
        homeProb = 31;
        awayProb = 31;
      } else {
        drawProb = Math.round(24 - (conf - 0.5) * 28);
        if (drawProb < 10) drawProb = 10;
        if (drawProb > 28) drawProb = 28;
        const remaining = 100 - drawProb;
        homeProb = Math.round(homeProbRaw * remaining / 100);
        awayProb = remaining - homeProb;
      }

      const homeOdds = homeProb > 0 ? (100 / homeProb).toFixed(2) : "—";
      const drawOdds = drawProb > 0 ? (100 / drawProb).toFixed(2) : "—";
      const awayOdds = awayProb > 0 ? (100 / awayProb).toFixed(2) : "—";

      let topClass, verdictClass, verdictText;
      if (p.predictedResult === "HOME_WIN") {
        topClass = "top-home";
        verdictClass = "v-home";
        verdictText = `1  ${p.homeTeam}`;
      } else if (p.predictedResult === "AWAY_WIN") {
        topClass = "top-away";
        verdictClass = "v-away";
        verdictText = `2  ${p.awayTeam}`;
      } else {
        topClass = "top-draw";
        verdictClass = "v-draw";
        verdictText = "X  Empate";
      }

      const [hg, ag] = p.predictedScore.split("-");
      const confPct = Math.round(conf * 100);

      return `
        <div class="card">
          <div class="card-top ${topClass}"></div>
          <div class="card-body">
            <div class="card-header">
              <span>Pronóstico</span>
              <span class="badge">Conf. ${confPct}%</span>
            </div>

            <div class="matchup">
              <div class="team-block">
                <div class="name">${p.homeTeam}</div>
                <div class="meta">${homeRating}</div>
              </div>
              <div class="score-block">${hg}:${ag}</div>
              <div class="team-block">
                <div class="name">${p.awayTeam}</div>
                <div class="meta">${awayRating}</div>
              </div>
            </div>

            <div class="odds-row">
              <div class="odds-cell${p.predictedResult === 'HOME_WIN' ? ' active-home' : ''}">
                <span class="label">1</span>
                <span class="value">${homeOdds}</span>
              </div>
              <div class="odds-cell${p.predictedResult === 'DRAW' ? ' active-draw' : ''}">
                <span class="label">X</span>
                <span class="value">${drawOdds}</span>
              </div>
              <div class="odds-cell${p.predictedResult === 'AWAY_WIN' ? ' active-away' : ''}">
                <span class="label">2</span>
                <span class="value">${awayOdds}</span>
              </div>
            </div>

            <div class="verdict ${verdictClass}">${verdictText}</div>

            <div class="prob-bar">
              <div class="prob-home" style="width:${homeProb}%"></div>
              <div class="prob-away" style="width:${awayProb}%"></div>
            </div>
            <div class="prob-labels">
              <span>${p.homeTeam} ${homeProb}%</span>
              <span>${p.awayTeam} ${awayProb}%</span>
            </div>

            <div class="reason">${p.reasoning}</div>
          </div>
        </div>
      `;
    })
    .join("");
}