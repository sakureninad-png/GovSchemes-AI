import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import HowItWorks from '@/components/landing/HowItWorks';
import TrustSection from '@/components/landing/TrustSection';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <TrustSection />
      <Footer />
    </>
  );
}
