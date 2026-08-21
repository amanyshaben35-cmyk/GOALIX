const matches = [
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
  },
  {
    id: 4,
    league: "الدوري الفرنسي",
    home: "باريس سان جيرمان",
    away: "مارسيليا",
    time: "21:00"
  },
  {
    id: 5,
    league: "الدوري الألماني",
    home: "بايرن ميونخ",
    away: "بوروسيا دورتموند",
    time: "20:30"
  }
];

const grid = document.getElementById("matches");
const analysis = document.getElementById("analysis");
const search = document.getElementById("search");
const leagueFilter = document.getElementById("league-filter");
const date = document.getElementById("date");
const predictionCount = document.getElementById("prediction-count");

function predictions() {
  return JSON.parse(
    localStorage.getItem("goalix_predictions") || "{}"
  );
}

function renderLeagues() {
  if (!leagueFilter) return;

  const leagues = [
    "الكل",
    ...new Set(matches.map(m => m.league))
  ];

  leagueFilter.innerHTML = leagues.map(league =>
    `<option value="${league}">${league}</option>`
  ).join("");
}

function renderMatches() {
  if (!grid) return;

  const query = search?.value.trim().toLowerCase() || "";
  const league = leagueFilter?.value || "الكل";

  const filtered = matches.filter(m => {
    const searchOK =
      !query ||
      m.home.toLowerCase().includes(query) ||
      m.away.toLowerCase().includes(query) ||
      m.league.toLowerCase().includes(query);

    const leagueOK =
      league === "الكل" || m.league === league;

    return searchOK && leagueOK;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="no-matches">
        لا توجد مباريات مطابقة.
      </div>
    `;
    return;
  }

  const saved = predictions();

  grid.innerHTML = filtered.map(m => `
    <article class="match-card">

      <div class="match-header">
        <span class="league">${m.league}</span>
        <span class="match-status">لم تبدأ</span>
      </div>

      <div class="match-time">${m.time}</div>

      <div class="teams">
        <div class="team">${m.home}</div>
        <div class="vs">ضد</div>
        <div class="team">${m.away}</div>
      </div>

      <div class="choices">

        <button
          class="choice"
          onclick="predict(${m.id}, '${m.home}')">
          ${m.home}
        </button>

        <button
          class="choice"
          onclick="predict(${m.id}, 'تعادل')">
          تعادل
        </button>

        <button
          class="choice"
          onclick="predict(${m.id}, '${m.away}')">
          ${m.away}
        </button>

      </div>

      <div class="prediction-status">
        ${
          saved[m.id]
            ? `توقعك: ${saved[m.id]}`
            : "لم يتم اختيار توقع"
        }
      </div>

      <button
        class="analysis-button"
        onclick="showAnalysis(${m.id})">
        تحليل المباراة
      </button>

    </article>
  `).join("");
}

function predict(id, choice) {
  const saved = predictions();

  saved[id] = choice;

  localStorage.setItem(
    "goalix_predictions",
    JSON.stringify(saved)
  );

  updateCount();
  renderMatches();

  if (analysis) {
    analysis.innerHTML = `
      <div class="analysis-box">
        <div class="analysis-title">
          تم تسجيل توقعك ✅
        </div>
        <strong>
          اختيارك: ${choice}
        </strong>
      </div>
    `;
  }
}

function showAnalysis(id) {
  const match = matches.find(m => m.id === id);

  if (!match || !analysis) return;

  analysis.innerHTML = `
    <div class="analysis-box">

      <div class="analysis-title">
        تحليل GOALIX ⚽
      </div>

      <h3>
        ${match.home} ضد ${match.away}
      </h3>

      <div class="analysis-row">
        <span>المباراة</span>
        <strong>${match.time}</strong>
      </div>

      <div class="analysis-row">
        <span>الدوري</span>
        <strong>${match.league}</strong>
      </div>

      <p class="analysis-note">
        التحليل الحالي تجريبي.
      </p>

    </div>
  `;

  analysis.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function updateCount() {
  if (!predictionCount) return;

  predictionCount.textContent =
    Object.keys(predictions()).length;
}

function scrollToMatches() {
  document
    .getElementById("matches-section")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}

function setupTabs() {
  document.querySelectorAll("nav button")
    .forEach(button => {

      button.addEventListener("click", () => {

        const target =
          document.getElementById(button.dataset.tab);

        if (!target) return;

        document
          .querySelectorAll("nav button")
          .forEach(b => b.classList.remove("active"));

        document
          .querySelectorAll(".page")
          .forEach(p => p.classList.remove("active"));

        button.classList.add("active");
        target.classList.add("active");
      });
    });
}

function setupTheme() {
  const theme = document.getElementById("theme");

  if (!theme) return;

  if (localStorage.getItem("goalix_theme") === "light") {
    document.body.classList.add("light");
    theme.textContent = "☀";
  }

  theme.addEventListener("click", () => {

    document.body.classList.toggle("light");

    const light =
      document.body.classList.contains("light");

    theme.textContent = light ? "☀" : "☾";

    localStorage.setItem(
      "goalix_theme",
      light ? "light" : "dark"
    );
  });
}

if (search) {
  search.addEventListener("input", renderMatches);
}

if (leagueFilter) {
  leagueFilter.addEventListener("change", renderMatches);
}

if (date) {
  date.textContent =
    new Date().toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
}

renderLeagues();
renderMatches();
updateCount();
setupTabs();
setupTheme();
