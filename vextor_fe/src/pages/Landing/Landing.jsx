import LandingNavbar from './components/LandingNavbar';
import HeroSection from './components/HeroSection';
import BenefitsSection from './components/BenefitsSection';
import FeaturesSection from './components/FeaturesSection';
import ProductPreviewSection from './components/ProductPreviewSection';
import ProblemSection from './components/ProblemSection';
import WhyVextorSection from './components/WhyVextorSection';
import IntermediateCTA from './components/IntermediateCTA';
import LandingFooter from './components/LandingFooter';

/**
 * Landing Page
 *
 * Responsabilidad:
 * Página comercial (pública) B2B para la conversión de empresas de transporte de flotas.
 *
 * Jerarquía visual oficial VEXTOR:
 * 1. Navbar (LandingNavbar)
 * 2. Hero (HeroSection)
 * 3. Beneficios (BenefitsSection)
 * 4. Funciones (FeaturesSection)
 * 5. Información/demo de plataforma (ProductPreviewSection)
 * 6. Por qué VEXTOR / Desafíos (WhyVextorSection & ProblemSection)
 * 7. CTA final (IntermediateCTA)
 * 8. Footer (LandingFooter)
 */
const Landing = () => {
  return (
    <div className="min-h-screen bg-v-dark font-sans selection:bg-[#124A2F] selection:text-white">
      <LandingNavbar />

      <main>
        <HeroSection />
        <BenefitsSection />
        <FeaturesSection />
        <ProductPreviewSection />
        <ProblemSection />
        <WhyVextorSection />
        <IntermediateCTA />
      </main>

      <LandingFooter />
    </div>
  );
};

export default Landing;
