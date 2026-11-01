import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import { publicPagePath } from '../utils/pagePath.js';
import { ChevronDown } from './Icons.jsx';

const ABOUT = '/jurnal-haqida';

const links = [
  { to: '/arxiv', label: 'Arxiv' },
  { to: '/sonlar', label: 'Jurnal sonlari' },
  { to: ABOUT, label: 'Jurnal haqida' },
  { to: '/ruknlar', label: 'Ruknlar' },
  { to: '/tahrir-kengashi', label: 'Tahrir kengashi' },
  { to: '/maqola-yuborish', label: 'Maqola yuborish' },
];

export default function Header() {
  const pages = useFetch(() => api.pages(), []);

  // "Jurnal haqida" ostida barcha sahifalar (admin paneldan yaratilganlari ham);
  // headerda alohida havolasi borlari takrorlanmaydi
  const aboutItems = (pages.data || [])
    .map((p) => ({ to: publicPagePath(p.slug), label: p.title }))
    .filter((p) => p.to === ABOUT || !links.some((l) => l.to === p.to))
    .sort((a, b) => (b.to === ABOUT) - (a.to === ABOUT));

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">KI</span>
          <span className="brand__text">
            <span className="brand__name">Kelajak iqtisodiyoti va raqamli transformatsiyalar</span>
            <span className="brand__sub">Ilmiy elektron jurnali</span>
          </span>
        </Link>
        <nav className="nav">
          {links.map((l) =>
            l.to === ABOUT && aboutItems.length > 1 ? (
              <NavDropdown key={l.to} link={l} items={aboutItems} />
            ) : (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}>
                {l.label}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

function NavDropdown({ link, items }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Sichqoncha olib borilganda ochiladi; sensorli ekranda strelka bosiladi
  const hover = (value) => (e) => {
    if (e.pointerType === 'mouse') setOpen(value);
  };
  const isActive = items.some((i) => i.to === pathname);

  return (
    <div
      ref={ref}
      className={`nav__group${open ? ' is-open' : ''}`}
      onPointerEnter={hover(true)}
      onPointerLeave={hover(false)}
      onBlur={(e) => {
        if (!ref.current.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <Link to={link.to} className={`nav__link${isActive ? ' is-active' : ''}`}>
        {link.label}
      </Link>
      <button
        type="button"
        className="nav__toggle"
        aria-label={`${link.label} bo‘limlari`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDown size={12} />
      </button>
      {open && (
        <ul className="nav__menu">
          {items.map((i) => (
            <li key={i.to}>
              <Link to={i.to} className={`nav__menu-link${i.to === pathname ? ' is-active' : ''}`}>
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
