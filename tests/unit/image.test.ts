import { describe, expect, it } from 'vitest';
import { centerCrop } from '../../src/lib/image';

describe('recorte de la portada', () => {
  it('recorta al centro las fotos más altas que la proporción 1,91:1', () => {
    expect(centerCrop(3000, 2000)).toEqual({ sx: 0, sy: 215, sw: 3000, sh: 1570 });
  });

  it('recorta los lados de las imágenes muy anchas', () => {
    expect(centerCrop(4000, 1000)).toEqual({ sx: 1045, sy: 0, sw: 1911, sh: 1000 });
  });
});
