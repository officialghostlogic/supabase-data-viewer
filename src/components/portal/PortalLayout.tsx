import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalTopBar } from "@/components/portal/PortalTopBar";
import { PortalProvider, getPortalTheme, type PortalRole } from "@/components/portal/PortalContext";

interface PortalLayoutProps {
  role: PortalRole;
}

export const PortalLayout = ({ role }: PortalLayoutProps) => {
  const theme = getPortalTheme(role);

  return (
    <PortalProvider value={theme}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <PortalSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <PortalTopBar />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </PortalProvider>
  );
};
