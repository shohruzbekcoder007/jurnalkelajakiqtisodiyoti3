import { formatDate } from '../utils/useFetch.js';

// Chiziq oldingi elementga biriktiriladi — qator bo'linganda asl saytdagidek birinchi qator oxirida qoladi
export default function ArticleMeta({ article }) {
  const parts = [article.rubric?.name, article.issue?.title, formatDate(article.publishedAt)].filter(Boolean);
  return (
    <div className="meta">
      {parts.map((p, i) => (
        <span key={i} className="meta__item">
          {p}
          {i < parts.length - 1 && <span className="meta__dash" />}
        </span>
      ))}
    </div>
  );
}
