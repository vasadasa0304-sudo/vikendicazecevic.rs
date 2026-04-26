# Vikendica Zečević Zlatar Site

Static extraction of the bundled `vikendica-zlatar-export.html` into plain editable files. The goal is to preserve the current design and behavior while making future edits straightforward.

## Structure

- `index.html`: page markup, preserved section order, IDs, and bilingual content hooks
- `content.js`: the client-editable content source of truth for both Serbian and English
- `config.js`: public runtime config for `/api/inquire`, source label, and the map embed URL
- `styles.css`: extracted fonts and site styles
- `script.js`: renders content from `content.js`, handles SR/EN switching, nav behavior, reveal animation, gallery lightbox, and inquiry form UI
- `api/inquire.js`: Vercel-compatible serverless inquiry endpoint
- `netlify/functions/inquire.js`: Netlify wrapper for the same inquiry endpoint
- `server/inquire-handler.js`: shared inquiry validation and delivery logic
- `netlify.toml`: Netlify redirect so the public endpoint stays `/api/inquire`
- `.env.example`: required environment variables for Telegram, SMTP, and light rate limiting
- `package.json`: minimal backend dependency manifest (`nodemailer`)
- `assets/fonts/`: locally extracted `woff2` files from the export bundle
- `images/`: reserved for future real photography and image replacements
- `AGENTS.md`: concise repo rules for future edits

## Run Locally

Use any static file server from this folder.

```bash
cd vikendica-zlatar-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Editing Content

For normal content updates, edit `content.js`.

- Text, captions, amenities, nearby distances, contact details, SEO copy, and form labels now live in `content.js`
- `index.html` still contains fallback copy inside some elements, but `content.js` is the authoritative source used by the running site

## Inquiry Endpoint

The inquiry form still posts to one public path:

```text
POST /api/inquire
```

The backend validates:

- `checkin`
- `checkout`
- `guests`
- `guestName`
- at least one contact method in `contact`
- accepted contact methods are `email` or `phone / WhatsApp`
- guest count cannot exceed `6`

Delivery behavior:

- Telegram bot notification, if Telegram is configured
- email inbox notification, if email is configured
- `reply-to` uses the guest email if an email exists in `contact`
- if only a phone / WhatsApp number exists, it is included clearly in both Telegram and email
- at least one notification channel is required for production

Response behavior:

- `200`: every configured channel sent successfully; unconfigured optional channels are reported as `not_configured`
- `207`: partial success, at least one configured channel sent and at least one configured channel failed
- `400`: validation error
- `429`: honeypot or best-effort rate-limit block
- `500`: total failure, with `status` set to `config_error`, `provider_error`, or `error`

## Environment Variables

Copy `.env.example` and set the real values in your deployment platform.

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

Both channels can be configured together. If only one channel is configured and sends successfully, the endpoint returns `success` and marks the other channel as `not_configured`.

Optional but useful:

- `SMTP_SECURE`: set to `true` for port `465`; otherwise omit or use `false`
- `INQUIRE_PROPERTY_NAME`: fallback property name if the frontend payload omits it
- `INQUIRE_SOURCE_LABEL`: fallback source label, for example `website`
- `INQUIRE_RATE_LIMIT_MAX`: default `5`
- `INQUIRE_RATE_LIMIT_WINDOW_MS`: default `600000`
- `INQUIRE_DELIVERY_TIMEOUT_MS`: default `8000`

Legacy aliases still supported by the backend:

- `SMTP_FROM` can be used instead of `INQUIRY_EMAIL_FROM`
- `INQUIRE_EMAIL_TO` can be used instead of `INQUIRY_EMAIL_TO`

To switch the recipient email, change `INQUIRY_EMAIL_TO`.

To switch the Telegram destination, change `TELEGRAM_CHAT_ID`.

## Local Testing

Node 18+ is required for the serverless endpoint.

Vercel local testing:

1. `npm install`
2. copy `.env.example` to `.env.local` and fill in the real values
3. run `npx vercel dev`
4. open the site and submit the form, or `curl` the endpoint directly

Netlify local testing:

1. `npm install`
2. export the same variables in your shell or load them from an `.env` file
3. run `npx netlify dev`
4. submit the form or test `POST /api/inquire` with `curl`

Example direct test:

```bash
curl -X POST http://localhost:8888/api/inquire \
  -H "Content-Type: application/json" \
  -d '{
    "propertyName": "Vikendica Zečević Zlatar",
    "checkin": "2026-05-01",
    "checkout": "2026-05-04",
    "guests": "4",
    "guestName": "Test Guest",
    "contact": "guest@example.com",
    "message": "Testing inquiry delivery",
    "timestamp": "2026-04-22T10:00:00.000Z",
    "sourceLabel": "website",
    "language": "en",
    "_hp": ""
  }'
```

## Deployment

This project is still mostly static HTML/CSS/JS, but the inquiry form now needs a serverless runtime.

Vercel:

1. import the project or run `vercel`
2. set all variables from `.env.example` in the Vercel project settings
3. deploy normally; `api/inquire.js` will be served automatically at `/api/inquire`

Netlify:

1. connect the repo or run `netlify deploy`
2. set all variables from `.env.example` in the Netlify site settings
3. deploy normally; `netlify.toml` rewrites `/api/inquire` to `/.netlify/functions/inquire`
4. check Netlify Function logs for `[inquire] config_missing`, `telegram_delivery_failed`, or `email_delivery_failed` if the form reports an error

Hosts like GitHub Pages, S3, or plain Nginx are no longer enough by themselves if you want the live inquiry form to work, because they do not run the serverless endpoint.

## Known Limitations

- Real property photos are still missing. Replace the hero/about placeholders and gallery `src` values before serious promotion.
- The Google Maps embed is approximate until the owner provides the exact Maps pin or embed URL.
- Canonical and Open Graph URL use `https://vikendicazecevic.rs/`.
- Rate limiting is in-memory and best-effort in serverless environments; it resets on cold starts and should be treated as light spam protection only.
- `api/inquire.js` is kept for Vercel compatibility. Netlify uses `netlify/functions/inquire.js` plus the redirect in `netlify.toml`.
- `AGENTS.md` is ignored by `.gitignore`; remove it before manual static uploads if you are not deploying from git.

## What Was Simplified

- Removed the export-only bundler loader, manifest tags, and runtime unpacking script
- Split inline CSS and JS into `styles.css` and `script.js`
- Extracted embedded fonts into local files under `assets/fonts/`
- Removed the hidden export tweak panel and related postMessage code
- Kept the existing section layout, IDs, text structure, and front-end interactions

## Current Placeholders / Remaining Gaps

- The hero, about, and gallery areas still use placeholder blocks instead of real photos
- SMTP and Telegram credentials still need to be configured in the deployment platform
- The Google Maps embed depends on external availability; a fallback placeholder is already in the markup
