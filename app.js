const matches = [
  {
    id: 1,
    league: "Premier League",
    home: "Manchester City",
    away: "Arsenal",
    time: "20:00"
  },
  {
    id: 2,
    league: "La Liga",
    home: "Barcelona",
    away: "Real Madrid",
    time: "22:00"
  },
  {
    id: 3,
    league: "Serie A",
    home: "Inter",
    away: "AC Milan",
    time: "21:45"
  }
];

const grid = document.getElementById("matches");

function renderMatches() {
  if (!grid) return;

  grid.innerHTML = matches.map(match => `
    <article class="match-card">
      <div class="league">${match.league}</div>

      <div class="match-time">${match.time}</div>

      <div class="teams">
        <div class="team">
          <strong>${match.home}</strong>
        </div>

        <div class="vs">VS</div>

        <div class="team">
          <strong>${match.away}</strong>
        </div>
      </div>

      <div class="choices">
        <button class="choice" onclick="predict(${match.id}, 'فوز ${match.home}')">
          ${match.home}
        </button>

        <button class="choice" onclick="predict(${match.id}, 'تعادل')">
          تعادل
        </button>

        <button class="choice" onclick="predict(${match.id}, 'فوز ${match.away}')">
          ${match.away}
        </button>
      </div>
    </article>
  `).join("");
}

function predict(id, label) {
  const match = matches.find(item => item.id === id);

  if (!match) return;

  const analysis = document.getElementById("analysis");

  if (analysis) {
    analysis.textContent =
      `تم تسجيل توقعك: ${label} — ${match.home} ضد ${match.away}`;
  }

  showToast("تم تسجيل توقعك بنجاح");
}

function showToast(message) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function scrollToMatches() {
  const section = document.getElementById("matches-section");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth"
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderMatches();
});
