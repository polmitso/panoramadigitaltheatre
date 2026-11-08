// Offers — phase 1, deliberately simple: no Work, no database collection.
// Each offer = an image from Work → Εικόνες by its *record ID* (never the file name) and, optionally,
// title / text / end date. To change the picture keep the ID and use «Αντικατάσταση αρχείου» in Work.
// Empty list (or all ended) → no «Προσφορές» in the menu, no band on the home page.
export const OFFERS = [
  {
    image: '', // ← media record ID of 1080_combo_gjucb8mlcm.webp
    title: '', title_en: '',
    text: '', text_en: '',
    where: '', where_en: '', // empty → «Ισχύει μόνο στο ταμείο του Panorama.»
    ends: '', // 'YYYY-MM-DD' (inclusive) or empty
  },
];
