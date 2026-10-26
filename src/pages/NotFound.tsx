import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export default function NotFound() {
  return (
    <div className="container-page">
      <PageHeader title="No encontramos esta página">Puede que el enlace esté mal escrito o que la página ya no exista.</PageHeader>
      <Link className="btn-secondary mt-6" to="/">Volver al inicio</Link>
    </div>
  );
}
