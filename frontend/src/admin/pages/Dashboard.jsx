import { Link } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { PageTitle, Alert, useLoader, statusLabels, formatDateTime } from '../ui.jsx';

export default function Dashboard() {
  const { data, error } = useLoader(() => adminApi.stats());

  const cards = [
    { label: 'Maqolalar', value: data?.articles, to: '/admin/maqolalar' },
    { label: 'Ruknlar', value: data?.rubrics, to: '/admin/ruknlar' },
    { label: 'Jurnal sonlari', value: data?.issues, to: '/admin/sonlar' },
    { label: 'Sahifalar', value: data?.pages, to: '/admin/sahifalar' },
    { label: 'Yangi arizalar', value: data?.newSubmissions, to: '/admin/arizalar?status=new', accent: true },
  ];

  return (
    <>
      <PageTitle title="Boshqaruv paneli">
        <Link to="/admin/maqolalar/yangi" className="adm-btn adm-btn--primary">
          + Yangi maqola
        </Link>
      </PageTitle>
      <Alert>{error?.message}</Alert>

      <div className="adm-stats">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className={`adm-stat${c.accent ? ' adm-stat--accent' : ''}`}>
            <span className="adm-stat__value">{c.value ?? '—'}</span>
            <span className="adm-stat__label">{c.label}</span>
          </Link>
        ))}
      </div>

      <section className="adm-card">
        <div className="adm-card__head">
          <h2 className="adm-card__title">So‘nggi arizalar</h2>
          <Link to="/admin/arizalar" className="link-arrow">
            Barchasi →
          </Link>
        </div>
        {data?.recentSubmissions?.length ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Maqola nomi</th>
                  <th>Mualliflar</th>
                  <th>Sana</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.map((s) => (
                  <tr key={s._id}>
                    <td className="adm-table__title">{s.title}</td>
                    <td>{s.authors}</td>
                    <td className="adm-nowrap">{formatDateTime(s.createdAt)}</td>
                    <td>
                      <span className={`adm-badge adm-badge--${s.status}`}>{statusLabels[s.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="adm-empty">Hozircha arizalar yo‘q</p>
        )}
      </section>
    </>
  );
}
