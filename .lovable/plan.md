

## Plan: Fix Duplicate Images, Add Navigation, Improve Typography, Make Artist Names Clickable

### Problem Summary
1. **Duplicate images**: Import creates a new `digital_assets` row every re-import without checking if one already exists for that work, resulting in 2+ images per work
2. **No back buttons**: Pages lack obvious back navigation beyond breadcrumbs
3. **Poor font contrast/hierarchy**: Metadata labels and values on work detail and artist pages lack visual distinction
4. **Artist name not clickable**: On the work detail page, clicking an artist name (e.g. "Pat Powell") doesn't navigate to that artist's profile

---

### Changes

#### 1. Fix duplicate images during import
**File**: `src/hooks/useImport.ts` (image upload section, ~line 438)

Before inserting a new `digital_assets` row, query for an existing primary image on the same `work_id`. If one exists, update `file_url` and `filename` instead of inserting a duplicate. This prevents the 2-image-per-work problem on re-imports.

```
// Before insert, check for existing primary asset
const { data: existingAsset } = await supabase
  .from("digital_assets")
  .select("id")
  .eq("work_id", workId)
  .eq("is_primary", true)
  .maybeSingle();

if (existingAsset) {
  // Update existing
  await supabase.from("digital_assets")
    .update({ file_url: urlData.publicUrl, filename: ... })
    .eq("id", existingAsset.id);
} else {
  // Insert new
  await supabase.from("digital_assets").insert({ ... });
}
```

#### 2. Add back buttons to detail pages
**Files**: `WorkDetailPage.tsx`, `ArtistProfilePage.tsx`

Add a visible "← Back" button next to the breadcrumb on both the work detail and artist profile pages. Uses `navigate(-1)` or links to the parent list page. Styled as a small outline button with a left arrow icon.

#### 3. Improve typography contrast on detail pages
**Files**: `MetadataSections.tsx`, `ArtistProfilePage.tsx`

- **Section headers**: Increase font size from `text-xs` to `text-sm`, use `text-foreground` instead of `text-muted-foreground`
- **Field labels**: Keep uppercase but use slightly darker color (`text-muted-foreground` → `text-foreground/70`)
- **Field values**: Increase from `text-sm` to `text-base` for key fields (title, artist, medium), ensure `text-foreground` not `text-card-foreground`
- **Work title (h1)**: Bump from `text-2xl` to `text-3xl`
- **Artist name on artist profile**: Same bump to `text-3xl`

#### 4. Make artist name clickable on work detail page
**File**: `MetadataSections.tsx` (line ~101-112)

When not in edit mode and an `artist_id` exists, wrap the artist display name in a `<Link>` to `{basePath}/artists/{artist_id}`. This requires passing `basePath` and `artist_id` into `MetadataSections` (artist_id is already available on the `work` object). The link gets standard interactive styling (text-primary, hover:underline).

Also pass `basePath` as a new prop to `MetadataSections`, sourced from `usePortal()` in the parent.

---

### Technical Details

- **MetadataSections** gains two new props: `basePath: string` and the existing `work.artist_id` is used for linking
- No new dependencies or database changes required
- The duplicate image fix uses `maybeSingle()` to safely handle zero or one result

