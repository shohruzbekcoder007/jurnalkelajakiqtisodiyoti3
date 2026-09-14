import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import { ArrowRight, Send } from '../components/Icons.jsx';

const empty = { title: '', authors: '', email: '', abstract: '', message: '' };

function Field({ label, required, error, children }) {
  return (
    <label className="field">
      <span className="field__label">
        {label} {required && <span className="field__req">*</span>}
      </span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

export default function Submit() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', text: '' });
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setStatus({ type: '', text: '' });
    try {
      const res = await api.submit(form);
      setForm(empty);
      setStatus({ type: 'success', text: res.message });
    } catch (err) {
      setErrors(err.errors || {});
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container container--narrow">
      <PageHeader eyebrow="Tahririyat bilan aloqa" title="Maqola yuborish">
        Ilmiy maqolangizni ko‘rib chiqish uchun quyidagi shakl orqali yuboring.
      </PageHeader>

      <div className="submit-grid">
        <form className="form-card" onSubmit={onSubmit} noValidate={false}>
          <Field label="Maqola nomi" required error={errors.title}>
            <input className="input" value={form.title} onChange={set('title')} required />
          </Field>
          <Field label="Mualliflar" required error={errors.authors}>
            <input className="input" value={form.authors} onChange={set('authors')} placeholder="F.I.Sh. bilan kiriting" required />
          </Field>
          <Field label="Elektron pochta" required error={errors.email}>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Annotatsiya" required error={errors.abstract}>
            <textarea className="input textarea" value={form.abstract} onChange={set('abstract')} required />
          </Field>
          <Field label="Qo‘shimcha xabar" error={errors.message}>
            <textarea className="input textarea" value={form.message} onChange={set('message')} />
          </Field>

          {status.text && <div className={`form-status form-status--${status.type}`}>{status.text}</div>}

          <button type="submit" className="btn btn--primary" disabled={sending}>
            <Send size={14} /> {sending ? 'Yuborilmoqda…' : 'Yuborish'}
          </button>
        </form>

        <aside className="submit-aside">
          <h3 className="submit-aside__title">Yuborishdan avval</h3>
          <p className="submit-aside__text">
            Maqola jurnal mavzusiga mos, ilgari boshqa nashrda chop etilmagan va ilmiy talablar asosida tayyorlangan
            bo‘lishi lozim.
          </p>
          <Link to="/chop-etish-tartibi" className="link-arrow">
            Talablarni o‘qish <ArrowRight size={13} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
