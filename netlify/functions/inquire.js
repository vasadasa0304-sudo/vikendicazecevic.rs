const { handleNetlifyEvent } = require("../../server/inquire-handler");

function parseBody(event) {
  if (!event.body) return {};

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

exports.handler = async (event) => {
  const body = parseBody(event);

  if (body.website && String(body.website).trim() !== "") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  }

  return handleNetlifyEvent(event);
};
