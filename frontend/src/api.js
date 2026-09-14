const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'So‘rovda xatolik');
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }
  return data;
}

export const api = {
  articles: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    return request(`/articles?${qs}`);
  },
  article: (slug) => request(`/articles/${encodeURIComponent(slug)}`),
  rubrics: () => request('/rubrics'),
  currentIssue: () => request('/issues/current'),
  page: (slug) => request(`/pages/${encodeURIComponent(slug)}`),
  submit: (body) => request('/submissions', { method: 'POST', body: JSON.stringify(body) }),
};
