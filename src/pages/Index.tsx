import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip } from "@/components/home/StatsStrip";
import { FeaturedWorks } from "@/components/home/FeaturedWorks";

const Index = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteHeader />
    <main className="flex-1">
      <HeroSection />
      <StatsStrip />
      <FeaturedWorks />
    </main>
    <SiteFooter />
  </div>
);

export default Index;
