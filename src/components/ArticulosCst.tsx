import { Children, cloneElement, Fragment, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { listPublishedGuideSlugs } from '../lib/api';
import { guiaDeArticulo, partesCst } from '../lib/articulosCst';

// Una sola consulta por visita: los enlaces solo llevan a guías publicadas.
let publicadas: Promise<Set<string>> | null = null;
function usePublicadas() {
  const [set, setSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    publicadas ??= listPublishedGuideSlugs().then((r) => new Set(r.map((g) => g.slug))).catch(() => {
      publicadas = null;
      return new Set<string>();
    });
    let vivo = true;
    publicadas.then((s) => { if (vivo) setSet(s); });
    return () => { vivo = false; };
  }, []);
  return set;
}

/** Texto en el que cada artículo del CST citado enlaza a la guía que lo explica. */
export function TextoCst({ texto, actual }: { texto: string; actual?: string }) {
  const publicadasSet = usePublicadas();
  return (
    <>
      {partesCst(texto).map((p, i) => {
        if (typeof p === 'string') return <Fragment key={i}>{p}</Fragment>;
        const slug = guiaDeArticulo(p.articulo, publicadasSet, actual);
        return slug
          ? <Link key={i} to={`/derechos/${slug}`} className="btn-link font-normal" title="Leer la guía sobre este artículo">{p.texto}</Link>
          : <Fragment key={i}>{p.texto}</Fragment>;
      })}
    </>
  );
}

/** Aplica TextoCst a todo el texto dentro de un bloque JSX (párrafos, listas, títulos). */
export function conArticulosCst(node: ReactNode): ReactNode {
  return Children.map(node, (n) => {
    if (typeof n === 'string') return <TextoCst texto={n} />;
    if (!isValidElement(n) || n.type === Link) return n;
    const el = n as ReactElement<{ children?: ReactNode }>;
    return el.props.children === undefined ? el : cloneElement(el, undefined, conArticulosCst(el.props.children));
  });
}
