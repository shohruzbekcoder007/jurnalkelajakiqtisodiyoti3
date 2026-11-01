// Saytdagi doimiy manzillarga ega sahifalar; qolganlari /sahifa/:slug da ochiladi
const FIXED = ['jurnal-haqida', 'tahrir-kengashi', 'jurnal-manzili', 'chop-etish-tartibi', 'axborot-xati'];

export const publicPagePath = (slug) => (FIXED.includes(slug) ? `/${slug}` : `/sahifa/${slug}`);
