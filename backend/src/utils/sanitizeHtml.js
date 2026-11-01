import sanitizeHtml from 'sanitize-html';

// Admin muharriri (TipTap) chiqaradigan teglar; qolgani (script, on* atributlar, ...) olib tashlanadi
const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/i, /^inherit$/];
const SIZE = [/^\d+(\.\d+)?(px|%)$/];

const options = {
  allowedTags: [
    'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'span', 'mark', 'a',
    'ul', 'ol', 'li', 'blockquote', 'hr', 'img',
    'table', 'colgroup', 'col', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'iframe',
  ],
  allowedAttributes: {
    '*': ['style'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    mark: ['data-color'],
    ol: ['start', 'type'],
    th: ['colspan', 'rowspan', 'colwidth'],
    td: ['colspan', 'rowspan', 'colwidth'],
    div: ['data-youtube-video'],
    iframe: ['src', 'width', 'height', 'allowfullscreen', 'allow', 'frameborder'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
      color: COLOR,
      'background-color': COLOR,
      width: SIZE,
      'min-width': SIZE,
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'],
  allowIframeRelativeUrls: false,
  // Ruxsat etilmagan manzil olib tashlangach bo'sh qolgan iframe ham kerak emas
  exclusiveFilter: (frame) => frame.tag === 'iframe' && !frame.attribs.src,
  transformTags: {
    // Faqat "yangi oynada" ruxsat etiladi va u doim noopener bilan
    // eslint-disable-next-line no-unused-vars
    a: (tagName, { target, rel, ...attribs }) => ({
      tagName,
      attribs: target === '_blank' ? { ...attribs, target, rel: 'noopener noreferrer' } : attribs,
    }),
  },
};

export function cleanPageHtml(html) {
  return sanitizeHtml(String(html || ''), options).trim();
}
