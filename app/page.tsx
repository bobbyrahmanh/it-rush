import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PrivacySection from "@/components/landing/PrivacySection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <PrivacySection />
    </main>
  );
}