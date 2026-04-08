import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/components/portal/PortalContext";

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
  const portal = usePortal();
  const count = selectedIds.length;

  const softDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("artists")
        .update({ deleted_at: new Date().toISOString(), deleted_by: portal.role })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${count} artists moved to trash`);
      qc.invalidateQueries({ queryKey: ["artists-list"] });
      qc.invalidateQueries({ queryKey: ["works-list"] });
      qc.invalidateQueries({ queryKey: ["trash-counts"] });
      onOpenChange(false);
      onDeleted();
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {count} artists to trash?</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>These artists will be moved to the trash and hidden from all views. They can be restored within 90 days.</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => softDeleteMutation.mutate(selectedIds)}
            disabled={softDeleteMutation.isPending}
          >
            {softDeleteMutation.isPending ? "Moving…" : `Move ${count} to Trash`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
