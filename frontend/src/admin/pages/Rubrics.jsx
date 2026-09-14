import { useState } from 'react';
import { adminApi } from '../adminApi.js';
import { PageTitle, Alert, useLoader } from '../ui.jsx';

export default function Rubrics() {
  const list = useLoader(() => adminApi.rubrics.list());
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [newRow, setNewRow] = useState({ name: '', order: '' });
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
    if (await run(() => adminApi.rubrics.create(newRow), 'Rukn qo‘shildi')) setNewRow({ name: '', order: '' });
  };

  const onSave = async () => {
    const { _id, name, order, slug } = editing;
    if (await run(() => adminApi.rubrics.update(_id, { name, order, slug }), 'Rukn saqlandi')) setEditing(null);
  };

  const onDelete = (r) => {
    if (window.confirm(`"${r.name}" ruknini o‘chirasizmi?`)) run(() => adminApi.rubrics.remove(r._id), 'Rukn o‘chirildi');
  };

  return (
    <>
      <PageTitle title="Ruknlar" />
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <form className="adm-card adm-inline-form" onSubmit={onCreate}>
        <input
          className="input"
          placeholder="Yangi rukn nomi"
          value={newRow.name}
          onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
          required
        />
        <input
          className="input adm-input--num"
          type="number"
          placeholder="Tartib"
          value={newRow.order}
          onChange={(e) => setNewRow({ ...newRow, order: e.target.value })}
        />
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
                <th>Tartib</th>
                <th>Nomi</th>
                <th>Slug</th>
                <th>Maqolalar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data || []).map((r) =>
                editing?._id === r._id ? (
                  <tr key={r._id} className="is-editing">
                    <td>
                      <input
                        className="input adm-input--num"
                        type="number"
                        value={editing.order}
                        onChange={(e) => setEditing({ ...editing, order: e.target.value })}
                      />
                    </td>
                    <td>
                      <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    </td>
                    <td>
                      <input className="input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                    </td>
                    <td>{r.articleCount}</td>
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
                  <tr key={r._id}>
                    <td>{r.order}</td>
                    <td className="adm-table__title">{r.name}</td>
                    <td className="adm-muted">{r.slug}</td>
                    <td>{r.articleCount}</td>
                    <td className="adm-actions">
                      <button type="button" className="adm-link" onClick={() => setEditing({ ...r })}>
                        Tahrirlash
                      </button>
                      <button type="button" className="adm-link adm-link--danger" onClick={() => onDelete(r)}>
                        O‘chirish
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        {!list.loading && list.data?.length === 0 && <p className="adm-empty">Ruknlar yo‘q</p>}
      </div>
    </>
  );
}
