# Vikendica Zečević Zlatar Site

Lightweight static-first website for Vikendica Zečević Zlatar, with bilingual content and one Netlify Function for inquiry notifications.

## Structure

- `index.html`: page markup, preserved section order, IDs, and bilingual content hooks
- `content.js`: the client-editable content source of truth for both Serbian and English
- `config.js`: public runtime config for `/api/inquire`, source label, and the map embed URL
- `styles.css`: extracted fonts and site styles
- `script.js`: renders content from `content.js`, handles SR/EN switching, nav behavior, reveal animation, gallery lightbox, and inquiry form UI
- `netlify/functions/inquire.js`: Netlify Function for the inquiry endpoint
- `server/inquire-handler.js`: shared inquiry validation and delivery logic
- `netlify.toml`: Netlify redirect so the public endpoint stays `/api/inquire`
- `.env.example`: required environment variables for Telegram, SMTP, and light rate limiting
- `package.json`: minimal backend dependency manifest (`nodemailer`)
- `assets/fonts/`: local `woff2` font files
- `images/`: optimized production photos and replacement notes
- `sitemap.xml` and `robots.txt`: crawler hints for the production domain

## Run Locally

For a static preview without the inquiry function:

```bash
cd vikendica-zlatar-site
npm run serve
```

Then open `http://localhost:8000`.

For a Netlify-style staging preview with `/api/inquire` routed to the local function:

```bash
npm install
npm run stage
```

Then open `http://localhost:8888`.

In a second terminal, verify the staging server:

```bash
npm run stage:smoke
```

The smoke test checks that the page responds, security headers are present, `/api/inquire` reaches the local Netlify Function, and missing-function routes return `404`. Without real local environment variables, `/api/inquire` is expected to return `config_error`.

The staging script pins `netlify-cli@17.38.1` because newer Netlify CLI packages require Node 20+, while this project supports Node 18+.

## Editing Content

For normal content updates, edit `content.js`.

- Text, captions, amenities, nearby distances, contact details, SEO copy, and form labels now live in `content.js`
- `index.html` still contains fallback copy inside some elements, but `content.js` is the authoritative source used by the running site
- Structured data lives in `index.html`; update it only when the verified business facts change.

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

Netlify local testing:

1. `npm install`
2. export the same variables in your shell or load them from an `.env` file
3. run `npm run stage`
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

This project is still mostly static HTML/CSS/JS, but the inquiry form needs Netlify Functions.

Netlify:

1. connect the repo or run `netlify deploy`
2. set all variables from `.env.example` in the Netlify site settings
3. deploy normally; `netlify.toml` rewrites `/api/inquire` to `/.netlify/functions/inquire`
4. check Netlify Function logs for `[inquire] config_missing`, `telegram_delivery_failed`, or `email_delivery_failed` if the form reports an error

Hosts like GitHub Pages, S3, or plain Nginx are no longer enough by themselves if you want the live inquiry form to work, because they do not run the serverless endpoint.

## Google Visibility Setup

Google Search Console verification currently uses the HTML file method:

- verification file: `google27409bef3ff9aefc.html`
- production URL: `https://vikendicazecevic.rs/google27409bef3ff9aefc.html`

After each production deploy with SEO changes:

1. open Google Search Console for `https://vikendicazecevic.rs/`
2. click **Verify** if ownership is not verified yet
3. submit `https://vikendicazecevic.rs/sitemap.xml`
4. use URL Inspection for `https://vikendicazecevic.rs/`
5. request indexing after confirming Google can fetch the page

Use the same business details everywhere the property is listed:

- name: `Vikendica Zečević Zlatar`
- address: `Brdo bb, Zlatar, Nova Varoš, Srbija`
- phone: `+381 (0)65 65 89 346`
- phone: `+381 (0)69 231 69 41`
- email: `vikendicazecevic@gmail.com`
- website: `https://vikendicazecevic.rs/`

Do not create a Google Business Profile for the property unless the owner confirms it is eligible under Google’s rules. Vacation homes by themselves are generally not eligible for Business Profiles.

The site intentionally uses `LodgingBusiness` and visible FAQ structured data, not Google’s `VacationRental` rich-result type. Google’s vacation-rental enhancement has stricter requirements and is intended for eligible vacation-rental integrations, so using it without the full setup can create a Search Console “Holiday rental” invalid item even when the page itself is indexed.

## Known Limitations

- Optimized property photos are now wired into the hero, about, and gallery sections; replace them later only if a stronger final photo set is provided.
- Responsive WebP variants are generated for mobile performance; keep the `srcset` values in `index.html` and `content.js` aligned when replacing photos.
- The Google Maps embed uses the owner-provided location pin.
- Canonical and Open Graph URL use `https://vikendicazecevic.rs/`.
- `sitemap.xml` contains only the single homepage because this is a one-page static site.
- Rate limiting is in-memory and best-effort in serverless environments; it resets on cold starts and should be treated as light spam protection only.
- Netlify uses `netlify/functions/inquire.js` plus the redirect in `netlify.toml` to serve `/api/inquire`.
- Raw source photos and agent/development notes are intentionally ignored by git; deploy from GitHub/Netlify rather than manually uploading the whole local folder.

## What Was Simplified

- Removed the export-only bundler loader, manifest tags, and runtime unpacking script
- Split inline CSS and JS into `styles.css` and `script.js`
- Extracted embedded fonts into local files under `assets/fonts/`
- Removed the hidden export tweak panel and related postMessage code
- Kept the existing section layout, IDs, text structure, and front-end interactions

## Current Placeholders / Remaining Gaps

- Raw source photos are not stored in the production site; keep originals in external storage.
- SMTP and Telegram credentials need to be configured in the deployment platform for the live inquiry flow
- The Google Maps embed depends on external availability; a fallback placeholder is already in the markup
