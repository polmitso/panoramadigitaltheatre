// Offers — phase 1, deliberately simple: no Work, no database collection.
// Each offer = an image from Work → Εικόνες by its *record ID* (never the file name) and, optionally,
// title / text / end date. To change the picture keep the ID and use «Αντικατάσταση αρχείου» in Work.
// Empty list (or all ended) → no «Προσφορές» in the menu, no band on the home page.
export const OFFERS = [
  {
    image: '', // ← media record ID of 1080_combo_gjucb8mlcm.webp
    title: '', title_en: '',
    text: 'Με ένα εισιτήριο επισκέπτεστε και τις 2 εκθέσεις, την ίδια ημέρα.\nΗ διάρκεια και των 2 επισκέψεων είναι περίπου 2 με 3 ώρες.',
    text_en: 'One ticket gets you into both exhibitions on the same day.\nAllow about 2 to 3 hours for both visits.',
    where: 'Το εισιτήριο είναι διαθέσιμο μόνο στα ταμεία του Panorama.',
    where_en: 'The ticket is available only at the Panorama box office.',
    ends: '2026-12-31', // inclusive
  },
];
