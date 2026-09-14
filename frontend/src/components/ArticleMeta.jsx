import { formatDate } from '../utils/useFetch.js';

export default function ArticleMeta({ article }) {
  const parts = [article.rubric?.name, article.issue?.title, formatDate(article.publishedAt)].filter(Boolean);
  return (
    <div className="meta">
      {parts.map((p, i) => (
        <span key={i} className="meta__item">
          {i > 0 && <span className="meta__dash" />}
          {p}
        </span>
      ))}
    </div>
  );
}
