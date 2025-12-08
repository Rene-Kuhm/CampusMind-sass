import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies | CampusMind',
  description: 'Información sobre el uso de cookies en CampusMind',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Política de Cookies
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. ¿Qué son las Cookies?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando
              visitas un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen
              de manera más eficiente y proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Tipos de Cookies que Utilizamos
            </h2>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="text-left p-4 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                      Tipo
                    </th>
                    <th className="text-left p-4 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                      Propósito
                    </th>
                    <th className="text-left p-4 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr>
                    <td className="p-4 border border-gray-200 dark:border-gray-700 font-medium">
                      Necesarias
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      Esenciales para el funcionamiento del sitio web. Incluyen cookies de sesión
                      y autenticación.
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      Sesión / 30 días
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td className="p-4 border border-gray-200 dark:border-gray-700 font-medium">
                      Funcionales
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      Permiten recordar tus preferencias como idioma, modo oscuro y configuraciones personalizadas.
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      1 año
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-gray-200 dark:border-gray-700 font-medium">
                      Analíticas
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      Nos ayudan a entender cómo los visitantes interactúan con el sitio web.
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      2 años
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td className="p-4 border border-gray-200 dark:border-gray-700 font-medium">
                      Marketing
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      Se utilizan para mostrar contenido relevante basado en tus intereses.
                    </td>
                    <td className="p-4 border border-gray-200 dark:border-gray-700">
                      1 año
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Cookies Específicas que Utilizamos
            </h2>

            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              3.1 Cookies Necesarias
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Nombre</th>
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Propósito</th>
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Duración</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr>
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">campusmind_session</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Gestión de sesión de usuario</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Sesión</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">csrf_token</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Protección contra ataques CSRF</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Sesión</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">auth_token</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Autenticación de usuario</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">30 días</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              3.2 Cookies Funcionales
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Nombre</th>
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Propósito</th>
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Duración</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr>
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">theme</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Preferencia de tema (claro/oscuro)</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">1 año</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">locale</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Preferencia de idioma</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">1 año</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">sidebar_collapsed</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Estado del menú lateral</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              3.3 Cookies Analíticas
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Nombre</th>
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Proveedor</th>
                    <th className="text-left p-3 border border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">Propósito</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr>
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">_ga, _gid</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Google Analytics</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Análisis de tráfico y comportamiento</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td className="p-3 border border-gray-200 dark:border-gray-700 font-mono">_campusmind_analytics</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">CampusMind</td>
                    <td className="p-3 border border-gray-200 dark:border-gray-700">Métricas de uso de funciones</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Tecnologías Similares
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Además de las cookies, utilizamos otras tecnologías de almacenamiento:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>LocalStorage:</strong> Para almacenar datos de la aplicación como flashcards,
                progreso de estudio y configuraciones offline</li>
              <li><strong>SessionStorage:</strong> Para datos temporales durante tu sesión de navegación</li>
              <li><strong>IndexedDB:</strong> Para almacenar grandes cantidades de datos para funcionalidad offline</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Gestión de Cookies
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Puedes gestionar tus preferencias de cookies de varias maneras:
            </p>

            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              5.1 A través de CampusMind
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Puedes cambiar tus preferencias en cualquier momento desde el banner de cookies
              o desde la configuración de tu cuenta.
            </p>

            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              5.2 A través de tu Navegador
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              La mayoría de navegadores permiten controlar las cookies a través de sus ajustes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
              <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Cookies de Terceros
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Algunos servicios de terceros pueden establecer sus propias cookies cuando utilizas CampusMind:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Google Analytics:</strong> Para análisis de tráfico web</li>
              <li><strong>Stripe:</strong> Para procesamiento seguro de pagos</li>
              <li><strong>Cloudflare:</strong> Para seguridad y rendimiento del sitio</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Estos servicios tienen sus propias políticas de privacidad y cookies que te recomendamos revisar.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Actualizaciones de esta Política
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Podemos actualizar esta política de cookies ocasionalmente para reflejar cambios en
              nuestras prácticas o por otras razones operativas, legales o reglamentarias.
              Te recomendamos revisar esta página periódicamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Contacto
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Si tienes preguntas sobre nuestra política de cookies:
            </p>
            <ul className="list-none text-gray-600 dark:text-gray-300 space-y-1">
              <li><strong>Email:</strong> privacy@campusmind.com</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/legal/terms" className="text-primary-500 hover:text-primary-600">
              Términos de Servicio
            </a>
            <a href="/legal/privacy" className="text-primary-500 hover:text-primary-600">
              Política de Privacidad
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
