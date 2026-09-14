import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { formatDate } from '../../utils/useFetch.js';
import { PageTitle, Alert, Pager, useLoader } from '../ui.jsx';

export default function Articles() {
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page'), 10) || 1;
  const q = params.get('q') || '';
  const rubric = params.get('rubric') || '';
  const issue = params.get('issue') || '';
  const [query, setQuery] = useState(q);
  const [flash, setFlash] = useState({ type: '', text: '' });

  const rubrics = useLoader(() => adminApi.rubrics.list());
  const list = useLoader(() => adminApi.articles.list({ page, q, rubric, issue }), [page, q, rubric, issue]);

  const update = (next) => {
    const merged = { q, rubric, issue, page: String(page), ...next };
    setParams(Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'page' && v === '1'))));
  };

  const onDelete = async (a) => {
    if (!window.confirm(`"${a.title}" maqolasini o‘chirasizmi?`)) return;
    try {
      await adminApi.articles.remove(a._id);
      setFlash({ type: 'success', text: 'Maqola o‘chirildi' });
      list.reload();
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      <PageTitle title="Maqolalar">
        <Link to="/admin/maqolalar/yangi" className="adm-btn adm-btn--primary">
          + Yangi maqola
        </Link>
      </PageTitle>
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <div className="adm-card">
        <form
          className="adm-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: query.trim(), page: '1' });
          }}
        >
          <input
            className="input"
            type="search"
            placeholder="Sarlavha bo‘yicha qidirish"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="input" value={rubric} onChange={(e) => update({ rubric: e.target.value, page: '1' })}>
            <option value="">Barcha ruknlar</option>
            {(rubrics.data || []).map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
          <button type="submit" className="adm-btn">
            Qidirish
          </button>
        </form>

        <Alert>{list.error?.message}</Alert>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Sarlavha</th>
                <th>Rukn</th>
                <th>Son</th>
                <th>Sana</th>
                <th>PDF</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data?.items || []).map((a) => (
                <tr key={a._id}>
                  <td className="adm-table__title">
                    <Link to={`/admin/maqolalar/${a._id}`}>{a.title}</Link>
                    {a.featuredOrder && (
                      <Link to="/admin/tanlangan" className="adm-badge adm-badge--featured" title="Bosh sahifada tanlangan">
                        ★ {a.featuredOrder}-o‘rin
                      </Link>
                    )}
                  </td>
                  <td>{a.rubric?.name || '—'}</td>
                  <td className="adm-nowrap">{a.issue?.title || '—'}</td>
                  <td className="adm-nowrap">{formatDate(a.publishedAt)}</td>
                  <td>{a.pdf?.filename ? '✓' : '—'}</td>
                  <td className="adm-actions">
                    <a href={`/maqola/${a.slug}`} target="_blank" rel="noreferrer" className="adm-link">
                      Ko‘rish
                    </a>
                    <Link to={`/admin/maqolalar/${a._id}`} className="adm-link">
                      Tahrirlash
                    </Link>
                    <button type="button" className="adm-link adm-link--danger" onClick={() => onDelete(a)}>
                      O‘chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.loading && list.data?.items.length === 0 && <p className="adm-empty">Maqolalar topilmadi</p>}
        <div className="adm-card__foot">
          <span className="adm-muted">Jami: {list.data?.total ?? 0}</span>
          <Pager page={page} pages={list.data?.pages || 1} onChange={(p) => update({ page: String(p) })} />
        </div>
      </div>
    </>
  );
}
