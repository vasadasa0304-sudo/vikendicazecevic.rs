/* Availability calendar — self-contained renderer (no dependencies).
 *
 * Data source, in order:
 *   1. options.endpoint (e.g. "/api/availability" — Netlify function that
 *      reads the owner's Google Calendar iCal feed server-side)
 *   2. window.AVAILABILITY (manual fallback file, availability-data.js)
 *   3. nothing → the container is hidden entirely.
 *
 * A day is "busy" when its NIGHT is booked: `from` (check-in) is busy,
 * `to` (check-out morning) is free for a new arrival — the same
 * end-exclusive semantics as Google/OTA iCal feeds.
 *
 * Guests can select an available range (check-in → check-out). The
 * selection is reported through options.onSelect(null | {from, to,
 * nights, label}) so the host page can prefill the inquiry form.
 *
 * Public API:
 *   AvailabilityCalendar.mount(container, {
 *     lang: "sr" | "en",
 *     endpoint?: string,
 *     selectable?: boolean,
 *     minNights?: number,
 *     onSelect?: (selection) => void,
 *   })
 *   AvailabilityCalendar.setLang(lang)
 *   AvailabilityCalendar.getSelection()
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
      selected: "Izabrano",
      prevMonth: "Prethodni mesec",
      nextMonth: "Sledeći mesec",
      updated: "Ažurirano",
      loading: "Učitavanje popunjenosti…",
      selectHint: "Izaberite datum dolaska, pa datum odlaska.",
      night: (n) => (n % 10 === 1 && n % 100 !== 11 ? "noć" : "noći"),
      minNights: (n) => `Minimalan boravak: ${n} ${n % 10 === 1 && n % 100 !== 11 ? "noć" : "noći"}`,
      disclaimer: "Kalendar je informativan — dostupnost termina potvrđujemo kroz upit.",
      dayLabel: (d, m, y, state) => `${d}. ${m.toLowerCase()} ${y}. — ${state.toLowerCase()}`,
      rangeLabel: (f, t, n, nightWord) => `${f} — ${t} (${n} ${nightWord})`,
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
      selected: "Selected",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      updated: "Updated",
      loading: "Loading availability…",
      selectHint: "Pick a check-in date, then a check-out date.",
      night: (n) => (n === 1 ? "night" : "nights"),
      minNights: (n) => `Minimum stay: ${n} ${n === 1 ? "night" : "nights"}`,
      disclaimer: "The calendar is indicative — dates are confirmed through an inquiry.",
      dayLabel: (d, m, y, state) => `${d} ${m} ${y} — ${state.toLowerCase()}`,
      rangeLabel: (f, t, n, nightWord) => `${f} — ${t} (${n} ${nightWord})`,
    },
  };

  const MONTHS_AHEAD = 11; // how far guests can browse (current month + 11)

  const state = {
    container: null,
    lang: "sr",
    offset: 0,
    busyNights: new Set(),
    updated: "",
    source: "none",
    minNights: 0,
    selectable: false,
    onSelect: null,
    selStart: null, // "YYYY-MM-DD"
    selEnd: null,
    loaded: false,
  };

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

  function collectBusyNights(ranges) {
    const nights = new Set();
    (Array.isArray(ranges) ? ranges : []).forEach((range) => {
      const from = parseIso(range.from);
      const to = parseIso(range.to);
      if (!from || !to || to <= from) {
        console.warn("[availability] skipped invalid range:", range);
        return;
      }
      for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
        nights.add(keyOf(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    });
    return nights;
  }

  async function loadData(endpoint) {
    if (endpoint) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timer);
        if (response.ok) {
          const data = await response.json();
          if (data && data.ok && Array.isArray(data.busy)) {
            return { busy: data.busy, updated: data.updated || "", source: "live" };
          }
        }
      } catch {
        /* fall through to the manual file */
      }
    }
    const manual = window.AVAILABILITY;
    if (manual && Array.isArray(manual.busy)) {
      return { busy: manual.busy, updated: manual.updated || "", source: "manual" };
    }
    return null;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function monthsPerView() {
    return window.matchMedia("(min-width: 760px)").matches ? 2 : 1;
  }

  function nightsBetween(fromIso, toIso) {
    return Math.round((parseIso(toIso) - parseIso(fromIso)) / 86400000);
  }

  function rangeIsFree(fromIso, toIso) {
    const from = parseIso(fromIso);
    const to = parseIso(toIso);
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      if (state.busyNights.has(keyOf(d.getFullYear(), d.getMonth(), d.getDate()))) return false;
    }
    return true;
  }

  function formatHuman(iso, t) {
    const date = parseIso(iso);
    return state.lang === "sr"
      ? `${date.getDate()}. ${t.months[date.getMonth()].toLowerCase()} ${date.getFullYear()}.`
      : `${date.getDate()} ${t.months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function currentSelection() {
    if (!state.selStart || !state.selEnd) return null;
    const t = STRINGS[state.lang] || STRINGS.sr;
    const nights = nightsBetween(state.selStart, state.selEnd);
    return {
      from: state.selStart,
      to: state.selEnd,
      nights,
      label: t.rangeLabel(
        formatHuman(state.selStart, t),
        formatHuman(state.selEnd, t),
        nights,
        t.night(nights)
      ),
    };
  }

  function reportSelection() {
    if (typeof state.onSelect === "function") state.onSelect(currentSelection());
  }

  function handleDayClick(dateKey) {
    if (state.selStart && !state.selEnd && dateKey === state.selStart) {
      state.selStart = null; // tap again to clear
    } else if (
      state.selStart &&
      !state.selEnd &&
      dateKey > state.selStart &&
      rangeIsFree(state.selStart, dateKey) &&
      nightsBetween(state.selStart, dateKey) >= Math.max(1, state.minNights)
    ) {
      state.selEnd = dateKey;
    } else {
      // a busy day can never START a stay — an invalid tap clears the selection
      state.selStart = state.busyNights.has(dateKey) ? null : dateKey;
      state.selEnd = null;
    }
    render();
    reportSelection();
  }

  function buildMonth(year, month, t, today, todayKey) {
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
      const dateKey = keyOf(year, month, day);
      const isPast = date < today;
      const isToday = dateKey === todayKey;
      const isBusy = state.busyNights.has(dateKey);
      // checkout day: guests may leave the morning a new booking starts,
      // so the selected end date itself may sit on a busy night
      const isSelEdge = dateKey === state.selStart || dateKey === state.selEnd;
      const isInRange =
        state.selStart && state.selEnd && dateKey > state.selStart && dateKey < state.selEnd;

      const cls = ["avail-day"];
      if (isPast) cls.push("avail-day--past");
      else if (isBusy) cls.push("avail-day--busy");
      else cls.push("avail-day--free");
      if (isToday) cls.push("avail-day--today");
      if (isSelEdge) cls.push("avail-day--selected");
      if (isInRange) cls.push("avail-day--inrange");

      const stateLabel = isSelEdge
        ? t.selected
        : isPast
          ? t.past
          : isBusy
            ? t.busy
            : t.free;
      const label = t.dayLabel(day, t.months[month], year, stateLabel);

      const selectableDay =
        state.selectable &&
        !isPast &&
        (!isBusy ||
          // a busy check-in day can still be a valid CHECK-OUT day
          (state.selStart && !state.selEnd && dateKey > state.selStart));

      cells += selectableDay
        ? `<td class="${cls.join(" ")}"><button type="button" class="avail-day-btn" data-date="${dateKey}" aria-label="${label}" ${isSelEdge ? 'aria-pressed="true"' : ""}><span>${day}</span></button></td>`
        : `<td class="${cls.join(" ")}" aria-label="${label}"><span>${day}</span></td>`;

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

    if (!state.loaded) {
      state.container.innerHTML = `<p class="avail-note">${t.loading}</p>`;
      return;
    }

    const today = startOfToday();
    const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());
    const count = monthsPerView();
    const maxOffset = Math.max(0, MONTHS_AHEAD - (count - 1));
    if (state.offset > maxOffset) state.offset = maxOffset;

    const base = new Date(today.getFullYear(), today.getMonth() + state.offset, 1);
    let monthsMarkup = "";
    for (let i = 0; i < count; i++) {
      const m = new Date(base.getFullYear(), base.getMonth() + i, 1);
      monthsMarkup += buildMonth(m.getFullYear(), m.getMonth(), t, today, todayKey);
    }

    const updated = parseIso(state.updated);
    const updatedLabel = updated ? `${t.updated}: ${formatHuman(state.updated, t)}` : "";

    state.container.innerHTML = `
      <div class="avail-nav">
        <button type="button" class="avail-nav-btn" data-step="-1"
          aria-label="${t.prevMonth}" ${state.offset === 0 ? "disabled" : ""}>‹</button>
        <div class="avail-months">${monthsMarkup}</div>
        <button type="button" class="avail-nav-btn" data-step="1"
          aria-label="${t.nextMonth}" ${state.offset >= maxOffset ? "disabled" : ""}>›</button>
      </div>
      <div class="avail-legend">
        <span class="avail-key avail-key--free">${t.free}</span>
        <span class="avail-key avail-key--busy">${t.busy}</span>
        <span class="avail-key avail-key--today">${t.today}</span>
        ${state.selectable ? `<span class="avail-key avail-key--selected">${t.selected}</span>` : ""}
      </div>
      <p class="avail-note">
        ${state.selectable ? `${t.selectHint} ` : ""}${t.disclaimer}${state.minNights > 0 ? ` ${t.minNights(state.minNights)}.` : ""}
        ${updatedLabel ? `<span class="avail-updated">${updatedLabel}</span>` : ""}
      </p>
    `;

    state.container.querySelectorAll(".avail-nav-btn").forEach((button) => {
      button.addEventListener("click", () => {
        state.offset = Math.min(
          Math.max(0, state.offset + Number(button.dataset.step)),
          maxOffset
        );
        render();
      });
    });

    state.container.querySelectorAll(".avail-day-btn").forEach((button) => {
      button.addEventListener("click", () => handleDayClick(button.dataset.date));
    });
  }

  let resizeTimer = null;

  window.AvailabilityCalendar = {
    async mount(container, options = {}) {
      state.container = container;
      state.lang = options.lang === "en" ? "en" : "sr";
      state.selectable = Boolean(options.selectable);
      state.onSelect = options.onSelect || null;
      state.loaded = false;
      render();

      const data = await loadData(options.endpoint);
      if (!data) {
        container.hidden = true;
        console.info("[availability] no data source — calendar hidden");
        return;
      }

      state.busyNights = collectBusyNights(data.busy);
      state.updated = data.updated;
      state.source = data.source;
      state.minNights =
        Number(options.minNights) ||
        Number(window.AVAILABILITY && window.AVAILABILITY.minNights) ||
        0;
      state.loaded = true;
      render();

      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 150);
      });
    },
    setLang(lang) {
      state.lang = lang === "en" ? "en" : "sr";
      if (state.container) {
        render();
        reportSelection();
      }
    },
    getSelection() {
      return currentSelection();
    },
  };
})();
