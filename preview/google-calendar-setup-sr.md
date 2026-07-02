# Google kalendar → sajt: podešavanje sinhronizacije popunjenosti

Cilj: vlasnik vodi rezervacije u običnom Google kalendaru (nalog
`vikendicazecevic@gmail.com`), a sajt automatski prikazuje te datume kao
zauzete. Bez ikakvog menjanja koda — upiše se događaj u kalendar i to je sve.

## Korak 1 — Vlasnik: napraviti POSEBAN kalendar za rezervacije (jednom)

> Važno: poseban kalendar, a ne glavni — da privatne obaveze ne blokiraju
> termine i da se sajtu ne šalje ništa osim rezervacija.

1. Otvoriti [calendar.google.com](https://calendar.google.com) prijavljen kao
   `vikendicazecevic@gmail.com`.
2. Levo, pored „Drugi kalendari" kliknuti **+** → **Napravi novi kalendar**
   (Create new calendar).
3. Ime: **Vikendica — rezervacije**. Vremenska zona: Beograd. → **Napravi
   kalendar**.

## Korak 2 — Vlasnik: kako se upisuje rezervacija

1. U kalendaru kliknuti na datum dolaska → **Ceo dan** (All day).
2. Naslov po želji (npr. „Marko, 4 osobe" — **naslov se NIKAD ne prikazuje na
   sajtu**, sajt vidi samo datume).
3. Kao kraj događaja izabrati **poslednju noć boravka** (dan PRE odlaska).
   Primer: gost je tu od 10. do 14. jula (odlazi 14. ujutru) → događaj od
   **10. do 13. jula**. Tako 14. jul na sajtu ostaje slobodan za novi dolazak.
   (Ako se pogreši i upiše do 14., ništa strašno — sajt će samo prikazati
   jedan dan više kao zauzet.)
4. Proveriti da je događaj u kalendaru „Vikendica — rezervacije" (padajuća
   lista u događaju) → **Sačuvaj**. Sajt se osveži u roku od ~15 minuta.

Otkazivanje rezervacije = obrisati događaj. To je celo održavanje.

## Korak 3 — Vlasnik: poslati „tajnu adresu" kalendara (jednom)

1. Levo, preći mišem preko kalendara „Vikendica — rezervacije" → tri tačke →
   **Podešavanja i deljenje** (Settings and sharing).
2. Skrolovati do **Integriši kalendar** (Integrate calendar).
3. Kopirati **Tajnu adresu u iCal formatu** (Secret address in iCal format) —
   dugačak link koji se završava na `basic.ics`.
4. Poslati taj link Stefanu (Viber/poruka). Link je tajna — ne objavljivati ga.

## Korak 4 — Stefan: uneti link u Netlify (jednom)

1. Netlify → sajt **vikendicazecevic.rs** → **Site configuration →
   Environment variables → Add a variable**.
2. Ime: `AVAILABILITY_ICS_URL` · vrednost: tajni link iz koraka 3.
3. **Deploys → Trigger deploy → Deploy site** (env važi od sledećeg deploya).
4. Provera: `curl https://vikendicazecevic.rs/api/availability` → treba da
   vrati `{"ok":true,...,"busy":[...]}` sa datumima iz kalendara.

## Kako radi (tehnički)

- `netlify/functions/availability.js` čita tajni iCal link (samo na serveru),
  parsira događaje i vraća **isključivo datume** — naslovi i detalji se
  odbacuju, pa ništa privatno ne može da procuri.
- Odgovor se kešira 15 min; ako Google zakaže, služi se poslednje poznato
  stanje umesto praznog kalendara.
- Otkazani (CANCELLED) i „slobodan" (TRANSP:TRANSPARENT) događaji se
  preskaču. Ponavljajući događaji nisu podržani (računa se samo prva
  instanca) — rezervacije se ionako ne ponavljaju.
- Ako env promenljiva nije podešena, endpoint vraća 503, a kalendar na
  sajtu se sam sakrije / padne na ručni fajl `availability-data.js`.
