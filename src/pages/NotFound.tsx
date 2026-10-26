import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader title="No encontramos esta página">Puede que el enlace esté mal escrito o que la página ya no exista.</PageHeader>
      <div className="container-page py-8">
        <Link className="btn-secondary" to="/">Volver al inicio</Link>
      </div>
    </>
  );
}
