import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch, formatDate } from '../utils/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import HtmlFrame from '../components/HtmlFrame.jsx';
import { useTheme } from '../utils/theme.js';
import { Loading, ErrorMessage } from '../components/Status.jsx';

export default function StaticPage({ slug }) {
  const { data, loading, error } = useFetch(() => api.page(slug), [slug]);
  const navigate = useNavigate();
  const theme = useTheme();

  // Matn ichidagi sayt havolalari sahifani qayta yuklamasdan ochiladi
  const onContentClick = (e) => {
    const a = e.target.closest('a');
    if (!a || a.target || a.origin !== window.location.origin || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (a.pathname.startsWith('/uploads/') || a.pathname.startsWith('/api/')) return;
    e.preventDefault();
    navigate(a.pathname + a.search + a.hash);
  };

  // Kod rejimidagi sahifalar o'z dizayniga ega — kengroq joy beriladi
  const isCode = data?.format === 'code';

  return (
    <div className={`container${isCode ? '' : ' container--narrow'}`}>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <>
          <PageHeader eyebrow={data.eyebrow} title={data.title}>
            {data.showUpdated ? `Yangilangan: ${formatDate(data.updatedAt)}` : null}
          </PageHeader>
          {isCode ? (
            <HtmlFrame code={data.code} title={data.title} theme={theme} />
          ) : data.content ? (
            // HTML server tomonida saqlashda tozalangan (backend/src/utils/sanitizeHtml.js)
            <div className="prose" onClick={onContentClick} dangerouslySetInnerHTML={{ __html: data.content }} />
          ) : (
            <div className="prose">
              {data.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
