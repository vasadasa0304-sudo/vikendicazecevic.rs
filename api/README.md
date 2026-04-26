# Inquiry API

Public endpoint:

```text
POST /api/inquire
```

Accepted JSON fields:

```json
{
  "propertyName": "Vikendica Zečević Zlatar",
  "checkin": "2026-05-01",
  "checkout": "2026-05-04",
  "guests": "4",
  "guestName": "Guest Name",
  "contact": "guest@example.com or +381...",
  "message": "Optional note",
  "timestamp": "2026-04-22T10:00:00.000Z",
  "sourceLabel": "website",
  "language": "sr",
  "_hp": ""
}
```

Behavior:

- `200`: every configured channel sent successfully; unconfigured optional channels are reported as `not_configured`
- `207`: partial success, at least one configured channel sent and at least one configured channel failed
- `400`: validation error
- `429`: honeypot or rate-limit block
- `500`: total delivery failure; response `status` is `config_error`, `provider_error`, or `error`

Secrets are read only from environment variables. No bot token or SMTP credential is exposed to the browser.

Validation requires check-in, check-out, guest count, guest name, and at least one contact method. Check-out must be after check-in, and guest count cannot exceed `6`.

Telegram-only setup:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Email-only setup:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `INQUIRY_EMAIL_FROM`
- `INQUIRY_EMAIL_TO`

At least one notification channel is required for production. Both channels can be configured together.

Optional:

- `INQUIRE_PROPERTY_NAME`
- `INQUIRE_SOURCE_LABEL`
- `SMTP_SECURE`

Legacy aliases still supported:

- `SMTP_FROM` instead of `INQUIRY_EMAIL_FROM`
- `INQUIRE_EMAIL_TO` instead of `INQUIRY_EMAIL_TO`
