// Prepara una imagen de portada en el navegador: la recorta al centro en
// proporción 1,91:1 (la que usan las vistas previas de enlaces), la reduce a
// 1200 × 628 y la guarda como WebP (o JPEG si el navegador no sabe). Al
// redibujarla en un canvas se descartan los metadatos, como la ubicación GPS.
export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 628;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Medidas del recorte centrado que conserva la proporción de destino. */
export function centerCrop(width: number, height: number, ratio = COVER_WIDTH / COVER_HEIGHT) {
  if (width / height > ratio) {
    const w = Math.round(height * ratio);
    return { sx: Math.round((width - w) / 2), sy: 0, sw: w, sh: height };
  }
  const h = Math.round(width / ratio);
  return { sx: 0, sy: Math.round((height - h) / 2), sw: width, sh: h };
}

export async function prepareCoverImage(file: File): Promise<File> {
  const img = await loadImage(file);
  const { sx, sy, sw, sh } = centerCrop(img.naturalWidth, img.naturalHeight);
  const scale = Math.min(1, COVER_WIDTH / sw);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no puede procesar la imagen.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const webp = await toBlob(canvas, 'image/webp', 0.82);
  if (webp && webp.type === 'image/webp') return new File([webp], 'portada.webp', { type: 'image/webp' });
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.85);
  if (!jpeg) throw new Error('No se pudo procesar la imagen.');
  return new File([jpeg], 'portada.jpg', { type: 'image/jpeg' });
}
