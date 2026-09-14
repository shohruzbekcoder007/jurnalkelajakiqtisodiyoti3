import { useState } from 'react';
import { adminApi } from '../adminApi.js';
import { useAuth } from '../AuthContext.jsx';
import { PageTitle, Field, Alert } from '../ui.jsx';

export default function Settings() {
  const { admin } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', repeat: '' });
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.repeat) {
      setFlash({ type: 'error', text: 'Yangi parollar mos kelmadi' });
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.changePassword(form.current, form.next);
      setForm({ current: '', next: '', repeat: '' });
      setFlash({ type: 'success', text: res.message });
    } catch (err) {
      setFlash({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <PageTitle title="Sozlamalar" />
      <Alert type={flash.type} onClose={() => setFlash({})}>
        {flash.text}
      </Alert>
      <form className="adm-card adm-form adm-form--narrow" onSubmit={onSubmit}>
        <h2 className="adm-card__title adm-field--wide">Parolni o‘zgartirish</h2>
        <p className="adm-muted adm-field--wide">{admin?.email}</p>
        <Field label="Joriy parol" required wide>
          <input className="input" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} required />
        </Field>
        <Field label="Yangi parol" hint="Kamida 8 belgi" required wide>
          <input className="input" type="password" autoComplete="new-password" minLength={8} value={form.next} onChange={set('next')} required />
        </Field>
        <Field label="Yangi parolni takrorlang" required wide>
          <input className="input" type="password" autoComplete="new-password" minLength={8} value={form.repeat} onChange={set('repeat')} required />
        </Field>
        <div className="adm-field--wide">
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
            {busy ? 'Saqlanmoqda…' : 'Parolni yangilash'}
          </button>
        </div>
      </form>
    </>
  );
}
