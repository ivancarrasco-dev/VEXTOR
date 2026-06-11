import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * HeroSection Component
 *
 * Responsabilidad:
 * Sección principal de impacto visual (Hero) para la Landing Page.
 *
 * Funcionalidades:
 * * Titular principal con propuesta de valor.
 * * Llamadas a la acción (CTA) primarias y secundarias.
 * * Mockup visual de la plataforma con elementos flotantes animados.
 * * Prueba social (social proof) mediante avatares de usuarios.
 * * Animaciones de entrada coordinadas con Framer Motion.
 */
const HeroSection = () => {
  return (
    <section id="inicio" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Nueva Era en Gestión de Flotas
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-v-white leading-[1.1] mb-6">
              Gestione toda su flota desde una <span className="text-primary">sola plataforma.</span>
            </h1>

            <p className="text-xl text-v-gray mb-10 max-w-lg leading-relaxed">
              Controle vehículos, conductores, rutas y mantenimientos con una solución moderna diseñada para empresas de transporte especial.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 h-14">
                Comenzar Gratis
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-v-white gap-2 h-14">
                <div className="bg-v-white/10 p-2 rounded-full">
                  <Play className="fill-v-white w-3 h-3" />
                </div>
                Ver Demo
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-6 text-v-gray/60 text-sm">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-v-dark bg-v-dark-soft flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p>Confianza de +500 empresas de transporte</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glass Card Mockup */}
            <div className="relative z-10 bg-v-dark-soft/50 border border-v-white/10 rounded-2xl p-4 backdrop-blur-sm shadow-2xl">
              <div className="bg-v-dark rounded-xl overflow-hidden border border-v-dark-border aspect-video shadow-inner">
                {/* Simplified UI Mockup */}
                <div className="p-4 border-b border-v-dark-border flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="h-4 w-32 bg-v-dark-border rounded-full" />
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-4">
                    <div className="h-32 bg-v-dark-soft rounded-xl border border-v-dark-border" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-v-dark-soft rounded-xl border border-v-dark-border" />
                      <div className="h-24 bg-v-dark-soft rounded-xl border border-v-dark-border" />
                    </div>
                  </div>
                  <div className="h-full bg-v-dark-soft rounded-xl border border-v-dark-border" />
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 z-20 bg-primary/90 text-v-dark p-4 rounded-2xl font-bold shadow-xl flex items-center gap-3"
            >
              <div className="bg-v-dark/20 p-2 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-70">Operación Hoy</p>
                <p className="text-lg">98% Eficiencia</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 z-20 bg-v-dark-soft border border-v-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <ChevronRight className="rotate-[-90deg]" />
              </div>
              <div>
                <p className="text-v-white font-bold">Ahorro Costos</p>
                <div className="h-1.5 w-24 bg-v-dark-border rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary w-3/4" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
