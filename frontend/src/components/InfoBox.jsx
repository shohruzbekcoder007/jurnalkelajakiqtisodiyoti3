import { Link } from 'react-router-dom';
import { ArrowRight } from './Icons.jsx';

export default function InfoBox({ title, children, linkTo, linkLabel }) {
  return (
    <div className="info-box">
      <h3 className="info-box__title">{title}</h3>
      <p className="info-box__text">{children}</p>
      {linkTo && (
        <Link to={linkTo} className="link-arrow">
          {linkLabel} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
