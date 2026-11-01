import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { PageTitle, Field, Alert } from '../ui.jsx';
import { publicPagePath } from '../../utils/pagePath.js';

// Muharrir og'ir — faqat shu sahifada yuklanadi
const RichEditor = lazy(() => import('../RichEditor.jsx'));

const empty = { title: '', eyebrow: '', slug: '', showUpdated: false, content: '' };

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Eski sahifalar: paragraflar ro'yxati → HTML
const toHtml = (page) => page.content || (page.body || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');

export default function PageForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [slug, setSlug] = useState('');
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    adminApi.pages
      .get(id)
      .then((p) => {
        setSlug(p.slug);
        setForm({ title: p.title, eyebrow: p.eyebrow || '', slug: p.slug, showUpdated: !!p.showUpdated, content: toHtml(p) });
      })
      .catch((err) => setFlash({ type: 'error', text: err.message }));
  }, [id, isNew]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (isNew) {
        const created = await adminApi.pages.create(form);
        navigate(`/admin/sahifalar/${created._id}`, { replace: true });
        return;
      }
      await adminApi.pages.update(id, form);
      setFlash({ type: 'success', text: 'Sahifa saqlandi' });
    } catch (err) {
      setErrors(err.errors || {});
      setFlash({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle title={isNew ? 'Yangi sahifa' : 'Sahifani tahrirlash'}>
        {!isNew && slug && (
          <a href={publicPagePath(slug)} target="_blank" rel="noreferrer" className="adm-btn adm-btn--ghost">
            Saytda ko‘rish ↗
          </a>
        )}
        <Link to="/admin/sahifalar" className="adm-btn adm-btn--ghost">
          ← Ro‘yxatga qaytish
        </Link>
      </PageTitle>
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <form className="adm-card adm-form" onSubmit={onSubmit}>
        <Field label="Sarlavha" required error={errors.title} wide>
          <input className="input" value={form.title} onChange={set('title')} required />
        </Field>
        <Field label="Ustki yozuv" hint="Sarlavha ustidagi kichik qizil yozuv, masalan: Tahririyat sahifasi">
          <input className="input" value={form.eyebrow} onChange={set('eyebrow')} />
        </Field>
        {isNew && (
          <Field label="Slug (URL)" hint="Bo‘sh qoldirilsa sarlavhadan yaratiladi">
            <input className="input" value={form.slug} onChange={set('slug')} />
          </Field>
        )}
        <label className="adm-check adm-field--wide">
          <input type="checkbox" checked={form.showUpdated} onChange={set('showUpdated')} />
          “Yangilangan: sana” yozuvini ko‘rsatish
        </label>
        {/* <label> emas: muharrir ichidagi tugmalar label bosilishini o'g'irlamasligi uchun */}
        <div className="adm-field adm-field--wide">
          <span className="adm-field__label">Matn</span>
          <Suspense fallback={<div className="rte rte--loading">Muharrir yuklanmoqda…</div>}>
            <RichEditor value={form.content} onChange={(content) => setForm((f) => ({ ...f, content }))} />
          </Suspense>
        </div>
        <div className="adm-field--wide">
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
            {busy ? 'Saqlanmoqda…' : isNew ? 'Sahifani yaratish' : 'Saqlash'}
          </button>
        </div>
      </form>
    </>
  );
}
