import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePortal } from "@/components/portal/PortalContext";
import { useImportContext } from "./ImportPage";

interface Props {
  fileName: string;
}

export function ResultsStep({ fileName }: Props) {
  const navigate = useNavigate();
  const { role } = usePortal();
  const { matchResults } = useImportContext();

  const included = matchResults.filter((r) => r.included);
  const newCount = included.filter((r) => r.status === "new").length;
  const updateCount = included.filter((r) => r.status === "update").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Import Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{included.length}</div>
            <div className="text-xs text-muted-foreground">Total processed</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{newCount}</div>
            <div className="text-xs text-muted-foreground">New works</div>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <div className="text-2xl font-bold">{updateCount}</div>
            <div className="text-xs text-muted-foreground">Updated</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{included.filter((r) => r.hasImage).length}</div>
            <div className="text-xs text-muted-foreground">Images</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Source file: <span className="font-mono">{fileName}</span>
        </p>

        <div className="flex gap-3">
          <Button onClick={() => navigate(`/${role}/works`)}>
            View works
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Import another file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
