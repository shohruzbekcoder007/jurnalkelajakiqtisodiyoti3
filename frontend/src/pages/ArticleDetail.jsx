import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import ArticleMeta from '../components/ArticleMeta.jsx';
import { Loading, ErrorMessage } from '../components/Status.jsx';
import { ArrowLeft, Download, External } from '../components/Icons.jsx';

const fileUrl = (filename) => `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/uploads/${filename}`;

function PdfViewer({ pdf, title }) {
  const url = fileUrl(pdf.filename);
  const name = pdf.originalName || `${title}.pdf`;
  const size = pdf.size ? `${(pdf.size / 1024 / 1024).toFixed(2)} MB` : '';
  // Ko'pchilik mobil brauzerlar PDF'ni sahifa ichida ko'rsata olmaydi (pdfViewerEnabled === false)
  const canEmbed = typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false;

  const fallback = (
    <div className="pdf__fallback">
      <p>Brauzeringiz PDF faylni sahifa ichida ko‘rsata olmaydi.</p>
      <a href={url} target="_blank" rel="noreferrer" className="btn btn--primary pdf__btn">
        <External size={14} /> PDF faylni ochish
      </a>
    </div>
  );

  return (
    <section className="pdf">
      <div className="pdf__bar">
        <div className="pdf__info">
          <span className="pdf__label">To‘liq maqola · PDF</span>
          <span className="pdf__name" title={name}>
            {name}
            {size && <span className="pdf__size"> · {size}</span>}
          </span>
        </div>
        <div className="pdf__actions">
          <a href={url} target="_blank" rel="noreferrer" className="btn btn--outline pdf__btn">
            <External size={14} /> Yangi oynada ochish
          </a>
          <a href={url} download={name} className="btn btn--primary pdf__btn">
            <Download size={14} /> Yuklab olish
          </a>
        </div>
      </div>

      {canEmbed ? (
        <object data={`${url}#view=FitH&navpanes=0`} type="application/pdf" className="pdf__frame" aria-label={title}>
          {fallback}
        </object>
      ) : (
        fallback
      )}
    </section>
  );
}

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

          {data.pdf?.filename && <PdfViewer pdf={data.pdf} title={data.title} />}

          <Link to="/arxiv" className="link-arrow article__back">
            <ArrowLeft size={13} /> Arxivga qaytish
          </Link>
        </article>
      )}
    </div>
  );
}
