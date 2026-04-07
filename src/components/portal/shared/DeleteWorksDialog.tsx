import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LinkedCounts {
  images: number;
  conditions: number;
  loans: number;
}

interface DeleteWorksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onDeleted: () => void;
}

export const DeleteWorksDialog = ({
  open,
  onOpenChange,
  selectedIds,
  onDeleted,
}: DeleteWorksDialogProps) => {
  const qc = useQueryClient();
  const [linked, setLinked] = useState<LinkedCounts | null>(null);
  const count = selectedIds.length;

  useEffect(() => {
    if (!open || selectedIds.length === 0) {
      setLinked(null);
      return;
    }
    (async () => {
      const [imgRes, condRes, loanRes] = await Promise.all([
        supabase.from("digital_assets").select("work_id", { count: "exact", head: true }).in("work_id", selectedIds),
        supabase.from("condition_reports").select("work_id", { count: "exact", head: true }).in("work_id", selectedIds),
        supabase.from("loans").select("work_id", { count: "exact", head: true }).in("work_id", selectedIds),
      ]);
      setLinked({
        images: imgRes.count ?? 0,
        conditions: condRes.count ?? 0,
        loans: loanRes.count ?? 0,
      });
    })();
  }, [open, selectedIds]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error: e1 } = await supabase.from("digital_assets").delete().in("work_id", ids);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("condition_reports").delete().in("work_id", ids);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("loans").delete().in("work_id", ids);
      if (e3) throw e3;
      const { error: e4 } = await supabase.from("works").delete().in("id", ids);
      if (e4) throw e4;
    },
    onSuccess: () => {
      toast.success(`${count} works deleted`);
      qc.invalidateQueries({ queryKey: ["works-list"] });
      qc.invalidateQueries({ queryKey: ["primary-images"] });
      onOpenChange(false);
      onDeleted();
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {count} works?</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>This will permanently delete {count} works and cannot be undone.</p>
            {linked && linked.images > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                ⚠ {linked.images} works have images — these will also be deleted from storage.
              </p>
            )}
            {linked && linked.conditions > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                ⚠ {linked.conditions} works have condition reports — these will also be deleted.
              </p>
            )}
            {linked && linked.loans > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                ⚠ {linked.loans} works are on loan records — these will also be deleted.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate(selectedIds)}
            disabled={deleteMutation.isPending || !linked}
          >
            {deleteMutation.isPending ? "Deleting…" : `Delete ${count} works`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
