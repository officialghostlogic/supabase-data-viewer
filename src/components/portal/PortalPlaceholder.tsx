import { useParams } from "react-router-dom";
import { Construction } from "lucide-react";

const sectionLabels: Record<string, string> = {
  works: "Works",
  artists: "Artists",
  locations: "Locations",
  condition: "Condition Reports",
  loans: "Loans",
  import: "Import",
  reports: "Reports",
};

export const PortalPlaceholder = ({ section }: { section: string }) => {
  const label = sectionLabels[section] || section;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Construction className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h1 className="text-xl font-bold text-foreground font-display">{label}</h1>
      <p className="text-sm text-muted-foreground mt-2">This section is under construction.</p>
    </div>
  );
};
