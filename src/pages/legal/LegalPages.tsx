import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import { LegalReviewBanner } from '../../components/LegalReviewBanner';
import { PageHeader } from '../../components/PageHeader';

// Borradores. Todo el contenido requiere revisión de un abogado colombiano
// antes del lanzamiento público (ver docs/checklist-legal.md).

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container-page">
      <PageHeader title={title} />
      <div className="py-6">
        <LegalReviewBanner />
        <div className="mt-6 max-w-prose space-y-4 text-lg leading-relaxed [&_h2]:mt-8 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DataPolicy() {
  return (
    <LegalPage title="Política de datos">
      <p>
        Esta política describe cómo {brand.name} trata los datos personales de quienes usan la plataforma. Su
        adecuación a la normativa colombiana de protección de datos está pendiente de verificación.
      </p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>Correo electrónico y contraseña cifrada, para crear y proteger tu cuenta.</li>
        <li>Alias público, que es lo único que otras personas ven de ti.</li>
        <li>Los relatos que envías y su historial de moderación.</li>
        <li>Registros técnicos de seguridad, como intentos de acceso y cambios de rol.</li>
      </ul>
      <h2>Para qué los usamos</h2>
      <p>Para operar la cuenta, moderar el contenido, prevenir abusos y atender tus solicitudes.</p>
      <h2>Tus solicitudes</h2>
      <p>
        Puedes consultar, corregir o pedir la eliminación de tus datos desde <Link to="/cuenta">Mi cuenta</Link> o
        escribiendo a {brand.contactEmail}. Los plazos están pendientes de verificación legal.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Términos de uso">
      <p>Al usar {brand.name} aceptas publicar solo experiencias propias o conocidas de buena fe, y respetar las reglas.</p>
      <h2>Responsabilidad sobre el contenido</h2>
      <p>
        Cada persona es responsable de lo que publica. La moderación revisa el contenido antes de publicarlo, pero no
        verifica cada hecho.
      </p>
      <h2>Empresas</h2>
      <p>
        Las empresas pueden pedir correcciones y, tras verificar su representación, responder públicamente. Nunca
        reciben la identidad de quienes publican, salvo orden de autoridad competente, cuyo procedimiento está
        pendiente de definir con un abogado.
      </p>
    </LegalPage>
  );
}

export function Rules() {
  return (
    <LegalPage title="Reglas de publicación">
      <ul>
        <li>Cuenta hechos que viviste o viste. Separa lo que te contaron otras personas.</li>
        <li>No incluyas nombres, cédulas, teléfonos, correos ni fotos de personas.</li>
        <li>No insultes, amenaces ni ataques a nadie. Describe conductas, no personas.</li>
        <li>No publiques información confidencial de la empresa ni secretos comerciales.</li>
        <li>No publiques en nombre de otra persona ni repitas el mismo relato.</li>
        <li>Puedes publicar hasta 3 experiencias cada 24 horas.</li>
      </ul>
      <h2>Moderación</h2>
      <p>
        Cada experiencia pasa por revisión. Puede publicarse, pedirte ajustes, restringirse o retirarse. Siempre verás
        el motivo y podrás apelar desde <Link to="/cuenta">Mi cuenta</Link>.
      </p>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacidad">
      <h2>Lo que ven otros</h2>
      <p>Tu alias, tus relatos publicados, la empresa, la categoría y el periodo.</p>
      <h2>Lo que queda privado</h2>
      <p>
        Tu correo, tu dirección IP y el identificador de tu cuenta. La base de datos impide que las consultas públicas
        los devuelvan.
      </p>
      <h2>Eliminación de la cuenta</h2>
      <p>
        Al eliminar tu cuenta se borran tu correo y tu alias. Tus experiencias publicadas se conservan anonimizadas y se
        guardan los registros de moderación necesarios para auditoría. Los plazos de conservación propuestos están en
        revisión legal.
      </p>
    </LegalPage>
  );
}

export function Contact() {
  return (
    <LegalPage title="Contacto">
      <p>
        Para consultas sobre datos personales, correcciones o solicitudes de empresas escribe a{' '}
        <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>.
      </p>
      <p className="text-muted">Esta dirección es provisional y debe reemplazarse antes del lanzamiento.</p>
    </LegalPage>
  );
}
