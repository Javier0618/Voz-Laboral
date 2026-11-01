// Fase 5.2: cada calculadora explica su fórmula y enlaza a su guía.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: false, supabase: null, requireClient: () => ({}) }));

import Prima from '../../src/pages/calculadoras/Prima';
import Cesantias from '../../src/pages/calculadoras/Cesantias';
import SalarioNeto from '../../src/pages/calculadoras/SalarioNeto';
import PrestacionServicios from '../../src/pages/calculadoras/PrestacionServicios';
import Liquidacion from '../../src/pages/Liquidacion';

const casos = [
  ['prima', Prima, '/derechos/prima-de-servicios'],
  ['cesantías', Cesantias, '/derechos/cesantias-e-intereses'],
  ['salario neto', SalarioNeto, '/derechos/pago-del-salario'],
  ['prestación de servicios', PrestacionServicios, '/derechos/cuando-existe-contrato-de-trabajo'],
  ['liquidación', Liquidacion, '/derechos/liquidacion-al-terminar-el-contrato'],
] as const;

describe('calculadoras: cómo se calcula y guía', () => {
  it.each(casos)('%s muestra la fórmula y enlaza a su guía sin calcular antes', (_n, Page, guia) => {
    render(<MemoryRouter><Page /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Cómo se calcula' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lee la guía sobre este tema' })).toBeTruthy();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(guia);
  });
});
