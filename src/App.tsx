import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { DashboardPage } from "@/components/portal/DashboardPage";
import { PortalPlaceholder } from "@/components/portal/PortalPlaceholder";

const queryClient = new QueryClient();

const portalSections = ["works", "artists", "locations", "condition", "loans", "import", "reports"] as const;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Staff Portal */}
          <Route path="/staff" element={<PortalLayout role="staff" />}>
            <Route index element={<DashboardPage />} />
            {portalSections.map((s) => (
              <Route key={s} path={s} element={<PortalPlaceholder section={s} />} />
            ))}
            {portalSections.map((s) => (
              <Route key={`${s}-new`} path={`${s}/new`} element={<PortalPlaceholder section={s} />} />
            ))}
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={<PortalLayout role="admin" />}>
            <Route index element={<DashboardPage />} />
            {portalSections.map((s) => (
              <Route key={s} path={s} element={<PortalPlaceholder section={s} />} />
            ))}
            {portalSections.map((s) => (
              <Route key={`${s}-new`} path={`${s}/new`} element={<PortalPlaceholder section={s} />} />
            ))}
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
