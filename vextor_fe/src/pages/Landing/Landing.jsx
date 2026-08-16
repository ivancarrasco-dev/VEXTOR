import LandingNavbar from './components/LandingNavbar';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import FeaturesSection from './components/FeaturesSection';
import CTASection from './components/CTASection';
import LandingFooter from './components/LandingFooter';

/**
 * Landing Page
 *
 * Responsabilidad:
 * Página web de marketing (pública) para la conversión de empresas de transporte.
 *
 * Estructura:
 * * LandingNavbar: Navegación global.
 * * HeroSection: Propuesta de valor principal.
 * * ProblemSection: Agitación de puntos de dolor.
 * * FeaturesSection: Características y previsualización de UI.
 * * CTASection: Llamada a la acción final.
 * * LandingFooter: Información legal y enlaces adicionales.
 */
const Landing = () => {
  return (
    <div className="min-h-screen bg-v-dark font-sans selection:bg-primary selection:text-v-dark">
      <LandingNavbar />

      <main>
        <HeroSection />

        {/* Subtle separator */}
        <div className="container mx-auto px-6">
          <div className="h-px bg-linear-to-r from-transparent via-v-dark-border to-transparent" />
        </div>

        <ProblemSection />

        <FeaturesSection />

        <div id="beneficios">
          {/* Detailed Benefits section integrated within Features/Problem logic,
              but could be expanded here if needed. */}
        </div>

        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default Landing;
