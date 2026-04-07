import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ArtistWorkInfo {
  display_name: string;
  work_count: number;
}

interface DeleteArtistsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  artists: Array<{ id: string; display_name: string }>;
  onDeleted: () => void;
}

export const DeleteArtistsDialog = ({
  open,
  onOpenChange,
  selectedIds,
  artists,
  onDeleted,
}: DeleteArtistsDialogProps) => {
  const qc = useQueryClient();
  const count = selectedIds.length;
  const [affected, setAffected] = useState<ArtistWorkInfo[]>([]);

  useEffect(() => {
    if (!open || selectedIds.length === 0) {
      setAffected([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("works")
        .select("artist_id")
        .in("artist_id", selectedIds);
      
      const countMap: Record<string, number> = {};
      data?.forEach((w) => {
        if (w.artist_id) countMap[w.artist_id] = (countMap[w.artist_id] || 0) + 1;
      });
      
      const list = artists
        .filter((a) => selectedIds.includes(a.id) && countMap[a.id] > 0)
        .map((a) => ({ display_name: a.display_name, work_count: countMap[a.id] }))
        .sort((a, b) => b.work_count - a.work_count);
      setAffected(list);
    })();
  }, [open, selectedIds, artists]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Unlink works (preserve artist_name text)
      const { error: e1 } = await supabase
        .from("works")
        .update({ artist_id: null })
        .in("artist_id", ids);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("artists").delete().in("id", ids);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success(`${count} artists deleted`);
      qc.invalidateQueries({ queryKey: ["artists-list"] });
      qc.invalidateQueries({ queryKey: ["works-list"] });
      onOpenChange(false);
      onDeleted();
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {count} artists?</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>This will permanently delete {count} artists and cannot be undone.</p>
            {affected.length > 0 && (
              <>
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠ {affected.length} of these artists have works in the collection.
                  Their works will remain but will be unlinked (artist field will be cleared).
                </p>
                <ul className="text-sm text-muted-foreground ml-4 list-disc space-y-0.5">
                  {affected.slice(0, 5).map((a) => (
                    <li key={a.display_name}>
                      {a.display_name} — {a.work_count} work{a.work_count !== 1 ? "s" : ""}
                    </li>
                  ))}
                  {affected.length > 5 && (
                    <li>…and {affected.length - 5} more</li>
                  )}
                </ul>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate(selectedIds)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : `Delete ${count} artists`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
