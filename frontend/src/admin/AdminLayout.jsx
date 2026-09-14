import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const links = [
  { to: '/admin', label: 'Boshqaruv paneli', end: true },
  { to: '/admin/maqolalar', label: 'Maqolalar' },
  { to: '/admin/tanlangan', label: 'Tanlangan maqolalar' },
  { to: '/admin/ruknlar', label: 'Ruknlar' },
  { to: '/admin/sonlar', label: 'Jurnal sonlari' },
  { to: '/admin/sahifalar', label: 'Sahifalar' },
  { to: '/admin/arizalar', label: 'Arizalar' },
  { to: '/admin/sozlamalar', label: 'Sozlamalar' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="adm">
      <aside className={`adm-side${open ? ' is-open' : ''}`}>
        <Link to="/admin" className="adm-brand">
          <span className="brand__mark adm-brand__mark">FT</span>
          <span>
            <span className="adm-brand__name">Moliyaviy texnologiyalar</span>
            <span className="adm-brand__sub">Admin panel</span>
          </span>
        </Link>
        <nav className="adm-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `adm-nav__link${isActive ? ' is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side__foot">
          <a href="/" target="_blank" rel="noreferrer" className="adm-nav__link">
            Saytni ochish ↗
          </a>
        </div>
      </aside>
      {open && <div className="adm-backdrop" onClick={() => setOpen(false)} />}

      <div className="adm-main">
        <header className="adm-top">
          <button type="button" className="adm-burger" onClick={() => setOpen((o) => !o)} aria-label="Menyu">
            <span />
            <span />
            <span />
          </button>
          <div className="adm-top__user">
            <span>{admin?.name}</span>
            <span className="adm-muted">{admin?.email}</span>
          </div>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={logout}>
            Chiqish
          </button>
        </header>
        <div className="adm-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
