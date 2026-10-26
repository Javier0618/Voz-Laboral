"""Convierte el informe de Supersociedades «10.000 empresas más grandes» (Excel)
en archivos SQL para cargar el catálogo de empresas en Supabase.

Uso:
    python scripts/importar_empresas.py RUTA_DEL_EXCEL [--anio 2025] [--lote 2000]

Genera supabase/importaciones/empresas_<anio>_parte_N.sql. Cada archivo:
- crea las empresas (nombre, sector, ciudad, departamento);
- guarda el NIT en company_private_data, que no es legible públicamente;
- es idempotente: volver a ejecutarlo no duplica empresas.

Requiere: pip install openpyxl
"""
import argparse
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl

DEPARTAMENTOS = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
    'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
    'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
    'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
]
MINUSCULAS = {'de', 'del', 'la', 'las', 'el', 'los', 'y', 'e'}


def normalizar(texto: str) -> str:
    """Igual que private.normalize_text() en la base de datos."""
    sin_tildes = unicodedata.normalize('NFD', texto)
    sin_tildes = ''.join(c for c in sin_tildes if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', sin_tildes.lower()).strip()


DEPTO_POR_CLAVE = {normalizar(d): d for d in DEPARTAMENTOS}
DEPTO_POR_CLAVE.update({'bogota d c': 'Bogotá D.C.', 'san andres': 'San Andrés y Providencia',
                        'archipielago de san andres providencia y santa catalina': 'San Andrés y Providencia',
                        'valle': 'Valle del Cauca', 'guajira': 'La Guajira'})


def titulo(texto: str) -> str:
    """«MEDELLÍN» -> «Medellín», «SANTA ROSA DE CABAL» -> «Santa Rosa de Cabal»."""
    palabras = texto.strip().lower().split()
    return ' '.join(p if (i > 0 and p in MINUSCULAS) else p[:1].upper() + p[1:] for i, p in enumerate(palabras)).replace('D.c.', 'D.C.')


def departamento(texto: str) -> str:
    return DEPTO_POR_CLAVE.get(normalizar(texto), titulo(texto))


def ciudad(texto: str) -> str:
    # El informe usa «CIUDAD-DEPARTAMENTO».
    return titulo(texto.split('-')[0])


def slug(*partes: str) -> str:
    base = '-'.join(normalizar(p).replace(' ', '-') for p in partes)
    return base[:80].strip('-')


def sql_texto(valor) -> str:
    return 'null' if valor is None else "'" + str(valor).replace("'", "''") + "'"


def leer(ruta: Path):
    hoja = openpyxl.load_workbook(ruta, read_only=True).worksheets[0]
    filas = list(hoja.iter_rows(values_only=True))
    try:
        cab = next(i for i, f in enumerate(filas) if f and f[1] == 'NIT')
    except StopIteration:
        sys.exit('No se encontró la fila de encabezados (columna «NIT»). ¿Es el informe de Supersociedades?')
    col = {str(n).strip(): i for i, n in enumerate(filas[cab]) if n}
    for requerida in ('NIT', 'RAZÓN SOCIAL', 'DEPARTAMENTO DOMICILIO', 'CIUDAD DOMICILIO', 'MACROSECTOR'):
        if requerida not in col:
            sys.exit(f'Falta la columna «{requerida}» en el Excel.')

    empresas, slugs, descartes = [], set(), []
    for f in filas[cab + 1:]:
        if not f or not f[col['NIT']]:
            continue
        nit = str(f[col['NIT']]).strip()
        razon = ' '.join(str(f[col['RAZÓN SOCIAL']]).split())
        # Algunas razones sociales incluyen «PUDIENDO UTILIZAR LAS SIGLAS…»: se muestra la parte principal.
        nombre = re.split(r'\s+PUDIENDO\s', razon, maxsplit=1)[0]
        if len(nombre) > 120:
            nombre = nombre[:119].rsplit(' ', 1)[0] + '…'
        legal = razon if razon != nombre else None
        if not re.fullmatch(r'[0-9]{6,12}', nit) or len(nombre) < 2 or len(razon) > 160:
            descartes.append((nit, nombre, 'NIT o nombre fuera de formato'))
            continue
        c, d = ciudad(str(f[col['CIUDAD DOMICILIO']])), departamento(str(f[col['DEPARTAMENTO DOMICILIO']]))
        s = slug(nombre, c)
        n = 2
        while s in slugs:  # misma razón social en la misma ciudad
            s = f"{slug(nombre, c)[:76]}-{n}"
            n += 1
        slugs.add(s)
        empresas.append({'slug': s, 'nombre': nombre, 'legal': legal, 'sector': titulo(str(f[col['MACROSECTOR']])), 'ciudad': c, 'depto': d, 'nit': nit})
    return empresas, descartes


def escribir(empresas, anio: int, lote: int, destino: Path):
    destino.mkdir(parents=True, exist_ok=True)
    nota = f'Fuente: Supersociedades, 10.000 empresas más grandes por ingresos {anio}'
    archivos = []
    for parte, inicio in enumerate(range(0, len(empresas), lote), start=1):
        grupo = empresas[inicio:inicio + lote]
        valores = ',\n'.join(
            f"  ({sql_texto(e['slug'])}, {sql_texto(e['nombre'])}, {sql_texto(e['legal'])}, {sql_texto(e['sector'])}, {sql_texto(e['ciudad'])}, {sql_texto(e['depto'])}, {sql_texto(e['nit'])})"
            for e in grupo
        )
        sql = f"""-- VozLaboral: importación de empresas, parte {parte} ({len(grupo)} empresas).
-- {nota}.
-- Generado por scripts/importar_empresas.py. Se puede ejecutar más de una vez sin duplicar.
begin;

with origen (slug, trade_name, legal_name, sector, city, department, tax_id) as (values
{valores}
),
nuevas as (
  insert into public.companies (slug, trade_name, legal_name, sector, city, department)
  select o.slug, o.trade_name, o.legal_name, o.sector, o.city, o.department
    from origen o
   where not exists (select 1 from public.company_private_data p where p.tax_id = o.tax_id)
  on conflict do nothing
  returning id, slug
)
insert into public.company_private_data (company_id, tax_id, internal_notes)
select n.id, o.tax_id, {sql_texto(nota)}
  from nuevas n join origen o using (slug)
on conflict do nothing;

commit;
"""
        archivo = destino / f'empresas_{anio}_parte_{parte}.sql'
        archivo.write_text(sql, encoding='utf-8')
        archivos.append(archivo)
    return archivos


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('excel', type=Path)
    p.add_argument('--anio', type=int, default=2025)
    p.add_argument('--lote', type=int, default=2000)
    p.add_argument('--destino', type=Path, default=Path(__file__).resolve().parent.parent / 'supabase' / 'importaciones')
    a = p.parse_args()
    empresas, descartes = leer(a.excel)
    archivos = escribir(empresas, a.anio, a.lote, a.destino)
    print(f'{len(empresas)} empresas en {len(archivos)} archivos; {len(descartes)} descartadas.')
    for d in descartes:
        print('  descartada:', *d)
    for f in archivos:
        print(' ', f)


if __name__ == '__main__':
    main()
