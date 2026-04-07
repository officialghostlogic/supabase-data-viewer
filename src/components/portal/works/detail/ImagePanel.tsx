import { Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

interface ImagePanelProps {
  assets: Tables<"digital_assets">[];
  classification: string | null;
}

export const ImagePanel = ({ assets, classification }: ImagePanelProps) => {
  const primary = assets.find((a) => a.is_primary) ?? assets[0];
  const others = assets.filter((a) => a.id !== primary?.id);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Main image */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {primary ? (
          <img
            src={primary.file_url}
            alt={primary.caption || "Work image"}
            className="w-full h-full object-contain max-h-[400px]"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
            <ImageIcon className="h-12 w-12" />
            <span className="text-sm text-muted-foreground">No image on file</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {others.length > 0 && (
        <div className="flex gap-1 p-2 overflow-x-auto border-t border-border">
          {[primary, ...others].filter(Boolean).map((asset) => (
            <div
              key={asset!.id}
              className="w-14 h-14 shrink-0 rounded bg-muted overflow-hidden border border-border"
            >
              <img
                src={asset!.file_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div className="p-3 border-t border-border">
        <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
          <Upload className="h-3.5 w-3.5" />
          Upload Image
        </Button>
      </div>
    </div>
  );
};
