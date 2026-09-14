import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Alert } from '../ui.jsx';

export default function Login() {
  const { admin, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && admin) return <Navigate to={location.state?.from || '/admin'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={onSubmit}>
        <div className="brand">
          <span className="brand__mark">KI</span>
          <span className="brand__text">
            <span className="brand__name">Kelajak iqtisodiyoti va raqamli transformatsiyalar</span>
            <span className="brand__sub">Admin panel</span>
          </span>
        </div>
        <h1 className="display adm-login__title">Kirish</h1>
        <Alert>{error}</Alert>
        <label className="field">
          <span className="field__label">Elektron pochta</span>
          <input
            className="input"
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field__label">Parol</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <button type="submit" className="btn btn--primary adm-login__btn" disabled={busy}>
          {busy ? 'Tekshirilmoqda…' : 'Kirish'}
        </button>
        <a href="/" className="link-arrow adm-login__back">
          ← Saytga qaytish
        </a>
      </form>
    </div>
  );
}
