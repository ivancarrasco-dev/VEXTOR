import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * IntermediateCTA Component
 *
 * Responsabilidad:
 * Llamado a la acción estratégico posicionado tras las secciones comerciales,
 * impulsando al usuario hacia el formulario de contacto o registro.
 */
const IntermediateCTA = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-v-dark-soft/40 border-t border-v-dark-border/70 transition-colors duration-300 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-v-dark border border-v-dark-border rounded-2xl p-8 sm:p-12 text-center shadow-md overflow-hidden"
          >
            {/* Subtle brand background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 blur-3xl rounded-full pointer-events-none -z-0" />

            <div className="relative z-10 max-w-2xl mx-auto">

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 border border-[#124A2F]/20 dark:border-[#A6C98F]/20 text-[#124A2F] dark:text-[#A6C98F] text-xs font-bold tracking-wider uppercase mb-5">
                <CheckCircle2 size={16} />
                Lleve su flota al siguiente nivel
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-v-white mb-4 tracking-tight leading-[1.18]">
                ¿Listo para tener mayor <span className="text-[#124A2F] dark:text-[#A6C98F]">control de su operación?</span>
              </h2>

              <p className="text-sm sm:text-base text-v-gray mb-8 leading-relaxed font-normal max-w-lg mx-auto">
                Solicite una demostración personalizada sin compromiso. Nuestro equipo configurará una presentación adaptada a su tamaño de flota.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link to="/contacto" className="w-full sm:w-auto">
                  <Button size="lg" variant="primary" className="w-full sm:w-auto text-sm sm:text-base font-semibold h-12 px-7 rounded-lg group shadow-sm hover:shadow-md">
                    Solicitar demostración
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-sm sm:text-base font-semibold h-12 px-6 rounded-lg">
                    Comenzar Gratis
                  </Button>
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-v-dark-border flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-v-gray font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-[#124A2F] dark:text-[#A6C98F] w-4 h-4 shrink-0" />
                  <span>Asesoría técnica sin costo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="text-[#124A2F] dark:text-[#A6C98F] w-4 h-4 shrink-0" />
                  <span>Respuesta en menos de 24 horas</span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default IntermediateCTA;
