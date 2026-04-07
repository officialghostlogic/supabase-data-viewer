import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPicker } from "./LocationPicker";
import type { Tables } from "@/integrations/supabase/types";

interface MetadataSectionsProps {
  work: Tables<"works">;
  artist: { display_name: string; given_name: string | null; family_name: string | null; nationality: string | null; birth_year: number | null; death_year: number | null; is_isu_affiliated: boolean | null; bio: string | null } | null;
  location: { full_location: string | null; location_type: string | null; climate_controlled: boolean | null; security_level: string | null } | null;
  building: { name: string; short_name: string | null } | null;
  editing: boolean;
  draft: Record<string, unknown>;
  setDraft: (key: string, value: unknown) => void;
  allArtists: { id: string; display_name: string }[];
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-1.5">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-1">{label}</span>
    <div>{children}</div>
  </div>
);

const ReadValue = ({ value, mono }: { value: string | number | null | undefined; mono?: boolean }) => (
  <span className={`text-sm text-card-foreground ${mono ? "font-mono text-xs" : ""}`}>
    {value ?? <span className="text-muted-foreground/50">—</span>}
  </span>
);

const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-3 mt-6 first:mt-0">
    {title}
  </h3>
);

const classifications = [
  "Painting", "Sculpture", "Print", "Drawing", "Photography", "Photograph",
  "Ceramic", "Mixed Media", "Textile", "Unknown",
];

const rightsOptions = ["Unknown", "Public Domain", "Copyright", "Fair Use", "Creative Commons"];

export const MetadataSections = ({
  work, artist, location, building, editing, draft, setDraft, allArtists,
}: MetadataSectionsProps) => {
  const v = (key: string) => (editing ? (draft[key] as string) ?? "" : undefined);

  // Missing fields for quality section
  const qualityFields = ["credit_line", "provenance", "date_acquired", "medium", "classification", "dimensions_display"];
  const missing = qualityFields.filter((f) => !(work as Record<string, unknown>)[f]);

  return (
    <div className="space-y-1">
      {/* IDENTIFICATION */}
      <SectionHeader title="Identification" />
      <Field label="Accession #">
        {editing ? (
          <Input value={v("accession_number") ?? ""} onChange={(e) => setDraft("accession_number", e.target.value)} className="h-8 text-sm font-mono" />
        ) : (
          <ReadValue value={work.accession_number} mono />
        )}
      </Field>
      <Field label="Barcode">
        {editing ? (
          <Input value={v("barcode") ?? ""} onChange={(e) => setDraft("barcode", e.target.value)} className="h-8 text-sm font-mono" />
        ) : (
          <ReadValue value={work.barcode} mono />
        )}
      </Field>

      {/* WORK DETAILS */}
      <SectionHeader title="Work Details" />
      <Field label="Title">
        {editing ? (
          <Input value={v("title") ?? ""} onChange={(e) => setDraft("title", e.target.value)} className="h-8 text-sm" />
        ) : (
          <span className="text-sm font-semibold text-card-foreground">{work.title}</span>
        )}
      </Field>
      <Field label="Artist">
        {editing ? (
          <Select value={(draft.artist_id as string) ?? work.artist_id ?? ""} onValueChange={(val) => setDraft("artist_id", val)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select artist" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— No artist —</SelectItem>
              {allArtists.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div>
            <span className="text-sm text-card-foreground">{artist?.display_name ?? work.artist_name ?? "—"}</span>
            {artist?.nationality && (
              <span className="text-xs text-muted-foreground ml-2">({artist.nationality})</span>
            )}
            {artist?.birth_year && (
              <span className="text-xs text-muted-foreground ml-1">
                {artist.birth_year}–{artist.death_year ?? "present"}
              </span>
            )}
          </div>
        )}
      </Field>
      <Field label="Medium">
        {editing ? (
          <Input value={v("medium") ?? ""} onChange={(e) => setDraft("medium", e.target.value)} className="h-8 text-sm" />
        ) : (
          <ReadValue value={work.medium} />
        )}
      </Field>
      <Field label="Classification">
        {editing ? (
          <Select value={(draft.classification as string) ?? work.classification ?? ""} onValueChange={(val) => setDraft("classification", val)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {classifications.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <ReadValue value={work.classification} />
        )}
      </Field>
      <Field label="Date Created"><ReadValue value={work.date_created} /></Field>
      <Field label="Date Acquired">
        {editing ? (
          <Input value={v("date_acquired") ?? ""} onChange={(e) => setDraft("date_acquired", e.target.value)} className="h-8 text-sm" />
        ) : (
          <ReadValue value={work.date_acquired} />
        )}
      </Field>
      <Field label="Dimensions">
        {editing ? (
          <div className="flex gap-2 items-center">
            <Input placeholder="H" value={v("dimensions_h") ?? ""} onChange={(e) => setDraft("dimensions_h", e.target.value ? Number(e.target.value) : null)} className="h-8 text-sm w-16" type="number" />
            <span className="text-xs text-muted-foreground">×</span>
            <Input placeholder="W" value={v("dimensions_w") ?? ""} onChange={(e) => setDraft("dimensions_w", e.target.value ? Number(e.target.value) : null)} className="h-8 text-sm w-16" type="number" />
            <span className="text-xs text-muted-foreground">×</span>
            <Input placeholder="D" value={v("dimensions_d") ?? ""} onChange={(e) => setDraft("dimensions_d", e.target.value ? Number(e.target.value) : null)} className="h-8 text-sm w-16" type="number" />
          </div>
        ) : (
          <ReadValue value={work.dimensions_display} />
        )}
      </Field>
      <Field label="Rights">
        {editing ? (
          <Select value={(draft.rights_status as string) ?? work.rights_status ?? ""} onValueChange={(val) => setDraft("rights_status", val)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {rightsOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <ReadValue value={work.rights_status} />
        )}
      </Field>

      {/* LOCATION */}
      <SectionHeader title="Location" />
      <Field label="Location">
        <ReadValue value={location?.full_location ?? work.location_full ?? ([work.location_building, work.location_floor, work.location_room].filter(Boolean).join(" / ") || null)} />
      </Field>
      {building && (
        <Field label="Building"><ReadValue value={building.name} /></Field>
      )}
      <Field label="On Display">
        {editing ? (
          <Switch
            checked={(draft.is_on_display as boolean) ?? work.is_on_display ?? false}
            onCheckedChange={(val) => setDraft("is_on_display", val)}
          />
        ) : (
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${work.is_on_display ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
        )}
      </Field>

      {/* PROVENANCE & RIGHTS */}
      <SectionHeader title="Provenance & Rights" />
      <Field label="Credit Line">
        {editing ? (
          <Textarea value={v("credit_line") ?? ""} onChange={(e) => setDraft("credit_line", e.target.value)} className="text-sm min-h-[60px]" />
        ) : (
          <ReadValue value={work.credit_line} />
        )}
      </Field>
      <Field label="Provenance">
        {editing ? (
          <Textarea value={v("provenance") ?? ""} onChange={(e) => setDraft("provenance", e.target.value)} className="text-sm min-h-[60px]" />
        ) : (
          <ReadValue value={work.provenance} />
        )}
      </Field>
      <Field label="Notes">
        {editing ? (
          <Textarea value={v("notes") ?? ""} onChange={(e) => setDraft("notes", e.target.value)} className="text-sm min-h-[60px]" />
        ) : (
          <ReadValue value={work.notes} />
        )}
      </Field>

      {/* DATA QUALITY */}
      <SectionHeader title="Data Quality" />
      <Field label="Score">
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (work.data_quality_score ?? 0) < 40 ? "bg-red-500" :
                (work.data_quality_score ?? 0) < 70 ? "bg-amber-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(work.data_quality_score ?? 0, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium tabular-nums text-card-foreground">
            {work.data_quality_score ?? "—"}%
          </span>
        </div>
      </Field>
      {missing.length > 0 && (
        <Field label="Missing">
          <span className="text-xs text-muted-foreground">
            {missing.join(", ")}
          </span>
        </Field>
      )}

      {/* SUBJECT TAGS */}
      <SectionHeader title="Subject Tags" />
      <div className="flex flex-wrap gap-1.5 py-1">
        {work.subject_tags && work.subject_tags.length > 0 ? (
          work.subject_tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
      </div>

      {/* ICONCLASS */}
      <SectionHeader title="Iconclass" />
      <div className="flex flex-wrap gap-1.5 py-1">
        {work.iconclass_ids && work.iconclass_ids.length > 0 ? (
          work.iconclass_ids.map((ic) => (
            <span key={ic} className="inline-flex items-center rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {ic}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No iconclass IDs</span>
        )}
      </div>

      {/* SOURCE INFO */}
      <SectionHeader title="Source Info" />
      <Field label="System">
        {work.source_system ? (
          <Badge variant="outline" className="text-xs">{work.source_system}</Badge>
        ) : <ReadValue value={null} />}
      </Field>
      <Field label="Source File">
        <span className="font-mono text-[11px] text-muted-foreground break-all">
          {work.source_file ?? "—"}
        </span>
      </Field>
      <Field label="Created">
        <span className="text-xs text-muted-foreground">
          {work.created_at ? new Date(work.created_at).toLocaleString() : "—"}
        </span>
      </Field>
      <Field label="Updated">
        <span className="text-xs text-muted-foreground">
          {work.updated_at ? new Date(work.updated_at).toLocaleString() : "—"}
        </span>
      </Field>
    </div>
  );
};
