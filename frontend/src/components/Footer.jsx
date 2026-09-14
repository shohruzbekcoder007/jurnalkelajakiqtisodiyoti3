import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">Moliyaviy texnologiyalar</div>
            <p className="footer__desc">
              Toshkent davlat iqtisodiyot universitetining ilmiy elektron jurnali. Moliyaviy texnologiyalar,
              iqtisodiyot va raqamli taraqqiyot masalalari.
            </p>
          </div>
          <div>
            <div className="footer__label">Jurnal</div>
            <ul className="footer__links">
              <li><Link to="/jurnal-haqida">Jurnal haqida</Link></li>
              <li><Link to="/jurnal-manzili">Jurnal manzili</Link></li>
              <li><Link to="/tahrir-kengashi">Tahrir kengashi</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer__label">Mualliflar uchun</div>
            <ul className="footer__links">
              <li><Link to="/chop-etish-tartibi">Chop etish tartibi</Link></li>
              <li><Link to="/maqola-yuborish">Maqola yuborish</Link></li>
              <li><Link to="/axborot-xati">Axborot xati</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 TDIU · Barcha huquqlar himoyalangan</span>
          <span>ISSN · Ilmiy nashr</span>
        </div>
      </div>
    </footer>
  );
}
