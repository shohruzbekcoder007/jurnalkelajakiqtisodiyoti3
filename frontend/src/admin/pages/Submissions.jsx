import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { PageTitle, Alert, Pager, useLoader, statusLabels, formatDateTime } from '../ui.jsx';

export default function Submissions() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = parseInt(params.get('page'), 10) || 1;
  const [openId, setOpenId] = useState(null);
  const [flash, setFlash] = useState({ type: '', text: '' });

  const list = useLoader(() => adminApi.submissions.list({ status, page }), [status, page]);

  const setFilter = (next) =>
    setParams(Object.fromEntries(Object.entries({ status, page: String(page), ...next }).filter(([k, v]) => v && !(k === 'page' && v === '1'))));

  const changeStatus = async (s, value) => {
    try {
      await adminApi.submissions.setStatus(s._id, value);
      list.reload();
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    }
  };

  const onDelete = async (s) => {
    if (!window.confirm(`"${s.title}" arizasini o‘chirasizmi?`)) return;
    try {
      await adminApi.submissions.remove(s._id);
      setFlash({ type: 'success', text: 'Ariza o‘chirildi' });
      list.reload();
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      <PageTitle title="Arizalar" />
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>

      <div className="adm-tabs">
        {[['', 'Barchasi'], ...Object.entries(statusLabels)].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`adm-tab${status === value ? ' is-active' : ''}`}
            onClick={() => setFilter({ status: value, page: '1' })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="adm-card">
        <Alert>{list.error?.message}</Alert>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Maqola nomi</th>
                <th>Mualliflar</th>
                <th>Email</th>
                <th>Sana</th>
                <th>Holat</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data?.items || []).map((s) => (
                <Fragment key={s._id}>
                  <tr>
                    <td className="adm-table__title">
                      <button type="button" className="adm-link adm-link--plain" onClick={() => setOpenId(openId === s._id ? null : s._id)}>
                        {s.title}
                      </button>
                    </td>
                    <td>{s.authors}</td>
                    <td>
                      <a href={`mailto:${s.email}`} className="adm-link">
                        {s.email}
                      </a>
                    </td>
                    <td className="adm-nowrap">{formatDateTime(s.createdAt)}</td>
                    <td>
                      <select className={`input adm-status adm-badge--${s.status}`} value={s.status} onChange={(e) => changeStatus(s, e.target.value)}>
                        {Object.entries(statusLabels).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="adm-actions">
                      <button type="button" className="adm-link" onClick={() => setOpenId(openId === s._id ? null : s._id)}>
                        {openId === s._id ? 'Yopish' : 'Batafsil'}
                      </button>
                      <button type="button" className="adm-link adm-link--danger" onClick={() => onDelete(s)}>
                        O‘chirish
                      </button>
                    </td>
                  </tr>
                  {openId === s._id && (
                    <tr className="adm-detail">
                      <td colSpan={6}>
                        <h4>Annotatsiya</h4>
                        <p>{s.abstract}</p>
                        {s.message && (
                          <>
                            <h4>Qo‘shimcha xabar</h4>
                            <p>{s.message}</p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {!list.loading && list.data?.items.length === 0 && <p className="adm-empty">Arizalar yo‘q</p>}
        <div className="adm-card__foot">
          <span className="adm-muted">Jami: {list.data?.total ?? 0}</span>
          <Pager page={page} pages={list.data?.pages || 1} onChange={(p) => setFilter({ page: String(p) })} />
        </div>
      </div>
    </>
  );
}
