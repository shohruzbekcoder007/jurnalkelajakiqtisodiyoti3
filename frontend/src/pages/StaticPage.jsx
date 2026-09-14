import { api } from '../api.js';
import { useFetch, formatDate } from '../utils/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import { Loading, ErrorMessage } from '../components/Status.jsx';

export default function StaticPage({ slug }) {
  const { data, loading, error } = useFetch(() => api.page(slug), [slug]);

  return (
    <div className="container container--narrow">
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <>
          <PageHeader eyebrow={data.eyebrow} title={data.title}>
            {data.showUpdated ? `Yangilangan: ${formatDate(data.updatedAt)}` : null}
          </PageHeader>
          <div className="prose">
            {data.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
