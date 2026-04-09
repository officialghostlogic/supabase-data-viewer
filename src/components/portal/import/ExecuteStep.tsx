import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { usePortal } from "@/components/portal/PortalContext";
import { useImportExecution, type MatchResult } from "@/hooks/useImport";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";
import { CheckCircle, ChevronDown, AlertTriangle, Building2, MapPin, Users, Image, FileText, Upload } from "lucide-react";

interface Props {
  matchResults: MatchResult[];
  rowImageMap: Record<number, EmbeddedImage>;
  fileName: string;
  sourceSystem: string;
  onReset: () => void;
  onPushingChange?: (pushing: boolean) => void;
  imagesLost?: boolean;
  expectedImageCount?: number;
  onReuploadFile?: () => void;
}

export function ExecuteStep({ matchResults, rowImageMap, fileName, sourceSystem, onReset, onPushingChange, imagesLost, expectedImageCount, onReuploadFile }: Props) {
  const navigate = useNavigate();
  const { role } = usePortal();
  const { progress, done, postImportData, execute } = useImportExecution();
  const [setToReview, setSetToReview] = useState(true);
  const [pushing, setPushing] = useState(false);

  const included = matchResults.filter((r) => r.included);

  const stats = useMemo(() => {
    const newWorks = included.filter((r) => r.status === "new").length;
    const updates = included.filter((r) => r.status === "update").length;
    const newArtists = new Set(included.filter((r) => r.artistStatus === "new" && r.row.artist_display).map((r) => r.row.artist_display!)).size;
    const newBuildings = new Set(included.filter((r) => r.buildingStatus === "new" && r.row.location_building).map((r) => r.row.location_building)).size;
    const newLocations = new Set(included.filter((r) => r.locationStatus === "new" && r.row.location_full).map((r) => r.row.location_full!)).size;
    const images = included.filter((r) => rowImageMap[r.row.rowIndex]).length;
    const flagged = included.filter((r) => r.row.import_flags.length > 0);
    const newBuildingNames = Array.from(new Set(included.filter((r) => r.buildingStatus === "new" && r.row.location_building).map((r) => r.row.location_building)));
    const newLocationNames = Array.from(new Set(included.filter((r) => r.locationStatus === "new" && r.row.location_full).map((r) => r.row.location_full!)));
    return { newWorks, updates, newArtists, newBuildings, newLocations, images, flagged, newBuildingNames, newLocationNames };
  }, [included, rowImageMap]);

  const isPushingRef = useRef(false);

  const handlePush = async () => {
    if (isPushingRef.current) return;
    isPushingRef.current = true;
    setPushing(true);
    onPushingChange?.(true);
    try {
      await execute(matchResults, rowImageMap, fileName, sourceSystem, setToReview);
    } finally {
      onPushingChange?.(false);
    }
  };

  // Post-import screen
  if (done && postImportData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Works created" value={postImportData.created} />
              <StatCard label="Works updated" value={postImportData.updated} />
              <StatCard label="Artists created" value={postImportData.artistsCreated} />
              <StatCard label="Buildings created" value={postImportData.buildingsCreated} />
              <StatCard label="Rooms created" value={postImportData.locationsCreated} />
              <StatCard label="Images saved" value={postImportData.imagesUploaded} />
            </div>

            {postImportData.newBuildings.length > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg text-sm space-y-1">
                {postImportData.newBuildings.map((name) => (
                  <p key={name}>
                    New building added: <strong>{name}</strong> —{" "}
                    <button className="text-primary underline" onClick={() => navigate(`/${role}/locations`)}>
                      add details at Locations
                    </button>
                  </p>
                ))}
              </div>
            )}

            {progress && progress.errors > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {progress.errors} error{progress.errors > 1 ? "s" : ""} occurred
                  <ChevronDown className="h-3 w-3" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1 text-xs">
                  {progress.errorDetails.map((e, i) => (
                    <div key={i} className="p-2 bg-destructive/10 rounded">Row {e.row}: {e.message}</div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate(`/${role}/works?source_file=${encodeURIComponent(fileName)}`)}>
                View imported works
              </Button>
              <Button variant="outline" onClick={() => navigate(`/${role}/works?import_status=needs_review`)}>
                Review flagged works
              </Button>
              <Button variant="outline" onClick={onReset}>Start new import</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pushing phase
  if (pushing && progress) {
    const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{progress.phase}...</p>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress.detail} ({progress.current} of {progress.total})</p>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div><span className="font-bold text-primary">{progress.created}</span> created</div>
            <div><span className="font-bold">{progress.updated}</span> updated</div>
            <div><span className="font-bold">{progress.imagesUploaded}</span> images</div>
            <div><span className="font-bold text-destructive">{progress.errors}</span> errors</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Review phase
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={FileText} label="Works to create" value={stats.newWorks} color="text-primary" />
        <SummaryCard icon={FileText} label="Works to update" value={stats.updates} />
        <SummaryCard icon={Users} label="Artists to create" value={stats.newArtists} />
        <SummaryCard icon={MapPin} label="Locations to create" value={stats.newLocations} />
        <SummaryCard icon={Building2} label="Buildings to create" value={stats.newBuildings} />
        <SummaryCard icon={Image} label="Images to upload" value={stats.images} />
      </div>

      {stats.newBuildingNames.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
            <Building2 className="h-4 w-4" />
            New buildings that will be created ({stats.newBuildingNames.length})
            <ChevronDown className="h-3 w-3 ml-auto" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {stats.newBuildingNames.map((name) => (
              <div key={name} className="p-2 bg-muted/50 rounded text-sm">{name}</div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {stats.newLocationNames.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
            <MapPin className="h-4 w-4" />
            New rooms that will be created ({stats.newLocationNames.length})
            <ChevronDown className="h-3 w-3 ml-auto" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {stats.newLocationNames.map((name) => (
              <div key={name} className="p-2 bg-muted/50 rounded text-sm">{name}</div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {stats.flagged.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full p-3 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/15">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Flagged works ({stats.flagged.length})
            <ChevronDown className="h-3 w-3 ml-auto" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {stats.flagged.map((m, i) => (
              <div key={i} className="p-2 bg-muted/50 rounded text-sm flex items-center gap-2">
                <span className="font-mono text-xs">{m.row.accession_number || "—"}</span>
                <span className="truncate">{m.row.title}</span>
                {m.row.import_flags.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Checkbox id="needsReview" checked={setToReview} onCheckedChange={(v) => setSetToReview(!!v)} />
            <label htmlFor="needsReview" className="text-sm">
              Set all imported works to <Badge variant="outline">needs_review</Badge>
              <span className="text-muted-foreground ml-1">(recommended — staff can publish after review)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {imagesLost && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{expectedImageCount || 0} image{(expectedImageCount || 0) !== 1 ? "s" : ""}</strong> were not saved — re-upload the original file to restore them before pushing.
                </span>
              </div>
              {onReuploadFile && (
                <Button size="sm" variant="outline" onClick={onReuploadFile}>
                  Re-upload file
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handlePush} className="w-full" size="lg" disabled={pushing || included.length === 0 || !!imagesLost}>
        <Upload className="h-4 w-4 mr-2" />
        Push to Database ({included.length} works){imagesLost ? " — re-upload file first" : ""}
      </Button>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className="text-center p-3 bg-muted rounded-lg">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color || "text-muted-foreground"}`} />
      <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-2 bg-muted/50 rounded">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
