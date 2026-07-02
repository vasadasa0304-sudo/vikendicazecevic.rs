/* Popunjenost vikendice — ručno održavanje.
 *
 * Ovaj fajl je JEDINO mesto koje se menja kad stigne rezervacija.
 * Pravila:
 *   - `from` je dan DOLASKA (ta noć je zauzeta)
 *   - `to`   je dan ODLASKA (checkout ujutru — taj dan je slobodan za novi dolazak)
 *   - Datumi su uvek u formatu "GGGG-MM-DD".
 *   - `note` je samo za internu referencu (ime gosta, izvor) — NIKAD se ne prikazuje na sajtu.
 *
 * Isti model (from = check-in, to = check-out, end-exclusive) koriste i iCal feedovi
 * Booking.com/Airbnb-a, pa se kasnije ovaj fajl može generisati automatski iz OTA kalendara
 * bez ikakve izmene u prikazu.
 */
window.AVAILABILITY = {
  updated: "2026-07-02", // datum poslednje izmene — prikazuje se ispod kalendara
  minNights: 0, // minimalan broj noći (0 = bez napomene)
  busy: [
    // PRIMER — obrišite ove tri stavke i unesite stvarne rezervacije:
    { from: "2026-07-10", to: "2026-07-14", note: "primer" },
    { from: "2026-07-24", to: "2026-07-27", note: "primer" },
    { from: "2026-08-07", to: "2026-08-16", note: "primer" },
  ],
};
