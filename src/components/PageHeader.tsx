import { useEffect, type ReactNode } from 'react';
import { brand } from '../config/brand';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${brand.name}` : brand.name;
  }, [title]);
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  usePageTitle(title);
  return (
    <div className="border-b border-line pb-6 pt-8 sm:pt-12">
      <h1 className="text-4xl leading-tight sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-prose text-lg text-muted">{children}</div>}
    </div>
  );
}
