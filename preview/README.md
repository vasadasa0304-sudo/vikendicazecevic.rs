# Kalendar popunjenosti — parkirana funkcionalnost (nije objavljena)

Kompletan, spreman kalendar popunjenosti. Namerno NIJE uključen u sajt:
`netlify.toml` vraća 404 za `/preview/*`, tako da ništa od ovoga nije javno
iako je u repou.

## Lokalni pregled

```bash
cd ~/projects/vikendicazecevic.rs
python3 -m http.server 8000
# → http://localhost:8000/preview/calendar.html
```

## Kako se održava (dok nema OTA kalendara)

Jedini fajl koji se menja je `availability-data.js`:

- `from` = dan **dolaska** (ta noć je zauzeta)
- `to` = dan **odlaska** (checkout ujutru — taj dan je slobodan za novi dolazak)
- `updated` osvežiti pri svakoj izmeni (prikazuje se ispod kalendara)
- `note` je interna referenca — nikad se ne prikazuje

Semantika je identična iCal feedovima (end-exclusive), pa kasnija automatska
sinhronizacija sa Booking.com/Airbnb ne menja ništa u prikazu.

## Kako se objavljuje (3 koraka, kad dođe vreme)

1. Sadržaj `availability-calendar.css` prebaciti u `styles.css` (sve klase su
   `avail-` prefiksovane, nema kolizija). `availability-data.js` +
   `availability-calendar.js` premestiti u koren i dodati `<script defer>`
   posle `content.js` u `index.html`.
2. U `index.html` dodati sekciju (npr. između `#location` i `#stay-info`):
   `<section id="availability">` sa `<div class="avail-wrap" id="availability-calendar">`,
   naslovima kroz `data-i18n` i pozivom
   `AvailabilityCalendar.mount(...)` + `AvailabilityCalendar.setLang(lang)`
   u `applyLang()` u `script.js`.
3. Ukloniti `/preview/*` 404 pravilo iz `netlify.toml` (ili obrisati folder),
   `node scripts/prebake.js`, push.

## Kasnije: automatska sinhronizacija sa OTA (kad postoje listinzi)

Booking.com i Airbnb izvoze iCal URL po objektu. Preporučen put:
GitHub Action na dnevnom cron-u povuče iCal, regeneriše
`availability-data.js` (VEVENT DTSTART/DTEND → `busy[]`), commit + push →
Netlify sam objavi. Ručno održavanje tada prestaje.
