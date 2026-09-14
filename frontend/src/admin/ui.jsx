import { useCallback, useEffect, useState } from 'react';

export function PageTitle({ title, children }) {
  return (
    <div className="adm-head">
      <h1 className="adm-head__title">{title}</h1>
      {children && <div className="adm-head__actions">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, error, required, children, wide }) {
  return (
    <label className={`adm-field${wide ? ' adm-field--wide' : ''}`}>
      <span className="adm-field__label">
        {label} {required && <span className="field__req">*</span>}
      </span>
      {children}
      {hint && !error && <span className="adm-field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

export function Alert({ type = 'error', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`adm-alert adm-alert--${type}`}>
      <span>{children}</span>
      {onClose && (
        <button type="button" className="adm-alert__close" onClick={onClose} aria-label="Yopish">
          ×
        </button>
      )}
    </div>
  );
}

export function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination adm-pager">
      <button type="button" className="pagination__btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ←
      </button>
      <span className="adm-muted">
        {page} / {pages}
      </span>
      <button type="button" className="pagination__btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        →
      </button>
    </div>
  );
}

// Ma'lumotni yuklash va qayta yuklash uchun hook
export function useLoader(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return fn()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState((s) => ({ ...s, loading: false, error })));
  }, deps);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load };
}

export const statusLabels = {
  new: 'Yangi',
  review: 'Ko‘rib chiqilmoqda',
  accepted: 'Qabul qilindi',
  rejected: 'Rad etildi',
};

export function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
