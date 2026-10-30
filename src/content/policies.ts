// Documentos legales que se muestran en /politicas/:slug.

export interface PolicySection { heading: string; paragraphs: string[] }
export interface Policy { slug: string; title: string; summary: string; sections: PolicySection[] }

const RESPONSABLE = 'VozLaboral, plataforma de experiencias laborales en Colombia. Para cualquier asunto sobre tus datos, escríbenos al correo de contacto que aparece al final de esta página.';

export const policies: Policy[] = [
  {
    slug: 'tratamiento-de-datos',
    title: 'Política de tratamiento de datos personales',
    summary: 'Qué datos tratamos, para qué, durante cuánto tiempo y cómo puedes ejercer tus derechos.',
    sections: [
      {
        heading: 'Responsable del tratamiento',
        paragraphs: [RESPONSABLE, 'Marco de referencia: Ley 1581 de 2012 y Decreto 1074 de 2015.'],
      },
      {
        heading: 'Datos que tratamos',
        paragraphs: [
          'Para la cuenta: correo electrónico y contraseña (almacenada cifrada por el proveedor de autenticación). No pedimos nombre real ni documento de identidad.',
          'Para publicar: el alias que eliges y el contenido de tus experiencias, comentarios, reportes, apelaciones y solicitudes.',
          'Reacciones: guardamos qué reacción dejó cada cuenta para contar una por persona y permitir quitarla. Solo se publica el total; nadie más ve quién reaccionó.',
          'Envíos sin cuenta: no pedimos correo ni otro dato de contacto. Guardamos el contenido y una huella cifrada (hash) del enlace de seguimiento, nunca el enlace. Quien tenga el enlace puede ver el estado, las reacciones y los comentarios, y vincular la experiencia a una cuenta.',
          'Registros técnicos y de seguridad: eventos como superar límites de envío o cambios de rol. En nuestras tablas no guardamos direcciones IP; el proveedor de infraestructura puede registrarlas en sus propios registros técnicos durante el plazo que define su contrato.',
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
        paragraphs: [
          'Usamos proveedores de infraestructura en la nube para la base de datos, la autenticación y el alojamiento del sitio. Sus servidores pueden estar ubicados fuera de Colombia.',
          'Solo les transmitimos los datos necesarios para prestar el servicio, y los tratan por nuestra cuenta, sin usarlos para fines propios.',
        ],
      },
      {
        heading: 'Conservación',
        paragraphs: [
          'Cuenta: mientras esté activa. Al solicitar la eliminación hay 15 días para cancelarla; después, las publicaciones y los comentarios se desvinculan de la cuenta, se borran sus reacciones, el alias y el acceso.',
          'Comentarios eliminados por su autor: dejan de mostrarse de inmediato y se conservan ocultos para atender reclamaciones durante el plazo del historial de moderación.',
          'Registros de seguridad: 12 meses. Historial de moderación: 5 años, para atender reclamaciones y requerimientos legales.',
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
        paragraphs: [
          'Tu alias, el contenido de las experiencias publicadas, si fueron buenas, malas o mixtas, la empresa, el tema, tu relación con la empresa (si la indicas) y el periodo aproximado, mostrado como mes y año.',
          'Tus comentarios, con tu alias. De las reacciones solo se muestra el total, nunca quién reaccionó.',
          'Si compartes sin cuenta, la experiencia aparece firmada como «Persona sin cuenta».',
        ],
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
          'No podemos garantizar anonimato absoluto. Los detalles de un relato pueden permitir que alguien de tu entorno te reconozca. Una autoridad competente puede requerir información conforme a la ley; en ese caso solo entregamos lo que la orden exija.',
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
          'Un espacio independiente para compartir experiencias laborales, buenas y malas, conversar sobre ellas y encontrar orientación general sobre derechos. No es una autoridad judicial ni administrativa, y no sustituye al Ministerio del Trabajo, a los inspectores de trabajo, a los jueces ni la asesoría jurídica profesional.',
          'Que una experiencia esté publicada significa que cumple las reglas de publicación, no que la plataforma haya comprobado los hechos.',
        ],
      },
      {
        heading: 'Responsabilidad sobre el contenido',
        paragraphs: [
          'Cada persona responde por lo que publica, también en los comentarios. Debes relatar hechos que viviste o conoces, distinguiendo lo que te contaron terceros, y expresar tus opiniones como tales.',
          'El enlace de seguimiento de un envío sin cuenta es personal: quien lo tenga puede ver y vincular esa experiencia. Guárdalo y no lo compartas.',
        ],
      },
      {
        heading: 'Independencia',
        paragraphs: ['Las empresas no pueden pagar por retirar o modificar críticas legítimas. Pueden solicitar correcciones de datos verificables y publicar respuestas identificadas como suyas.'],
      },
      {
        heading: 'Contenido ilícito y retiro',
        paragraphs: [
          'Podemos retirar o restringir contenido que incumpla las reglas de publicación o la ley. Si crees que una publicación o un comentario es ilícito, repórtalo desde la propia publicación o escríbenos al correo de contacto.',
        ],
      },
      {
        heading: 'Ley aplicable',
        paragraphs: [
          'Estos términos se rigen por las leyes de la República de Colombia.',
          'Las experiencias reflejan la vivencia y la opinión de quien las escribe. Las decisiones que tomes con base en ellas o en las guías son tuyas: para tu caso concreto, consulta al Ministerio del Trabajo o a un profesional del derecho.',
        ],
      },
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
          'Contar experiencias laborales buenas, malas o mixtas que viviste o presenciaste, con detalle sobre los hechos y cómo te afectaron.',
          'Reconocer lo que una empresa hace bien: también ayuda a quien busca trabajo.',
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
        heading: 'Comentarios y reacciones',
        paragraphs: [
          'Comenta para aportar tu experiencia, hacer una pregunta o dar apoyo. Valen las mismas reglas: sin nombres ni datos de contacto, sin insultos ni amenazas.',
          'No acuses a personas concretas ni intentes adivinar quién escribió una experiencia.',
          'Las reacciones expresan apoyo («Me pasó igual», «Me sirvió», «Gracias»). No son votos ni una calificación de la empresa.',
          'Quien escribe una experiencia puede desactivar los comentarios.',
        ],
      },
      {
        heading: 'Cómo moderamos',
        paragraphs: [
          'Revisamos cada experiencia antes de publicarla. Podemos publicarla, pedir ajustes, marcarla como en disputa, restringirla temporalmente ante un riesgo justificado o retirarla. Cada decisión tiene un motivo que puedes consultar y apelar.',
          'Los comentarios se publican al instante. Si parecen incluir datos personales quedan retenidos hasta que los revisemos, y cualquiera con cuenta puede reportar uno.',
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
        paragraphs: [
          'Puedes cambiar tu alias, retirar tus experiencias, borrar tus comentarios, quitar tus reacciones y solicitar la eliminación de la cuenta directamente en Mi cuenta.',
          'Si compartiste sin cuenta, puedes vincular la experiencia a una cuenta desde tu enlace de seguimiento y gestionarla desde allí.',
        ],
      },
      {
        heading: 'Otras solicitudes',
        paragraphs: [
          'Para consultas, rectificaciones o supresiones que no puedas hacer desde tu cuenta, escribe al canal de contacto indicado abajo, describiendo tu solicitud y la forma de responderte.',
          'Respondemos las consultas en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles, como establece la Ley 1581 de 2012.',
          'Para proteger tus datos, podemos pedirte que confirmes que eres el titular, por ejemplo escribiendo desde el correo de tu cuenta.',
        ],
      },
      { heading: 'Responsable', paragraphs: [RESPONSABLE] },
    ],
  },
];
