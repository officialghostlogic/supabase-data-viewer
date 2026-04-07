import { createContext, useContext } from "react";

export type PortalRole = "staff" | "admin";

interface PortalTheme {
  role: PortalRole;
  sidebarBg: string;
  accentColor: string;
  accentHsl: string;
  borderColor: string;
  badgeLabel: string;
  badgeClass: string;
  basePath: string;
}

const themes: Record<PortalRole, PortalTheme> = {
  staff: {
    role: "staff",
    sidebarBg: "#1C1F2E",
    accentColor: "#4A7CFF",
    accentHsl: "222 100% 64%",
    borderColor: "#4A7CFF",
    badgeLabel: "● STAFF VIEW",
    badgeClass: "bg-[#4A7CFF]/15 text-[#4A7CFF] border-[#4A7CFF]/30",
    basePath: "/staff",
  },
  admin: {
    role: "admin",
    sidebarBg: "#1A1412",
    accentColor: "#C8A415",
    accentHsl: "47 82% 43%",
    borderColor: "#C8A415",
    badgeLabel: "● ADMIN VIEW",
    badgeClass: "bg-[#C8A415]/15 text-[#C8A415] border-[#C8A415]/30",
    basePath: "/admin",
  },
};

export const getPortalTheme = (role: PortalRole) => themes[role];

const PortalContext = createContext<PortalTheme>(themes.staff);

export const PortalProvider = PortalContext.Provider;
export const usePortal = () => useContext(PortalContext);
