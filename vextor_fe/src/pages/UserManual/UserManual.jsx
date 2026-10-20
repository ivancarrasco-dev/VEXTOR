import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const MANUAL_URL = 'https://raw.githubusercontent.com/ivancarrasco-dev/VEXTOR/main/docs/VEXTOR%20Manual%20de%20usuario.pdf';

const UserManual = () => {
  return (
    <main className="min-h-screen bg-v-dark-soft text-v-white transition-colors duration-300">
      <header className="border-b border-v-dark-border">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-v-gray hover:text-v-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <a href={MANUAL_URL} download="VEXTOR-Manual-de-usuario.pdf" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A6C98F] px-4 py-2.5 text-sm font-semibold text-[#102016] hover:bg-[#b8d6a5] transition-colors">
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
        </div>
      </header>
      <section className="container mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#A6C98F]">Centro de ayuda</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manual de usuario</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-v-gray sm:text-base">
                Consulta la guía de VEXTOR para conocer cómo utilizar las funciones de la plataforma.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-v-dark-border bg-v-dark/40 px-4 py-3">
              <FileText className="h-8 w-8 shrink-0 text-[#A6C98F]" />
              <div>
                <p className="text-sm font-semibold">VEXTOR Manual de usuario.pdf</p>
                <p className="text-xs text-v-gray">Documento PDF</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-v-dark-border bg-white shadow-xl">
            <iframe title="Vista previa del Manual de usuario de VEXTOR"
              src={MANUAL_URL + '#toolbar=1&navpanes=0&view=FitH'}
              className="h-[65vh] min-h-[480px] w-full sm:h-[78vh]" />
          </div>
          <p className="mt-4 text-center text-xs text-v-gray">
            Si la vista previa no se muestra en tu navegador, usa el botón “Descargar PDF”.
          </p>
        </div>
      </section>
    </main>
  );
};

export default UserManual;
