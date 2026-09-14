import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import ArticleMeta from '../components/ArticleMeta.jsx';
import { Loading, ErrorMessage } from '../components/Status.jsx';
import { ArrowLeft, ArrowRight } from '../components/Icons.jsx';

export default function ArticleDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(() => api.article(slug), [slug]);

  return (
    <div className="container container--narrow">
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <article className="article">
          <div className="page-head">
            <ArticleMeta article={data} />
            <h1 className="article-title article__title">{data.title}</h1>
            {data.authors?.length > 0 && <div className="page-head__sub">{data.authors.join(', ')}</div>}
          </div>
          <div className="prose">
            {data.summary && <p>{data.summary}</p>}
            {data.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {data.pdf?.filename && (
            <a
              href={`${import.meta.env.VITE_API_URL || ''}/uploads/${data.pdf.filename}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn--primary article__pdf"
            >
              To‘liq maqola (PDF) <ArrowRight />
            </a>
          )}
          <Link to="/arxiv" className="link-arrow article__back">
            <ArrowLeft size={13} /> Arxivga qaytish
          </Link>
        </article>
      )}
    </div>
  );
}
