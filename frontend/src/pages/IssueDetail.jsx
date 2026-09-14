import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import ArticleMeta from '../components/ArticleMeta.jsx';
import PdfViewer from '../components/PdfViewer.jsx';
import { Loading, ErrorMessage } from '../components/Status.jsx';
import { ArrowLeft, ArrowRight } from '../components/Icons.jsx';

export default function IssueDetail() {
  const { year, number } = useParams();
  const { data, loading, error } = useFetch(() => api.issue(year, number), [year, number]);

  if (loading) {
    return (
      <div className="container">
        <Loading />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container">
        <ErrorMessage error={error} />
      </div>
    );
  }

  return (
    <div className="container">
      <PageHeader eyebrow={data.isCurrent ? 'So‘nggi son' : 'Jurnal soni'} title={data.title}>
        {data.articleCount} ta ilmiy maqola
        {data.isOpen ? ' · Maqolalar qabul qilinmoqda' : ''}
      </PageHeader>

      <div className="issue-layout">
        <div>
          <div className="section-head">
            <h2 className="section-head__title">Mundarija</h2>
            <span className="section-head__note">{data.articleCount} ta maqola</span>
          </div>
          {data.articles.length === 0 ? (
            <div className="status">Bu sonda hali maqolalar yo‘q</div>
          ) : (
            <ol className="issue-toc">
              {data.articles.map((a, i) => (
                <li key={a._id} className="issue-toc__item">
                  <span className="issue-toc__num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <ArticleMeta article={a} />
                    <h3 className="article-title issue-toc__title">
                      <Link to={`/maqola/${a.slug}`}>{a.title}</Link>
                    </h3>
                    {a.authors?.length > 0 && <div className="issue-toc__authors">{a.authors.join(', ')}</div>}
                    <Link to={`/maqola/${a.slug}`} className="link-arrow">
                      Maqolani o‘qish <ArrowRight size={13} />
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {data.pdf ? (
        <PdfViewer
          pdf={data.pdf}
          title={data.title}
          label="Jurnal sonining to‘liq nashri · PDF"
          downloadName={`${data.year}-yil-${data.number}-son.pdf`}
        />
      ) : (
        <div className="issue-nopdf">Bu sonning to‘liq PDF nashri hali joylanmagan.</div>
      )}

      <Link to="/sonlar" className="link-arrow article__back">
        <ArrowLeft size={13} /> Barcha sonlar
      </Link>
    </div>
  );
}
