import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

const roles = ["PUBLIC", "STAFF", "ADMIN"] as const;
type Role = (typeof roles)[number];

const roleRoutes: Record<Role, string> = {
  PUBLIC: "/",
  STAFF: "/staff",
  ADMIN: "/admin",
};

const getActiveRole = (pathname: string): Role => {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/staff")) return "STAFF";
  return "PUBLIC";
};

export const SiteHeader = () => {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const active = getActiveRole(location.pathname);

  const handleRoleSwitch = (role: Role) => {
    sessionStorage.setItem("pac_role", role);
    navigate(roleRoutes[role]);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-foreground font-body">
              Permanent Art Collection
            </span>
            <span className="block text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
              Indiana State University
            </span>
          </div>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: "Home", to: "/" },
            { label: "Collection", to: "/collection" },
            { label: "Artists", to: "/artists" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role switcher */}
          <div className="hidden sm:flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={`px-3 py-1.5 text-xs font-semibold tracking-wider rounded-md transition-all ${
                  active === role
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Dark mode */}
          <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
};
