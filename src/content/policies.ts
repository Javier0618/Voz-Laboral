// BORRADORES de documentos legales. No garantizan el cumplimiento normativo:
// deben ser revisados y completados por un abogado colombiano antes del
// lanzamiento público. Los campos entre [corchetes] están pendientes.

export interface PolicySection { heading: string; paragraphs: string[] }
export interface Policy { slug: string; title: string; summary: string; sections: PolicySection[] }

const RESPONSABLE = '[Razón social, NIT, domicilio y canal de contacto del responsable del tratamiento: PENDIENTE]';

export const policies: Policy[] = [
  {
    slug: 'tratamiento-de-datos',
    title: 'Política de tratamiento de datos personales',
    summary: 'Qué datos tratamos, para qué, durante cuánto tiempo y cómo puedes ejercer tus derechos.',
    sections: [
      {
        heading: 'Responsable del tratamiento',
        paragraphs: [RESPONSABLE, 'Marco de referencia: Ley 1581 de 2012 y Decreto 1074 de 2015, sujeto a verificación de vigencia y alcance por parte de un abogado.'],
      },
      {
        heading: 'Datos que tratamos',
        paragraphs: [
          'Para la cuenta: correo electrónico y contraseña (almacenada cifrada por el proveedor de autenticación). No pedimos nombre real ni documento de identidad.',
          'Para publicar: el alias que eliges y el contenido de tus experiencias, reportes, apelaciones y solicitudes.',
          'Registros técnicos y de seguridad: eventos como superar límites de envío o cambios de rol. En nuestras tablas no guardamos direcciones IP; el proveedor de infraestructura puede registrarlas en sus propios registros técnicos durante el plazo que define su contrato [confirmar plazo y condiciones con el proveedor].',
          'No solicitamos datos sensibles. Si un relato los incluye, el equipo de moderación puede pedir que se retiren.',
        ],
      },
      {
        heading: 'Finalidades',
        paragraphs: [
          'Gestionar tu cuenta, publicar y moderar contenido, atender reclamaciones y solicitudes, prevenir abusos y cumplir obligaciones legales.',
          'No vendemos datos ni los compartimos con las empresas mencionadas en las publicaciones.',
        ],
      },
      {
        heading: 'Transferencia y transmisión de datos',
        paragraphs: ['[PENDIENTE: ubicación de los servidores del proveedor, contrato de transmisión y análisis de transferencia internacional de datos.]'],
      },
      {
        heading: 'Conservación',
        paragraphs: [
          'Cuenta: mientras esté activa. Al solicitar la eliminación hay 15 días para cancelarla; después, las publicaciones se desvinculan de la cuenta y se borran el alias y el acceso.',
          'Registros de seguridad: 12 meses. Historial de moderación: 5 años, para atender reclamaciones y requerimientos legales. [Plazos propuestos, pendientes de validación jurídica.]',
        ],
      },
      {
        heading: 'Tus derechos',
        paragraphs: [
          'Conocer, actualizar, rectificar y solicitar la supresión de tus datos; solicitar prueba de la autorización; ser informado sobre el uso de tus datos; presentar quejas ante la Superintendencia de Industria y Comercio; y revocar la autorización cuando proceda.',
          'Consulta el procedimiento en «Consultas y reclamos sobre tus datos».',
        ],
      },
    ],
  },
  {
    slug: 'privacidad',
    title: 'Aviso de privacidad',
    summary: 'Resumen de cómo protegemos tu identidad y cuáles son sus límites.',
    sections: [
      {
        heading: 'Lo que ven otras personas',
        paragraphs: ['Tu alias, el contenido de las experiencias publicadas, la empresa, la categoría, tu relación con la empresa (si la indicas) y el periodo aproximado, mostrado como mes y año.'],
      },
      {
        heading: 'Lo que nunca se publica',
        paragraphs: [
          'Tu correo, tu identificador de cuenta y los datos técnicos de acceso. Las empresas no tienen acceso a los datos de las cuentas, y las reclamaciones empresariales no revelan quién escribió una experiencia.',
          'El personal de moderación ve el alias y el contenido necesario para revisar, no tu correo.',
        ],
      },
      {
        heading: 'Límites de la protección',
        paragraphs: [
          'No podemos garantizar anonimato absoluto. Los detalles de un relato pueden permitir que alguien de tu entorno te reconozca. Una autoridad competente puede requerir información conforme a la ley [procedimiento de atención de requerimientos: PENDIENTE de revisión jurídica].',
        ],
      },
      { heading: 'Responsable', paragraphs: [RESPONSABLE] },
    ],
  },
  {
    slug: 'terminos',
    title: 'Términos de uso',
    summary: 'Condiciones para usar la plataforma.',
    sections: [
      {
        heading: 'Qué es y qué no es la plataforma',
        paragraphs: [
          'Un espacio independiente para compartir experiencias laborales y orientación general sobre derechos. No es una autoridad judicial ni administrativa, y no sustituye al Ministerio del Trabajo, a los inspectores de trabajo, a los jueces ni la asesoría jurídica profesional.',
          'Que una experiencia esté publicada significa que cumple las reglas de publicación, no que la plataforma haya comprobado los hechos.',
        ],
      },
      {
        heading: 'Responsabilidad sobre el contenido',
        paragraphs: ['Cada persona responde por lo que publica. Debes relatar hechos que viviste o conoces, distinguiendo lo que te contaron terceros, y expresar tus opiniones como tales.'],
      },
      {
        heading: 'Independencia',
        paragraphs: ['Las empresas no pueden pagar por retirar o modificar críticas legítimas. Pueden solicitar correcciones de datos verificables y publicar respuestas identificadas como suyas.'],
      },
      { heading: 'Pendiente', paragraphs: ['[Ley aplicable, jurisdicción, limitación de responsabilidad y procedimiento de notificación de contenido ilícito: PENDIENTE de redacción por un abogado.]'] },
    ],
  },
  {
    slug: 'reglas',
    title: 'Reglas de publicación',
    summary: 'Lo que se puede y no se puede publicar.',
    sections: [
      {
        heading: 'Sí',
        paragraphs: [
          'Relatar situaciones laborales que viviste o presenciaste, con el máximo detalle sobre los hechos y su efecto.',
          'Separar lo que viste directamente de lo que te contaron otras personas.',
          'Expresar tu opinión, dejando claro que es tu valoración.',
        ],
      },
      {
        heading: 'No',
        paragraphs: [
          'Publicar nombres, teléfonos, correos, documentos de identidad, direcciones o fotos de personas concretas.',
          'Amenazar, insultar o incitar a la violencia o al acoso contra nadie.',
          'Copiar documentos confidenciales o información protegida de la empresa.',
          'Publicar contenido falso a sabiendas, publicidad o textos automatizados.',
          'Publicar sobre una empresa con la que no tuviste relación laboral directa, salvo que lo indiques claramente.',
        ],
      },
      {
        heading: 'Cómo moderamos',
        paragraphs: [
          'Revisamos cada experiencia antes de publicarla. Podemos publicarla, pedir ajustes, marcarla como en disputa, restringirla temporalmente ante un riesgo justificado o retirarla. Cada decisión tiene un motivo que puedes consultar y apelar.',
          'Los avisos automáticos de datos personales solo ayudan a priorizar la revisión: nunca deciden sobre la veracidad de un relato.',
        ],
      },
    ],
  },
  {
    slug: 'solicitudes',
    title: 'Consultas y reclamos sobre tus datos',
    summary: 'Cómo ejercer tus derechos como titular de datos personales.',
    sections: [
      {
        heading: 'Desde tu cuenta',
        paragraphs: ['Puedes cambiar tu alias, retirar tus experiencias y solicitar la eliminación de la cuenta directamente en Mi cuenta.'],
      },
      {
        heading: 'Otras solicitudes',
        paragraphs: [
          'Para consultas, rectificaciones o supresiones que no puedas hacer desde tu cuenta, escribe al canal de contacto indicado abajo, describiendo tu solicitud y la forma de responderte.',
          '[PENDIENTE: canal oficial, plazos de respuesta de consultas y reclamos según la normativa vigente y procedimiento de verificación de identidad del titular, a definir con un abogado.]',
        ],
      },
      { heading: 'Responsable', paragraphs: [RESPONSABLE] },
    ],
  },
];
