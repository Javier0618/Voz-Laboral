// Inicial sobre fondo neutro: identifica visualmente sin usar logos de empresas.
export function Monogram({ text, size = 'md', tone = 'navy' }: { text: string; size?: 'sm' | 'md' | 'lg'; tone?: 'navy' | 'action' }) {
  const letter = text.replace(/^\[[^\]]*\]\s*/, '').trim().charAt(0).toUpperCase() || '·';
  const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-11 w-11 text-lg', lg: 'h-16 w-16 text-2xl' };
  const tones = { navy: 'bg-navy text-paper', action: 'bg-action-tint text-action' };
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-lg font-serif font-semibold ${sizes[size]} ${tones[tone]}`}>
      {letter}
    </span>
  );
}
