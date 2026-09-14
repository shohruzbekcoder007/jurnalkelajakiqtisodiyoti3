import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from './Icons.jsx';

// Jurnal soni kartasi (bosh sahifadagi "So'nggi son" va sonlar arxivida)
export default function IssueCard({ issue, label = 'Jurnal soni', className = '' }) {
  if (!issue) {
    return (
      <div className={`issue-card ${className}`}>
        <span className="issue-card__mark" aria-hidden>KI</span>
        <div className="issue-card__top">
          <span>{label}</span>
        </div>
        <div className="issue-card__title">—</div>
        <div className="issue-card__foot" />
      </div>
    );
  }

  return (
    <Link to={`/sonlar/${issue.year}/${issue.number}`} className={`issue-card issue-card--link ${className}`}>
      <span className="issue-card__mark" aria-hidden>KI</span>
      <div className="issue-card__top">
        <span>{label}</span>
        <span>№ {issue.title}</span>
      </div>
      <div className="issue-card__title">{issue.title}</div>
      <div className="issue-card__foot">
        <span className="issue-card__line" />
        <BookOpen size={14} />
        <span>{issue.articleCount ?? 0} ta ilmiy maqola</span>
        <span className="issue-card__go">
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
