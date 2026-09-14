// Jurnal sonidagi barcha maqolalarni bitta PDF kitobga yig'adi:
// muqova → mundarija → maqolalar (PDF'i bor maqola o'z sahifalari bilan, yo'q bo'lsa matnidan sahifa yaratiladi)
import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { UPLOAD_DIR } from '../config/upload.js';
import { JOURNAL_NAME, JOURNAL_SUBTITLE, PUBLISHER } from '../config/site.js';

const require = createRequire(import.meta.url);
const FONT_DIR = path.join(path.dirname(require.resolve('dejavu-fonts-ttf/package.json')), 'ttf');

const A4 = [595.28, 841.89];
const MARGIN = 64;
const NAVY = rgb(0.09, 0.216, 0.267);
const RED = rgb(0.776, 0.427, 0.365);
const MUTED = rgb(0.29, 0.36, 0.4);

const pad2 = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => (d ? `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}` : '');

function wrap(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of String(text || '').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        line = next;
      } else {
        if (line) lines.push(line);
        // Juda uzun so'zni bo'lib yuborish
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > maxWidth) {
          let i = rest.length - 1;
          while (i > 1 && font.widthOfTextAtSize(rest.slice(0, i), size) > maxWidth) i--;
          lines.push(rest.slice(0, i));
          rest = rest.slice(i);
        }
        line = rest;
      }
    }
    lines.push(line);
  }
  return lines;
}

// Oddiy matn joylashtiruvchi: sahifa to'lsa yangisini ochadi
class Writer {
  constructor(doc, fonts, { onNewPage } = {}) {
    this.doc = doc;
    this.fonts = fonts;
    this.onNewPage = onNewPage;
    this.width = A4[0] - MARGIN * 2;
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - MARGIN;
    this.onNewPage?.(this.page);
  }

  space(h) {
    this.y -= h;
  }

  text(str, { font = 'regular', size = 11, color = NAVY, lineHeight = 1.5, indent = 0, maxWidth } = {}) {
    const f = this.fonts[font];
    const lh = size * lineHeight;
    for (const line of wrap(str, f, size, (maxWidth || this.width) - indent)) {
      if (this.y - lh < MARGIN) this.newPage();
      this.y -= lh;
      this.page.drawText(line, { x: MARGIN + indent, y: this.y, size, font: f, color });
    }
  }
}

async function loadFonts(doc) {
  doc.registerFontkit(fontkit);
  const load = async (file) => doc.embedFont(await fs.readFile(path.join(FONT_DIR, file)), { subset: true });
  return {
    regular: await load('DejaVuSerif.ttf'),
    bold: await load('DejaVuSerif-Bold.ttf'),
    sans: await load('DejaVuSans.ttf'),
    sansBold: await load('DejaVuSans-Bold.ttf'),
  };
}

function drawCover(doc, fonts, issueTitle, count) {
  const page = doc.addPage(A4);
  const [w, h] = A4;
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.06, 0.165, 0.208) });
  page.drawRectangle({ x: 0, y: h - 10, width: w, height: 10, color: RED });

  // "KI" belgisi
  page.drawRectangle({ x: MARGIN, y: h - 150, width: 54, height: 54, borderColor: rgb(1, 1, 1), borderWidth: 1.5 });
  page.drawRectangle({ x: MARGIN + 49, y: h - 101, width: 9, height: 9, color: RED });
  page.drawText('KI', { x: MARGIN + 13, y: h - 131, size: 20, font: fonts.bold, color: rgb(1, 1, 1) });
  page.drawText('KI', { x: w - 330, y: 120, size: 260, font: fonts.regular, color: rgb(0.12, 0.25, 0.3) });

  let y = h - 260;
  page.drawText(JOURNAL_SUBTITLE.toUpperCase(), { x: MARGIN, y, size: 10, font: fonts.sansBold, color: RED });
  y -= 24;
  for (const line of wrap(JOURNAL_NAME, fonts.regular, 34, w - MARGIN * 2)) {
    y -= 40;
    page.drawText(line, { x: MARGIN, y, size: 34, font: fonts.regular, color: rgb(1, 1, 1) });
  }
  y -= 60;
  page.drawRectangle({ x: MARGIN, y: y + 14, width: 36, height: 1.5, color: RED });
  y -= 22;
  page.drawText(issueTitle, { x: MARGIN, y, size: 26, font: fonts.bold, color: rgb(1, 1, 1) });
  y -= 28;
  page.drawText(`${count} ta ilmiy maqola`, { x: MARGIN, y, size: 12, font: fonts.sans, color: rgb(0.8, 0.88, 0.9) });

  page.drawText(PUBLISHER, { x: MARGIN, y: MARGIN, size: 12, font: fonts.sansBold, color: rgb(0.8, 0.88, 0.9) });
}

// Matnli maqola sahifalari (maqolaning PDF fayli bo'lmasa)
async function buildTextArticle(article, issueTitle) {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  const header = (page) => {
    page.drawText(`${JOURNAL_NAME} · ${issueTitle}`, { x: MARGIN, y: A4[1] - 38, size: 8, font: fonts.sans, color: MUTED });
    page.drawRectangle({ x: MARGIN, y: A4[1] - 46, width: A4[0] - MARGIN * 2, height: 0.5, color: MUTED });
  };
  const wr = new Writer(doc, fonts, { onNewPage: header });
  wr.space(10);
  wr.text([article.rubric?.name, fmtDate(article.publishedAt)].filter(Boolean).join('  ·  ').toUpperCase(), {
    font: 'sansBold',
    size: 8.5,
    color: RED,
  });
  wr.space(8);
  wr.text(article.title.toUpperCase(), { font: 'bold', size: 16, lineHeight: 1.35 });
  if (article.authors?.length) {
    wr.space(6);
    wr.text(article.authors.join(', '), { font: 'sans', size: 10.5, color: MUTED });
  }
  if (article.summary) {
    wr.space(18);
    wr.text('Annotatsiya', { font: 'sansBold', size: 9, color: MUTED });
    wr.space(2);
    wr.text(article.summary, { size: 10.5, lineHeight: 1.55, color: MUTED });
  }
  if (article.keywords?.length) {
    wr.space(8);
    wr.text(`Kalit so‘zlar: ${article.keywords.join(', ')}`, { font: 'sans', size: 9.5, color: MUTED });
  }
  wr.space(14);
  for (const p of article.body || []) {
    wr.text(p, { size: 11, lineHeight: 1.6 });
    wr.space(8);
  }
  return doc;
}

async function loadArticlePdf(article) {
  if (!article.pdf?.filename) return null;
  try {
    const bytes = await fs.readFile(path.join(UPLOAD_DIR, path.basename(article.pdf.filename)));
    return await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    return null;
  }
}

/**
 * @returns {{ bytes: Uint8Array, pages: number, warnings: string[] }}
 */
export async function buildIssuePdf(issue, articles) {
  const issueTitle = `${issue.year}-yil ${issue.number}-son`;
  const warnings = [];

  // 1. Har bir maqolaning sahifalarini tayyorlash
  const parts = [];
  for (const article of articles) {
    let src = await loadArticlePdf(article);
    if (article.pdf?.filename && !src) warnings.push(`"${article.title}" PDF faylini o‘qib bo‘lmadi — matnidan sahifa yaratildi`);
    if (!src) src = await buildTextArticle(article, issueTitle);
    parts.push({ article, src, pages: src.getPageCount() });
  }

  const book = await PDFDocument.create();
  const fonts = await loadFonts(book);
  book.setTitle(`${JOURNAL_NAME} — ${issueTitle}`);
  book.setAuthor(PUBLISHER);
  book.setSubject(JOURNAL_SUBTITLE);
  book.setProducer(PUBLISHER);

  // 2. Mundarija necha sahifa bo'lishini aniqlash uchun sinov joylashtiruvi
  const drawToc = async (doc, f, startPages) => {
    const wr = new Writer(doc, f);
    wr.text(JOURNAL_NAME.toUpperCase(), { font: 'sansBold', size: 8.5, color: RED });
    wr.space(6);
    wr.text(`${issueTitle} · Mundarija`, { font: 'bold', size: 22, lineHeight: 1.3 });
    wr.space(20);
    parts.forEach((p, i) => {
      const num = String(startPages[i] ?? 0);
      if (wr.y - 60 < MARGIN) wr.newPage();
      const top = wr.y;
      wr.text(`${i + 1}. ${p.article.title}`, { font: 'bold', size: 10.5, lineHeight: 1.4, maxWidth: wr.width - 40 });
      wr.page.drawText(num, {
        x: A4[0] - MARGIN - f.sans.widthOfTextAtSize(num, 10.5),
        y: top - 10.5 * 1.4,
        size: 10.5,
        font: f.sans,
        color: NAVY,
      });
      const meta = [p.article.authors?.join(', '), p.article.rubric?.name].filter(Boolean).join(' · ');
      if (meta) wr.text(meta, { font: 'sans', size: 9, color: MUTED, indent: 14, maxWidth: wr.width - 40 });
      wr.space(10);
    });
    return doc.getPageCount();
  };

  const probe = await PDFDocument.create();
  const tocPages = await drawToc(probe, await loadFonts(probe), []);

  // 3. Har bir maqola boshlanadigan sahifa (1 — muqova)
  const startPages = [];
  let cursor = 1 + tocPages + 1;
  for (const p of parts) {
    startPages.push(cursor);
    cursor += p.pages;
  }

  // 4. Kitobni yig'ish
  drawCover(book, fonts, issueTitle, articles.length);
  await drawToc(book, fonts, startPages);
  for (const p of parts) {
    const copied = await book.copyPages(p.src, p.src.getPageIndices());
    copied.forEach((page) => book.addPage(page));
  }

  const bytes = await book.save();
  return { bytes, pages: book.getPageCount(), warnings };
}
