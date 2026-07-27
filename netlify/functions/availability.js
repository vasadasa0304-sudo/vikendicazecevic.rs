/* GET /api/availability — public availability feed for the site calendar.
 *
 * Reads the owner's Google Calendar via its SECRET iCal URL (env var
 * AVAILABILITY_ICS_URL, set in Netlify — never shipped to the browser),
 * and returns ONLY busy date ranges. Event titles, guest names and any
 * other details are stripped server-side, so nothing private can leak.
 *
 * Range semantics match the site calendar and OTA iCal feeds:
 * `from` = first busy night (check-in), `to` = exclusive end (checkout
 * morning — that day is free for a new arrival).
 *
 * Not configured (no env var) → 503 {ok:false, code:"not_configured"}
 * and the site calendar silently falls back / hides itself.
 */

const CACHE_TTL_MS = 15 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 8000;
const MAX_ICS_BYTES = 2 * 1024 * 1024;
const HORIZON_PAST_DAYS = 45;
const HORIZON_FUTURE_DAYS = 550;

const cache = globalThis.__AVAILABILITY_CACHE || { at: 0, payload: null };
globalThis.__AVAILABILITY_CACHE = cache;

function jsonResponse(statusCode, payload, maxAgeSeconds = 0) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": maxAgeSeconds > 0 ? `public, max-age=${maxAgeSeconds}` : "no-store",
    },
    body: JSON.stringify(payload),
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/* "20260710" | "20260710T140000Z" | "20260710T140000" → "2026-07-10" (date part only) */
function icsValueToIsoDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(String(value || "").trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function isoDateToUtc(iso) {
  const [y, mo, d] = iso.split("-").map(Number);
  return Date.UTC(y, mo - 1, d);
}

function addDaysIso(iso, days) {
  const t = new Date(isoDateToUtc(iso) + days * 86400000);
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

function getProp(eventText, name) {
  const re = new RegExp(`^${name}(?:;[^:\\r\\n]*)?:(.+)$`, "m");
  const m = re.exec(eventText);
  return m ? m[1].trim() : "";
}

/* Parse an ICS text into clean busy ranges. Exported for tests. */
function parseIcs(icsText, todayIso) {
  const unfolded = String(icsText || "").replace(/\r?\n[ \t]/g, "");
  const ranges = [];
  const warnings = [];

  const minIso = addDaysIso(todayIso, -HORIZON_PAST_DAYS);
  const maxIso = addDaysIso(todayIso, HORIZON_FUTURE_DAYS);

  const eventRe = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;
  while ((match = eventRe.exec(unfolded)) !== null) {
    const event = match[1];

    if (/^STATUS:CANCELLED$/m.test(event)) continue;
    // "Free" (transparent) events don't block availability
    if (/^TRANSP:TRANSPARENT$/m.test(event)) continue;
    if (/^RRULE:/m.test(event)) {
      warnings.push("recurring_event_first_instance_only");
    }

    const dtstart = getProp(event, "DTSTART");
    const dtend = getProp(event, "DTEND");
    const from = icsValueToIsoDate(dtstart);
    // No DTEND (zero-length/all-day single) → one night
    let to = dtend ? icsValueToIsoDate(dtend) : from ? addDaysIso(from, 1) : "";

    if (!from || !to) continue;
    // Timed event ending same day it starts → not an overnight stay
    if (to <= from) continue;
    // Keep only ranges near the horizon (bounds payload size)
    if (to < minIso || from > maxIso) continue;

    ranges.push({ from, to });
  }

  // newest LAST-MODIFIED across events ≈ when the owner last edited bookings
  let updated = "";
  const modRe = /^LAST-MODIFIED(?:;[^:\r\n]*)?:(.+)$/gm;
  let mod;
  while ((mod = modRe.exec(unfolded)) !== null) {
    const iso = icsValueToIsoDate(mod[1]);
    if (iso > updated) updated = iso;
  }

  ranges.sort((a, b) => (a.from < b.from ? -1 : 1));

  // Duplicate calendar entries (the same stay saved twice, or an event carried
  // in the feed more than once) produced identical ranges in the payload. The
  // renderer is idempotent so it never showed, but the API should not report a
  // busy range twice — dedupe on the exact from/to pair.
  const seenRange = new Set();
  const busy = ranges.filter((range) => {
    const key = `${range.from}|${range.to}`;
    if (seenRange.has(key)) return false;
    seenRange.add(key);
    return true;
  });
  if (busy.length !== ranges.length) warnings.push("duplicate_events_removed");

  return { busy, updated, warnings: [...new Set(warnings)] };
}

async function fetchIcs(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "vikendicazecevic.rs availability sync" },
    });
    if (!response.ok) {
      throw new Error(`upstream_status_${response.status}`);
    }
    const text = await response.text();
    if (text.length > MAX_ICS_BYTES) {
      throw new Error("upstream_too_large");
    }
    if (!text.includes("BEGIN:VCALENDAR")) {
      throw new Error("upstream_not_ics");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { ok: false, code: "method_not_allowed" });
  }

  const icsUrl = String(process.env.AVAILABILITY_ICS_URL || "").trim();
  if (!icsUrl) {
    return jsonResponse(503, { ok: false, code: "not_configured" });
  }

  const now = Date.now();
  if (cache.payload && now - cache.at < CACHE_TTL_MS) {
    return jsonResponse(200, cache.payload, 900);
  }

  try {
    const icsText = await fetchIcs(icsUrl);
    const todayIso = new Date().toISOString().slice(0, 10);
    const { busy, updated, warnings } = parseIcs(icsText, todayIso);

    const payload = { ok: true, source: "google-calendar", updated, busy };
    if (warnings.length) payload.warnings = warnings;

    cache.at = now;
    cache.payload = payload;
    return jsonResponse(200, payload, 900);
  } catch (error) {
    console.error("[availability] upstream_failed", {
      message: String(error && error.message).slice(0, 120),
    });
    // serve stale data rather than an empty calendar if we ever had any
    if (cache.payload) {
      return jsonResponse(200, { ...cache.payload, stale: true }, 300);
    }
    return jsonResponse(502, { ok: false, code: "upstream_error" });
  }
};

module.exports.parseIcs = parseIcs;
