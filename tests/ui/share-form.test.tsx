import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareForm, type SubmitPayload } from '../../src/features/share/ShareForm';

const USER = 'user-1';
const COMPANY = { id: '0b8f6a2e-1c3d-4e5f-8a9b-0c1d2e3f4a5b', name: 'Empresa Ficticia de Prueba' };
const categories = [
  { id: 1, slug: 'pago-de-salarios', name: 'Pago de salarios' },
  { id: 2, slug: 'jornadas', name: 'Jornadas y descansos' },
];
const STORY = 'Durante varios meses la quincena llegó con una o dos semanas de retraso. '.repeat(4);

function setup(onSubmit: (p: SubmitPayload) => Promise<void>, onSuccess = vi.fn()) {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ShareForm
        userId={USER}
        alias="Operaria_Norte"
        categories={categories}
        initialCompany={COMPANY}
        searchCompanies={async () => []}
        proposeCompany={async () => 'nueva'}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
      />
    </MemoryRouter>,
  );
  return { onSuccess };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText('Categoría'), '1');
  const start = screen.getByLabelText('Desde');
  await user.clear(start);
  await user.type(start, '2024-03');
  await user.click(screen.getByLabelText('Trabajé ahí antes'));
  await user.click(screen.getByLabelText('Lo que viste o viviste directamente'));
  await user.paste(STORY);
  await user.click(screen.getByLabelText('Acepto las reglas de publicación'));
}

describe('ShareForm', () => {
  beforeEach(() => window.localStorage.clear());

  it('muestra errores accesibles si falta información', async () => {
    const user = userEvent.setup();
    setup(vi.fn());
    await user.click(screen.getByRole('button', { name: 'Ver vista previa' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Elige una categoría');
    expect(alert).toHaveTextContent('Debes aceptar las reglas de publicación');
    expect(screen.getByLabelText('Categoría')).toHaveAttribute('aria-invalid', 'true');
  });

  it('avisa si el relato parece tener un teléfono o un correo', async () => {
    const user = userEvent.setup();
    setup(vi.fn());
    await user.click(screen.getByLabelText('Lo que viste o viviste directamente'));
    await user.paste('Me escribió desde jefe@empresa.co y me llamó al 3105551234');
    expect(screen.getByText(/Parece que hay datos personales/)).toBeInTheDocument();
    expect(screen.getByText(/un correo electrónico, un número de teléfono/)).toBeInTheDocument();
  });

  it('muestra la vista previa con el alias y envía a revisión', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(p: SubmitPayload) => Promise<void>>().mockResolvedValue(undefined);
    const { onSuccess } = setup(onSubmit);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Ver vista previa' }));
    expect(await screen.findByRole('heading', { name: 'Vista previa' })).toBeInTheDocument();
    expect(screen.getByText('Operaria_Norte')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enviar a revisión' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: COMPANY.id,
        categoryId: 1,
        periodStart: '2024-03-01',
        periodEnd: null,
        relationship: 'anterior',
        accountDirect: STORY.trim(),
        accountThirdParty: null,
      }),
    );
    expect(window.localStorage.getItem(`vozlaboral:borrador:${USER}`)).toBeNull();
  });

  it('conserva el borrador si el envío falla', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ message: 'Llegaste al límite de 3 publicaciones en 24 horas' });
    const { onSuccess } = setup(onSubmit);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Ver vista previa' }));
    await user.click(await screen.findByRole('button', { name: 'Enviar a revisión' }));

    expect(await screen.findByText(/Llegaste al límite de 3 publicaciones/)).toBeInTheDocument();
    expect(screen.getByText(/Tu borrador sigue guardado/)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    const saved = JSON.parse(window.localStorage.getItem(`vozlaboral:borrador:${USER}`) ?? '{}');
    expect(saved.accountDirect).toBe(STORY);

    await user.click(screen.getByRole('button', { name: 'Volver a editar' }));
    expect(screen.getByLabelText('Lo que viste o viviste directamente')).toHaveValue(STORY);
  });

  it('recupera el borrador al volver a abrir el formulario', async () => {
    window.localStorage.setItem(
      `vozlaboral:borrador:${USER}`,
      JSON.stringify({ accountDirect: 'Texto guardado antes', categoryId: '2' }),
    );
    setup(vi.fn());
    expect(screen.getByText(/Recuperamos tu borrador/)).toBeInTheDocument();
    expect(screen.getByLabelText('Lo que viste o viviste directamente')).toHaveValue('Texto guardado antes');
    expect(screen.getByLabelText('Categoría')).toHaveValue('2');
  });
});
