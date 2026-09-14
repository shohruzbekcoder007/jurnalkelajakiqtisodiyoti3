import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../adminApi.js';
import { formatDate } from '../../utils/useFetch.js';
import { PageTitle, Alert, useLoader } from '../ui.jsx';

const slots = [
  { label: '1-o‘rin', hint: 'Katta to‘q karta (chapda)' },
  { label: '2-o‘rin', hint: 'O‘ngdagi yuqori karta' },
  { label: '3-o‘rin', hint: 'O‘ngdagi pastki karta' },
];

function Slot({ index, value, options, taken, onChange }) {
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o._id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => o._id === value || !q || o.title.toLowerCase().includes(q));
  }, [options, query, value]);

  return (
    <div className={`adm-card adm-slot${index === 0 ? ' adm-slot--main' : ''}`}>
      <div className="adm-slot__head">
        <span className="adm-slot__num">{slots[index].label}</span>
        <span className="adm-muted">{slots[index].hint}</span>
      </div>

      {selected ? (
        <div className="adm-slot__preview">
          <span className="adm-slot__meta">
            {selected.rubric?.name} · {formatDate(selected.publishedAt)}
          </span>
          <span className="adm-slot__title">{selected.title}</span>
        </div>
      ) : (
        <div className="adm-slot__preview adm-slot__preview--empty">Maqola tanlanmagan</div>
      )}

      <input
        className="input"
        type="search"
        placeholder="Sarlavha bo‘yicha qidirish…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">— Bo‘sh qoldirish —</option>
        {filtered.map((o) => (
          <option key={o._id} value={o._id} disabled={taken.includes(o._id) && o._id !== value}>
            {formatDate(o.publishedAt)} — {o.title.length > 90 ? `${o.title.slice(0, 90)}…` : o.title}
          </option>
        ))}
      </select>
      {value && (
        <button type="button" className="adm-link adm-link--muted" onClick={() => onChange(null)}>
          Tozalash
        </button>
      )}
    </div>
  );
}

export default function Featured() {
  const options = useLoader(() => adminApi.articles.options());
  const current = useLoader(() => adminApi.featured.get());
  const [chosen, setChosen] = useState([null, null, null]);
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (current.data) setChosen(current.data.map((a) => a?._id || null));
  }, [current.data]);

  const setSlot = (i) => (id) => setChosen((c) => c.map((v, j) => (j === i ? id : v)));

  const move = (i, dir) =>
    setChosen((c) => {
      const next = [...c];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });

  const dirty = JSON.stringify(chosen) !== JSON.stringify((current.data || []).map((a) => a?._id || null));

  const onSave = async () => {
    setBusy(true);
    try {
      const res = await adminApi.featured.save(chosen);
      setFlash({ type: 'success', text: res.message });
      current.reload();
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const list = options.data || [];

  return (
    <>
      <PageTitle title="Tanlangan maqolalar">
        <a href="/" target="_blank" rel="noreferrer" className="adm-btn adm-btn--ghost">
          Bosh sahifani ko‘rish ↗
        </a>
        <button type="button" className="adm-btn adm-btn--primary" onClick={onSave} disabled={busy || !dirty}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </PageTitle>
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>
      <Alert>{options.error?.message || current.error?.message}</Alert>

      <p className="adm-intro">
        Bosh sahifadagi “Tanlangan maqolalar” blokida ko‘rsatiladigan 3 ta maqolani tanlang. Bo‘sh qolgan o‘rin
        saytda ko‘rinmaydi; birorta ham maqola tanlanmasa, blok yashiriladi.
      </p>

      <div className="adm-slots">
        {chosen.map((value, i) => (
          <div key={i} className="adm-slot-wrap">
            <Slot index={i} value={value} options={list} taken={chosen.filter(Boolean)} onChange={setSlot(i)} />
            <div className="adm-slot__move">
              {i > 0 && (
                <button type="button" className="adm-link" onClick={() => move(i, -1)}>
                  ← Oldinga
                </button>
              )}
              {i < 2 && (
                <button type="button" className="adm-link" onClick={() => move(i, 1)}>
                  Orqaga →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {dirty && <p className="adm-muted adm-unsaved">Saqlanmagan o‘zgarishlar bor</p>}
    </>
  );
}
