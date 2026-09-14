import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { PageTitle, Alert, useLoader } from '../ui.jsx';

const thisYear = new Date().getFullYear();

export default function Issues() {
  const list = useLoader(() => adminApi.issues.list());
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [newRow, setNewRow] = useState({ year: thisYear, number: '', isCurrent: true });
  const [editing, setEditing] = useState(null);

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
    if (await run(() => adminApi.issues.create(newRow), 'Yangi son qo‘shildi')) {
      setNewRow({ year: thisYear, number: '', isCurrent: true });
    }
  };

  const onSave = async () => {
    const { _id, year, number, isCurrent } = editing;
    if (await run(() => adminApi.issues.update(_id, { year, number, isCurrent }), 'Son saqlandi')) setEditing(null);
  };

  const makeCurrent = (i) => run(() => adminApi.issues.update(i._id, { isCurrent: true }), `${i.title} joriy son qilindi`);

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
          Joriy son
        </label>
        <button type="submit" className="adm-btn adm-btn--primary">
          + Qo‘shish
        </button>
      </form>

      <div className="adm-card">
        <Alert>{list.error?.message}</Alert>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Son</th>
                <th>Yil</th>
                <th>Raqam</th>
                <th>Maqolalar</th>
                <th>Holat</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data || []).map((i) =>
                editing?._id === i._id ? (
                  <tr key={i._id} className="is-editing">
                    <td>{i.title}</td>
                    <td>
                      <input className="input adm-input--num" type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: e.target.value })} />
                    </td>
                    <td>
                      <input className="input adm-input--num" type="number" value={editing.number} onChange={(e) => setEditing({ ...editing, number: e.target.value })} />
                    </td>
                    <td>{i.articleCount}</td>
                    <td>
                      <label className="adm-check">
                        <input type="checkbox" checked={editing.isCurrent} onChange={(e) => setEditing({ ...editing, isCurrent: e.target.checked })} />
                        Joriy
                      </label>
                    </td>
                    <td className="adm-actions">
                      <button type="button" className="adm-link" onClick={onSave}>
                        Saqlash
                      </button>
                      <button type="button" className="adm-link adm-link--muted" onClick={() => setEditing(null)}>
                        Bekor qilish
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={i._id}>
                    <td className="adm-table__title">{i.title}</td>
                    <td>{i.year}</td>
                    <td>{i.number}</td>
                    <td>
                      <Link to={`/admin/maqolalar?issue=${i._id}`} className="adm-link">
                        {i.articleCount}
                      </Link>
                    </td>
                    <td>
                      {i.isCurrent ? (
                        <span className="adm-badge adm-badge--accepted">Joriy son</span>
                      ) : (
                        <button type="button" className="adm-link adm-link--muted" onClick={() => makeCurrent(i)}>
                          Joriy qilish
                        </button>
                      )}
                    </td>
                    <td className="adm-actions">
                      <button type="button" className="adm-link" onClick={() => setEditing({ ...i })}>
                        Tahrirlash
                      </button>
                      <button type="button" className="adm-link adm-link--danger" onClick={() => onDelete(i)}>
                        O‘chirish
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        {!list.loading && list.data?.length === 0 && <p className="adm-empty">Sonlar yo‘q</p>}
      </div>
    </>
  );
}
