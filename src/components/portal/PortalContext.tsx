import { createContext, useContext } from "react";

export type PortalRole = "staff" | "admin";

interface PortalTheme {
  role: PortalRole;
  sidebarBg: string;
  accentColor: string;
  accentHsl: string;
  badgeLabel: string;
  basePath: string;
}

const themes: Record<PortalRole, PortalTheme> = {
  staff: {
    role: "staff",
    sidebarBg: "230 24% 15%",
    accentColor: "hsl(223 100% 65%)",
    accentHsl: "223 100% 65%",
    badgeLabel: "● STAFF VIEW",
    basePath: "/staff",
  },
  admin: {
    role: "admin",
    sidebarBg: "15 18% 9%",
    accentColor: "hsl(48 81% 43%)",
    accentHsl: "48 81% 43%",
    badgeLabel: "● ADMIN VIEW",
    basePath: "/admin",
  },
};

export const getPortalTheme = (role: PortalRole) => themes[role];

const PortalContext = createContext<PortalTheme>(themes.staff);

export const PortalProvider = PortalContext.Provider;
export const usePortal = () => useContext(PortalContext);
