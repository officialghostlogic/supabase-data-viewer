import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Image,
  Users,
  MapPin,
  ClipboardCheck,
  HandCoins,
  Upload,
  FileBarChart,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Landmark,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/components/portal/PortalContext";
import { useTheme } from "@/hooks/useTheme";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "" },
  { title: "Works", icon: Image, path: "/works" },
  { title: "Import", icon: Upload, path: "/import" },
  { title: "Artists", icon: Users, path: "/artists" },
  { title: "Locations", icon: MapPin, path: "/locations" },
  { title: "Condition", icon: ClipboardCheck, path: "/condition" },
  { title: "Loans", icon: HandCoins, path: "/loans" },
  { title: "Reports", icon: FileBarChart, path: "/reports" },
];

export const PortalSidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { dark, toggle: toggleTheme } = useTheme();
  const portal = usePortal();
  const location = useLocation();

  const portalLabel = portal.role === "staff" ? "Staff Portal" : "Admin Portal";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
      style={{
        ["--sidebar-background" as string]: portal.sidebarBg,
        ["--sidebar-foreground" as string]: "0 0% 100%",
        ["--sidebar-accent" as string]: portal.accentHsl,
        ["--sidebar-accent-foreground" as string]: "0 0% 100%",
        ["--sidebar-border" as string]: "0 0% 100% / 0.08",
        ["--sidebar-primary" as string]: portal.accentHsl,
        ["--sidebar-primary-foreground" as string]: "0 0% 100%",
        ["--sidebar-ring" as string]: portal.accentHsl,
      } as React.CSSProperties}
    >
      <SidebarContent>
        {/* Logo area */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.08]">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: portal.accentColor }}
          >
            <Landmark className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-white tracking-tight">
              {portalLabel}
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const fullPath = `${portal.basePath}${item.path}`;
                const isActive =
                  item.path === ""
                    ? location.pathname === portal.basePath || location.pathname === `${portal.basePath}/`
                    : location.pathname.startsWith(fullPath);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={fullPath}
                        end={item.path === ""}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                        activeClassName="!text-white !bg-white/[0.1]"
                        style={isActive ? { borderLeft: `3px solid ${portal.accentColor}` } : undefined}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.08] p-2 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 text-white/50 hover:text-white hover:bg-white/[0.06]"
        >
          {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span className="text-xs">{dark ? "Light mode" : "Dark mode"}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start gap-3 text-white/50 hover:text-white hover:bg-white/[0.06]"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <PanelLeftClose className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
