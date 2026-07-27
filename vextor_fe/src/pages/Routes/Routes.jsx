const Routes = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-v-dark-soft rounded-3xl border border-v-dark-border p-12 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <h2 className="text-3xl font-bold text-v-white mb-4">Control de Rutas</h2>
      <p className="text-v-gray max-w-md">Planificación y seguimiento de rutas en desarrollo. Utilice el dashboard para ver el estado actual.</p>
    </div>
  );
};

export default Routes;
