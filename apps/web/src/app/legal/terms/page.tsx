import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio | CampusMind',
  description: 'Términos y condiciones de uso de CampusMind',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Términos de Servicio
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Aceptación de los Términos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Al acceder y utilizar CampusMind, aceptas estar legalmente vinculado por estos Términos de Servicio.
              Si no estás de acuerdo con alguno de estos términos, no debes utilizar nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Descripción del Servicio
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              CampusMind es una plataforma educativa que proporciona herramientas para el estudio efectivo, incluyendo:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Sistema de flashcards con repetición espaciada (SM-2)</li>
              <li>Quizzes y evaluaciones</li>
              <li>Notas y recursos de estudio</li>
              <li>Grupos de estudio colaborativos</li>
              <li>Seguimiento de progreso y gamificación</li>
              <li>Búsqueda de recursos académicos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Registro y Cuenta
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Para acceder a ciertas funcionalidades, debes crear una cuenta. Te comprometes a:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Proporcionar información precisa y completa durante el registro</li>
              <li>Mantener la seguridad de tu contraseña y credenciales</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de tu cuenta</li>
              <li>Ser responsable de todas las actividades que ocurran bajo tu cuenta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Uso Aceptable
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Al utilizar CampusMind, aceptas no:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Violar cualquier ley o regulación aplicable</li>
              <li>Publicar contenido ilegal, ofensivo o inapropiado</li>
              <li>Interferir con el funcionamiento normal de la plataforma</li>
              <li>Intentar acceder a cuentas o datos de otros usuarios</li>
              <li>Utilizar la plataforma para distribuir spam o malware</li>
              <li>Copiar, modificar o distribuir nuestro contenido sin autorización</li>
              <li>Utilizar bots o scripts automatizados sin permiso</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Contenido del Usuario
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Eres responsable del contenido que publicas en CampusMind. Al publicar contenido:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Conservas la propiedad de tu contenido original</li>
              <li>Nos otorgas una licencia para mostrar y distribuir tu contenido dentro de la plataforma</li>
              <li>Garantizas que tienes los derechos necesarios para compartir dicho contenido</li>
              <li>Aceptas que podemos eliminar contenido que viole estos términos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Propiedad Intelectual
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              CampusMind y su contenido original, características y funcionalidad son propiedad de
              CampusMind y están protegidos por leyes de propiedad intelectual. Nuestra marca,
              logotipos y otros elementos distintivos no pueden ser utilizados sin autorización previa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Planes y Pagos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Ofrecemos diferentes planes de suscripción:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Plan Gratuito:</strong> Acceso básico con funcionalidades limitadas</li>
              <li><strong>Plan Pro:</strong> Funcionalidades avanzadas mediante suscripción mensual o anual</li>
              <li><strong>Plan Institucional:</strong> Para instituciones educativas con términos personalizados</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Los pagos se procesan de forma segura a través de proveedores de pago autorizados.
              Las suscripciones se renuevan automáticamente hasta que se cancelen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Cancelación y Reembolsos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta.
              Al cancelar:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Mantendrás acceso hasta el final del período de facturación actual</li>
              <li>No se realizarán cargos adicionales</li>
              <li>Tu cuenta se convertirá al plan gratuito</li>
              <li>Los reembolsos se consideran caso por caso dentro de los primeros 14 días</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Limitación de Responsabilidad
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              CampusMind se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;. No garantizamos que:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>El servicio estará disponible de forma ininterrumpida</li>
              <li>Los resultados obtenidos serán precisos o confiables</li>
              <li>La plataforma estará libre de errores o defectos</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              En ningún caso seremos responsables por daños indirectos, incidentales o consecuentes
              derivados del uso de nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Terminación
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Nos reservamos el derecho de suspender o terminar tu acceso a CampusMind en cualquier momento,
              sin previo aviso, si:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Violas estos Términos de Servicio</li>
              <li>Tu conducta perjudica a otros usuarios o a la plataforma</li>
              <li>Se detecta actividad fraudulenta en tu cuenta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Modificaciones
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Podemos modificar estos Términos de Servicio en cualquier momento. Los cambios
              significativos se notificarán a través de la plataforma o por correo electrónico.
              El uso continuado después de los cambios constituye la aceptación de los nuevos términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. Ley Aplicable
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Estos términos se regirán e interpretarán de acuerdo con las leyes aplicables,
              sin tener en cuenta sus disposiciones sobre conflictos de leyes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              13. Contacto
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos en:
            </p>
            <ul className="list-none text-gray-600 dark:text-gray-300 space-y-1">
              <li><strong>Email:</strong> legal@campusmind.com</li>
              <li><strong>Sitio web:</strong> www.campusmind.com/contact</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/legal/privacy" className="text-primary-500 hover:text-primary-600">
              Política de Privacidad
            </a>
            <a href="/legal/cookies" className="text-primary-500 hover:text-primary-600">
              Política de Cookies
            </a>
            <a href="/" className="text-primary-500 hover:text-primary-600">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
