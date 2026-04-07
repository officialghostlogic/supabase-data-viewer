import { Link } from "react-router-dom";
import { ArrowRight, Image, Paintbrush, Camera, Layers, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFeaturedWorks } from "@/hooks/useFeaturedWorks";

const classificationIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Painting: Paintbrush,
  Photograph: Camera,
  Print: Layers,
  Sculpture: Box,
};

const WorkCard = ({
  title,
  artist_name,
  date_created,
  classification,
}: {
  title: string;
  artist_name: string | null;
  date_created: string | null;
  classification: string | null;
}) => {
  const Icon = (classification && classificationIcon[classification]) || Image;

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5">
      {/* Placeholder image area */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
        <Icon className="h-10 w-10 text-muted-foreground/30 transition-transform group-hover:scale-110" />
        {classification && (
          <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-[10px] tracking-wider uppercase">
            {classification}
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-1">
        <h3 className="font-display font-semibold text-card-foreground leading-snug line-clamp-2 text-[15px]">
          {title}
        </h3>
        {artist_name && (
          <p className="text-sm text-muted-foreground font-body">{artist_name}</p>
        )}
        {date_created && (
          <p className="text-xs text-muted-foreground/70 font-body">{date_created}</p>
        )}
      </div>
    </div>
  );
};

export const FeaturedWorks = () => {
  const { data: works, isLoading } = useFeaturedWorks();

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold tracking-wider uppercase text-gold mb-2 font-body">
              On Display
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Featured Works
            </h2>
          </div>
          <Link
            to="/collection"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View full collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {works?.map((work) => (
              <WorkCard
                key={work.id}
                title={work.title}
                artist_name={work.artist_name}
                date_created={work.date_created}
                classification={work.classification}
              />
            ))}
            {works?.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-12">
                No works currently on display.
              </p>
            )}
          </div>
        )}

        <div className="sm:hidden mt-8 text-center">
          <Link
            to="/collection"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            View full collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
