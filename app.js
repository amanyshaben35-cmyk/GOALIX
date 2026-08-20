let matches = [
  {
    id: 1,
    league: "الدوري الإنجليزي الممتاز",
    home: "أرسنال",
    away: "مانشستر سيتي",
    time: "20:00"
  },
  {
    id: 2,
    league: "الدوري الإسباني",
    home: "برشلونة",
    away: "ريال مدريد",
    time: "22:00"
  },
  {
    id: 3,
    league: "الدوري الإيطالي",
    home: "إنتر",
    away: "ميلان",
    time: "21:45"
  }
];

const grid = document.getElementById("matches");
const analysis = document.getElementById("analysis");

function renderMatches() {
  grid.innerHTML = matches.map(m => `
    <article class="match-card">
      <div class="league">${m.league}</div>
      <div class="match-time">${m.time}</div>

      <div class="teams">
        <div class="team">${m.home}</div>
        <div class="vs">ضد</div>
        <div class="team">${m.away}</div>
      </div>

      <div class="choices">
        <button class="choice" onclick="predict(${m.id}, '${m.home}')">
          ${m.home}
        </button>
        <button class="choice" onclick="predict(${m.id}, 'تعادل')">
          تعادل
        </button>
        <button class="choice" onclick="predict(${m.id}, '${m.away}')">
          ${m.away}
        </button>
      </div>
    </article>
  `).join("");
}

function predict(id, choice) {
  const match = matches.find(m => m.id === id);

  if (analysis) {
    analysis.textContent =
      `تم تسجيل توقعك: ${choice} في مباراة ${match.home} ضد ${match.away}`;
  }
}

function scrollToMatches() {
  document.getElementById("matches-section")?.scrollIntoView({
    behavior: "smooth"
  });
}

renderMatches();
