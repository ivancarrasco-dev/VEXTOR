const Vehicles = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-v-dark-soft rounded-3xl border border-v-dark-border p-12 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
      </div>
      <h2 className="text-3xl font-bold text-v-white mb-4">Gestión de Vehículos</h2>
      <p className="text-v-gray max-w-md">Esta sección está actualmente en desarrollo. Pronto podrá gestionar toda su flota desde aquí.</p>
    </div>
  );
};

export default Vehicles;
