import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import { setPageMeta } from '../../lib/meta';
import { GLOSARIO } from '../../lib/glosario';
import { PageHeader } from '../../components/ui';

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function GlosarioPage() {
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    setPageMeta({
      title: `Glosario laboral: qué significa cada término · ${brand.name}`,
      description: 'Qué son las cesantías, el IBL, el preaviso, el recargo, la historia laboral y otros términos laborales de Colombia, explicados en lenguaje claro.',
      path: '/herramientas/glosario',
      jsonLd: {
        '@type': 'DefinedTermSet',
        name: `Glosario laboral de ${brand.name}`,
        url: `${brand.siteUrl}/herramientas/glosario`,
        inLanguage: 'es-CO',
        hasDefinedTerm: GLOSARIO.map((t) => ({ '@type': 'DefinedTerm', name: t.termino, description: t.definicion, url: `${brand.siteUrl}/herramientas/glosario#${t.id}` })),
      },
    });
    return () => setPageMeta(null);
  }, []);

  // Al llegar desde una guía con #termino, se lleva la vista al término.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  const lista = useMemo(() => {
    const ordenados = [...GLOSARIO].sort((a, b) => sinTildes(a.termino).localeCompare(sinTildes(b.termino)));
    const f = sinTildes(filtro.trim());
    return f ? ordenados.filter((t) => sinTildes(`${t.termino} ${(t.variantes ?? []).join(' ')} ${t.definicion}`).includes(f)) : ordenados;
  }, [filtro]);

  return (
    <div className="page py-10">
      <p className="text-sm"><Link to="/herramientas/" className="btn-link">Herramientas</Link></p>
      <PageHeader title="Glosario laboral">
        Las palabras que aparecen en tu contrato, tu desprendible y las guías, explicadas en una o dos frases. En las guías, toca una palabra subrayada
        con puntos para ver su definición.
      </PageHeader>

      <div className="mt-6 max-w-md">
        <label htmlFor="filtro-glosario" className="label">Buscar un término</label>
        <input id="filtro-glosario" type="search" className="input" placeholder="Por ejemplo: cesantías" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      </div>

      <dl className="mt-8 max-w-prose">
        {lista.map((t) => (
          <div key={t.id} id={t.id} className="scroll-mt-6 border-b border-line py-5 target:bg-teal-tint/60">
            <dt className="font-serif text-xl">{t.termino}{t.variantes?.some((v) => v === v.toUpperCase()) && <span className="ml-2 font-sans text-sm text-slate">({t.variantes.filter((v) => v === v.toUpperCase()).join(', ')})</span>}</dt>
            <dd className="mt-1">{t.definicion}</dd>
            {t.guia && <dd className="mt-1 text-sm"><Link to={`/derechos/${t.guia.slug}/`} className="btn-link">{t.guia.label}</Link></dd>}
          </div>
        ))}
      </dl>
      {lista.length === 0 && <p className="mt-6 text-slate">No encontramos ese término. Prueba con otra palabra o búscalo en las <Link to="/buscar" className="btn-link">guías</Link>.</p>}
    </div>
  );
}
