import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi, uploadUrl } from '../adminApi.js';
import { formatDate } from '../../utils/useFetch.js';
import { PageTitle, Field, Alert, useLoader, toInputDate, formatDateTime } from '../ui.jsx';

export default function IssueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const issue = useLoader(() => adminApi.issues.get(id), [id]);
  const [form, setForm] = useState(null);
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (issue.data) {
      const i = issue.data;
      setForm({ year: i.year, number: i.number, publishedAt: toInputDate(i.publishedAt), isCurrent: !!i.isCurrent, isOpen: i.isOpen });
    }
  }, [issue.data]);

  const act = async (key, fn, success) => {
    setBusy(key);
    try {
      const res = await fn();
      setFlash({ type: res?.warnings?.length ? 'error' : 'success', text: [res?.message || success, ...(res?.warnings || [])].join(' · ') });
      await issue.reload();
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  };

  if (issue.loading && !issue.data) return <div className="adm-empty">Yuklanmoqda…</div>;
  if (issue.error && !issue.data) return <Alert>{issue.error.message}</Alert>;
  if (!form) return null;

  const i = issue.data;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const withoutPdf = i.articles.filter((a) => !a.pdf?.filename).length;

  return (
    <>
      <PageTitle title={i.title}>
        <a href={`/sonlar/${i.year}/${i.number}`} target="_blank" rel="noreferrer" className="adm-btn adm-btn--ghost">
          Saytda ko‘rish ↗
        </a>
        <Link to="/admin/sonlar" className="adm-btn adm-btn--ghost">
          ← Barcha sonlar
        </Link>
      </PageTitle>
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <div className="adm-form-grid">
        <div>
          {/* Holat */}
          <div className={`adm-card adm-status-card ${i.isOpen ? 'is-open' : 'is-closed'}`}>
            <div>
              <h2 className="adm-card__title">{i.isOpen ? 'Son ochiq' : 'Son yopiq'}</h2>
              <p className="adm-muted">
                {i.isOpen
                  ? 'Bu songa yangi maqolalar biriktirish mumkin. Son to‘lgach uni yoping.'
                  : 'Yopiq songa yangi maqola biriktirib bo‘lmaydi. Mavjud maqolalarni tahrirlash mumkin.'}
              </p>
            </div>
            <button
              type="button"
              className={`adm-btn ${i.isOpen ? 'adm-btn--danger' : 'adm-btn--primary'}`}
              disabled={!!busy}
              onClick={() =>
                act('open', () => adminApi.issues.update(id, { isOpen: !i.isOpen }), i.isOpen ? 'Son yopildi' : 'Son qayta ochildi')
              }
            >
              {i.isOpen ? 'Sonni yopish' : 'Sonni qayta ochish'}
            </button>
          </div>

          {/* Maqolalar */}
          <div className="adm-card">
            <div className="adm-card__head">
              <h2 className="adm-card__title">Maqolalar ({i.articleCount})</h2>
              {i.isOpen && (
                <Link to={`/admin/maqolalar/yangi?issue=${i._id}`} className="adm-btn adm-btn--primary">
                  + Maqola qo‘shish
                </Link>
              )}
            </div>
            {i.articles.length ? (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sarlavha</th>
                      <th>Rukn</th>
                      <th>Sana</th>
                      <th>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {i.articles.map((a, n) => (
                      <tr key={a._id}>
                        <td>{n + 1}</td>
                        <td className="adm-table__title">
                          <Link to={`/admin/maqolalar/${a._id}`}>{a.title}</Link>
                        </td>
                        <td>{a.rubric?.name || '—'}</td>
                        <td className="adm-nowrap">{formatDate(a.publishedAt)}</td>
                        <td>{a.pdf?.filename ? '✓' : <span className="adm-muted">yo‘q</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="adm-empty">Bu sonda hali maqola yo‘q</p>
            )}
          </div>
        </div>

        <div className="adm-side-col">
          {/* Asosiy ma'lumotlar */}
          <form
            className="adm-card"
            onSubmit={(e) => {
              e.preventDefault();
              act('save', () => adminApi.issues.update(id, form), 'Saqlandi');
            }}
          >
            <h3 className="adm-card__title">Son ma'lumotlari</h3>
            <div className="adm-row">
              <Field label="Yil" required>
                <input className="input" type="number" value={form.year} onChange={set('year')} required />
              </Field>
              <Field label="Son" required>
                <input className="input" type="number" min="1" value={form.number} onChange={set('number')} required />
              </Field>
            </div>
            <Field label="Nashr sanasi">
              <input className="input" type="date" value={form.publishedAt} onChange={set('publishedAt')} />
            </Field>
            <label className="adm-check adm-check--block">
              <input type="checkbox" checked={form.isCurrent} onChange={set('isCurrent')} />
              Bosh sahifada “So‘nggi son” sifatida ko‘rsatish
            </label>
            <button type="submit" className="adm-btn adm-btn--primary adm-btn--block" disabled={!!busy}>
              {busy === 'save' ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </form>

          {/* PDF nashr */}
          <div className="adm-card">
            <h3 className="adm-card__title">To‘liq PDF nashr</h3>
            {i.pdf?.filename ? (
              <div className="adm-file">
                <a href={uploadUrl(i.pdf.filename)} target="_blank" rel="noreferrer" className="adm-link">
                  {i.pdf.originalName || i.pdf.filename}
                </a>
                <span className="adm-muted">
                  {(i.pdf.size / 1024 / 1024).toFixed(2)} MB
                  {i.pdf.generated ? ` · yig‘ilgan ${formatDateTime(i.pdf.generatedAt)}` : ' · qo‘lda yuklangan'}
                </span>
                <button
                  type="button"
                  className="adm-link adm-link--danger"
                  onClick={() => window.confirm('PDF nashrni o‘chirasizmi?') && act('remove', () => adminApi.issues.removePdf(id), 'PDF o‘chirildi')}
                >
                  O‘chirish
                </button>
              </div>
            ) : (
              <p className="adm-muted">PDF nashr hali yo‘q</p>
            )}

            <button
              type="button"
              className="adm-btn adm-btn--primary adm-btn--block"
              disabled={!!busy || !i.articleCount}
              onClick={() => act('generate', () => adminApi.issues.generatePdf(id))}
            >
              {busy === 'generate' ? 'Kitob yig‘ilmoqda…' : i.pdf?.generated ? 'Kitobni qayta yig‘ish' : 'Maqolalardan kitob yig‘ish'}
            </button>
            <span className="adm-field__hint">
              Muqova, mundarija va sondagi barcha maqolalar bitta PDF kitobga yig‘iladi.
              {withoutPdf > 0 && ` PDF’i yo‘q ${withoutPdf} ta maqola uchun matnidan sahifa yaratiladi.`}
            </span>

            <div className="adm-divider">yoki</div>

            <label className={`adm-btn adm-btn--ghost adm-btn--block adm-upload${busy ? ' is-disabled' : ''}`}>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) act('upload', () => adminApi.issues.uploadPdf(id, file), 'PDF nashr yuklandi');
                }}
              />
              {busy === 'upload' ? 'Yuklanmoqda…' : 'Tayyor PDF yuklash'}
            </label>
            <span className="adm-field__hint">Maksimal hajm 20 MB</span>
          </div>

          {!i.articleCount && (
            <button
              type="button"
              className="adm-btn adm-btn--danger adm-btn--block"
              onClick={async () => {
                if (!window.confirm(`${i.title}ni o‘chirasizmi?`)) return;
                try {
                  await adminApi.issues.remove(id);
                  navigate('/admin/sonlar', { replace: true });
                } catch (err) {
                  setFlash({ type: 'error', text: err.message });
                }
              }}
            >
              Sonni o‘chirish
            </button>
          )}
        </div>
      </div>
    </>
  );
}
