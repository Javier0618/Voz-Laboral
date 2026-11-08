import type { LegalResource } from '../lib/api';
import { publicGuideImageUrl } from '../lib/publicGuideImageUrl';

/** Portada de una guía. Sin descripción, es decorativa (alt vacío). */
export function GuideCover({ guide, className = '' }: { guide: Pick<LegalResource, 'cover_url' | 'cover_alt'>; className?: string }) {
  if (!guide.cover_url) return null;
  return (
    <img src={publicGuideImageUrl(guide.cover_url)} alt={guide.cover_alt} width={1200} height={628} loading="lazy" decoding="async"
      className={`block aspect-[1200/628] w-full bg-mist object-cover ${className}`} />
  );
}
