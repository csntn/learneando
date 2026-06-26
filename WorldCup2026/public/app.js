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
      const homeProb = extractHomeProb(p.reasoning);
      const awayProb = 100 - homeProb;

      let topClass, verdictClass, verdictText;
      if (p.predictedResult === "HOME_WIN") {
        topClass = "top-home"; verdictClass = "v-home";
        verdictText = `🏆 Gana ${p.winner}`;
      } else if (p.predictedResult === "AWAY_WIN") {
        topClass = "top-away"; verdictClass = "v-away";
        verdictText = `🏆 Gana ${p.winner}`;
      } else {
        topClass = "top-draw"; verdictClass = "v-draw";
        verdictText = "🤝 Empate probable";
      }

      const [hg, ag] = p.predictedScore.split("-");

      return `
        <div class="card">
          <div class="card-top ${topClass}"></div>
          <div class="round">Predicción · Confianza ${Math.round(p.confidence * 100)}%</div>

          <div class="matchup">
            <div class="team">
              <div class="name">${p.homeTeam}</div>
              <div class="rating">Rating ${homeRating}</div>
            </div>
            <div class="score">${hg} - ${ag}</div>
            <div class="team">
              <div class="name">${p.awayTeam}</div>
              <div class="rating">Rating ${awayRating}</div>
            </div>
          </div>

          <div class="verdict ${verdictClass}">${verdictText}</div>

          <div class="probbar">
            <div class="prob-home" style="width:${homeProb}%"></div>
            <div class="prob-away" style="width:${awayProb}%"></div>
          </div>
          <div class="prob-labels">
            <span>${p.homeTeam} ${homeProb}%</span>
            <span>${p.awayTeam} ${awayProb}%</span>
          </div>

          <div class="reason">${p.reasoning}</div>
        </div>
      `;
    })
    .join("");
}