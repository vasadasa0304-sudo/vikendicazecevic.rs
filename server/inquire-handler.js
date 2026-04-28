const nodemailer = require("nodemailer");

const DEFAULT_PROPERTY_NAME = "Vikendica Zečević Zlatar";

const rateLimitStore = globalThis.__INQUIRE_RATE_LIMIT_STORE || new Map();
globalThis.__INQUIRE_RATE_LIMIT_STORE = rateLimitStore;

let mailTransporter = null;

class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class DeliveryError extends Error {
  constructor(channel, code, message, details) {
    super(message);
    this.name = "DeliveryError";
    this.channel = channel;
    this.code = code;
    this.details = details;
  }
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  };
}

function sendNodeResponse(res, response) {
  res.statusCode = response.statusCode;

  Object.entries(response.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.end(response.body);
}

function getEnvNumber(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getEnvValue(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function getEmailTo() {
  return getEnvValue("INQUIRY_EMAIL_TO", "INQUIRE_EMAIL_TO");
}

function getEmailFrom() {
  return getEnvValue("INQUIRY_EMAIL_FROM", "SMTP_FROM");
}

function getMissingTelegramConfig() {
  return ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"].filter((name) => !getEnvValue(name));
}

function getMissingEmailConfig() {
  const missing = [];

  if (!getEmailTo()) missing.push("INQUIRY_EMAIL_TO");
  if (!getEmailFrom()) missing.push("INQUIRY_EMAIL_FROM");

  ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].forEach((name) => {
    if (!getEnvValue(name)) missing.push(name);
  });

  return missing;
}

function requireDeliveryConfig(channel) {
  const missing = channel === "telegram" ? getMissingTelegramConfig() : getMissingEmailConfig();

  if (missing.length) {
    logMissingConfig(channel, missing);
    throw new DeliveryError(channel, "config_error", `${channel}_not_configured`, { missing });
  }
}

function getNotificationConfig() {
  const telegramMissing = getMissingTelegramConfig();
  const emailMissing = getMissingEmailConfig();

  return {
    telegram: {
      configured: telegramMissing.length === 0,
      missing: telegramMissing,
    },
    email: {
      configured: emailMissing.length === 0,
      missing: emailMissing,
    },
  };
}

function stripControlCharacters(value) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function sanitizeLine(value, maxLength = 160) {
  return stripControlCharacters(String(value || ""))
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeMessage(value, maxLength = 2000) {
  return stripControlCharacters(String(value || ""))
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function normalizeHeaders(input) {
  const normalized = {};

  if (!input) {
    return normalized;
  }

  if (typeof input.forEach === "function") {
    input.forEach((value, key) => {
      normalized[String(key).toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
    });

    return normalized;
  }

  Object.entries(input).forEach(([key, value]) => {
    if (value == null) return;
    normalized[String(key).toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
  });

  return normalized;
}

function getClientIp(headers) {
  const netlifyIp = headers["x-nf-client-connection-ip"];
  const forwardedFor = headers["x-forwarded-for"];
  const realIp = headers["x-real-ip"];
  const candidate = netlifyIp || forwardedFor || realIp || "";

  return sanitizeLine(candidate.split(",")[0] || "", 80);
}

function enforceRateLimit(headers) {
  const ip = getClientIp(headers);
  const windowMs = getEnvNumber("INQUIRE_RATE_LIMIT_WINDOW_MS", 10 * 60 * 1000);
  const maxRequests = getEnvNumber("INQUIRE_RATE_LIMIT_MAX", 5);

  if (!ip || maxRequests <= 0) {
    return;
  }

  const now = Date.now();
  const recent = (rateLimitStore.get(ip) || []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= maxRequests) {
    throw new AppError(429, "rate_limited", "Too many inquiry attempts. Please try again later.");
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);

  if (rateLimitStore.size > 500) {
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const fresh = timestamps.filter((timestamp) => now - timestamp < windowMs);
      if (fresh.length) {
        rateLimitStore.set(key, fresh);
      } else {
        rateLimitStore.delete(key);
      }
    }
  }
}

function parseBody(bodyText) {
  if (!bodyText) {
    return {};
  }

  try {
    const parsed = JSON.parse(bodyText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new AppError(400, "invalid_body", "Request body must be a JSON object.");
    }

    return parsed;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(400, "invalid_json", "Invalid JSON payload.");
  }
}

function normalizeDate(value) {
  const raw = sanitizeLine(value, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return "";
  }

  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return raw;
}

function normalizeTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatDisplayTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  const parts = new Intl.DateTimeFormat("sr-RS", {
    timeZone: "Europe/Belgrade",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(safeDate);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.day}.${byType.month}.${byType.year}. ${byType.hour}:${byType.minute}`;
}

function getTodayDateString() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function extractEmail(value) {
  const match = sanitizeLine(value, 200).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : "";
}

function looksLikePhone(value) {
  return sanitizeLine(value, 60).replace(/\D/g, "").length >= 6;
}

function getGuestCount(value) {
  const numbers = String(value || "").match(/\d+/g);
  if (!numbers) {
    return null;
  }

  return Math.max(...numbers.map(Number).filter(Number.isFinite));
}

function normalizeInquiry(payload) {
  return {
    honeypot: sanitizeLine(payload._hp || payload.honeypot, 120),
    propertyName: sanitizeLine(
      payload.propertyName ||
        payload.cabinName ||
        payload.property ||
        process.env.INQUIRE_PROPERTY_NAME ||
        DEFAULT_PROPERTY_NAME,
      120
    ),
    checkin: normalizeDate(payload.checkin),
    checkout: normalizeDate(payload.checkout),
    guests: sanitizeLine(payload.guests, 40),
    guestName: sanitizeLine(payload.guestName || payload.name, 120),
    contact: sanitizeLine(payload.contact, 200),
    message: sanitizeMessage(payload.message, 2000),
    timestamp: normalizeTimestamp(payload.timestamp),
    sourceLabel:
      sanitizeLine(
        payload.sourceLabel || payload.siteSource || payload.source || process.env.INQUIRE_SOURCE_LABEL,
        80
      ) || "website",
    language: sanitizeLine(payload.language, 16).toLowerCase(),
  };
}

function validateInquiry(inquiry) {
  if (inquiry.honeypot) {
    throw new AppError(429, "spam_blocked", "Submission blocked.");
  }

  const errors = [];
  const contactEmail = extractEmail(inquiry.contact);
  const hasPhoneContact = looksLikePhone(inquiry.contact);

  if (!inquiry.propertyName) {
    errors.push({ field: "propertyName", message: "Property name is required." });
  }

  if (!inquiry.checkin) {
    errors.push({ field: "checkin", message: "Check-in date is required." });
  }

  if (!inquiry.checkout) {
    errors.push({ field: "checkout", message: "Check-out date is required." });
  }

  if (inquiry.checkin && inquiry.checkout && inquiry.checkout <= inquiry.checkin) {
    errors.push({ field: "checkout", message: "Check-out must be after check-in." });
  }

  const today = getTodayDateString();
  if (inquiry.checkin && inquiry.checkin < today) {
    errors.push({ field: "checkin", message: "Check-in date must not be in the past." });
  }

  if (!inquiry.guests) {
    errors.push({ field: "guests", message: "Guest count is required." });
  }

  const guestCount = getGuestCount(inquiry.guests);
  if (inquiry.guests && (!guestCount || guestCount > 6)) {
    errors.push({ field: "guests", message: "Guest count cannot exceed 6." });
  }

  if (inquiry.guestName.length < 2) {
    errors.push({ field: "guestName", message: "Guest name is required." });
  }

  if (!contactEmail && !hasPhoneContact) {
    errors.push({
      field: "contact",
      message: "Provide at least one contact method: email or phone / WhatsApp.",
    });
  }

  if (errors.length > 0) {
    throw new AppError(400, "validation_error", "Validation failed.", errors);
  }

  return { contactEmail, hasPhoneContact };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isTestInquiry(inquiry) {
  return [inquiry.guestName, inquiry.message, inquiry.sourceLabel].some((value) =>
    String(value || "").toUpperCase().includes("TEST")
  );
}

function getInquiryHeading(inquiry) {
  return `${isTestInquiry(inquiry) ? "[TEST] " : ""}Novi upit za rezervaciju`;
}

function buildTelegramMessage(inquiry) {
  const displayTimestamp = formatDisplayTimestamp(inquiry.timestamp);
  const lines = [
    getInquiryHeading(inquiry),
    "",
    `Objekat: ${inquiry.propertyName}`,
    `Dolazak: ${inquiry.checkin}`,
    `Odlazak: ${inquiry.checkout}`,
    `Gostiju: ${inquiry.guests}`,
    `Ime: ${inquiry.guestName}`,
    `Kontakt: ${inquiry.contact}`,
    `Poruka: ${inquiry.message || "-"}`,
    `Izvor: ${inquiry.sourceLabel}`,
    `Vreme: ${displayTimestamp}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildEmailSubject(inquiry) {
  return `${getInquiryHeading(inquiry)} · ${inquiry.propertyName}`;
}

function buildEmailText(inquiry) {
  const displayTimestamp = formatDisplayTimestamp(inquiry.timestamp);
  const lines = [
    getInquiryHeading(inquiry),
    "",
    `Objekat: ${inquiry.propertyName}`,
    `Dolazak: ${inquiry.checkin}`,
    `Odlazak: ${inquiry.checkout}`,
    `Gostiju: ${inquiry.guests}`,
    `Ime: ${inquiry.guestName}`,
    `Kontakt: ${inquiry.contact}`,
    `Poruka: ${inquiry.message || "-"}`,
    `Izvor: ${inquiry.sourceLabel}`,
    `Vreme: ${displayTimestamp}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildEmailHtml(inquiry) {
  const displayTimestamp = formatDisplayTimestamp(inquiry.timestamp);
  const rows = [
    ["Objekat", inquiry.propertyName],
    ["Dolazak", inquiry.checkin],
    ["Odlazak", inquiry.checkout],
    ["Gostiju", inquiry.guests],
    ["Ime", inquiry.guestName],
    ["Kontakt", inquiry.contact],
    ["Poruka", inquiry.message || "-"],
    ["Izvor", inquiry.sourceLabel],
    ["Vreme", displayTimestamp],
  ]
    .filter(Boolean)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">${escapeHtml(
          label
        )}</td><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="sr">
  <body style="margin:0;padding:24px;font-family:Arial,sans-serif;color:#1f1a14;background:#f7f3ec;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e6ddd0;border-radius:16px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(getInquiryHeading(inquiry))}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;">${rows}</table>
    </div>
  </body>
</html>`;
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function getMailTransporter() {
  if (mailTransporter) {
    return mailTransporter;
  }

  requireDeliveryConfig("email");

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: getEnvNumber("INQUIRE_DELIVERY_TIMEOUT_MS", 8000),
    greetingTimeout: getEnvNumber("INQUIRE_DELIVERY_TIMEOUT_MS", 8000),
    socketTimeout: getEnvNumber("INQUIRE_DELIVERY_TIMEOUT_MS", 8000),
  });

  return mailTransporter;
}

async function sendTelegramInquiry(inquiry) {
  requireDeliveryConfig("telegram");

  const response = await withTimeout(
    fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        disable_web_page_preview: true,
        text: buildTelegramMessage(inquiry),
      }),
    }),
    getEnvNumber("INQUIRE_DELIVERY_TIMEOUT_MS", 8000),
    "telegram"
  );

  if (!response.ok) {
    let description = response.statusText;

    try {
      const data = await response.json();
      description = data.description || description;
    } catch {}

    throw new DeliveryError("telegram", "provider_error", `telegram_request_failed:${response.status}`, {
      description,
    });
  }

  const data = await response.json();

  if (!data.ok) {
    throw new DeliveryError("telegram", "provider_error", "telegram_api_error", {
      description: data.description || "unknown_error",
    });
  }

  return data.result?.message_id || "sent";
}

async function sendEmailInquiry(inquiry, replyTo) {
  requireDeliveryConfig("email");

  const transporter = getMailTransporter();
  const result = await withTimeout(
    transporter.sendMail({
      from: getEmailFrom(),
      to: getEmailTo(),
      replyTo: replyTo || undefined,
      subject: buildEmailSubject(inquiry),
      text: buildEmailText(inquiry),
      html: buildEmailHtml(inquiry),
    }),
    getEnvNumber("INQUIRE_DELIVERY_TIMEOUT_MS", 8000) + 1000,
    "email"
  );

  return result.messageId || "sent";
}

function redactSecrets(value) {
  let output = String(value || "");

  [
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.TELEGRAM_CHAT_ID,
    process.env.SMTP_USER,
    process.env.SMTP_PASS,
  ]
    .filter(Boolean)
    .forEach((secret) => {
      output = output.replaceAll(String(secret), "[redacted]");
    });

  return output;
}

function safeErrorMessage(error) {
  return redactSecrets(error instanceof Error ? error.message : String(error));
}

function getSafeErrorCode(error) {
  if (error instanceof DeliveryError) {
    return error.code;
  }

  return "provider_error";
}

function logMissingConfig(group, missing) {
  console.error("[inquire] config_missing", {
    group,
    missing,
  });
}

function logChannelNotConfigured(group, missing) {
  console.warn("[inquire] channel_not_configured", {
    group,
    missing,
  });
}

function logSafeFailure(context, error) {
  console.error(`[inquire] ${context}`, {
    code: error instanceof DeliveryError ? error.code : undefined,
    message: safeErrorMessage(error),
    details:
      error instanceof DeliveryError && error.code === "config_error"
        ? { missing: error.details?.missing || [] }
        : undefined,
  });
}

function getErrorStatus(error) {
  if (error.code === "validation_error") {
    return "validation_error";
  }

  if (error.statusCode === 429) {
    return "rate_limited";
  }

  return "error";
}

function getDeliveryFailureStatus(results) {
  const failedCodes = results
    .filter((result) => result.status === "rejected")
    .map((result) => getSafeErrorCode(result.reason));

  if (failedCodes.includes("config_error")) {
    return "config_error";
  }

  if (failedCodes.includes("provider_error")) {
    return "provider_error";
  }

  return "error";
}

function buildDeliveryResult(taskEntries, settledResults, initialChannels) {
  const channels = { ...initialChannels };
  const failed = {};

  taskEntries.forEach(([channel], index) => {
    const result = settledResults[index];

    if (result.status === "fulfilled") {
      channels[channel] = "sent";
      return;
    }

    channels[channel] = "failed";
    failed[channel] = getSafeErrorCode(result.reason);
    logSafeFailure(`${channel}_delivery_failed`, result.reason);
  });

  return {
    channels,
    failed,
    sentCount: Object.values(channels).filter((status) => status === "sent").length,
    failedCount: Object.values(channels).filter((status) => status === "failed").length,
  };
}

async function handleInquiryRequest({ method, headers, bodyText }) {
  try {
    if (method !== "POST") {
      return jsonResponse(405, {
        ok: false,
        status: "error",
        code: "method_not_allowed",
        message: "Only POST is allowed.",
      });
    }

    const normalizedHeaders = normalizeHeaders(headers);
    enforceRateLimit(normalizedHeaders);

    const payload = parseBody(bodyText);
    const inquiry = normalizeInquiry(payload);
    const { contactEmail } = validateInquiry(inquiry);
    const notificationConfig = getNotificationConfig();

    const channels = {
      telegram: notificationConfig.telegram.configured ? "pending" : "not_configured",
      email: notificationConfig.email.configured ? "pending" : "not_configured",
    };

    if (!notificationConfig.telegram.configured) {
      logChannelNotConfigured("telegram", notificationConfig.telegram.missing);
    }

    if (!notificationConfig.email.configured) {
      logChannelNotConfigured("email", notificationConfig.email.missing);
    }

    if (!notificationConfig.telegram.configured && !notificationConfig.email.configured) {
      return jsonResponse(500, {
        ok: false,
        status: "config_error",
        code: "config_error",
        message: "No notification channel configured.",
        userMessage: "Inquiry delivery is not configured correctly.",
        channels,
        deliveries: channels,
      });
    }

    const taskEntries = [];
    if (notificationConfig.telegram.configured) {
      taskEntries.push(["telegram", sendTelegramInquiry(inquiry)]);
    }
    if (notificationConfig.email.configured) {
      taskEntries.push(["email", sendEmailInquiry(inquiry, contactEmail)]);
    }

    const settledResults = await Promise.allSettled(taskEntries.map(([, task]) => task));
    const deliveryResult = buildDeliveryResult(taskEntries, settledResults, channels);

    if (deliveryResult.sentCount > 0 && deliveryResult.failedCount === 0) {
      return jsonResponse(200, {
        ok: true,
        status: "success",
        message: "Inquiry delivered.",
        channels: deliveryResult.channels,
        deliveries: deliveryResult.channels,
      });
    }

    if (deliveryResult.sentCount > 0) {
      return jsonResponse(207, {
        ok: true,
        status: "partial_success",
        message: "Inquiry delivered partially.",
        channels: deliveryResult.channels,
        deliveries: deliveryResult.channels,
        failed: deliveryResult.failed,
      });
    }

    const failureStatus = getDeliveryFailureStatus(settledResults);
    return jsonResponse(500, {
      ok: false,
      status: failureStatus,
      code: failureStatus,
      message: "Inquiry delivery failed.",
      userMessage:
        failureStatus === "config_error"
          ? "Inquiry delivery is not configured correctly."
          : "Inquiry delivery provider failed.",
      channels: deliveryResult.channels,
      deliveries: deliveryResult.channels,
      failed: deliveryResult.failed,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonResponse(error.statusCode, {
        ok: false,
        status: getErrorStatus(error),
        code: error.code,
        message: error.message,
        errors: error.details || undefined,
      });
    }

    logSafeFailure("unhandled_request_error", error);

    return jsonResponse(500, {
      ok: false,
      status: "error",
      code: "internal_error",
      message: "Unexpected server error.",
    });
  }
}

async function readNodeRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      return req.body;
    }

    if (Buffer.isBuffer(req.body)) {
      return req.body.toString("utf8");
    }

    return JSON.stringify(req.body);
  }

  let body = "";

  for await (const chunk of req) {
    body += chunk;

    if (body.length > 100000) {
      throw new AppError(400, "body_too_large", "Request body is too large.");
    }
  }

  return body;
}

async function handleNodeRequest(req, res) {
  try {
    const response = await handleInquiryRequest({
      method: req.method,
      headers: req.headers,
      bodyText: await readNodeRequestBody(req),
    });

    sendNodeResponse(res, response);
  } catch (error) {
    const response =
      error instanceof AppError
        ? jsonResponse(error.statusCode, {
            ok: false,
            status: getErrorStatus(error),
            code: error.code,
            message: error.message,
            errors: error.details || undefined,
          })
        : jsonResponse(500, {
            ok: false,
            status: "error",
            code: "internal_error",
            message: "Unexpected server error.",
          });

    if (!(error instanceof AppError)) {
      logSafeFailure("unhandled_node_error", error);
    }

    sendNodeResponse(res, response);
  }
}

async function handleNetlifyEvent(event) {
  try {
    const bodyText = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "";

    return handleInquiryRequest({
      method: event.httpMethod,
      headers: event.headers,
      bodyText,
    });
  } catch (error) {
    if (!(error instanceof AppError)) {
      logSafeFailure("unhandled_netlify_error", error);
    }

    return jsonResponse(
      error instanceof AppError ? error.statusCode : 500,
      error instanceof AppError
        ? {
            ok: false,
            status: getErrorStatus(error),
            code: error.code,
            message: error.message,
            errors: error.details || undefined,
          }
        : {
            ok: false,
            status: "error",
            code: "internal_error",
            message: "Unexpected server error.",
          }
    );
  }
}

module.exports = {
  handleNetlifyEvent,
  handleNodeRequest,
};
