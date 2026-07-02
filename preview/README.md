# Kalendar popunjenosti — OBJAVLJEN 2026-07-02

Kalendar je live na sajtu (sekcija `#availability`, nav stavka „Termini").

- **Izvor podataka:** Google kalendar „Vikendica-rezervacije" (nalog
  vikendicazecevic@gmail.com) preko `GET /api/availability`
  (`netlify/functions/availability.js`, env `AVAILABILITY_ICS_URL` u
  Netlify-ju). Vodič za vlasnika: `google-calendar-setup-sr.md` — upis
  rezervacije = ceo dan događaj, kraj = poslednja noć (dan pre odlaska).
- **Kod:** `/availability-calendar.js` (koren), stilovi `avail-*` u
  `styles.css`, hookovi u `script.js` (`initAvailabilityCalendar`,
  `handleAvailabilitySelection`, `applyDateParamsFromUrl`). Izbor termina
  popunjava formu upita; podržani su i `?checkin=…&checkout=…` parametri.
- **Otpornost:** funkcija kešira 15 min i služi poslednje poznato stanje ako
  Google zakaže; bez ikakvih podataka sekcija i nav stavka se same sakriju.
- **OTA kasnije:** Booking/Airbnb iCal uvesti u isti Google kalendar (sve u
  jedan feed), ili proširiti funkciju na više URL-ova.
