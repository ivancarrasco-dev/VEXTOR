const Maintenance = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-v-dark-soft rounded-3xl border border-v-dark-border p-12 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <h2 className="text-3xl font-bold text-v-white mb-4">Mantenimientos</h2>
      <p className="text-v-gray max-w-md">Programación de servicios técnicos en desarrollo. Mantenga su flota en óptimas condiciones.</p>
    </div>
  );
};

export default Maintenance;
