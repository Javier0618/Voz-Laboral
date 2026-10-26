import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PageHeader } from '../components/PageHeader';
import { RequireAuth } from '../components/RequireAuth';
import { ErrorState, LoadingState, Notice } from '../components/States';
import { SupabaseGate } from '../components/SupabaseGate';
import { useToast } from '../components/Toast';
import { ShareForm } from '../features/share/ShareForm';
import { createExperience, findCompaniesForSelect, listCategories, proposeCompany } from '../lib/api';
import { requireClient } from '../lib/supabase';
import { useAsync } from '../lib/useAsync';

async function loadInitial(companyId: string | null) {
  const categories = await listCategories();
  let company: { id: string; name: string } | null = null;
  if (companyId) {
    const res = await requireClient().from('companies').select('id, name').eq('id', companyId).maybeSingle();
    company = (res.data as { id: string; name: string } | null) ?? null;
  }
  return { categories, company };
}

function Content() {
  const { session, profile } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const companyId = params.get('empresa');
  const initial = useAsync(() => loadInitial(companyId), [companyId]);

  if (!profile) return <LoadingState label="Cargando tu perfil" />;
  if (profile.deletion_requested_at) {
    return <Notice tone="warning">Pediste eliminar tu cuenta, así que no puedes publicar. Puedes cancelar la solicitud en Mi cuenta.</Notice>;
  }
  if (!profile.alias) {
    return (
      <Notice tone="info" title="Primero elige un alias">
        Tu alias es lo único que otras personas verán. <Link to="/cuenta">Elígelo en Mi cuenta</Link>.
      </Notice>
    );
  }
  if (initial.status === 'loading') return <LoadingState />;
  if (initial.status === 'error') return <ErrorState message={initial.error} onRetry={initial.reload} />;

  const userId = session!.user.id;
  return (
    <ShareForm
      userId={userId}
      alias={profile.alias}
      categories={initial.data.categories}
      initialCompany={initial.data.company}
      searchCompanies={findCompaniesForSelect}
      proposeCompany={proposeCompany}
      onSubmit={async (p) => {
        await createExperience({ ...p, authorId: userId });
      }}
      onSuccess={() => {
        toast.show('Enviada a revisión');
        navigate('/cuenta');
      }}
    />
  );
}

export default function Share() {
  return (
    <div className="container-page max-w-3xl">
      <PageHeader title="Compartir experiencia">
        Cuenta lo que viviste. La moderación lo revisa antes de publicarlo y solo se mostrará tu alias.
      </PageHeader>
      <SupabaseGate>
        <RequireAuth>
          <Content />
        </RequireAuth>
      </SupabaseGate>
    </div>
  );
}
