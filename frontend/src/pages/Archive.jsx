import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import ArticleMeta from '../components/ArticleMeta.jsx';
import SideLabel from '../components/SideLabel.jsx';
import InfoBox from '../components/InfoBox.jsx';
import { Loading, ErrorMessage } from '../components/Status.jsx';
import { ArrowLeft, ArrowRight, Search } from '../components/Icons.jsx';

export default function Archive() {
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('sahifa'), 10) || 1;
  const q = params.get('q') || '';
  const rukn = params.get('rukn') || '';
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const rubrics = useFetch(() => api.rubrics());
  const list = useFetch(() => api.articles({ page, limit: 7, q, rubric: rukn }), [page, q, rukn]);

  const update = (next) => {
    const merged = { q, rukn, sahifa: String(page), ...next };
    setParams(Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'sahifa' && v === '1'))));
  };

  const onSearch = (e) => {
    e.preventDefault();
    update({ q: query.trim(), sahifa: '1' });
  };

  const pages = list.data?.pages || 1;

  return (
    <div className="container">
      <PageHeader eyebrow="Ilmiy fond" title="Maqolalar arxivi">
        Jurnal sonlarida chop etilgan ilmiy maqolalarni mavzu, rukn yoki kalit so‘z bo‘yicha izlang.
      </PageHeader>

      <div className="archive-grid">
        <div>
          <form className="search" onSubmit={onSearch}>
            <input
              className="input search__input"
              type="search"
              placeholder="Maqola nomi bo‘yicha izlash"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn--primary search__btn">
              <Search size={15} /> Izlash
            </button>
          </form>

          {list.loading && !list.data ? (
            <Loading />
          ) : list.error ? (
            <ErrorMessage error={list.error} />
          ) : list.data.items.length === 0 ? (
            <div className="status">Maqolalar topilmadi</div>
          ) : (
            <ul className="archive-list">
              {list.data.items.map((a) => (
                <li key={a._id} className="archive-item">
                  <ArticleMeta article={a} />
                  <h2 className="article-title archive-item__title">
                    <Link to={`/maqola/${a.slug}`}>{a.title}</Link>
                  </h2>
                  <p className="archive-item__summary">{a.summary}</p>
                  <Link to={`/maqola/${a.slug}`} className="link-arrow">
                    To‘liq maqola <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <nav className="pagination" aria-label="Sahifalar">
              <button
                type="button"
                className="pagination__btn"
                disabled={page <= 1}
                onClick={() => update({ sahifa: String(page - 1) })}
                aria-label="Oldingi"
              >
                <ArrowLeft />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pagination__btn${n === page ? ' is-active' : ''}`}
                  onClick={() => update({ sahifa: String(n) })}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="pagination__btn"
                disabled={page >= pages}
                onClick={() => update({ sahifa: String(page + 1) })}
                aria-label="Keyingi"
              >
                <ArrowRight />
              </button>
            </nav>
          )}
        </div>

        <aside className="archive-aside">
          <SideLabel>Rukn bo‘yicha</SideLabel>
          <select className="input select" value={rukn} onChange={(e) => update({ rukn: e.target.value, sahifa: '1' })}>
            <option value="">Barcha ruknlar</option>
            {(rubrics.data || []).map((r) => (
              <option key={r._id} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <InfoBox title="Arxiv haqida">Maqolalar soni, rukni va nashr qilingan sanasi bo‘yicha saralangan.</InfoBox>
        </aside>
      </div>
    </div>
  );
}
