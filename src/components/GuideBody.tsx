import { Fragment } from 'react';
import { headingIds, parseGuide, parseInline } from '../lib/guide';

/** Texto con **negrita** y enlaces https. Nunca usa HTML crudo. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((n, i) =>
        n.type === 'strong' ? (
          <strong key={i} className="font-semibold">{n.text}</strong>
        ) : n.type === 'link' ? (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="btn-link font-normal">
            {n.text}
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        ) : (
          <Fragment key={i}>{n.text}</Fragment>
        ),
      )}
    </>
  );
}

/** Cuerpo de una guía: lo usan la página pública y la vista previa del editor. */
export function GuideBody({ content }: { content: string }) {
  const blocks = parseGuide(content);
  const ids = headingIds(blocks);
  return (
    <div className="guide-body max-w-prose font-serif text-[1.125rem] leading-[1.85rem] text-ink">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return b.level === 3 ? (
              <h3 key={i} id={ids.get(i)} className="mt-8 scroll-mt-6 font-sans text-lg font-semibold">
                <Inline text={b.text} />
              </h3>
            ) : (
              <h2 key={i} id={ids.get(i)} className="mt-12 scroll-mt-6 border-t border-line pt-8 text-2xl first:mt-0 first:border-t-0 first:pt-0">
                <Inline text={b.text} />
              </h2>
            );
          case 'image':
            return (
              <figure key={i} className="mt-6">
                <img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded border border-line" />
                {b.alt && <figcaption className="mt-2 font-sans text-sm text-slate">{b.alt}</figcaption>}
              </figure>
            );
          case 'note':
            return (
              <aside key={i} className="mt-6 rounded border-l-4 border-teal bg-teal-tint/60 px-5 py-4 font-sans text-base leading-7">
                <p className="text-sm font-semibold text-teal-strong">Importante</p>
                <p className="mt-1"><Inline text={b.text} /></p>
              </aside>
            );
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i} className={`mt-5 space-y-2.5 pl-6 ${b.ordered ? 'list-decimal marker:font-sans marker:font-semibold marker:text-teal-strong' : 'list-disc marker:text-teal'}`}>
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1"><Inline text={it} /></li>
                ))}
              </Tag>
            );
          }
          default:
            return <p key={i} className="mt-5 first:mt-0"><Inline text={b.text} /></p>;
        }
      })}
    </div>
  );
}
