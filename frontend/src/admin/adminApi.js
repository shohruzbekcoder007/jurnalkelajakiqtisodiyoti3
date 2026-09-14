const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'ft_admin_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private rejim */
    }
  },
};

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    tokenStore.set(null);
    window.dispatchEvent(new Event('ft-admin-logout'));
  }
  if (!res.ok) {
    const err = new Error(data.message || 'So‘rovda xatolik');
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }
  return data;
}

const qs = (params = {}) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();

const crud = (name) => ({
  list: (params) => request(`/admin/${name}?${qs(params)}`),
  get: (id) => request(`/admin/${name}/${id}`),
  create: (body) => request(`/admin/${name}`, { method: 'POST', body }),
  update: (id, body) => request(`/admin/${name}/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/admin/${name}/${id}`, { method: 'DELETE' }),
});

export const adminApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/password', { method: 'PUT', body: { currentPassword, newPassword } }),

  stats: () => request('/admin/stats'),
  articles: {
    ...crud('articles'),
    uploadPdf: (id, file) => {
      const form = new FormData();
      form.append('pdf', file);
      return request(`/admin/articles/${id}/pdf`, { method: 'POST', form });
    },
    removePdf: (id) => request(`/admin/articles/${id}/pdf`, { method: 'DELETE' }),
  },
  rubrics: crud('rubrics'),
  issues: crud('issues'),
  pages: crud('pages'),
  submissions: {
    list: (params) => request(`/admin/submissions?${qs(params)}`),
    setStatus: (id, status) => request(`/admin/submissions/${id}`, { method: 'PATCH', body: { status } }),
    remove: (id) => request(`/admin/submissions/${id}`, { method: 'DELETE' }),
  },
};

export const uploadUrl = (filename) => `${BASE}/uploads/${filename}`;
