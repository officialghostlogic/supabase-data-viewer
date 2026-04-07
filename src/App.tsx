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
import { WorksListPage } from "@/components/portal/works/WorksListPage";

const queryClient = new QueryClient();

const placeholderSections = ["artists", "locations", "condition", "loans", "import", "reports"] as const;

const portalRoutes = (
  <>
    <Route index element={<DashboardPage />} />
    <Route path="works" element={<WorksListPage />} />
    <Route path="works/new" element={<PortalPlaceholder section="works" />} />
    <Route path="works/:id" element={<PortalPlaceholder section="works" />} />
    <Route path="works/:id/edit" element={<PortalPlaceholder section="works" />} />
    {placeholderSections.map((s) => (
      <Route key={s} path={s} element={<PortalPlaceholder section={s} />} />
    ))}
    {placeholderSections.map((s) => (
      <Route key={`${s}-new`} path={`${s}/new`} element={<PortalPlaceholder section={s} />} />
    ))}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/staff" element={<PortalLayout role="staff" />}>
            {portalRoutes}
          </Route>
          <Route path="/admin" element={<PortalLayout role="admin" />}>
            {portalRoutes}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
