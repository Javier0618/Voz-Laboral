// Recorrido crítico del formulario de publicación con la capa de datos simulada.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({
  isConfigured: true,
  supabase: {},
  requireClient: () => ({}),
  AppError: class AppError extends Error {},
}));

// Sesión simulada: cada prueba puede cambiarla (null = visitante sin cuenta).
const auth: { session: unknown; profile: unknown } = { session: null, profile: null };
vi.mock('../../src/auth/AuthProvider', () => ({
  useAuth: () => ({ loading: false, roles: [], isModerator: false, isAdmin: false, ...auth }),
}));

const createExperience = vi.fn();
const createAnonymousExperience = vi.fn();
vi.mock('../../src/lib/api', () => ({
  listCategories: () => Promise.resolve([{ slug: 'pago-salarios', name: 'Pago de salarios', description: '', sort_order: 1 }]),
  searchCompanies: () =>
    Promise.resolve([{ id: '7b0f8a3e-2c2f-4f43-9a55-0c6a1d1e5b10', slug: 'demo', trade_name: 'Empresa Demo', legal_name: null, sector: 'Comercio', city: 'Cali', department: 'Valle del Cauca', visible_experiences: 0, last_activity: null, total_count: 1, is_suggestion: false }]),
  createExperience: (...args: unknown[]) => createExperience(...args),
  createAnonymousExperience: (...args: unknown[]) => createAnonymousExperience(...args),
  updateMyExperience: vi.fn(),
  listMyExperiences: vi.fn(),
  getCompanyById: vi.fn(),
  suggestCompany: vi.fn(),
}));

import Share from '../../src/pages/Share';

const BODY =
  'Durante cuatro meses la nómina llegó con retrasos de dos semanas. Lo viví directamente y lo comenté con talento humano sin respuesta escrita. Otros compañeros dijeron que les pasó lo mismo, aunque eso no lo comprobé. Escríbanme a persona@correo.co si quieren saber más.';

function renderShare() {
  return render(
    <MemoryRouter initialEntries={['/compartir']}>
      <Share />
    </MemoryRouter>,
  );
}

describe('compartir una experiencia', () => {
  beforeEach(() => {
    sessionStorage.clear();
    auth.session = { user: { id: 'u1' } };
    auth.profile = { id: 'u1', alias: 'turno_de_noche', status: 'activa' };
    createExperience.mockReset();
    createExperience.mockResolvedValue({ id: 'e1', status: 'en_revision' });
    createAnonymousExperience.mockReset();
    createAnonymousExperience.mockResolvedValue({ id: 'e2', status: 'en_revision', token: 'a'.repeat(64) });
  });

  it('muestra errores junto a cada campo si faltan datos', async () => {
    const user = userEvent.setup();
    renderShare();
    await user.click(await screen.findByRole('button', { name: 'Revisar antes de enviar' }));
    expect(await screen.findByText('Elige la empresa del catálogo.')).toBeInTheDocument();
    expect(screen.getByText('Confirma que leíste las reglas de publicación.')).toBeInTheDocument();
    expect(createExperience).not.toHaveBeenCalled();
  });

  it('avisa de datos personales, muestra la vista previa y envía a revisión', async () => {
    const user = userEvent.setup();
    renderShare();

    await user.click(screen.getByRole('radio', { name: 'Mala' }));
    await user.type(screen.getByRole('combobox', { name: 'Empresa' }), 'Demo');
    await user.click(await screen.findByRole('option', { name: /Empresa Demo/ }));
    await user.selectOptions(await screen.findByLabelText('Categoría'), 'pago-salarios');
    await user.type(screen.getByLabelText('Desde'), '2024-03');
    await user.click(screen.getByLabelText('Trabajé allí'));
    await user.type(screen.getByLabelText('Cuenta tu experiencia'), BODY);

    expect(screen.getByText('Parece que incluiste un correo electrónico.')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /Leí y acepto/ }));
    await user.click(screen.getByRole('button', { name: 'Revisar antes de enviar' }));

    const preview = await screen.findByRole('article');
    expect(within(preview).getByText('Empresa Demo')).toBeInTheDocument();

    // El envío inmediato se bloquea por tiempo mínimo de redacción (anti-bots).
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 10_000);
    await user.click(screen.getByRole('button', { name: 'Enviar a revisión' }));
    expect(await screen.findByRole('heading', { name: 'Gracias por compartir' })).toBeInTheDocument();
    expect(createExperience).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: '7b0f8a3e-2c2f-4f43-9a55-0c6a1d1e5b10', tone: 'negativa', category: 'pago-salarios', relationship: 'anterior', rulesAccepted: true }),
    );
    vi.restoreAllMocks();
  });

  it('conserva el borrador si el envío falla', async () => {
    sessionStorage.setItem(
      'vozlaboral:borrador',
      JSON.stringify({ company: { id: '7b0f8a3e-2c2f-4f43-9a55-0c6a1d1e5b10', name: 'Empresa Demo' }, tone: 'mixta', category: 'pago-salarios', periodStart: '2024-03', periodEnd: '', relationship: 'anterior', title: '', body: BODY, hasDocuments: false, rulesAccepted: true }),
    );
    createExperience.mockRejectedValue({ kind: 'network', message: 'No hay conexión con el servidor.' });
    const user = userEvent.setup();
    renderShare();
    await user.click(await screen.findByRole('button', { name: 'Revisar antes de enviar' }));
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 10_000);
    await user.click(await screen.findByRole('button', { name: 'Enviar a revisión' }));
    expect(await screen.findByText(/No hay conexión con el servidor/)).toBeInTheDocument();
    expect(sessionStorage.getItem('vozlaboral:borrador')).toContain('nómina');
    vi.restoreAllMocks();
  });

  it('sin cuenta permite compartir, entrega el enlace de seguimiento e invita a registrarse', async () => {
    auth.session = null;
    auth.profile = null;
    sessionStorage.setItem(
      'vozlaboral:borrador',
      JSON.stringify({ company: { id: '7b0f8a3e-2c2f-4f43-9a55-0c6a1d1e5b10', name: 'Empresa Demo' }, tone: 'positiva', category: 'pago-salarios', periodStart: '2024-03', periodEnd: '', relationship: 'anterior', title: '', body: BODY, hasDocuments: false, rulesAccepted: true }),
    );
    const user = userEvent.setup();
    renderShare();
    expect(screen.getByText('Puedes compartir sin crear una cuenta')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Revisar antes de enviar' }));
    expect(screen.getByText(/firmada como «Persona sin cuenta»/)).toBeInTheDocument();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 10_000);
    await user.click(screen.getByRole('button', { name: 'Enviar a revisión' }));
    expect(await screen.findByRole('heading', { name: 'Gracias por compartir' })).toBeInTheDocument();
    expect(createAnonymousExperience).toHaveBeenCalledWith(expect.objectContaining({ tone: 'positiva' }));
    expect(createExperience).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Enlace de seguimiento') as HTMLInputElement).value).toContain(`/seguimiento/${'a'.repeat(64)}`);
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', `/cuenta?siguiente=/seguimiento/${'a'.repeat(64)}`);
    expect(screen.queryByText('Puedes compartir sin crear una cuenta')).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
