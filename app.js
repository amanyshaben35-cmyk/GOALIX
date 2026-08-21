"use strict";

let matches = [];

const grid = document.getElementById("matches");
const analysis = document.getElementById("analysis");
const search = document.getElementById("search");
const leagueFilter = document.getElementById("league-filter");
const date = document.getElementById("date");
const predictionCount = document.getElementById("prediction-count");

function getPredictions() {
  try {
    return JSON.parse(
      localStorage.getItem("goalix_predictions") || "{}"
    );
  } catch (error) {
    console.warn("GOALIX predictions error:", error);
    return {};
  }
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(dateString) {
  if (!dateString) return "--:--";

  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) {
    return "--:--";
  }

  return d.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Cairo"
  });
}

function formatDate(dateString) {
  if (!dateString) return "";

  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo"
  });
}

function getStatus(status) {
  const short = status?.short || "";

  if (
    short === "FT" ||
    short === "AET" ||
    short === "PEN"
  ) {
    return "انتهت";
  }

  if (
    short === "LIVE" ||
    short === "1H" ||
    short === "2H" ||
    short === "HT" ||
    short === "ET" ||
    short === "BT" ||
    short === "P"
  ) {
    return "مباشرة";
  }

  if (short === "PST") {
    return "مؤجلة";
  }

  if (short === "CANC") {
    return "ملغاة";
  }

  if (short === "ABD") {
    return "متوقفة";
  }

  if (short === "SUSP") {
    return "معلقة";
  }

  return "لم تبدأ";
}

function normalizeMatches(data) {
  if (!data || !Array.isArray(data.response)) {
    return [];
  }

  return data.response
    .filter(item => item?.fixture && item?.teams)
    .map(item => ({
      id: item.fixture.id,
      date: item.fixture.date,

      league:
        item.league?.name ||
        "بطولة غير معروفة",

      country:
        item.league?.country ||
        "",

      home:
        item.teams?.home?.name ||
        "الفريق المضيف",

      away:
        item.teams?.away?.name ||
        "الفريق الضيف",

      homeLogo:
        item.teams?.home?.logo ||
        "",

      awayLogo:
        item.teams?.away?.logo ||
        "",

      time: formatTime(item.fixture.date),

      status: getStatus(item.fixture.status),

      statusShort:
        item.fixture.status?.short ||
        "",

      homeGoals:
        item.goals?.home,

      awayGoals:
        item.goals?.away,

      homeWinner:
        item.teams?.home?.winner === true,

      awayWinner:
        item.teams?.away?.winner === true
    }));
}

async function loadMatches() {
  if (grid) {
    grid.innerHTML = `
      <div class="no-matches">
        جاري تحميل مباريات اليوم... ⚽
      </div>
    `;
  }

  try {
    const response = await fetch(
      "data/all-matches.json",
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        "تعذر تحميل ملف المباريات"
      );
    }

    const data = await response.json();

    matches = normalizeMatches(data);

    if (!matches.length) {
      throw new Error(
        "لم يتم العثور على مباريات"
      );
    }

    if (date && matches[0]?.date) {
      date.textContent =
        formatDate(matches[0].date);
    }

    renderLeagues();
    renderMatches();
    updateCount();

  } catch (error) {
    console.error(
      "GOALIX:",
      error
    );

    if (grid) {
      grid.innerHTML = `
        <div class="no-matches">
          تعذر تحميل المباريات حاليًا.<br>
          تأكد من اتصال الإنترنت ثم أعد المحاولة.
        </div>
      `;
    }
  }
}

function renderLeagues() {
  if (!leagueFilter) return;

  const leagues = [
    "الكل",
    ...new Set(
      matches
        .map(match => match.league)
        .filter(Boolean)
    )
  ];

  leagueFilter.innerHTML =
    leagues
      .map(
        league => `
          <option value="${escapeHTML(league)}">
            ${escapeHTML(league)}
          </option>
        `
      )
      .join("");
}

function getScoreHTML(match) {
  const hasScore =
    match.homeGoals !== null &&
    match.homeGoals !== undefined &&
    match.awayGoals !== null &&
    match.awayGoals !== undefined;

  if (!hasScore) {
    return `
      <div class="match-score">
        لم تبدأ
      </div>
    `;
  }

  return `
    <div class="match-score">
      ${escapeHTML(match.homeGoals)}
      -
      ${escapeHTML(match.awayGoals)}
    </div>
  `;
}

function renderTeam(team, logo) {
  return `
    <div class="team">

      ${
        logo
          ? `
            <img
              src="${escapeHTML(logo)}"
              alt="${escapeHTML(team)}"
              loading="lazy"
              width="48"
              height="48"
            >
          `
          : `
            <div
              class="team-logo-placeholder"
              aria-hidden="true"
            >
              ⚽
            </div>
          `
      }

      <span>
        ${escapeHTML(team)}
      </span>

    </div>
  `;
}

function renderMatches() {
  if (!grid) return;

  const query =
    search?.value
      ?.trim()
      ?.toLowerCase() || "";

  const selectedLeague =
    leagueFilter?.value || "الكل";

  const filtered =
    matches.filter(match => {

      const home =
        String(match.home || "")
          .toLowerCase();

      const away =
        String(match.away || "")
          .toLowerCase();

      const league =
        String(match.league || "")
          .toLowerCase();

      const searchOK =
        !query ||
        home.includes(query) ||
        away.includes(query) ||
        league.includes(query);

      const leagueOK =
        selectedLeague === "الكل" ||
        match.league === selectedLeague;

      return searchOK && leagueOK;
    });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="no-matches">
        لا توجد مباريات مطابقة للبحث.
      </div>
    `;

    return;
  }

  const saved = getPredictions();

  grid.innerHTML =
    filtered
      .map(match => {

        const prediction =
          saved[match.id];

        return `
          <article
            class="match-card goalix-match"
            data-match-id="${Number(match.id)}"
          >

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

              ${renderTeam(
                match.home,
                match.homeLogo
              )}

              <div class="vs">

                <span>
                  ضد
                </span>

                ${getScoreHTML(match)}

              </div>

              ${renderTeam(
                match.away,
                match.awayLogo
              )}

            </div>

            <div class="choices">

              <button
                class="choice"
                type="button"
                onclick="predict(${Number(match.id)}, 'home')"
              >
                فوز ${escapeHTML(match.home)}
              </button>

              <button
                class="choice"
                type="button"
                onclick="predict(${Number(match.id)}, 'draw')"
              >
                تعادل
              </button>

              <button
                class="choice"
                type="button"
                onclick="predict(${Number(match.id)}, 'away')"
              >
                فوز ${escapeHTML(match.away)}
              </button>

            </div>

            <div class="prediction-status">

              ${
                prediction
                  ? `
                    توقعك:
                    <strong>
                      ${escapeHTML(
                        prediction.label
                      )}
                    </strong>
                  `
                  : `
                    لم يتم اختيار توقع
                  `
              }

            </div>

            <button
              class="analysis-button"
              type="button"
              onclick="showAnalysis(${Number(match.id)})"
            >
              تحليل المباراة
            </button>

          </article>
        `;
      })
      .join("");
}

function predict(id, choice) {
  const match =
    matches.find(
      item => item.id === id
    );

  if (!match) return;

  const labels = {
    home:
      `فوز ${match.home}`,

    draw:
      "تعادل",

    away:
      `فوز ${match.away}`
  };

  const saved =
    getPredictions();

  saved[id] = {
    choice,
    label: labels[choice]
  };

  try {
    localStorage.setItem(
      "goalix_predictions",
      JSON.stringify(saved)
    );
  } catch (error) {
    console.warn(
      "تعذر حفظ التوقع:",
      error
    );
  }

  updateCount();
  renderMatches();

  if (analysis) {
    analysis.innerHTML = `
      <div class="analysis-box">

        <div class="analysis-title">
          تم تسجيل توقعك ✅
        </div>

        <h3>
          ${escapeHTML(match.home)}
          ضد
          ${escapeHTML(match.away)}
        </h3>

        <p>
          اختيارك:
          <strong>
            ${escapeHTML(labels[choice])}
          </strong>
        </p>

      </div>
    `;

    analysis.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function calculateSimpleAnalysis(match) {
  if (match.homeWinner === true) {
    return `أفضلية ${match.home}`;
  }

  if (match.awayWinner === true) {
    return `أفضلية ${match.away}`;
  }

  return "المباراة متوازنة";
}

function showAnalysis(id) {
  const match =
    matches.find(
      item => item.id === id
    );

  if (!match || !analysis) return;

  const saved =
    getPredictions();

  const prediction =
    saved[id];

  const recommendation =
    calculateSimpleAnalysis(match);

  const hasScore =
    match.homeGoals !== null &&
    match.homeGoals !== undefined &&
    match.awayGoals !== null &&
    match.awayGoals !== undefined;

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
        <span>البطولة</span>
        <strong>
          ${escapeHTML(match.league)}
        </strong>
      </div>

      <div class="analysis-row">
        <span>الموعد</span>
        <strong>
          ${escapeHTML(match.time)}
        </strong>
      </div>

      <div class="analysis-row">
        <span>الحالة</span>
        <strong>
          ${escapeHTML(match.status)}
        </strong>
      </div>

      <div class="analysis-row">
        <span>النتيجة</span>
        <strong>
          ${
            hasScore
              ? `${escapeHTML(match.homeGoals)} - ${escapeHTML(match.awayGoals)}`
              : "لم تبدأ"
          }
        </strong>
      </div>

      <div class="analysis-row">
        <span>قراءة GOALIX</span>
        <strong>
          ${escapeHTML(recommendation)}
        </strong>
      </div>

      ${
        prediction
          ? `
            <div class="analysis-row">

              <span>
                توقعك
              </span>

              <strong>
                ${escapeHTML(
                  prediction.label
                )}
              </strong>

            </div>
          `
          : `
            <p class="analysis-note">
              اختر توقعًا للمباراة لإضافته إلى سجل توقعاتك.
            </p>
          `
      }

      <p class="analysis-note">
        تنبيه: هذا تحليل إحصائي مبدئي وليس ضمانًا لنتيجة المباراة.
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
    Object.keys(
      getPredictions()
    ).length;
}

function scrollToMatches() {
  document
    .getElementById("matches-section")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}

function setupTabs() {
  document
    .querySelectorAll("nav button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const target =
            document.getElementById(
              button.dataset.tab
            );

          if (!target) return;

          document
            .querySelectorAll("nav button")
            .forEach(btn =>
              btn.classList.remove("active")
            );

          document
            .querySelectorAll(".page")
            .forEach(page =>
              page.classList.remove("active")
            );

          button.classList.add("active");
          target.classList.add("active");
        }
      );

    });
}

function setupTheme() {
  const theme =
    document.getElementById("theme");

  if (!theme) return;

  const savedTheme =
    localStorage.getItem("goalix_theme");

  if (savedTheme === "light") {
    document.body.classList.add("light");
    theme.textContent = "☀";
    theme.setAttribute(
      "aria-label",
      "تفعيل المظهر الداكن"
    );
  } else {
    theme.textContent = "☾";
    theme.setAttribute(
      "aria-label",
      "تفعيل المظهر الفاتح"
    );
  }

  theme.addEventListener(
    "click",
    () => {

      document.body.classList.toggle("light");

      const isLight =
        document.body.classList.contains("light");

      theme.textContent =
        isLight ? "☀" : "☾";

      theme.setAttribute(
        "aria-label",
        isLight
          ? "تفعيل المظهر الداكن"
          : "تفعيل المظهر الفاتح"
      );

      localStorage.setItem(
        "goalix_theme",
        isLight ? "light" : "dark"
      );
    }
  );
}

if (search) {
  search.addEventListener(
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

setupTabs();
setupTheme();
updateCount();
loadMatches();
