import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Admin yozgan erkin HTML/CSS/JS shu iframe ichida ishlaydi:
// - sandbox'da allow-same-origin yo'q → skript sayt cookie/localStorage (admin tokeni) va DOM'iga kira olmaydi
// - CSS faqat iframe ichiga ta'sir qiladi, sayt header/footer'ini buzmaydi
const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals';

const FONTS =
  'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Space+Mono:wght@400;700&display=swap';

// Sayt ranglari va shriftlari o'zgaruvchi sifatida ham beriladi: var(--teal), var(--font-serif) ...
// Tungi rejim qiymatlari styles.css dagi :root[data-theme='dark'] bilan bir xil
const BASE_CSS = `
:root {
  --navy-900: #0f2a35; --navy-800: #173744; --teal: #31718d; --teal-soft: #dceaea; --red: #c66d5d;
  --paper: #fffefa; --bg: #f5f5f3; --line: #d6dfdc; --text: #173744; --heading: #173744; --muted: #4b5b67;
  --font-display: 'Instrument Serif', 'Times New Roman', serif;
  --font-serif: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  --font-sans: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'Space Mono', ui-monospace, Consolas, monospace;
}
:root[data-theme='dark'] {
  color-scheme: dark;
  --teal: #74b4cc; --teal-soft: #173039; --red: #e0907f;
  --paper: #13222a; --bg: #0c171c; --line: #2a3e47; --text: #d5e0e2; --heading: #eef4f4; --muted: #9aadb2;
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: var(--font-sans); font-size: 15px; line-height: 1.6; color: var(--text); -webkit-font-smoothing: antialiased; }
img, video { max-width: 100%; height: auto; }
a { color: var(--teal); }
`;

// Balandlikni sahifaga yuboradi, havolalarni sahifa orqali ochadi
const BRIDGE = `<script>(function () {
  var last = 0, lastDelta = 0, lastTime = 0, same = 0;
  function send() {
    var b = document.body;
    if (!b) return;
    // <html> balandligi oxirgi elementning pastki margin'ini ham o'z ichiga oladi;
    // documentElement.scrollHeight esa oynadan kichik bo'lmaydi — kichrayishga xalaqit beradi
    var mb = parseFloat(getComputedStyle(b).marginBottom) || 0;
    var h = Math.ceil(Math.max(b.scrollHeight, b.getBoundingClientRect().bottom + mb, document.documentElement.getBoundingClientRect().height));
    if (h === last) return;
    var now = Date.now(), d = h - last;
    same = d > 0 && d === lastDelta && now - lastTime < 300 ? same + 1 : 0;
    lastDelta = d;
    lastTime = now;
    // 100vh kabi oyna balandligiga bog'liq bloklar balandlikni har safar bir xil qadamda
    // cheksiz o'stiradi — bunday tez tsikl to'xtatiladi (keyingi haqiqiy o'zgarishda davom etadi)
    if (same >= 4) return;
    last = h;
    parent.postMessage({ type: 'ki-frame-height', height: h }, '*');
  }
  if (window.ResizeObserver) new ResizeObserver(send).observe(document.body);
  window.addEventListener('load', send);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(send);
  send();
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented) return;
    var href = a.getAttribute('href');
    if (href.charAt(0) === '#') {
      e.preventDefault();
      var t = href.length > 1 && document.getElementById(decodeURIComponent(href.slice(1)));
      if (t) parent.postMessage({ type: 'ki-frame-scroll', top: t.getBoundingClientRect().top }, '*');
      return;
    }
    if (a.target && a.target !== '_self' && a.target !== '_top' && a.target !== '_parent') return;
    e.preventDefault();
    parent.postMessage({ type: 'ki-frame-navigate', href: a.href, newTab: e.ctrlKey || e.metaKey }, '*');
  });
})();</script>`;

export function buildSrcDoc(code = '', theme = 'light') {
  // To'liq hujjat (<html>...) bo'lsa o'zgarishsiz, faqat ko'prik skripti qo'shiladi
  if (/<html[\s>]/i.test(code)) {
    return /<\/body>/i.test(code) ? code.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${BRIDGE}</body>`) : code + BRIDGE;
  }
  return `<!doctype html><html lang="uz" data-theme="${theme === 'dark' ? 'dark' : 'light'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${FONTS}"><style>${BASE_CSS}</style></head><body>${code}${BRIDGE}</body></html>`;
}

export default function HtmlFrame({ code, title, preview = false, theme = 'light' }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(160);
  const navigate = useNavigate();
  const srcDoc = useMemo(() => buildSrcDoc(code, theme), [code, theme]);

  useEffect(() => {
    const open = (href, newTab) => {
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return;
      // Admin oldindan ko'rishida havola admin panelni tark ettirmaydi
      if (newTab || preview) {
        window.open(url.href, '_blank', 'noopener');
      } else if (url.origin === window.location.origin && !/^\/(uploads|api)\//.test(url.pathname)) {
        navigate(url.pathname + url.search + url.hash);
      } else {
        window.location.assign(url.href);
      }
    };

    const onMessage = (e) => {
      const frame = ref.current;
      if (!frame || e.source !== frame.contentWindow || !e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'ki-frame-height') {
        setHeight(Math.min(Math.max(Number(e.data.height) || 0, 40), 40000));
      } else if (e.data.type === 'ki-frame-scroll') {
        const top = frame.getBoundingClientRect().top + window.scrollY + (Number(e.data.top) || 0) - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      } else if (e.data.type === 'ki-frame-navigate') {
        open(String(e.data.href || ''), !!e.data.newTab);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate, preview]);

  return <iframe ref={ref} className="html-frame" title={title} sandbox={SANDBOX} srcDoc={srcDoc} style={{ height }} />;
}
