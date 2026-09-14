import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { ArrowRight } from '../components/Icons.jsx';

export default function NotFound() {
  return (
    <div className="container container--narrow">
      <PageHeader eyebrow="404" title="Sahifa topilmadi">
        Siz qidirayotgan sahifa mavjud emas yoki ko‘chirilgan.
      </PageHeader>
      <Link to="/" className="link-arrow">
        Bosh sahifaga qaytish <ArrowRight size={13} />
      </Link>
    </div>
  );
}
