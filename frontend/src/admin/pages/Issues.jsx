import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { PageTitle, Alert, useLoader } from '../ui.jsx';

const thisYear = new Date().getFullYear();

export default function Issues() {
  const list = useLoader(() => adminApi.issues.list());
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [newRow, setNewRow] = useState({ year: thisYear, number: '', isCurrent: true });

  const run = async (fn, success) => {
    try {
      await fn();
      setFlash({ type: 'success', text: success });
      list.reload();
      return true;
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
      return false;
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (await run(() => adminApi.issues.create(newRow), 'Yangi son ochildi')) {
      setNewRow({ year: thisYear, number: '', isCurrent: true });
    }
  };

  const toggleOpen = (i) =>
    run(
      () => adminApi.issues.update(i._id, { isOpen: !i.isOpen }),
      i.isOpen ? `${i.title} yopildi — endi unga maqola biriktirib bo‘lmaydi` : `${i.title} qayta ochildi`
    );

  const makeCurrent = (i) => run(() => adminApi.issues.update(i._id, { isCurrent: true }), `${i.title} so‘nggi son qilindi`);

  const onDelete = (i) => {
    if (window.confirm(`${i.title}ni o‘chirasizmi?`)) run(() => adminApi.issues.remove(i._id), 'Son o‘chirildi');
  };

  return (
    <>
      <PageTitle title="Jurnal sonlari" />
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <form className="adm-card adm-inline-form" onSubmit={onCreate}>
        <input
          className="input adm-input--num"
          type="number"
          placeholder="Yil"
          value={newRow.year}
          onChange={(e) => setNewRow({ ...newRow, year: e.target.value })}
          required
        />
        <input
          className="input adm-input--num"
          type="number"
          min="1"
          placeholder="Son"
          value={newRow.number}
          onChange={(e) => setNewRow({ ...newRow, number: e.target.value })}
          required
        />
        <label className="adm-check">
          <input type="checkbox" checked={newRow.isCurrent} onChange={(e) => setNewRow({ ...newRow, isCurrent: e.target.checked })} />
          So‘nggi son qilish
        </label>
        <button type="submit" className="adm-btn adm-btn--primary">
          + Yangi son ochish
        </button>
      </form>

      <div className="adm-card">
        <Alert>{list.error?.message}</Alert>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Son</th>
                <th>Maqolalar</th>
                <th>Holat</th>
                <th>PDF nashr</th>
                <th>Bosh sahifa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data || []).map((i) => (
                <tr key={i._id}>
                  <td className="adm-table__title">
                    <Link to={`/admin/sonlar/${i._id}`}>{i.title}</Link>
                  </td>
                  <td>
                    <Link to={`/admin/maqolalar?issue=${i._id}`} className="adm-link">
                      {i.articleCount} ta
                    </Link>
                  </td>
                  <td>
                    <span className={`adm-badge ${i.isOpen ? 'adm-badge--accepted' : 'adm-badge--rejected'}`}>
                      {i.isOpen ? 'Ochiq' : 'Yopiq'}
                    </span>
                  </td>
                  <td>{i.pdf?.filename ? (i.pdf.generated ? '✓ yig‘ilgan' : '✓ yuklangan') : '—'}</td>
                  <td>
                    {i.isCurrent ? (
                      <span className="adm-badge adm-badge--featured">So‘nggi son</span>
                    ) : (
                      <button type="button" className="adm-link adm-link--muted" onClick={() => makeCurrent(i)}>
                        So‘nggi son qilish
                      </button>
                    )}
                  </td>
                  <td className="adm-actions">
                    <button type="button" className="adm-link" onClick={() => toggleOpen(i)}>
                      {i.isOpen ? 'Yopish' : 'Ochish'}
                    </button>
                    <Link to={`/admin/sonlar/${i._id}`} className="adm-link">
                      Boshqarish
                    </Link>
                    <button type="button" className="adm-link adm-link--danger" onClick={() => onDelete(i)}>
                      O‘chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.loading && list.data?.length === 0 && <p className="adm-empty">Sonlar yo‘q</p>}
      </div>
    </>
  );
}
