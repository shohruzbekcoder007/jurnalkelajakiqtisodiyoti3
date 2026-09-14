import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import IssueCard from '../components/IssueCard.jsx';
import { Loading, ErrorMessage } from '../components/Status.jsx';

export default function Issues() {
  const { data, loading, error } = useFetch(() => api.issues());

  // Yillar bo'yicha guruhlash
  const byYear = (data || []).reduce((acc, issue) => {
    (acc[issue.year] ||= []).push(issue);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort((a, b) => b - a);

  return (
    <div className="container">
      <PageHeader eyebrow="Nashrlar" title="Jurnal sonlari">
        Jurnalning barcha sonlari. Son tanlanganda undagi maqolalar va to‘liq PDF nashri ochiladi.
      </PageHeader>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : years.length === 0 ? (
        <div className="status">Hozircha jurnal sonlari yo‘q</div>
      ) : (
        years.map((year) => (
          <section key={year} className="issues-year">
            <h2 className="issues-year__title">{year}-yil</h2>
            <div className="issues-grid">
              {byYear[year].map((issue) => (
                <div key={issue._id} className="issues-grid__item">
                  <IssueCard issue={issue} label={issue.isCurrent ? 'So‘nggi son' : 'Jurnal soni'} />
                  <div className="issues-grid__meta">
                    {issue.pdf ? <span className="issues-badge">PDF nashr mavjud</span> : <span>PDF nashr tayyorlanmoqda</span>}
                    {issue.isOpen && <span className="issues-badge issues-badge--open">Maqolalar qabul qilinmoqda</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
