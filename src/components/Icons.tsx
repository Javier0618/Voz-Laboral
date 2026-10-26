// Iconos de trazo, decorativos (aria-hidden). Heredan el color del texto.
import type { SVGProps } from 'react';

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);
export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Icon>
);
export const EyeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.75" /></Icon>
);
export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></Icon>
);
export const ScaleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 4v16M7 20h10M5 8h14" /><path d="m5 8-2.5 6a3 3 0 0 0 5 0L5 8ZM19 8l-2.5 6a3 3 0 0 0 5 0L19 8Z" /></Icon>
);
export const ReplyIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 5.5h16v10H9l-5 4v-14Z" /></Icon>
);
export const FileIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4" /></Icon>
);
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
);
export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>
);

export function BrandMark({ className = 'h-8 w-8', inverted = false }: { className?: string; inverted?: boolean }) {
  const bg = inverted ? 'rgb(var(--color-paper))' : 'rgb(var(--color-ink))';
  const fg = inverted ? 'rgb(var(--color-ink))' : 'rgb(var(--color-paper))';
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill={bg} />
      <path d="M9 10h14v9.5H15l-4.5 3.5v-3.5H9V10Z" fill="none" stroke={fg} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 14.75h6" stroke="rgb(var(--color-action))" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
