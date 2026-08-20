data/matches.json
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

      <div class="match-time">
        ${match.time}
      </div>

      <div class="teams">

        <div class="team">
          <strong>${match.home}</strong>
        </div>

        <div class="vs">
          VS
        </div>

        <div class="team">
          <strong>${match.away}</strong>
        </div>

      </div>

      <div class="choices">

        <button
          class="choice"
          onclick="predict(${match.id}, 'فوز ${match.home}')">
          ${match.home}
        </button>

        <button
          class="choice"
          onclick="predict(${match.id}, 'تعادل')">
          تعادل
        </button>

        <button
          class="choice"
          onclick="predict(${match.id}, 'فوز ${match.away}')">
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

/* التنقل بين الأقسام */

document.querySelectorAll("nav button").forEach(button => {

  button.addEventListener("click", () => {

    const tab = button.dataset.tab;

    document.querySelectorAll("nav button").forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    document.querySelectorAll(".page").forEach(page => {
      page.classList.remove("active");
    });

    const target = document.getElementById(
      tab === "matches"
        ? "matches-section"
        : tab
    );

    if (target) {
      target.classList.add("active");
    }

  });

});

/* الوضع الليلي / الفاتح */

const themeButton = document.getElementById("theme");

if (themeButton) {

  themeButton.addEventListener("click", () => {

    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {
      themeButton.textContent = "☀️";
      localStorage.setItem("goalix-theme", "light");
    } else {
      themeButton.textContent = "☾";
      localStorage.setItem("goalix-theme", "dark");
    }

  });

}

/* استعادة المظهر */

if (localStorage.getItem("goalix-theme") === "light") {
  document.body.classList.add("light");

  if (themeButton) {
    themeButton.textContent = "☀️";
  }
}

/* التاريخ */

const dateElement = document.getElementById("date");

if (dateElement) {

  const today = new Date();

  dateElement.textContent =
    today.toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

}

/* تشغيل المباريات */

document.addEventListener("DOMContentLoaded", () => {
  renderMatches();
});
