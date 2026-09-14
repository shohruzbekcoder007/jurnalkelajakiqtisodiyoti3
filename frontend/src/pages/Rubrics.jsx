import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import { Loading, ErrorMessage } from '../components/Status.jsx';
import { ChevronRight } from '../components/Icons.jsx';

export default function Rubrics() {
  const { data, loading, error } = useFetch(() => api.rubrics());

  return (
    <div className="container">
      <PageHeader eyebrow="Maqolalar tuzilmasi" title="Jurnal ruknlari">
        Kelajak iqtisodiyoti va raqamli transformatsiyalar bo‘yicha tadqiqotlarning asosiy yo‘nalishlari.
      </PageHeader>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <div className={`rubric-grid${data.length % 2 ? ' rubric-grid--odd' : ''}`}>
          {data.map((r, i) => (
            <Link key={r._id} to={`/arxiv?rukn=${r.slug}`} className="rubric-cell">
              <span className="rubric-cell__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rubric-cell__name">{r.name}</span>
              <span className="rubric-cell__count">
                {r.articleCount} ta maqola <ChevronRight size={11} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
