import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Construction } from "lucide-react";

const StaffPortal = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteHeader />
    <main className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <Construction className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Staff Portal</h1>
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default StaffPortal;
