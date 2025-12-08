import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | CampusMind',
  description: 'Política de privacidad y protección de datos de CampusMind',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Política de Privacidad
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introducción
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              En CampusMind, nos comprometemos a proteger tu privacidad y tus datos personales.
              Esta política describe cómo recopilamos, usamos, almacenamos y protegemos tu información
              cuando utilizas nuestra plataforma educativa.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Al utilizar CampusMind, aceptas las prácticas descritas en esta política de privacidad.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Información que Recopilamos
            </h2>

            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              2.1 Información que nos proporcionas
            </h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Datos de registro:</strong> nombre, correo electrónico, contraseña</li>
              <li><strong>Perfil:</strong> foto de perfil, información académica, carrera</li>
              <li><strong>Contenido:</strong> flashcards, notas, quizzes y recursos que creas</li>
              <li><strong>Comunicaciones:</strong> mensajes en grupos de estudio</li>
              <li><strong>Información de pago:</strong> datos de facturación (procesados por terceros seguros)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              2.2 Información recopilada automáticamente
            </h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Datos de uso:</strong> páginas visitadas, funciones utilizadas, tiempo de estudio</li>
              <li><strong>Datos del dispositivo:</strong> tipo de dispositivo, sistema operativo, navegador</li>
              <li><strong>Datos de rendimiento:</strong> progreso de aprendizaje, resultados de quizzes</li>
              <li><strong>Cookies y tecnologías similares:</strong> ver nuestra Política de Cookies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Cómo Utilizamos tu Información
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Utilizamos tu información para:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Proporcionar, mantener y mejorar nuestros servicios</li>
              <li>Personalizar tu experiencia de aprendizaje</li>
              <li>Calcular algoritmos de repetición espaciada (SM-2)</li>
              <li>Generar estadísticas y análisis de progreso</li>
              <li>Enviarte notificaciones y recordatorios de estudio</li>
              <li>Comunicarnos contigo sobre actualizaciones y soporte</li>
              <li>Procesar pagos y gestionar suscripciones</li>
              <li>Detectar y prevenir fraudes o abusos</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Compartición de Información
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              No vendemos tu información personal. Podemos compartir información con:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Proveedores de servicios:</strong> empresas que nos ayudan a operar la plataforma
                (hosting, procesamiento de pagos, análisis)</li>
              <li><strong>Otros usuarios:</strong> cuando compartes recursos públicamente o participas en grupos</li>
              <li><strong>Cumplimiento legal:</strong> cuando sea requerido por ley o para proteger derechos</li>
              <li><strong>Transferencia empresarial:</strong> en caso de fusión, adquisición o venta de activos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Seguridad de los Datos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Implementamos medidas de seguridad para proteger tu información:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Cifrado de datos en tránsito (HTTPS/TLS)</li>
              <li>Cifrado de datos sensibles en reposo</li>
              <li>Contraseñas hasheadas con algoritmos seguros</li>
              <li>Controles de acceso y autenticación robustos</li>
              <li>Monitoreo y detección de intrusiones</li>
              <li>Copias de seguridad regulares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Retención de Datos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Conservamos tu información mientras tu cuenta esté activa o sea necesario para:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Proporcionar servicios</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Resolver disputas</li>
              <li>Hacer cumplir acuerdos</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Al eliminar tu cuenta, eliminaremos o anonimizaremos tus datos personales,
              excepto donde la ley requiera retención.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Tus Derechos (GDPR/RGPD)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Dependiendo de tu ubicación, puedes tener derecho a:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Acceso:</strong> solicitar una copia de tus datos personales</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
              <li><strong>Eliminación:</strong> solicitar la eliminación de tus datos</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> oponerte al procesamiento de tus datos</li>
              <li><strong>Restricción:</strong> limitar cómo procesamos tus datos</li>
              <li><strong>Retiro de consentimiento:</strong> retirar el consentimiento en cualquier momento</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Para ejercer estos derechos, contacta con nosotros en privacy@campusmind.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Transferencias Internacionales
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tus datos pueden ser transferidos y procesados en países fuera de tu residencia.
              Cuando esto ocurre, implementamos salvaguardas apropiadas como:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Cláusulas contractuales estándar aprobadas</li>
              <li>Certificaciones y marcos de transferencia reconocidos</li>
              <li>Medidas técnicas y organizativas adicionales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Menores de Edad
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              CampusMind no está dirigido a menores de 13 años. No recopilamos intencionalmente
              información de niños menores de esta edad. Si eres padre o tutor y crees que tu hijo
              nos ha proporcionado información personal, contacta con nosotros para eliminarla.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Cambios en esta Política
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Podemos actualizar esta política ocasionalmente. Los cambios significativos se
              notificarán a través de la plataforma o por correo electrónico. Te recomendamos
              revisar esta política periódicamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Contacto
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Para preguntas sobre esta política de privacidad o tus datos personales:
            </p>
            <ul className="list-none text-gray-600 dark:text-gray-300 space-y-1">
              <li><strong>Email:</strong> privacy@campusmind.com</li>
              <li><strong>Delegado de Protección de Datos:</strong> dpo@campusmind.com</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/legal/terms" className="text-primary-500 hover:text-primary-600">
              Términos de Servicio
            </a>
            <a href="/legal/cookies" className="text-primary-500 hover:text-primary-600">
              Política de Cookies
            </a>
            <a href="/app/settings#privacy" className="text-primary-500 hover:text-primary-600">
              Configurar privacidad
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
