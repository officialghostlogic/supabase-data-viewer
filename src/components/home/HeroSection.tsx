import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTableCount } from "@/hooks/useCollectionCounts";

export const HeroSection = () => {
  const { data: worksCount } = useTableCount("works");

  return (
    <section className="relative hero-bg overflow-hidden">
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold" />

      <div className="container relative py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl space-y-6 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground leading-[1.1]">
            Explore the ISU Permanent{" "}
            <span className="text-gold">Art Collection</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/75 max-w-2xl leading-relaxed font-body">
            Discover{" "}
            <span className="font-semibold text-primary-foreground">
              {worksCount ?? "—"}
            </span>{" "}
            works spanning painting, sculpture, photography, and more from
            Indiana State University's growing collection.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button variant="hero" size="lg" asChild>
              <Link to="/collection">
                Browse Collection <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/artists">View Artists</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
