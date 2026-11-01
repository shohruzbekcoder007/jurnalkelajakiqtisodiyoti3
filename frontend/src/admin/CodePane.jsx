import { useEffect, useState } from 'react';
import HtmlFrame from '../components/HtmlFrame.jsx';

const PLACEHOLDER = `<style>
  .hero { padding: 48px; background: var(--navy-800); color: #fff; }
  .hero h2 { font-family: var(--font-display); font-size: 44px; margin: 0; }
</style>

<section class="hero">
  <h2>Kelajakni bugundan boshlang</h2>
  <button id="btn">Bosing</button>
</section>

<script>
  document.getElementById('btn').onclick = () => alert('Salom!');
</script>`;

// Erkin HTML/CSS/JS: chapda kod, pastda saytdagidek jonli ko'rinish
export default function CodePane({ value, onChange }) {
  const [preview, setPreview] = useState(value);
  const [device, setDevice] = useState('desktop');

  // Har bir harfda emas, yozish to'xtaganda yangilanadi (skriptlar qayta-qayta ishlamasligi uchun)
  useEffect(() => {
    const t = setTimeout(() => setPreview(value), 500);
    return () => clearTimeout(t);
  }, [value]);

  // Tab — fokusni o'tkazmasdan 2 ta bo'sh joy (Ctrl+Z bilan bekor qilinadigan tarzda)
  const onKeyDown = (e) => {
    if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    if (!document.execCommand('insertText', false, '  ')) {
      const el = e.target;
      el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end');
      onChange(el.value);
    }
  };

  return (
    <div className="code-pane">
      <textarea
        className="code-pane__input"
        value={value}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="code-pane__bar">
        <span className="code-pane__label">Saytdagi ko‘rinishi</span>
        <div className="code-pane__devices">
          {[
            ['desktop', 'Kompyuter'],
            ['mobile', 'Telefon'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`adm-tab${device === key ? ' is-active' : ''}`}
              onClick={() => setDevice(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={`code-pane__preview code-pane__preview--${device}`}>
        {preview.trim() ? (
          <HtmlFrame code={preview} title="Oldindan ko‘rish" preview />
        ) : (
          <div className="code-pane__empty">Kod yozilganda shu yerda ko‘rinadi</div>
        )}
      </div>
    </div>
  );
}
