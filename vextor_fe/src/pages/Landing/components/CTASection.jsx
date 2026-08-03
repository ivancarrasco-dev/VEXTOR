import { motion } from 'framer-motion';
import { Rocket, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * CTASection Component
 *
 * Responsabilidad:
 * Sección final de llamada a la acción (Call to Action) de la Landing Page.
 *
 * Funcionalidades:
 * * Recordatorio final de la propuesta de valor.
 * * Botones de conversión (Registro / Demo).
 * * Eliminación de fricción (Mención de "Sin tarjeta de crédito", "Configuración rápida").
 * * Diseño envolvente con orbes de luz y texturas sutiles.
 */
const CTASection = () => {
  return (
    <section className="py-24 bg-v-dark relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />

      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-v-dark-soft border border-v-white/10 rounded-[48px] p-12 md:p-20 overflow-hidden text-center">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-12">
                <Rocket className="text-v-dark-constant w-10 h-10" />
              </div>

              <h2 className="text-4xl md:text-6xl font-bold text-v-white mb-8 tracking-tight">
                Transforme la gestión de su <span className="text-primary">flota hoy mismo.</span>
              </h2>

              <p className="text-xl text-v-gray mb-12 max-w-2xl mx-auto leading-relaxed">
                Únase a cientos de empresas que ya han digitalizado su operación con Vextor. Comience su prueba gratuita ahora.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg rounded-2xl group">
                  Crear mi cuenta gratis
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="ghost" size="lg" className="w-full sm:w-auto h-16 text-v-white hover:bg-v-white/5 rounded-2xl border border-v-white/10">
                  Agendar una demo
                </Button>
              </div>

              <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
                <div className="flex items-center gap-2 text-v-white text-sm font-medium">
                  <ShieldCheck className="text-primary w-5 h-5" />
                  Sin tarjeta de crédito
                </div>
                <div className="flex items-center gap-2 text-v-white text-sm font-medium">
                  <Zap className="text-primary w-5 h-5" />
                  Configuración en 5 minutos
                </div>
                <div className="flex items-center gap-2 text-v-white text-sm font-medium">
                  <ShieldCheck className="text-primary w-5 h-5" />
                  Soporte 24/7 en español
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
