import { parseGuide } from '../lib/guide';

/** Cuerpo de una guía: lo usan la página pública y la vista previa del editor. */
export function GuideBody({ content }: { content: string }) {
  return (
    <div className="max-w-prose space-y-5 font-serif text-[1.125rem] leading-[1.85rem]">
      {parseGuide(content).map((b, i) =>
        b.type === 'heading' ? (
          <h2 key={i} className="pt-4 text-2xl first:pt-0">{b.text}</h2>
        ) : b.type === 'image' ? (
          <img key={i} src={b.src} alt={b.alt} loading="lazy" className="w-full rounded border border-line" />
        ) : b.type === 'list' ? (
          <ul key={i} className="list-disc space-y-2 pl-6 marker:text-teal">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  );
}
