# Kalendar popunjenosti — parkirana funkcionalnost (nije objavljena)

Kompletan kalendar popunjenosti sa Google Calendar sinhronizacijom i izborom
termina. Namerno NIJE uključen u sajt: `netlify.toml` vraća 404 za
`/preview/*`, tako da ništa od ovoga nije javno iako je u repou.

## Šta ume

- **Izvor podataka, po prioritetu:**
  1. `/api/availability` — Netlify funkcija
     (`netlify/functions/availability.js`) koja čita **tajni iCal link**
     Google kalendara vlasnika (env `AVAILABILITY_ICS_URL`) i vraća samo
     datume (naslovi događaja se odbacuju — privatnost). Keš 15 min.
     Podešavanje: `google-calendar-setup-sr.md`.
  2. `availability-data.js` — ručni fajl, radi i kao fallback ako Google
     zakaže ili env još nije podešen.
  3. Ništa od toga → kalendar se sam sakrije.
- **Izbor termina:** gost klikne datum dolaska pa datum odlaska (samo
  slobodne noći; dan odlaska sme da bude tuđi dan dolaska). Izbor se javlja
  kroz `onSelect({from, to, nights, label})` → stranica popunjava upit.
- Semantika svuda kao kod iCal-a: `from` = noć dolaska (zauzeta),
  `to` = jutro odlaska (slobodno za novi dolazak).

## Lokalni pregled

```bash
cd ~/projects/vikendicazecevic.rs
python3 -m http.server 8000
# → http://localhost:8000/preview/calendar.html   (fallback podaci)
```

Sa pravim Google feedom lokalno: `.env` + `npm run stage` (netlify dev) pa
`http://localhost:8888/preview/calendar.html`.

## Kako se objavljuje (kad dođe vreme)

1. `availability-calendar.css` → prebaciti u `styles.css` (sve klase su
   `avail-` prefiksovane). `availability-calendar.js` (+ po želji
   `availability-data.js` kao fallback) → u koren, `<script defer>` posle
   `content.js` u `index.html`.
2. U `index.html` dodati sekciju (npr. između `#location` i `#stay-info`)
   sa `<div class="avail-wrap" id="availability-calendar">` i naslovima kroz
   `data-i18n`; u `script.js`:
   ```js
   AvailabilityCalendar.mount(document.getElementById("availability-calendar"), {
     lang: currentLang,
     endpoint: "/api/availability",
     selectable: true,
     onSelect(sel) {
       if (!sel) return;
       const ci = document.getElementById("checkin");
       const co = document.getElementById("checkout");
       ci.value = sel.from; co.value = sel.to;
       syncDateInputLimits();
       document.getElementById("inquiry").scrollIntoView({ behavior: "smooth" });
     },
   });
   ```
   i `AvailabilityCalendar.setLang(lang)` u `applyLang()`.
3. (Opciono) podrška za `?checkin=…&checkout=…` parametre iz spoljnih
   linkova: na load pročitati `URLSearchParams` i popuniti inputе.
4. Ukloniti `/preview/*` 404 pravilo iz `netlify.toml`, `node
   scripts/prebake.js`, push. Pre objave obavezno podesiti
   `AVAILABILITY_ICS_URL` (koraci u `google-calendar-setup-sr.md`) ili
   očistiti „primer" stavke iz `availability-data.js`.

## Napomena o funkciji

`netlify/functions/availability.js` se DEPLOY-uje već sada (funkcije nisu pod
`/preview/*`), ali bez env promenljive vraća samo `503 not_configured` i ne
otkriva ništa — bezopasno. Kad se env podesi, `/api/availability` počinje da
vraća zauzete datume (javno bezbedno: to je isti podatak koji kalendar ionako
prikazuje).

## Kasnije: OTA kalendari

Booking.com/Airbnb iCal feedovi se dodaju trivijalno: ili se njihovi linkovi
uvezu u isti Google kalendar (Google podržava „From URL" import — sve se
sliva u jedan feed), ili se funkcija proširi da čita više URL-ova. Prikaz se
ne menja.
