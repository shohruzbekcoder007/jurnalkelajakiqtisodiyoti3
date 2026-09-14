// Ma'lumotlar bazasini asl saytdagi ma'lumotlar bilan to'ldiradi: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Rubric from './models/Rubric.js';
import Issue from './models/Issue.js';
import Article from './models/Article.js';
import Page from './models/Page.js';
import { ensureAdmin } from './createAdmin.js';

const rubrics = [
  { slug: 'audit-va-nazorat', name: 'Audit va nazorat' },
  { slug: 'davlat-moliyasi', name: 'Davlat moliyasi' },
  { slug: 'bank-ishi', name: 'Bank ishi' },
  { slug: 'moliya-va-sanoat', name: 'Moliya va sanoat' },
  { slug: 'hududiy-rivojlanish', name: 'Hududiy rivojlanish' },
  { slug: 'buxgalteriya-hisobi', name: 'Buxgalteriya hisobi' },
  { slug: 'iqtisodiy-tahlil', name: 'Iqtisodiy tahlil' },
].map((r, i) => ({ ...r, order: i + 1 }));

const articles = [
  {
    slug: 'paxta-klasterlarida-resurslardan-foydalanish',
    featuredOrder: 1,
    rubric: 'moliya-va-sanoat',
    date: '2026-08-24',
    title:
      'Paxta yetishtirish va qayta ishlash klasterlarida resurslardan foydalanish samaradorligini oshirish va iqtisodiy yo‘qotishlarni kamaytirish',
    summary:
      'Maqolada paxta yetishtirish va qayta ishlash klasterlarida resurslardan foydalanish samaradorligini oshirish masalalari tahlil qilingan.',
  },
  {
    slug: 'korxonalarda-ichki-auditni-tashkil-etish',
    featuredOrder: 2,
    rubric: 'audit-va-nazorat',
    date: '2026-08-21',
    title: 'Korxonalarda ichki auditni tashkil etish va takomillashtirish',
    summary: 'Korxonalarda ichki auditni samarali tashkil etishning nazariy va amaliy jihatlari yoritilgan.',
  },
  {
    slug: 'yoshlar-biznes-loyihalarini-moliyalashtirish',
    featuredOrder: 3,
    rubric: 'bank-ishi',
    date: '2026-08-18',
    title: 'Yoshlar biznes-loyihalarini moliyalashtirishda kredit va investitsiya resurslarining o‘rni',
    summary: 'Yoshlar biznes-loyihalarini qo‘llab-quvvatlashda kredit va investitsiya resurslarining o‘rni ko‘rib chiqiladi.',
  },
  {
    slug: 'davlat-moliyaviy-nazorati-modellari',
    rubric: 'davlat-moliyasi',
    date: '2026-08-15',
    title:
      'Davlat moliyaviy nazoratini modellar va metodologik yondashuvlarini xalqaro standartlar asosida takomillashtirish',
    summary: 'Davlat moliyaviy nazoratini xalqaro standartlar asosida rivojlantirish masalalari tahlil etilgan.',
  },
  {
    slug: 'aksiyadorlik-jamiyatlari-auditida-tahliliy-amallar',
    rubric: 'audit-va-nazorat',
    date: '2026-08-12',
    title: 'Акциядорлик жамиятлари аудитида таҳлилий амалларни қўллашни такомиллаштириш',
    summary: 'Aksiyadorlik jamiyatlari auditida tahliliy amallardan foydalanish samaradorligi o‘rganilgan.',
  },
  {
    slug: 'auditorlik-tekshiruvlarida-tashqi-tasdiqlar',
    rubric: 'audit-va-nazorat',
    date: '2026-08-08',
    title:
      'Auditorlik tekshiruvlarida tashqi tasdiqlardan foydalanish va ichki nazorat tizimining samaradorligini oshirish',
    summary:
      'Auditorlik tekshiruvlarida tashqi tasdiqlardan foydalanish va ichki nazorat samaradorligi masalalari yoritilgan.',
  },
  {
    slug: 'ozbekistonda-auditorlik-faoliyatini-tashkil-etish',
    rubric: 'audit-va-nazorat',
    date: '2026-08-04',
    title: 'O‘zbekistonda auditorlik faoliyatini tashkil etishning zaruriyati va uning ahamiyati',
    summary: 'O‘zbekistonda auditorlik faoliyatini tashkil etishning dolzarb masalalari tahlil qilingan.',
  },

  // NAMUNA: arxivning 2-sahifasidagi maqolalar skrinshotlarda ko'rinmagan.
  // Ruknlardagi sonlar mos kelishi uchun qo'shilgan — haqiqiy maqolalar bilan almashtiring.
  {
    slug: 'namuna-davlat-moliyasi',
    rubric: 'davlat-moliyasi',
    date: '2026-07-30',
    title: 'Mahalliy byudjetlar daromad bazasini mustahkamlash yo‘llari',
    summary: 'Mahalliy byudjetlar daromadlarini oshirish imkoniyatlari ko‘rib chiqilgan.',
  },
  {
    slug: 'namuna-bank-ishi',
    rubric: 'bank-ishi',
    date: '2026-07-26',
    title: 'Tijorat banklarida raqamli xizmatlarni rivojlantirish istiqbollari',
    summary: 'Tijorat banklarida raqamli bank xizmatlarini rivojlantirish yo‘nalishlari tahlil qilingan.',
  },
  {
    slug: 'namuna-hududiy-rivojlanish',
    rubric: 'hududiy-rivojlanish',
    date: '2026-07-22',
    title: 'Hududlarning investitsiyaviy jozibadorligini oshirish omillari',
    summary: 'Hududlarning investitsiyaviy jozibadorligiga ta’sir etuvchi omillar o‘rganilgan.',
  },
  {
    slug: 'namuna-buxgalteriya-hisobi',
    rubric: 'buxgalteriya-hisobi',
    date: '2026-07-18',
    title: 'Xalqaro moliyaviy hisobot standartlariga o‘tish masalalari',
    summary: 'Korxonalarning xalqaro moliyaviy hisobot standartlariga o‘tishdagi muammolar yoritilgan.',
  },
  {
    slug: 'namuna-iqtisodiy-tahlil',
    rubric: 'iqtisodiy-tahlil',
    date: '2026-07-14',
    title: 'Korxonalar moliyaviy barqarorligini baholash uslublari',
    summary: 'Korxonalar moliyaviy barqarorligini baholashning zamonaviy uslublari ko‘rib chiqilgan.',
  },
];

const pages = [
  {
    slug: 'jurnal-haqida',
    eyebrow: 'Tahririyat sahifasi',
    title: 'Jurnal haqida',
    showUpdated: true,
    updatedAt: new Date('2026-08-24T10:00:00Z'),
    body: [
      '“Kelajak iqtisodiyoti va raqamli transformatsiyalar” ilmiy elektron jurnali Ziyo nashir media tomonidan nashr etiladigan ilmiy elektron nashrdir. Jurnal moliya, bank ishi, audit, buxgalteriya hisobi va iqtisodiyotning zamonaviy yo‘nalishlariga bag‘ishlangan ilmiy maqolalarni e’lon qiladi. Jurnalning maqsadi — ilmiy izlanishlar natijalarini ommalashtirish, yosh olimlar va tadqiqotchilar uchun professional ilmiy muloqot maydonini yaratish.',
    ],
  },
  {
    slug: 'tahrir-kengashi',
    eyebrow: 'Jurnal jamoasi',
    title: 'Tahririyat kengashi',
    body: [
      'Tahririyat kengashi jurnalning ilmiy yo‘nalishlarini belgilaydi, maqolalarni ko‘rib chiqadi va nashr sifatini ta’minlaydi. Kengash tarkibiga moliya, iqtisodiyot, audit va bank ishi sohalarida faoliyat yurituvchi mutaxassislar kiradi.',
    ],
  },
  // NAMUNA: quyidagi sahifalar skrinshotlarda yo'q edi — matnini o'zingiz to'ldiring.
  {
    slug: 'jurnal-manzili',
    eyebrow: 'Tahririyat bilan aloqa',
    title: 'Jurnal manzili',
    body: ['Ziyo nashir media.'],
  },
  {
    slug: 'chop-etish-tartibi',
    eyebrow: 'Mualliflar uchun',
    title: 'Chop etish tartibi',
    body: [
      'Maqola jurnal mavzusiga mos, ilgari boshqa nashrda chop etilmagan va ilmiy talablar asosida tayyorlangan bo‘lishi lozim.',
    ],
  },
  {
    slug: 'axborot-xati',
    eyebrow: 'Mualliflar uchun',
    title: 'Axborot xati',
    body: ['Jurnalning navbatdagi soni uchun maqolalar qabul qilinmoqda.'],
  },
];

async function seed() {
  await connectDB(process.env.MONGO_URI);

  await Promise.all([Rubric.deleteMany({}), Issue.deleteMany({}), Article.deleteMany({}), Page.deleteMany({})]);

  const rubricDocs = await Rubric.insertMany(rubrics);
  const rubricBySlug = new Map(rubricDocs.map((r) => [r.slug, r._id]));

  const issue = await Issue.create({ year: 2026, number: 5, isCurrent: true });

  await Article.insertMany(
    articles.map(({ rubric, date, ...a }) => ({
      ...a,
      rubric: rubricBySlug.get(rubric),
      issue: issue._id,
      publishedAt: new Date(`${date}T09:00:00Z`),
    }))
  );

  // "Yangilangan" sanasi saqlanib qolishi uchun timestamps o'chiriladi
  for (const p of pages) {
    const now = new Date();
    await new Page({ createdAt: now, updatedAt: now, ...p }).save({ timestamps: false });
  }

  console.log(`Seed tayyor: ${rubricDocs.length} rukn, ${articles.length} maqola, ${pages.length} sahifa`);

  // Admin mavjud bo'lmasa .env dagi ma'lumotlar bilan yaratiladi (mavjud admin o'zgartirilmaydi)
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const { admin, created } = await ensureAdmin({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    console.log(created ? `Admin yaratildi: ${admin.email}` : `Admin mavjud: ${admin.email}`);
  }
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
