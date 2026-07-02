/* Availability calendar — self-contained renderer (no dependencies).
 *
 * Reads window.AVAILABILITY (see availability-data.js) and renders a
 * month-grid calendar into a container. A day is shown as "busy" when
 * its NIGHT is booked: `from` (check-in) is busy, `to` (check-out) is
 * free for a new arrival — the same end-exclusive semantics as the
 * iCal feeds Booking.com/Airbnb export, so the data source can later
 * be swapped for an OTA feed without touching this renderer.
 *
 * Public API:
 *   AvailabilityCalendar.mount(container, { lang: "sr" | "en" })
 *   AvailabilityCalendar.setLang(lang)   — re-renders in place
 */
(function () {
  const STRINGS = {
    sr: {
      months: [
        "Januar", "Februar", "Mart", "April", "Maj", "Jun",
        "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
      ],
      weekdays: ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"],
      weekdaysLong: ["ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota", "nedelja"],
      free: "Slobodno",
      busy: "Zauzeto",
      past: "Prošli datumi",
      today: "Danas",
      prevMonth: "Prethodni mesec",
      nextMonth: "Sledeći mesec",
      updated: "Ažurirano",
      minNights: (n) => `Minimalan boravak: ${n} ${n === 1 ? "noć" : n < 5 ? "noći" : "noći"}`,
      disclaimer:
        "Kalendar je informativan — dostupnost termina potvrđujemo kroz upit.",
      dayLabel: (d, m, y, state) => `${d}. ${m.toLowerCase()} ${y}. — ${state.toLowerCase()}`,
    },
    en: {
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ],
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      weekdaysLong: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      free: "Available",
      busy: "Booked",
      past: "Past dates",
      today: "Today",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      updated: "Updated",
      minNights: (n) => `Minimum stay: ${n} ${n === 1 ? "night" : "nights"}`,
      disclaimer: "The calendar is indicative — dates are confirmed through an inquiry.",
      dayLabel: (d, m, y, state) => `${d} ${m} ${y} — ${state.toLowerCase()}`,
    },
  };

  const MONTHS_AHEAD = 11; // how far guests can browse (current month + 11)
  const state = { container: null, lang: "sr", offset: 0, busyNights: null };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function keyOf(y, m, d) {
    return `${y}-${pad2(m + 1)}-${pad2(d)}`;
  }

  function parseIso(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
    if (!m) return null;
    const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (
      date.getFullYear() !== Number(m[1]) ||
      date.getMonth() !== Number(m[2]) - 1 ||
      date.getDate() !== Number(m[3])
    ) {
      return null;
    }
    return date;
  }

  function collectBusyNights() {
    const nights = new Set();
    const data = window.AVAILABILITY;
    const ranges = data && Array.isArray(data.busy) ? data.busy : [];

    ranges.forEach((range) => {
      const from = parseIso(range.from);
      const to = parseIso(range.to);
      if (!from || !to || to <= from) {
        console.warn("[availability] skipped invalid range:", range);
        return;
      }
      // every night from check-in up to (excluding) check-out day
      for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
        nights.add(keyOf(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    });

    return nights;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function monthsPerView() {
    return window.matchMedia("(min-width: 760px)").matches ? 2 : 1;
  }

  function buildMonth(year, month, t, today, busyNights) {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadBlanks = (first.getDay() + 6) % 7; // Monday-first grid

    const headRow = t.weekdays
      .map((wd, i) => `<th scope="col" abbr="${t.weekdaysLong[i]}">${wd}</th>`)
      .join("");

    let cells = "";
    for (let i = 0; i < leadBlanks; i++) cells += '<td class="avail-blank"></td>';

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const isBusy = busyNights.has(keyOf(year, month, day));

      const cls = ["avail-day"];
      if (isPast) cls.push("avail-day--past");
      else if (isBusy) cls.push("avail-day--busy");
      else cls.push("avail-day--free");
      if (isToday) cls.push("avail-day--today");

      const stateLabel = isPast ? t.past : isBusy ? t.busy : t.free;
      const label = t.dayLabel(day, t.months[month], year, stateLabel);
      cells += `<td class="${cls.join(" ")}" aria-label="${label}"><span>${day}</span></td>`;

      if ((leadBlanks + day) % 7 === 0 && day !== daysInMonth) {
        cells += "</tr><tr>";
      }
    }

    const tailBlanks = (7 - ((leadBlanks + daysInMonth) % 7)) % 7;
    for (let i = 0; i < tailBlanks; i++) cells += '<td class="avail-blank"></td>';

    return `
      <table class="avail-month">
        <caption class="avail-month-name">${t.months[month]} ${year}.</caption>
        <thead><tr>${headRow}</tr></thead>
        <tbody><tr>${cells}</tr></tbody>
      </table>
    `;
  }

  function render() {
    const t = STRINGS[state.lang] || STRINGS.sr;
    const today = startOfToday();
    const count = monthsPerView();
    const maxOffset = Math.max(0, MONTHS_AHEAD - (count - 1));
    if (state.offset > maxOffset) state.offset = maxOffset;

    const base = new Date(today.getFullYear(), today.getMonth() + state.offset, 1);
    let monthsMarkup = "";
    for (let i = 0; i < count; i++) {
      const m = new Date(base.getFullYear(), base.getMonth() + i, 1);
      monthsMarkup += buildMonth(m.getFullYear(), m.getMonth(), t, today, state.busyNights);
    }

    const data = window.AVAILABILITY || {};
    const minNights = Number(data.minNights) || 0;
    const updated = parseIso(data.updated);
    const updatedLabel = updated
      ? `${t.updated}: ${updated.getDate()}. ${t.months[updated.getMonth()].toLowerCase()} ${updated.getFullYear()}.`
      : "";

    state.container.innerHTML = `
      <div class="avail-nav">
        <button type="button" class="avail-nav-btn" data-step="-1"
          aria-label="${t.prevMonth}" ${state.offset === 0 ? "disabled" : ""}>‹</button>
        <div class="avail-months">${monthsMarkup}</div>
        <button type="button" class="avail-nav-btn" data-step="1"
          aria-label="${t.nextMonth}" ${state.offset >= maxOffset ? "disabled" : ""}>›</button>
      </div>
      <div class="avail-legend" aria-hidden="false">
        <span class="avail-key avail-key--free">${t.free}</span>
        <span class="avail-key avail-key--busy">${t.busy}</span>
        <span class="avail-key avail-key--today">${t.today}</span>
      </div>
      <p class="avail-note">
        ${t.disclaimer}${minNights > 0 ? ` ${t.minNights(minNights)}.` : ""}
        ${updatedLabel ? `<span class="avail-updated">${updatedLabel}</span>` : ""}
      </p>
    `;

    state.container.querySelectorAll(".avail-nav-btn").forEach((button) => {
      button.addEventListener("click", () => {
        state.offset = Math.min(Math.max(0, state.offset + Number(button.dataset.step)), maxOffset);
        render();
      });
    });
  }

  let resizeTimer = null;

  window.AvailabilityCalendar = {
    mount(container, options = {}) {
      state.container = container;
      state.lang = options.lang === "en" ? "en" : "sr";
      state.busyNights = collectBusyNights();
      render();

      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 150);
      });
    },
    setLang(lang) {
      state.lang = lang === "en" ? "en" : "sr";
      if (state.container) render();
    },
  };
})();
