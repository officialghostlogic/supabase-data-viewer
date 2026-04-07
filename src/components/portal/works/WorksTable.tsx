import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { usePortal } from "@/components/portal/PortalContext";
import { usePrimaryImages } from "@/hooks/useWorksList";

type Work = {
  id: string;
  accession_number: string | null;
  title: string;
  artist_name: string | null;
  classification: string | null;
  location_building: string | null;
  location_room: string | null;
  is_on_display: boolean | null;
  import_status: string | null;
  import_flags: string[] | null;
  data_quality_score: number | null;
};

const classColors: Record<string, string> = {
  Painting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Sculpture: "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  Print: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Drawing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Photography: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Photograph: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Ceramic: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Mixed Media": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  Textile: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const statusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  needs_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400",
  archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const qualityColor = (score: number | null) => {
  if (score === null) return "bg-muted";
  if (score < 40) return "bg-red-500";
  if (score < 70) return "bg-amber-500";
  return "bg-green-500";
};

interface WorksTableProps {
  works: Work[];
  loading: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
  showCheckboxes?: boolean;
}

export const WorksTable = ({ works, loading, selectedIds, onToggleSelect, onToggleAll, showCheckboxes }: WorksTableProps) => {
  const navigate = useNavigate();
  const portal = usePortal();
  const workIds = works.map((w) => w.id);
  const { data: imageMap } = usePrimaryImages(workIds);

  if (loading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
              <div className="w-10 h-10 rounded bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
            <th className="px-3 py-2.5 text-left w-[52px]">Img</th>
            <th className="px-3 py-2.5 text-left w-[110px]">Accession</th>
            <th className="px-3 py-2.5 text-left min-w-[180px]">Title</th>
            <th className="px-3 py-2.5 text-left min-w-[130px]">Artist</th>
            <th className="px-3 py-2.5 text-left w-[120px]">Class</th>
            <th className="px-3 py-2.5 text-left w-[140px]">Location</th>
            <th className="px-3 py-2.5 text-center w-[60px]">Disp</th>
            <th className="px-3 py-2.5 text-left w-[100px]">Status</th>
            <th className="px-3 py-2.5 text-left w-[80px]">Quality</th>
            <th className="px-3 py-2.5 text-center w-[70px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {works.map((work) => {
            const isUntitled = work.import_flags?.includes("untitled");
            const isReview = work.import_status === "needs_review";
            const imgUrl = imageMap?.[work.id];
            const location = [work.location_building, work.location_room].filter(Boolean).join(" / ");

            return (
              <tr
                key={work.id}
                onClick={() => navigate(`${portal.basePath}/works/${work.id}`)}
                className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                  isReview ? "border-l-[3px] border-l-amber-400" : ""
                }`}
              >
                {/* Image */}
                <td className="px-3 py-2">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                </td>

                {/* Accession */}
                <td className="px-3 py-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {work.accession_number || "—"}
                  </span>
                </td>

                {/* Title */}
                <td className="px-3 py-2 max-w-[220px]">
                  <span
                    className={`font-semibold text-card-foreground truncate block ${
                      isUntitled ? "italic" : ""
                    }`}
                  >
                    {work.title}
                  </span>
                </td>

                {/* Artist */}
                <td className="px-3 py-2 text-card-foreground truncate max-w-[150px]">
                  {work.artist_name || "—"}
                </td>

                {/* Classification */}
                <td className="px-3 py-2">
                  {work.classification ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                        classColors[work.classification] ||
                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {work.classification}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>

                {/* Location */}
                <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[140px]">
                  {location || "—"}
                </td>

                {/* On Display */}
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      work.is_on_display ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                </td>

                {/* Status */}
                <td className="px-3 py-2">
                  {work.import_status ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        statusStyles[work.import_status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {work.import_status.replace("_", " ")}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>

                {/* Quality */}
                <td className="px-3 py-2">
                  {work.data_quality_score !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${qualityColor(work.data_quality_score)}`}
                          style={{ width: `${Math.min(work.data_quality_score, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {work.data_quality_score}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${portal.basePath}/works/${work.id}`);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${portal.basePath}/works/${work.id}/edit`);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
