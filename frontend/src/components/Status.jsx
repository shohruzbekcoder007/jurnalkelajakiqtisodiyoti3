export function Loading() {
  return <div className="status">Yuklanmoqda…</div>;
}

export function ErrorMessage({ error }) {
  return <div className="status status--error">{error?.message || 'Xatolik yuz berdi'}</div>;
}
