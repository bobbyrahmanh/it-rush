import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PrivacySection from "@/components/landing/PrivacySection";
import FooterSection from "@/components/Footer";
import EnvironmentalSection from "@/components/landing/EnvironmentalSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <EnvironmentalSection />
      <PrivacySection />
      <FooterSection />
    </main>
  );
}