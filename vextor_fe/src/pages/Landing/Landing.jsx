import LandingNavbar from './components/LandingNavbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import SolutionsSection from './components/SolutionsSection';
import ProductPreviewSection from './components/ProductPreviewSection';
import HowItWorksSection from './components/HowItWorksSection';
import FinalCTASection from './components/FinalCTASection';
import LandingFooter from './components/LandingFooter';

/**
 * Landing Page
 *
 * Responsabilidad:
 * Página comercial (pública) B2B compacta, clara e intuitiva para la conversión de empresas de transporte.
 *
 * Estructura optimizada VEXTOR:
 * 1. Navbar (LandingNavbar)
 * 2. Hero (HeroSection)
 * 3. ¿Qué es VEXTOR? (AboutSection)
 * 4. Soluciones / Funcionalidades en 4 cards (SolutionsSection)
 * 5. Demostración de Plataforma (#demo) (ProductPreviewSection)
 * 6. ¿Cómo funciona? (HowItWorksSection)
 * 7. CTA final (FinalCTASection)
 * 8. Footer (LandingFooter)
 */
const Landing = () => {
  return (
    <div className="min-h-screen bg-v-dark font-sans selection:bg-[#124A2F] selection:text-white">
      <LandingNavbar />

      <main>
        <HeroSection />
        <AboutSection />
        <SolutionsSection />
        <ProductPreviewSection />
        <HowItWorksSection />
        <FinalCTASection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default Landing;
