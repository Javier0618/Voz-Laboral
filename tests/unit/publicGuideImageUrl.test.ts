import { describe, expect, it } from 'vitest';
import { publicGuideImageUrl } from '../../src/lib/publicGuideImageUrl';

const source = 'https://izzpirqqqwdvwbndnuql.supabase.co/storage/v1/object/public/guias/';
const target = 'https://tuvozlaboral.com/storage/v1/object/public/guias/';

describe('URLs públicas de imágenes de guías', () => {
  it('transforma portadas e infografías sin cambiar las rutas', () => {
    expect(publicGuideImageUrl(source + 'renuncia/portada.webp'))
      .toBe(target + 'renuncia/portada.webp');
    expect(publicGuideImageUrl(source + 'salud/infografia.webp?download=true'))
      .toBe(target + 'salud/infografia.webp?download=true');
  });

  it('conserva otras imágenes y URLs vacías', () => {
    expect(publicGuideImageUrl('https://otro-proyecto.supabase.co/storage/v1/object/public/guias/x.webp'))
      .toBe('https://otro-proyecto.supabase.co/storage/v1/object/public/guias/x.webp');
    expect(publicGuideImageUrl('https://izzpirqqqwdvwbndnuql.supabase.co/storage/v1/object/sign/guias/x.webp'))
      .toBe('https://izzpirqqqwdvwbndnuql.supabase.co/storage/v1/object/sign/guias/x.webp');
    expect(publicGuideImageUrl('/og-default.png')).toBe('/og-default.png');
    expect(publicGuideImageUrl(null)).toBe('');
  });
});
