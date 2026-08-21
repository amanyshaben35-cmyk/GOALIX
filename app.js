"use strict";

let matches = [];

const grid = document.getElementById("matches");
const analysis = document.getElementById("analysis");
const search = document.getElementById("search");
const leagueFilter = document.getElementById("league-filter");
const dateElement = document.getElementById("date");
const predictionCount = document.getElementById("prediction-count");

const DATA_URL = "data/all-matches.json";
const TIME_ZONE = "Africa/Cairo";

/* =========================
   أدوات عامة
========================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPredictions() {
  try {
    const saved = localStorage.getItem("goalix_predictions");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function savePredictions(data) {
  try {
    localStorage.setItem(
      "goalix_predictions",
      JSON.stringify(data)
    );
  } catch (error) {
    console.warn("GOALIX localStorage:", error);
  }
}

function formatTime(dateString) {
  if (!dateString) return "--:--";

  const value = new Date(dateString);

  if (Number.isNaN(value.getTime())) {
    return "--:--";
  }

  return value.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE
  });
}

function formatDate(dateString) {
  if (!dateString) return "";

  const value = new Date(dateString);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE
  });
}

/* =========================
   حالة المباراة
========================= */

function getStatus(status) {
  const short = String(status?.short || "").toUpperCase();

  if (["FT", "AET", "PEN"].includes(short)) {
    return "انتهت";
  }

  if (
    [
      "LIVE",
      "1H",
      "2H",
      "HT",
      "ET",
      "BT",
      "P"
    ].includes(short)
  ) {
    return "مباشرة";
  }

  if (["PST", "SUSP"].includes(short)) {
    return "مؤجلة";
  }

  if (["CANC", "ABD"].includes(short)) {
    return "ملغاة";
  }

  if (short === "TBD") {
    return "لم يحدد الموعد";
  }

  return "لم تبدأ";
}

/* =========================
   تحويل بيانات API
========================= */

function normalizeMatches(data) {
  if (!data || !Array.isArray(data.response)) {
    return [];
  }

  return data.response
    .filter(item => item?.fixture && item?.teams)
    .map(item => {
      const fixture = item.fixture;
      const league = item.league || {};
      const home = item.teams?.home || {};
      const away = item.teams?.away || {};
      const goals = item.goals || {};
      const score = item.score || {};

      return {
        id: Number(fixture.id),

        date: fixture.date || "",

        league:
          league.name ||
          "بطولة غير معروفة",

        country:
          league.country ||
          "",

        home:
          home.name ||
          "الفريق المضيف",

        away:
          away.name ||
          "الفريق الضيف",

        homeLogo:
          home.logo ||
          "",

        awayLogo:
          away.logo ||
          "",

        status:
          getStatus(fixture.status),

        statusShort:
          String(fixture.status?.short || "").toUpperCase(),

        time:
          formatTime(fixture.date),

        homeGoals:
          goals.home ?? null,

        awayGoals:
          goals.away ?? null,

        homeWinner:
          home.winner === true,

        awayWinner:
          away.winner === true,

        homePenalty:
          score.penalty?.home ?? null,

        awayPenalty:
          score.penalty?.away ?? null,

        homeExtraTime:
          score.extratime?.home ?? null,

        awayExtraTime:
          score.extratime?.away ?? null
      };
    })
    .filter(match => Number.isFinite(match.id));
}

/* =========================
   النتيجة
========================= */

function getScoreHTML(match) {
  const hasGoals =
    match.homeGoals !== null &&
    match.homeGoals !== undefined &&
    match.awayGoals !== null &&
    match.awayGoals !== undefined;

  if (!hasGoals) {
    return `
      <div class="match-score">
        <span>—</span>
      </div>
    `;
  }

  let scoreText =
    `${escapeHTML(match.homeGoals)} - ${escapeHTML(match.awayGoals)}`;

  const hasPenalties =
    match.homePenalty !== null &&
    match.homePenalty !== undefined &&
    match.awayPenalty !== null &&
    match.awayPenalty !== undefined;

  if (
    match.statusShort === "PEN" ||
    hasPenalties
  ) {
    scoreText += `
      <small class="penalty-score">
        ركلات الترجيح
        ${escapeHTML(match.homePenalty)}
        - 
        ${escapeHTML(match.awayPenalty)}
      </small>
    `;
  }

  return `
    <div class="match-score">
      ${scoreText}
    </div>
  `;
}

/* =========================
   عرض الفريق
========================= */

function renderTeam(name, logo) {
  const safeName = escapeHTML(name);
  const safeLogo = escapeHTML(logo);

  return `
    <div class="team">

      ${
        safeLogo
          ? `
            <img
              src="${safeLogo}"
              alt="${safeName}"
              loading="lazy"
              width="52"
              height="52"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            >

            <div
              class="team-logo-placeholder"
              style="display:none"
              aria-hidden="true"
            >
              ⚽
            </div>
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

      <span title="${safeName}">
        ${safeName}
      </span>

    </div>
  `;
}

/* =========================
   تحميل المباريات
========================= */

async function loadMatches() {
  if (grid) {
    grid.innerHTML = `
      <div class="no-matches">
        جاري تحميل مباريات اليوم... ⚽
      </div>
    `;
  }

  try {
    const response = await fetch(DATA_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    matches = normalizeMatches(data);

    if (!matches.length) {
      throw new Error(
        "لا توجد مباريات في ملف البيانات"
      );
    }

    updatePageDate();

    renderLeagues();
    renderMatches();
    updateCount();

  } catch (error) {
    console.error(
      "GOALIX load error:",
      error
    );

    if (grid) {
      grid.innerHTML = `
        <div class="no-matches">
          <strong>تعذر تحميل المباريات.</strong>
          <br>
          تأكد من اتصال الإنترنت ثم أعد تحميل الصفحة.
        </div>
      `;
    }
  }
}

function updatePageDate() {
  if (!dateElement) return;

  const firstMatch = matches.find(
    match => match.date
  );

  if (firstMatch) {
    dateElement.textContent =
      formatDate(firstMatch.date);
  }
}

/* =========================
   الدوريات
========================= */

function renderLeagues() {
  if (!leagueFilter) return;

  const currentValue =
    leagueFilter.value || "الكل";

  const leagues = [
    ...new Set(
      matches
        .map(match => match.league)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b, "en")
  );

  leagueFilter.innerHTML = `
    <option value="الكل">
      كل الدوريات
    </option>

    ${leagues
      .map(
        league => `
          <option value="${escapeHTML(league)}">
            ${escapeHTML(league)}
          </option>
        `
      )
      .join("")}
  `;

  const exists =
    leagues.includes(currentValue);

  leagueFilter.value =
    exists ? currentValue : "الكل";
}

/* =========================
   البحث
========================= */

function renderMatches() {
  if (!grid) return;

  const query =
    search?.value
      ?.trim()
      ?.toLocaleLowerCase("ar-EG") || "";

  const selectedLeague =
    leagueFilter?.value || "الكل";

  const filtered = matches.filter(match => {
    const searchable = [
      match.home,
      match.away,
      match.league,
      match.country
    ]
      .join(" ")
      .toLocaleLowerCase("ar-EG");

    const searchOK =
      !query ||
      searchable.includes(query);

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

  grid.innerHTML = filtered
    .map(match => {
      const prediction =
        saved[String(match.id)];

      return `
        <article
          class="match-card goalix-match"
          data-match-id="${match.id}"
        >

          <div class="match-header">

            <span
              class="league"
              title="${escapeHTML(match.league)}"
            >
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

              <span>ضد</span>

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
              data-prediction="home"
              data-id="${match.id}"
            >
              فوز
              <span>
                ${escapeHTML(match.home)}
              </span>
            </button>

            <button
              class="choice"
              type="button"
              data-prediction="draw"
              data-id="${match.id}"
            >
              تعادل
            </button>

            <button
              class="choice"
              type="button"
              data-prediction="away"
              data-id="${match.id}"
            >
              فوز
              <span>
                ${escapeHTML(match.away)}
              </span>
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
            data-analysis-id="${match.id}"
          >
            تحليل المباراة
          </button>

        </article>
      `;
    })
    .join("");

  bindMatchButtons();
}

/* =========================
   أزرار المباريات
========================= */

function bindMatchButtons() {
  if (!grid) return;

  grid
    .querySelectorAll("[data-prediction]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const id =
            Number(button.dataset.id);

          const choice =
            button.dataset.prediction;

          predict(id, choice);
        }
      );
    });

  grid
    .querySelectorAll("[data-analysis-id]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          showAnalysis(
            Number(
              button.dataset.analysisId
            )
          );
        }
      );
    });
}

/* =========================
   التوقعات
========================= */

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

  if (!labels[choice]) return;

  const saved =
    getPredictions();

  saved[String(id)] = {
    choice,
    label: labels[choice],
    createdAt:
      new Date().toISOString()
  };

  savePredictions(saved);

  updateCount();
  renderMatches();

  showAnalysis(id, true);
}

function updateCount() {
  if (!predictionCount) return;

  predictionCount.textContent =
    Object.keys(
      getPredictions()
    ).length;
}

/* =========================
   التحليل
========================= */

function calculateAnalysis(match) {
  if (match.homeWinner === true) {
    return {
      title:
        `أفضلية ${match.home}`,
      type: "home"
    };
  }

  if (match.awayWinner === true) {
    return {
      title:
        `أفضلية ${match.away}`,
      type: "away"
    };
  }

  return {
    title:
      "المباراة متوازنة",
    type: "draw"
  };
}

function showAnalysis(id, fromPrediction = false) {
  const match =
    matches.find(
      item => item.id === id
    );

  if (!match || !analysis) return;

  const saved =
    getPredictions();

  const prediction =
    saved[String(id)];

  const result =
    calculateAnalysis(match);

  const hasResult =
    match.homeGoals !== null &&
    match.homeGoals !== undefined &&
    match.awayGoals !== null &&
    match.awayGoals !== undefined;

  const score =
    hasResult
      ? `${match.homeGoals} - ${match.awayGoals}`
      : "لم تبدأ";

  const penalties =
    match.homePenalty !== null &&
    match.homePenalty !== undefined &&
    match.awayPenalty !== null &&
    match.awayPenalty !== undefined
      ? `
        <div class="analysis-row">
          <span>ركلات الترجيح</span>
          <strong>
            ${escapeHTML(match.homePenalty)}
            -
            ${escapeHTML(match.awayPenalty)}
          </strong>
        </div>
      `
      : "";

  analysis.innerHTML = `
    <div class="analysis-box">

      <div class="analysis-title">
        ${fromPrediction
          ? "تم تسجيل توقعك ✅"
          : "تحليل GOALIX ⚽"}
      </div>

      <h3>
        ${escapeHTML(match.home)}
        <span> ضد </span>
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
          ${escapeHTML(score)}
        </strong>
      </div>

      ${penalties}

      <div class="analysis-row">
        <span>قراءة GOALIX</span>
        <strong>
          ${escapeHTML(result.title)}
        </strong>
      </div>

      ${
        prediction
          ? `
            <div class="analysis-row">
              <span>توقعك</span>
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
        تنبيه: تحليل GOALIX إحصائي مبدئي
        ولا يضمن نتيجة المباراة.
      </p>

    </div>
  `;

  analysis.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

/* =========================
   التنقل
========================= */

function setupTabs() {
  const buttons =
    document.querySelectorAll(
      "nav button[data-tab]"
    );

  const pages =
    document.querySelectorAll(
      ".page"
    );

  buttons.forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const targetId =
          button.dataset.tab;

        const target =
          document.getElementById(
            targetId
          );

        if (!target) return;

        buttons.forEach(item =>
          item.classList.remove(
            "active"
          )
        );

        pages.forEach(page =>
          page.classList.remove(
            "active"
          )
        );

        button.classList.add(
          "active"
        );

        target.classList.add(
          "active"
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    );
  });
}

/* =========================
   الوضع الليلي / النهاري
========================= */

function setupTheme() {
  const theme =
    document.getElementById("theme");

  if (!theme) return;

  let savedTheme = null;

  try {
    savedTheme =
      localStorage.getItem(
        "goalix_theme"
      );
  } catch {}

  if (savedTheme === "light") {
    document.body.classList.add(
      "light"
    );

    theme.textContent = "☀";
    theme.setAttribute(
      "aria-label",
      "تفعيل الوضع الداكن"
    );
  } else {
    theme.textContent = "☾";
    theme.setAttribute(
      "aria-label",
      "تفعيل الوضع الفاتح"
    );
  }

  theme.addEventListener(
    "click",
    () => {
      const isLight =
        document.body.classList.toggle(
          "light"
        );

      theme.textContent =
        isLight ? "☀" : "☾";

      theme.setAttribute(
        "aria-label",
        isLight
          ? "تفعيل الوضع الداكن"
          : "تفعيل الوضع الفاتح"
      );

      try {
        localStorage.setItem(
          "goalix_theme",
          isLight
            ? "light"
            : "dark"
        );
      } catch {}
    }
  );
}

/* =========================
   البحث والفلاتر
========================= */

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

/* =========================
   زر مباريات اليوم
========================= */

window.scrollToMatches =
  function () {
    document
      .getElementById(
        "matches-section"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  };

/* =========================
   تشغيل GOALIX
========================= */

setupTabs();
setupTheme();
updateCount();
loadMatches();
