let matches = [];

const grid = document.getElementById("matches");
const analysis = document.getElementById("analysis");
const search = document.getElementById("search");
const leagueFilter = document.getElementById("league-filter");
const date = document.getElementById("date");
const predictionCount = document.getElementById("prediction-count");

function predictions() {
  try {
    return JSON.parse(
      localStorage.getItem("goalix_predictions") || "{}"
    );
  } catch {
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

  if (Number.isNaN(d.getTime())) return "--:--";

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

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Cairo"
  });
}

function getStatus(status) {
  const short = status?.short || "";

  if (short === "FT" || short === "AET" || short === "PEN") {
    return "انتهت";
  }

  if (short === "LIVE" || short === "1H" || short === "2H" ||
      short === "HT" || short === "ET" || short === "BT" ||
      short === "P") {
    return "مباشرة";
  }

  if (short === "PST") {
    return "مؤجلة";
  }

  if (short === "CANC") {
    return "ملغاة";
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
      league: item.league?.name || "بطولة غير معروفة",
      country: item.league?.country || "",
      home: item.teams?.home?.name || "الفريق المضيف",
      away: item.teams?.away?.name || "الفريق الضيف",
      homeLogo: item.teams?.home?.logo || "",
      awayLogo: item.teams?.away?.logo || "",
      time: formatTime(item.fixture.date),
      status: getStatus(item.fixture.status),
      statusShort: item.fixture.status?.short || "",
      homeGoals: item.goals?.home,
      awayGoals: item.goals?.away
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
      throw new Error("تعذر تحميل ملف المباريات");
    }

    const data = await response.json();

    matches = normalizeMatches(data);

    if (!matches.length) {
      throw new Error("لم يتم العثور على مباريات");
    }

    if (date && matches[0]?.date) {
      date.textContent = formatDate(matches[0].date);
    }

    renderLeagues();
    renderMatches();
    updateCount();

  } catch (error) {
    console.error("GOALIX:", error);

    if (grid) {
      grid.innerHTML = `
        <div class="no-matches">
          تعذر تحميل المباريات حاليًا.<br>
          تأكد من اتصال الإنترنت ثم أعد تحميل الصفحة.
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
        .map(m => m.league)
        .filter(Boolean)
    )
  ];

  leagueFilter.innerHTML = leagues
    .map(
      league =>
        `<option value="${escapeHTML(league)}">${escapeHTML(league)}</option>`
    )
    .join("");
}

function renderMatches() {
  if (!grid) return;

  const query =
    search?.value.trim().toLowerCase() || "";

  const league =
    leagueFilter?.value || "الكل";

  const filtered = matches.filter(m => {
    const searchOK =
      !query ||
      m.home.toLowerCase().includes(query) ||
      m.away.toLowerCase().includes(query) ||
      m.league.toLowerCase().includes(query);

    const leagueOK =
      league === "الكل" ||
      m.league === league;

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

  const saved = predictions();

  grid.innerHTML = filtered
    .map(m => {
      const prediction = saved[m.id];

      return `
        <article class="match-card">

          <div class="match-header">
            <span class="league">
              ${escapeHTML(m.league)}
            </span>

            <span class="match-status">
              ${escapeHTML(m.status)}
            </span>
          </div>

          <div class="match-time">
            ${escapeHTML(m.time)}
          </div>

          <div class="teams">

            <div class="team">
              ${
                m.homeLogo
                  ? `<img src="${escapeHTML(m.homeLogo)}"
                       alt=""
                       loading="lazy"
                       width="40"
                       height="40">`
                  : ""
              }

              <span>${escapeHTML(m.home)}</span>
            </div>

            <div class="vs">
              ضد
            </div>

            <div class="team">
              ${
                m.awayLogo
                  ? `<img src="${escapeHTML(m.awayLogo)}"
                       alt=""
                       loading="lazy"
                       width="40"
                       height="40">`
                  : ""
              }

              <span>${escapeHTML(m.away)}</span>
            </div>

          </div>

          ${
            m.homeGoals !== null &&
            m.homeGoals !== undefined &&
            m.awayGoals !== null &&
            m.awayGoals !== undefined
              ? `
                <div class="match-score">
                  ${escapeHTML(m.homeGoals)}
                  -
                  ${escapeHTML(m.awayGoals)}
                </div>
              `
              : ""
          }

          <div class="choices">

            <button
              class="choice"
              onclick="predict(${Number(m.id)}, 'home')">
              فوز ${escapeHTML(m.home)}
            </button>

            <button
              class="choice"
              onclick="predict(${Number(m.id)}, 'draw')">
              تعادل
            </button>

            <button
              class="choice"
              onclick="predict(${Number(m.id)}, 'away')">
              فوز ${escapeHTML(m.away)}
            </button>

          </div>

          <div class="prediction-status">
            ${
              prediction
                ? `توقعك: ${escapeHTML(prediction.label)}`
                : "لم يتم اختيار توقع"
            }
          </div>

          <button
            class="analysis-button"
            onclick="showAnalysis(${Number(m.id)})">
            تحليل المباراة
          </button>

        </article>
      `;
    })
    .join("");
}

function predict(id, choice) {
  const match = matches.find(m => m.id === id);

  if (!match) return;

  const labels = {
    home: `فوز ${match.home}`,
    draw: "تعادل",
    away: `فوز ${match.away}`
  };

  const saved = predictions();

  saved[id] = {
    choice,
    label: labels[choice]
  };

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
          ${escapeHTML(labels[choice])}
        </strong>

      </div>
    `;
  }
}

function showAnalysis(id) {
  const match = matches.find(m => m.id === id);

  if (!match || !analysis) return;

  const saved = predictions();
  const prediction = saved[id];

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
        <span>موعد المباراة</span>
        <strong>${escapeHTML(match.time)}</strong>
      </div>

      <div class="analysis-row">
        <span>البطولة</span>
        <strong>${escapeHTML(match.league)}</strong>
      </div>

      <div class="analysis-row">
        <span>الحالة</span>
        <strong>${escapeHTML(match.status)}</strong>
      </div>

      ${
        prediction
          ? `
            <div class="analysis-row">
              <span>توقعك</span>
              <strong>${escapeHTML(prediction.label)}</strong>
            </div>
          `
          : ""
      }

      <p class="analysis-note">
        تحليل GOALIX الحالي يعتمد على بيانات المباراة المتاحة.
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
  document
    .querySelectorAll("nav button")
    .forEach(button => {

      button.addEventListener("click", () => {

        const target =
          document.getElementById(button.dataset.tab);

        if (!target) return;

        document
          .querySelectorAll("nav button")
          .forEach(b =>
            b.classList.remove("active")
          );

        document
          .querySelectorAll(".page")
          .forEach(p =>
            p.classList.remove("active")
          );

        button.classList.add("active");
        target.classList.add("active");
      });

    });
}

function setupTheme() {
  const theme =
    document.getElementById("theme");

  if (!theme) return;

  if (
    localStorage.getItem("goalix_theme") === "light"
  ) {
    document.body.classList.add("light");
    theme.textContent = "☀";
  }

  theme.addEventListener("click", () => {

    document.body.classList.toggle("light");

    const light =
      document.body.classList.contains("light");

    theme.textContent =
      light ? "☀" : "☾";

    localStorage.setItem(
      "goalix_theme",
      light ? "light" : "dark"
    );
  });
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
loadMatches();
