import { useNavigate, useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePortal } from "@/components/portal/PortalContext";

const roles = [
  { label: "PUBLIC", path: "/" },
  { label: "STAFF", path: "/staff" },
  { label: "ADMIN", path: "/admin" },
] as const;

export const PortalTopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const portal = usePortal();

  const activeLabel = portal.role === "staff" ? "STAFF" : "ADMIN";

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between bg-card px-4"
      style={{ borderBottom: `3px solid ${portal.accentColor}` }}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider ${portal.badgeClass}`}
        >
          {portal.badgeLabel}
        </span>
      </div>

      {/* Role switcher */}
      <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
        {roles.map((r) => {
          const isActive = r.label === activeLabel;
          return (
            <button
              key={r.label}
              onClick={() => {
                sessionStorage.setItem("pac_role", r.label);
                navigate(r.path);
              }}
              className={`px-3 py-1.5 text-[11px] font-semibold tracking-wider rounded-md transition-all ${
                isActive
                  ? "shadow-sm text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { backgroundColor: portal.accentColor } : undefined}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
