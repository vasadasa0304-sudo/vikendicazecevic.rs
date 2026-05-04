const BASE_URL = (process.env.STAGE_URL || "http://127.0.0.1:8888").replace(/\/$/, "");

const REQUIRED_HEADERS = [
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "content-security-policy",
];

async function readResponseBody(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function checkHome() {
  const response = await fetch(`${BASE_URL}/`);
  const body = await response.text();

  assert(response.status === 200, `Expected / to return 200, got ${response.status}`);
  assert(body.includes("Vikendica"), "Expected home page HTML to include cabin content");

  const missingHeaders = REQUIRED_HEADERS.filter((header) => !response.headers.get(header));
  assert(!missingHeaders.length, `Missing security headers: ${missingHeaders.join(", ")}`);
}

async function checkInquiryRoute() {
  const response = await fetch(`${BASE_URL}/api/inquire`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      guestName: "Smoke Test",
      contact: "smoke@example.com",
      checkin: "2026-05-10",
      checkout: "2026-05-12",
      guests: "2",
    }),
  });
  const body = await readResponseBody(response);

  const acceptableStatuses = new Set([200, 207, 500]);
  assert(
    acceptableStatuses.has(response.status),
    `Expected /api/inquire to execute, got ${response.status}: ${JSON.stringify(body)}`
  );

  if (response.status === 500) {
    assert(
      body?.status === "config_error" || body?.code === "config_error",
      `Expected missing local env to return config_error, got ${JSON.stringify(body)}`
    );
  }
}

async function checkMissingFunction() {
  const response = await fetch(`${BASE_URL}/api/no-such-function`);
  assert(response.status === 404, `Expected missing function to return 404, got ${response.status}`);
}

async function main() {
  await checkHome();
  await checkInquiryRoute();
  await checkMissingFunction();
  console.log(`Staging smoke passed: ${BASE_URL}`);
}

main().catch((error) => {
  console.error(`Staging smoke failed: ${error.message}`);
  process.exitCode = 1;
});
