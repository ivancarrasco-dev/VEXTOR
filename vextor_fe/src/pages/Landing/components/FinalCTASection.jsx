import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * FinalCTASection Component
 *
 * Responsabilidad:
 * Sección final de llamada a la acción compacta y comercialmente directa.
 *
 * Mensaje principal: "Lleva la gestión de tu operación al siguiente nivel."
 * Botón principal: "Comenzar gratis" -> /register
 * Botón secundario: "Solicitar información" -> /contacto
 */
const FinalCTASection = () => {
  return (
    <section className="py-16 sm:py-20 bg-v-dark border-t border-v-dark-border transition-colors duration-300 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-v-dark-soft border border-v-dark-border rounded-2xl p-8 sm:p-12 text-center shadow-md overflow-hidden"
          >
            {/* Subtle brand background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 blur-3xl rounded-full pointer-events-none -z-0" />

            <div className="relative z-10 max-w-2xl mx-auto">

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 border border-[#124A2F]/20 dark:border-[#A6C98F]/20 text-[#124A2F] dark:text-[#A6C98F] text-xs font-bold tracking-wider uppercase mb-5">
                <ShieldCheck size={16} />
                Control Operativo Total
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-v-white mb-4 tracking-tight leading-[1.18]">
                Lleva la gestión de tu operación <br className="hidden sm:inline" />
                al <span className="text-[#124A2F] dark:text-[#A6C98F]">siguiente nivel.</span>
              </h2>

              <p className="text-xs sm:text-sm text-v-gray mb-8 leading-relaxed font-normal max-w-lg mx-auto">
                Empiece a administrar vehículos, conductores y rutas de forma organizada, segura y 100% digital.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="primary" className="w-full sm:w-auto text-sm sm:text-base font-semibold h-12 px-7 rounded-lg group shadow-sm hover:shadow-md">
                    Comenzar gratis
                    <ChevronRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <Link to="/contacto" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-sm sm:text-base font-semibold h-12 px-6 rounded-lg">
                    Solicitar información
                  </Button>
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-v-dark-border flex flex-wrap items-center justify-center gap-6 text-xs text-v-gray font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-[#124A2F] dark:text-[#A6C98F] w-4 h-4 shrink-0" />
                  <span>Plataforma SaaS segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="text-[#124A2F] dark:text-[#A6C98F] w-4 h-4 shrink-0" />
                  <span>Configuración en minutos</span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
