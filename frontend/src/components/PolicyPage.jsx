import React, { useEffect } from 'react';

export default function PolicyPage() {
  useEffect(() => {
    document.title = 'Política de Tratamiento de Datos | Caturro Café';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-gray-200">
      <header className="bg-black/60 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo Caturro Café" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">CATURRO CAFÉ</h1>
              <p className="text-sm text-gray-400">Política de Tratamiento de Datos Personales</p>
            </div>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Responsable del tratamiento</h2>
          <p>
            Caturro Café Underground, identificado como establecimiento de comercio en la ciudad de Bogotá, es el responsable
            del tratamiento de los datos personales suministrados por sus clientes, usuarios y aliados comerciales.
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Correo de contacto: <a className="text-blue-400 hover:text-blue-300 underline" href="mailto:contacto@caturrocafe.com">contacto@caturrocafe.com</a></li>
            <li>Dirección: Cl. 3 #13-07, Armenia, Quindío, Colombia</li>
            <li>Teléfono: +57 323 8360423</li>
            <li>Horario de atención: Lunes a sábado, 9:00 a.m. - 6:00 p.m.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Datos personales que tratamos</h2>
          <p>
            En el marco de los programas de fidelización, experiencia del cliente y gestión de promociones tratamos las
            siguientes categorías de datos:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Datos de identificación: nombres, apellidos y número de cédula.</li>
            <li>Datos de contacto: correo electrónico y número telefónico (cuando el usuario decide suministrarlos).</li>
            <li>Datos asociados a consumo: historial de compras, redenciones y movimientos de puntos.</li>
            <li>Datos técnicos: fecha y hora de los registros, dispositivo utilizado para el ingreso a la plataforma.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Finalidades del tratamiento</h2>
          <p>Los datos se recolectan y utilizan para las finalidades que se describen a continuación:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Gestionar el programa de fidelización y permitir el uso de la ruleta de promociones.</li>
            <li>Verificar la identidad de los clientes en el proceso de registro y autenticación.</li>
            <li>Notificar beneficios, premios, vencimientos y comunicaciones asociadas al programa.</li>
            <li>Realizar análisis estadísticos para mejorar la experiencia y ajustar el inventario disponible.</li>
            <li>Cumplir obligaciones legales y responder requerimientos de autoridades competentes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Derechos de los titulares</h2>
          <p>De acuerdo con la Ley 1581 de 2012 y sus decretos reglamentarios, los titulares de los datos pueden:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Acceder, conocer, actualizar y rectificar sus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada para el tratamiento.</li>
            <li>Ser informados sobre el uso que se ha dado a sus datos.</li>
            <li>Presentar quejas ante la SIC cuando exista una infracción a la normativa.</li>
            <li>Revocar la autorización y/o solicitar la supresión de los datos cuando no exista un deber legal o contractual que lo impida.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Procedimiento para ejercer derechos</h2>
          <p>
            Las consultas, reclamos o solicitudes relacionadas con el tratamiento de datos personales pueden radicarse a
            través del correo <a className="text-blue-400 hover:text-blue-300 underline" href="mailto:protecciondatos@caturrocafe.com">protecciondatos@caturrocafe.com</a>.
            Las consultas se atenderán dentro de los 10 días hábiles siguientes y los reclamos dentro de los 15 días hábiles,
            conforme lo establece la normativa colombiana vigente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Medidas de seguridad</h2>
          <p>
            Implementamos medidas administrativas, técnicas y físicas razonables para proteger la confidencialidad, integridad
            y disponibilidad de la información, incluyendo controles de acceso, cifrado de credenciales y monitoreo rutinario
            de la infraestructura tecnológica.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Transferencias y transmisiones</h2>
          <p>
            No compartimos datos personales con terceros sin autorización previa, salvo cuando resulte necesario para cumplir
            obligaciones contractuales o legales. En caso de realizar transmisiones o transferencias internacionales, se
            garantizará que los receptores brinden estándares equivalentes de protección y se suscribirán los acuerdos
            correspondientes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Vigencia y actualizaciones</h2>
          <p>
            Esta política entra en vigencia a partir del 1 de febrero de 2025 y podrá actualizarse en cualquier momento para
            reflejar cambios regulatorios o internos. La versión vigente siempre estará publicada en{' '}
            <a className="text-blue-400 hover:text-blue-300 underline" href="https://caturrocafe.com/politica-datos">
              https://caturrocafe.com/politica-datos
            </a>.
          </p>
        </section>
      </main>

      <footer className="bg-black/60 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-6 text-sm text-gray-400 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <span>© {new Date().getFullYear()} Caturro Café Underground. Todos los derechos reservados.</span>
          <a className="text-blue-400 hover:text-blue-300 underline" href="mailto:protecciondatos@caturrocafe.com">
            Contacto Protección de Datos
          </a>
        </div>
      </footer>
    </div>
  );
}
