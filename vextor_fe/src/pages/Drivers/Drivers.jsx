const Drivers = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-v-dark-soft rounded-3xl border border-v-dark-border p-12 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <h2 className="text-3xl font-bold text-v-white mb-4">Gestión de Conductores</h2>
      <p className="text-v-gray max-w-md">Sección de administración de conductores en desarrollo. Pronto podrá asignar y monitorear a su personal.</p>
    </div>
  );
};

export default Drivers;
