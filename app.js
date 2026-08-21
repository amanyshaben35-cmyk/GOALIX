const matches = [
  {
    id: 1,
    league: "الدوري الإنجليزي الممتاز",
    home: "أرسنال",
    away: "مانشستر سيتي",
    time: "20:00",
    status: "لم تبدأ",
    homeForm: "WWDWW",
    awayForm: "WWLWD"
  },
  {
    id: 2,
    league: "الدوري الإسباني",
    home: "برشلونة",
    away: "ريال مدريد",
    time: "22:00",
    status: "لم تبدأ",
    homeForm: "WWWWW",
    awayForm: "WDLWW"
  },
  {
    id: 3,
    league: "الدوري الإيطالي",
    home: "إنتر",
    away: "ميلان",
    time: "21:45",
    status: "لم تبدأ",
    homeForm: "WWDWW",
    awayForm: "LWWDW"
  },
  {
    id: 4,
    league: "الدوري الفرنسي",
    home: "باريس سان جيرمان",
    away: "مارسيليا",
    time: "21:00",
    status: "لم تبدأ",
    homeForm: "WWWWW",
    awayForm: "WDLWD"
  },
  {
    id: 5,
    league: "الدوري الألماني",
    home: "بايرن ميونخ",
    away: "بوروسيا دورتموند",
    time: "20:30",
    status: "لم تبدأ",
    homeForm: "WWWWD",
    awayForm: "WLWWL"
  }
];

const grid = document.getElementById("matches");
const analysis = document.getElementById("analysis");
const searchInput = document.getElementById("search");
const leagueFilter = document.getElementById("league-filter");
const predictionCount = document.getElementById("prediction-count");
const dateElement = document.getElementById("date");

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getPredictions() {
  try {
    return JSON.parse(
      localStorage.getItem("goalix_predictions")
    ) || {};
  } catch {
    return {};
  }
}

function savePrediction(id, choice) {
  const predictions = getPredictions();

  predictions[id] = {
    choice: choice,
    time: new Date().toISOString()
  };

  localStorage.setItem(
    "goalix_predictions",
    JSON.stringify(predictions)
  );
}

function setupDate() {
  if (!dateElement) return;

  const today = new Date();

  dateElement.textContent =
    today.toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
}

function setupLeagues() {
  if (!leagueFilter) return;

  const leagues = [
    "الكل",
    ...new Set(matches.map(match => match.league))
  ];

  leagueFilter.innerHTML = leagues.map(league => `
    <option value="${escapeHTML(league)}">
      ${escapeHTML(league)}
    </option>
  `).join("");
}

function getFilteredMatches() {
  const query = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const league =
    leagueFilter?.value || "الكل";

  return matches.filter(match => {

    const leagueOK =
      league === "الكل" ||
      match.league === league;

    const searchOK =
      !query ||
      match.home.toLowerCase().includes(query) ||
      match.away.toLowerCase().includes(query) ||
      match.league.toLowerCase().includes(query);

    return leagueOK && searchOK;
  });
}

function renderMatches() {
  if (!grid) return;

  const filtered = getFilteredMatches();
  const predictions = getPredictions();

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="no-matches">
        <h3>لا توجد مباريات</h3>
        <p>جرّب البحث باسم فريق آخر.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(match => {

    const prediction =
      predictions[match.id]?.choice;

    return `
      <article class="match-card">

        <div class="match-header">
          <span class="league">
            ${escapeHTML(match.league)}
          </span>

          <span class="match-status">
            ${escapeHTML(match.status)}
          </span>
        </div>

        <div class="match-time">
          ${escapeHTML(match.time)}
        </div>

        <div class="teams">

          <div class="team">
            ${escapeHTML(match.home)}
          </div>

          <div class="vs">
            ضد
          </div>

          <div class="team">
            ${escapeHTML(match.away)}
          </div>

        </div>

        <div class="form">
          <span>${escapeHTML(match.homeForm)}</span>
          <span>آخر النتائج</span>
          <span>${escapeHTML(match.awayForm)}</span>
        </div>

        <div class="choices">

          <button
            class="choice"
            data-id="${match.id}"
            data-choice="${escapeHTML(match.home)}"
          >
            ${escapeHTML(match.home)}
          </button>

          <button
            class="choice"
            data-id="${match.id}"
            data-choice="تعادل"
          >
            تعادل
          </button>

          <button
            class="choice"
            data-id="${match.id}"
            data-choice="${escapeHTML(match.away)}"
          >
            ${escapeHTML(match.away)}
          </button>

        </div>

        <div class="prediction-status">
          ${
            prediction
              ? `توقعك: ${escapeHTML(prediction)}`
              : "لم يتم اختيار توقع"
          }
        </div>

        <button
          class="analysis-button"
          data-analysis-id="${match.id}"
        >
          تحليل المباراة
        </button>

      </article>
    `;
  }).join("");

  attachEvents();
}

function attachEvents() {

  document.querySelectorAll(".choice")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          Number(button.dataset.id);

        const choice =
          button.dataset.choice;

        predict(id, choice);
      });

    });

  document.querySelectorAll(".analysis-button")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          Number(button.dataset.analysisId);

        showAnalysis(id);
      });

    });
}

function predict(id, choice) {

  const match =
    matches.find(item => item.id === id);

  if (!match) return;

  savePrediction(id, choice);
  updatePredictionCount();

  if (analysis) {
    analysis.innerHTML = `
      <div class="analysis-box">

        <div class="analysis-title">
          تم تسجيل توقعك ✅
        </div>

        <p>
          ${escapeHTML(match.home)}
          ضد
          ${escapeHTML(match.away)}
        </p>

        <strong>
          اختيارك:
          ${escapeHTML(choice)}
        </strong>

      </div>
    `;
  }

  renderMatches();
}

function showAnalysis(id) {

  const match =
    matches.find(item => item.id === id);

  if (!match || !analysis) return;

  const homeWins =
    (match.homeForm.match(/W/g) || []).length;

  const awayWins =
    (match.awayForm.match(/W/g) || []).length;

  let favorite = "تعادل";
  let confidence = 50;

  if (homeWins > awayWins) {
    favorite = match.home;
    confidence =
      Math.min(85, 55 + (homeWins - awayWins) * 5);
  }

  if (awayWins > homeWins) {
    favorite = match.away;
    confidence =
      Math.min(85, 55 + (awayWins - homeWins) * 5);
  }

  analysis.innerHTML = `
    <div class="analysis-box">

      <div class="analysis-title">
        تحليل GOALIX ⚽
      </div>

      <h3>
        ${escapeHTML(match.home)}
        ضد
        ${escapeHTML(match.away)}
      </h3>

      <div class="analysis-row">
        <span>الفريق المرشح</span>
        <strong>
          ${escapeHTML(favorite)}
        </strong>
      </div>

      <div class="analysis-row">
        <span>نسبة الترجيح</span>
        <strong>
          ${confidence}%
        </strong>
      </div>

      <div class="analysis-row">
        <span>فورمة ${escapeHTML(match.home)}</span>
        <strong>
          ${escapeHTML(match.homeForm)}
        </strong>
      </div>

      <div class="analysis-row">
        <span>فورمة ${escapeHTML(match.away)}</span>
        <strong>
          ${escapeHTML(match.awayForm)}
        </strong>
      </div>

      <p class="analysis-note">
        التحليل تجريبي ولا يضمن نتيجة المباراة.
      </p>

    </div>
  `;

  analysis.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function updatePredictionCount() {

  if (!predictionCount) return;

  const predictions =
    getPredictions();

  predictionCount.textContent =
    Object.keys(predictions).length;
}

function scrollToMatches() {

  document
    .getElementById("matches-section")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}

if (searchInput) {
  searchInput.addEventListener(
    "input",
    renderMatches
  );
}

if (leagueFilter) {
  leagueFilter.addEventListener(
    "change",
    renderMatches
  );
}

document.querySelectorAll("nav button")
  .forEach(button => {

    button.addEventListener("click", () => {

      const tab =
        button.dataset.tab;

      document
        .querySelectorAll("nav button")
        .forEach(item =>
          item.classList.remove("active")
        );

      button.classList.add("active");

      document
        .querySelectorAll(".page")
        .forEach(page =>
          page.classList.remove("active")
        );

      const target =
        document.getElementById(tab);

      if (target) {
        target.classList.add("active");
      }
    });

  });

const themeButton =
  document.getElementById("theme");

if (themeButton) {

  themeButton.addEventListener(
    "click",
    () => {

      document.body.classList.toggle("light");

      const isLight =
        document.body.classList.contains("light");

      themeButton.textContent =
        isLight ? "☀" : "☾";

      localStorage.setItem(
        "goalix_theme",
        isLight ? "light" : "dark"
      );
    }
  );

  if (
    localStorage.getItem("goalix_theme")
    === "light"
  ) {
    document.body.classList.add("light");
    themeButton.textContent = "☀";
  }
}

setupDate();
setupLeagues();
renderMatches();
updatePredictionCount();
