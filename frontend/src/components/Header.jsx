import { Link, NavLink } from 'react-router-dom';

const links = [
  { to: '/arxiv', label: 'Arxiv' },
  { to: '/jurnal-haqida', label: 'Jurnal haqida' },
  { to: '/ruknlar', label: 'Ruknlar' },
  { to: '/tahrir-kengashi', label: 'Tahrir kengashi' },
  { to: '/maqola-yuborish', label: 'Maqola yuborish' },
];

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">FT</span>
          <span className="brand__text">
            <span className="brand__name">Moliyaviy texnologiyalar</span>
            <span className="brand__sub">Ilmiy elektron jurnali</span>
          </span>
        </Link>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
