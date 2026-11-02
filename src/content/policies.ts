// Documentos legales que se muestran en /politicas/:slug.

export interface PolicySection { heading: string; paragraphs: string[] }
export interface Policy { slug: string; title: string; summary: string; sections: PolicySection[] }

import { adsenseClient } from '../lib/analytics';
import { turnstileSiteKey } from '../components/Turnstile';

/**
 * La publicidad (Google AdSense) solo se menciona si está activa: con
 * VITE_ADSENSE_CLIENT al compilar. Hoy el objetivo es medir qué páginas se
 * visitan con Google Analytics.
 */
const ADS = Boolean(adsenseClient());
const siAnuncios = <T,>(...items: T[]): T[] => (ADS ? items : []);

/** La verificación anti-robots (Cloudflare Turnstile) solo se menciona si está activa. */
const CAPTCHA = Boolean(turnstileSiteKey());
const siCaptcha = <T,>(...items: T[]): T[] => (CAPTCHA ? items : []);
const TEXTO_CAPTCHA =
  'Para frenar los envíos automáticos, al crear una cuenta, iniciar sesión, recuperar la contraseña o enviar una experiencia sin cuenta usamos la verificación anti-robots Cloudflare Turnstile. Cloudflare, Inc. analiza datos técnicos de tu navegador y tu dirección IP, que puede tratar en Estados Unidos y en otros países, solo para comprobar que no eres un robot. No la usamos para medir visitas ni para publicidad. Puedes conocer la [política de privacidad de Turnstile](https://www.cloudflare.com/turnstile-privacy-policy/).';

const CORREO_RESPONSABLE = 'contacto.vozlaboral@gmail.com';
const RESPONSABLE =
  `TuVozLaboral, sitio de guías laborales y experiencias de trabajadores en Colombia, con domicilio en Cali (Valle del Cauca, Colombia). Correo para cualquier asunto sobre tus datos personales, consultas y reclamos: [${CORREO_RESPONSABLE}](mailto:${CORREO_RESPONSABLE}).`;

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
          'Calculadoras de nómina, solo si tienes cuenta y sesión iniciada: guardamos lo que anotas (salario, días y horarios de trabajo, horas y novedades) y el total estimado de cada período, para que lleves tu registro. Solo tú lo ves; el equipo del sitio no lo consulta ni lo usa para otra cosa. Puedes borrar cada período desde Mi cuenta, y todo se borra al eliminar la cuenta. Sin cuenta, las calculadoras no envían datos: todo se queda en tu navegador.',
          'Envíos sin cuenta: no pedimos correo ni otro dato de contacto. Guardamos el contenido y una huella cifrada (hash) del enlace de seguimiento, nunca el enlace. Quien tenga el enlace puede ver el estado, las reacciones y los comentarios, y vincular la experiencia a una cuenta.',
          'Registros técnicos y de seguridad: eventos como superar límites de envío o cambios de rol. En nuestras tablas no guardamos direcciones IP; el proveedor de infraestructura puede registrarlas en sus propios registros técnicos durante el plazo que define su contrato.',
          'Datos de navegación, solo si los aceptas en el aviso de cookies: identificadores de cookies, páginas que visitas, cómo llegaste al sitio, tipo de dispositivo y navegador, y ubicación aproximada (país o ciudad) que se deduce de tu dirección IP. ' + (ADS ? 'Los recogen Google Analytics, para medir qué páginas se visitan, y Google AdSense, para mostrar publicidad.' : 'Los recoge Google Analytics, para medir qué páginas se visitan.') + ' Lo explicamos en la [política de cookies](/politicas/cookies).',
          'No solicitamos datos sensibles. Si un relato los incluye, el equipo de moderación puede pedir que se retiren.',
        ],
      },
      {
        heading: 'Finalidades',
        paragraphs: [
          'Gestionar tu cuenta, publicar y moderar contenido, atender reclamaciones y solicitudes, prevenir abusos y cumplir obligaciones legales.',
          'Si das tu autorización en el aviso de cookies: medir qué páginas se visitan y cómo se usa el sitio, para mejorar las guías y las herramientas (Google Analytics).',
          ...siAnuncios('Mostrar publicidad, personalizada solo si la aceptas (Google AdSense).'),
          'No vendemos datos ni los compartimos con las empresas mencionadas en las publicaciones. Los datos de tu cuenta y tus publicaciones nunca se usan para publicidad ni se envían a Google.',
        ],
      },
      {
        heading: ADS ? 'Cookies, medición y publicidad: tu autorización' : 'Cookies y medición: tu autorización',
        paragraphs: [
          (ADS ? 'Las cookies de medición (Google Analytics) y de publicidad personalizada (Google AdSense)' : 'Las cookies de medición (Google Analytics)') + ' solo se activan si las aceptas en el aviso de cookies que aparece en tu primera visita. Esa aceptación es tu autorización previa, expresa e informada para ese tratamiento. Si no aceptas, el sitio funciona igual.',
          'Puedes cambiar o retirar tu autorización cuando quieras desde «Preferencias de cookies», al pie de cada página.',
          'Antes de enviar datos de navegación, quitamos de las direcciones los parámetros y los enlaces privados de seguimiento, para que no salgan datos que puedan identificarte.',
          'Los detalles de cada cookie, para qué sirve y cuánto dura están en la [política de cookies](/politicas/cookies).',
        ],
      },
      {
        heading: 'Transferencia y transmisión de datos',
        paragraphs: [
          'Usamos proveedores de infraestructura en la nube para la base de datos, la autenticación y el alojamiento del sitio. Sus servidores pueden estar ubicados fuera de Colombia.',
          'Solo les transmitimos los datos necesarios para prestar el servicio, y los tratan por nuestra cuenta, sin usarlos para fines propios.',
          ...siCaptcha(TEXTO_CAPTCHA),
          ADS
            ? 'Si aceptas las cookies de medición o de publicidad, Google LLC y sus filiales reciben datos de navegación y pueden tratarlos en Estados Unidos y en otros países. En la medición actúan por nuestra cuenta. En la publicidad personalizada, Google y sus socios publicitarios también los usan según sus propias políticas. Puedes conocer [cómo usa Google los datos de los sitios que usan sus servicios](https://policies.google.com/technologies/partner-sites).'
            : 'Si aceptas las cookies de medición, Google LLC y sus filiales reciben datos de navegación y pueden tratarlos en Estados Unidos y en otros países. Actúan por nuestra cuenta, para darnos informes de uso del sitio. Puedes conocer [cómo usa Google los datos de los sitios que usan sus servicios](https://policies.google.com/technologies/partner-sites).',
        ],
      },
      {
        heading: 'Conservación',
        paragraphs: [
          'Cuenta: mientras esté activa. Al solicitar la eliminación hay 15 días para cancelarla; después, las publicaciones y los comentarios se desvinculan de la cuenta, se borran sus reacciones, el alias y el acceso.',
          'Nóminas guardadas en las calculadoras: mientras tengas la cuenta, o hasta que borres cada período. Se borran del todo cuando se elimina la cuenta.',
          'Comentarios eliminados por su autor: dejan de mostrarse de inmediato y se conservan ocultos para atender reclamaciones durante el plazo del historial de moderación.',
          'Registros de seguridad: 12 meses. Historial de moderación: 5 años, para atender reclamaciones y requerimientos legales.',
          'Datos de medición (Google Analytics): hasta 14 meses, tras los cuales Google los borra; solo usamos informes agregados. Cookies: la duración de cada una está en la política de cookies, y puedes borrarlas cuando quieras desde tu navegador.',
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
      {
        heading: ADS ? 'Cookies, medición y publicidad' : 'Cookies y medición',
        paragraphs: [
          (ADS ? 'Usamos Google Analytics para saber qué páginas se leen, y Google AdSense para mostrar publicidad.' : 'Usamos Google Analytics para saber qué páginas se leen.') + ' Sus cookies solo se activan si las aceptas, y puedes cambiar tu decisión en «Preferencias de cookies», al pie de cada página.',
          'Tu cuenta, tu correo y tus publicaciones nunca se envían a Google. Más detalles en la [política de cookies](/politicas/cookies).',
        ],
      },
      { heading: 'Responsable', paragraphs: [RESPONSABLE] },
    ],
  },
  {
    slug: 'cookies',
    title: 'Política de cookies',
    summary: 'Qué cookies usa el sitio, para qué sirven, cuánto duran y cómo cambiar tu decisión.',
    sections: [
      {
        heading: 'Qué son las cookies',
        paragraphs: [
          'Las cookies son pequeños archivos que un sitio guarda en tu navegador. El almacenamiento local cumple una función parecida. Algunos son necesarios para que el sitio funcione y otros sirven para medir qué páginas se visitan' + (ADS ? ' o para mostrar publicidad.' : '.'),
        ],
      },
      {
        heading: 'Necesarias (siempre activas)',
        paragraphs: [
          'Sin ellas el sitio no funciona bien, así que no requieren tu autorización. Se guardan en el almacenamiento local de tu navegador y no se comparten con terceros:',
          'Tu sesión, si inicias sesión. Tu preferencia de modo claro u oscuro. El texto de la experiencia que estás escribiendo, para que no lo pierdas. Una marca para no contar dos veces la visita a una guía el mismo día. Y tu decisión sobre las cookies, para no preguntarte en cada visita.',
          ...siCaptcha(TEXTO_CAPTCHA),
        ],
      },
      {
        heading: 'De medición: Google Analytics (opcionales)',
        paragraphs: [
          'Nos dicen qué páginas se leen, cómo llegan las visitas y desde qué tipo de dispositivo, para mejorar las guías y las herramientas. Solo vemos informes agregados, no quién eres.',
          'Las instala Google Analytics con los nombres «_ga» y «_ga_» seguido de un identificador, y duran hasta 2 años. Google conserva los datos hasta 14 meses.',
          'Puedes desactivar la medición de Google Analytics en todos los sitios con el [complemento de inhabilitación de Google Analytics](https://tools.google.com/dlpage/gaoptout).',
        ],
      },
      ...siAnuncios(
        {
        heading: 'De publicidad: Google AdSense (opcionales)',
        paragraphs: [
          'Mostramos anuncios de Google AdSense. Google y sus socios, como proveedores externos, usan cookies para mostrar anuncios según tus visitas anteriores a este y a otros sitios web.',
          'Las cookies de publicidad de Google permiten que Google y sus socios te muestren anuncios basados en tus visitas a este sitio y a otros sitios de internet. Si no las aceptas, los anuncios que veas no serán personalizados.',
          'Puedes desactivar la publicidad personalizada en la [configuración de anuncios de Google](https://adssettings.google.com) y conocer más sobre las cookies publicitarias de otros proveedores en [aboutads.info](https://www.aboutads.info).',
          'Los anuncios se marcan como «Publicidad» y no influyen en el contenido ni en la moderación. No mostramos anuncios en los perfiles de empresa, en las experiencias ni en los formularios para compartir.',
        ],
      }
      ),
      {
        heading: 'Cómo cambiar tu decisión',
        paragraphs: [
          'En tu primera visita te preguntamos si aceptas las cookies de medición' + (ADS ? ' y de publicidad' : '') + '. Puedes cambiar tu decisión cuando quieras desde «Preferencias de cookies», al pie de cada página.',
          'También puedes borrar o bloquear las cookies desde la configuración de tu navegador. Si bloqueas las necesarias, puede que algunas funciones, como iniciar sesión, dejen de funcionar.',
        ],
      },
      { heading: 'Responsable', paragraphs: [RESPONSABLE] },
    ],
  },
  {
    slug: 'terminos',
    title: 'Términos de uso',
    summary: 'Condiciones para usar el sitio: guías, experiencias y calculadoras.',
    sections: [
      {
        heading: 'Qué es y qué no es el sitio',
        paragraphs: [
          'Un sitio independiente que publica guías laborales con información general sobre derechos, deberes y cambios normativos en Colombia, reúne experiencias laborales de trabajadores, buenas y malas, y ofrece calculadoras orientativas. No es una autoridad judicial ni administrativa, y no sustituye al Ministerio del Trabajo, a los inspectores de trabajo, a los jueces ni la asesoría jurídica profesional.',
          'Las guías y las calculadoras son orientativas: cada guía indica su fuente oficial y la fecha en que se verificó, y la norma puede haber cambiado después. Antes de tomar una decisión, comprueba la fecha y la fuente, o consulta a un profesional.',
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
        paragraphs: [
          'Las empresas no pueden pagar por retirar o modificar críticas legítimas. Pueden solicitar correcciones de datos verificables y publicar respuestas identificadas como suyas.',
          ...siAnuncios('El sitio muestra publicidad de Google AdSense. Los anuncios se marcan como «Publicidad», los elige Google y no influyen en el contenido de las guías, en la moderación ni en las experiencias publicadas. No mostramos anuncios en los perfiles de empresa, en las experiencias ni en los formularios para compartir.'),
        ],
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
