# Video Theatre — Panorama Digital Theatre

Πριν από οποιαδήποτε αλλαγή, διάβασε τα κεντρικά docs στο repo `polmitso/videotheatre-work`, φάκελος `docs/`:
- `01-SYSTEM.md` — ταυτότητα, χάρτης repos/domains, πώς γίνεται deploy, κανόνες ασφαλείας
- `02-DATA.md` — collections του PocketBase και κανόνες
- `03-DECISIONS.md` — αποφάσεις που δεν ξανασυζητιούνται
- `04-STATUS.md` — τι λειτουργεί και τι ακολουθεί

## Αυτό το repo
- Δημόσιο site (Astro SSR, Node). Ο container ακούει στη **θύρα 4321**, όπως τα άλλα sites (Coolify → Ports Exposes = 4321).
- Όλη η πρόσβαση στο PocketBase: `src/lib/pocketbase.js`. Εμφανίζει παραγωγές με «Πού & πότε» στον χώρο `panorama-digital-theatre`.
- Σειρά: τώρα (νεότερη έναρξη πρώτα) → σύντομα (κοντινότερη πρώτα)· Αρχείο: ολοκληρωμένες, νεότερη πρώτα. Το «σύντομα» γίνεται αυτόματα «τώρα» με την ημερομηνία έναρξης.
- Στοιχεία επικοινωνίας από την εγγραφή του χώρου στο PocketBase. Εικόνες πάντα με record ID (`mediaById`), ποτέ με όνομα αρχείου.
- Κείμενα διεπαφής EL/EN: `src/lib/i18n.js`. Σελίδες: `src/components/*.astro`, οι διαδρομές στο `src/pages` είναι λεπτά wrappers.
- Έλεγχος: `/health.json` → `"ok": true`.
- Hero: `heroSlides()` + `src/components/HeroSlides.astro` (site `panorama`). Gallery: `src/components/Gallery.astro`. Umami στο `src/layouts/Site.astro`. Domain: https://panorama.com.gr
- Newsletter: φόρμα `src/components/Newsletter.astro` (ίδια στα 3 sites, στέλνει στο videotheatre.gr/api/newsletter), επιβεβαίωση `/newsletter-ok`.

## Κανόνες εργασίας
- Branch → `npm run build` → έλεγχος (screenshots) → merge στο `main` ως ένα πακέτο.
- Το Coolify δεν κάνει αυτόματο deploy: μετά το merge, Deploy στο Coolify και έλεγχος live.
- Κανένα μυστικό σε κώδικα ή docs. Μην κρύβεις σφάλματα του PocketBase.
- Μετά από κάθε ολοκληρωμένη δουλειά, ενημέρωσε το `docs/04-STATUS.md` στο videotheatre-work.
