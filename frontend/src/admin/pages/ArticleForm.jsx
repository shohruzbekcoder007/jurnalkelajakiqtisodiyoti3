import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { adminApi, uploadUrl } from '../adminApi.js';
import { PageTitle, Field, Alert, useLoader, toInputDate } from '../ui.jsx';

const empty = {
  title: '',
  slug: '',
  summary: '',
  authors: '',
  keywords: '',
  body: '',
  rubric: '',
  issue: '',
  publishedAt: toInputDate(new Date()),
};

const fromArticle = (a) => ({
  title: a.title || '',
  slug: a.slug || '',
  summary: a.summary || '',
  authors: (a.authors || []).join(', '),
  keywords: (a.keywords || []).join(', '),
  body: (a.body || []).join('\n\n'),
  rubric: a.rubric || '',
  issue: a.issue || '',
  publishedAt: toInputDate(a.publishedAt),
});

export default function ArticleForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);

  const rubrics = useLoader(() => adminApi.rubrics.list());
  const issues = useLoader(() => adminApi.issues.list());

  const [form, setForm] = useState(empty);
  const [article, setArticle] = useState(null);
  const [errors, setErrors] = useState({});
  const [flash, setFlash] = useState(
    location.state?.saved ? { type: 'success', text: 'Maqola yaratildi' } : { type: '', text: '' }
  );
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [pendingName, setPendingName] = useState('');

  useEffect(() => {
    if (isNew) {
      setForm(empty);
      setArticle(null);
      return;
    }
    setLoading(true);
    adminApi.articles
      .get(id)
      .then((a) => {
        setArticle(a);
        setForm(fromArticle(a));
      })
      .catch((err) => setFlash({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  // Yangi maqola uchun joriy sonni avtomatik tanlash
  useEffect(() => {
    if (isNew && !form.issue && issues.data?.length) {
      const current = issues.data.find((i) => i.isCurrent) || issues.data[0];
      setForm((f) => ({ ...f, issue: current._id }));
    }
  }, [isNew, issues.data, form.issue]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFlash({});
    try {
      const payload = { ...form, slug: isNew ? form.slug || undefined : form.slug };
      if (isNew) {
        const created = await adminApi.articles.create(payload);
        const file = fileRef.current?.files?.[0];
        if (file) await adminApi.articles.uploadPdf(created._id, file);
        navigate(`/admin/maqolalar/${created._id}`, { replace: true, state: { saved: true } });
        return;
      }
      const updated = await adminApi.articles.update(id, payload);
      setArticle(updated);
      setForm(fromArticle(updated));
      setFlash({ type: 'success', text: 'O‘zgarishlar saqlandi' });
    } catch (err) {
      setErrors(err.errors || {});
      setFlash({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const onPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isNew) return;
    setBusy(true);
    try {
      const updated = await adminApi.articles.uploadPdf(id, file);
      setArticle(updated);
      setFlash({ type: 'success', text: 'PDF yuklandi' });
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    } finally {
      e.target.value = '';
      setBusy(false);
    }
  };

  const onRemovePdf = async () => {
    if (!window.confirm('PDF faylni o‘chirasizmi?')) return;
    try {
      setArticle(await adminApi.articles.removePdf(id));
      setFlash({ type: 'success', text: 'PDF o‘chirildi' });
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Maqolani butunlay o‘chirasizmi?')) return;
    try {
      await adminApi.articles.remove(id);
      navigate('/admin/maqolalar', { replace: true });
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    }
  };

  if (loading) return <div className="adm-empty">Yuklanmoqda…</div>;

  return (
    <>
      <PageTitle title={isNew ? 'Yangi maqola' : 'Maqolani tahrirlash'}>
        {!isNew && article && (
          <a href={`/maqola/${article.slug}`} target="_blank" rel="noreferrer" className="adm-btn adm-btn--ghost">
            Saytda ko‘rish ↗
          </a>
        )}
        <Link to="/admin/maqolalar" className="adm-btn adm-btn--ghost">
          ← Ro‘yxatga qaytish
        </Link>
      </PageTitle>
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <form className="adm-form-grid" onSubmit={onSubmit}>
        <div className="adm-card">
          <Field label="Sarlavha" required error={errors.title} wide>
            <textarea className="input adm-textarea adm-textarea--sm" value={form.title} onChange={set('title')} required />
          </Field>
          <Field label="Qisqa izoh (annotatsiya)" error={errors.summary} wide>
            <textarea className="input adm-textarea adm-textarea--sm" value={form.summary} onChange={set('summary')} />
          </Field>
          <Field label="Mualliflar" hint="Vergul bilan ajrating" wide>
            <input className="input" value={form.authors} onChange={set('authors')} placeholder="A. Aliyev, B. Karimova" />
          </Field>
          <Field label="Kalit so‘zlar" hint="Vergul bilan ajrating" wide>
            <input className="input" value={form.keywords} onChange={set('keywords')} />
          </Field>
          <Field label="Maqola matni" hint="Paragraflarni bo‘sh qator bilan ajrating" wide>
            <textarea className="input adm-textarea adm-textarea--lg" value={form.body} onChange={set('body')} />
          </Field>
        </div>

        <div className="adm-side-col">
          <div className="adm-card">
            <Field label="Rukn" required error={errors.rubric}>
              <select className="input" value={form.rubric} onChange={set('rubric')} required>
                <option value="">— Tanlang —</option>
                {(rubrics.data || []).map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jurnal soni" required error={errors.issue}>
              <select className="input" value={form.issue} onChange={set('issue')} required>
                <option value="">— Tanlang —</option>
                {(issues.data || []).map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.title}
                    {i.isCurrent ? ' (joriy)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nashr sanasi" required error={errors.publishedAt}>
              <input className="input" type="date" value={form.publishedAt} onChange={set('publishedAt')} required />
            </Field>
            <Field label="Slug (URL)" hint={isNew ? 'Bo‘sh qoldirilsa sarlavhadan yaratiladi' : `/maqola/${form.slug}`}>
              <input className="input" value={form.slug} onChange={set('slug')} />
            </Field>
            <button type="submit" className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
              {busy ? 'Saqlanmoqda…' : isNew ? 'Maqolani yaratish' : 'Saqlash'}
            </button>
          </div>

          <div className="adm-card">
            <h3 className="adm-card__title">PDF fayl</h3>
            {article?.pdf?.filename ? (
              <div className="adm-file">
                <a href={uploadUrl(article.pdf.filename)} target="_blank" rel="noreferrer" className="adm-link">
                  {article.pdf.originalName || article.pdf.filename}
                </a>
                <span className="adm-muted">{(article.pdf.size / 1024 / 1024).toFixed(2)} MB</span>
                <button type="button" className="adm-link adm-link--danger" onClick={onRemovePdf}>
                  O‘chirish
                </button>
              </div>
            ) : (
              <p className="adm-muted">PDF yuklanmagan</p>
            )}
            <label className={`adm-btn adm-btn--ghost adm-btn--block adm-upload${busy ? ' is-disabled' : ''}`}>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={isNew ? (e) => setPendingName(e.target.files?.[0]?.name || '') : onPdf}
                disabled={busy}
              />
              {article?.pdf?.filename ? 'Boshqa PDF yuklash' : 'PDF tanlash'}
            </label>
            <span className="adm-field__hint">
              {isNew && pendingName ? `Tanlandi: ${pendingName}. ` : ''}
              {isNew ? 'Maqola yaratilganda yuklanadi. ' : ''}Maksimal hajm 20 MB
            </span>
          </div>

          {!isNew && (
            <button type="button" className="adm-btn adm-btn--danger adm-btn--block" onClick={onDelete}>
              Maqolani o‘chirish
            </button>
          )}
        </div>
      </form>
    </>
  );
}
