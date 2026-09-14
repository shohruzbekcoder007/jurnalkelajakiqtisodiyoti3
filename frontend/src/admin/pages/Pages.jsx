import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { PageTitle, Alert, useLoader, formatDateTime } from '../ui.jsx';
import { publicPagePath } from './PageForm.jsx';

export default function Pages() {
  const list = useLoader(() => adminApi.pages.list());
  const [flash, setFlash] = useState({ type: '', text: '' });

  const onDelete = async (p) => {
    if (!window.confirm(`"${p.title}" sahifasini o‘chirasizmi?`)) return;
    try {
      await adminApi.pages.remove(p._id);
      setFlash({ type: 'success', text: 'Sahifa o‘chirildi' });
      list.reload();
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      <PageTitle title="Sahifalar">
        <Link to="/admin/sahifalar/yangi" className="adm-btn adm-btn--primary">
          + Yangi sahifa
        </Link>
      </PageTitle>
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <div className="adm-card">
        <Alert>{list.error?.message}</Alert>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Sarlavha</th>
                <th>Manzil</th>
                <th>Yangilangan</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data || []).map((p) => (
                <tr key={p._id}>
                  <td className="adm-table__title">
                    <Link to={`/admin/sahifalar/${p._id}`}>{p.title}</Link>
                  </td>
                  <td className="adm-muted">{publicPagePath(p.slug)}</td>
                  <td className="adm-nowrap">{formatDateTime(p.updatedAt)}</td>
                  <td className="adm-actions">
                    <a href={publicPagePath(p.slug)} target="_blank" rel="noreferrer" className="adm-link">
                      Ko‘rish
                    </a>
                    <Link to={`/admin/sahifalar/${p._id}`} className="adm-link">
                      Tahrirlash
                    </Link>
                    <button type="button" className="adm-link adm-link--danger" onClick={() => onDelete(p)}>
                      O‘chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.loading && list.data?.length === 0 && <p className="adm-empty">Sahifalar yo‘q</p>}
      </div>
    </>
  );
}
