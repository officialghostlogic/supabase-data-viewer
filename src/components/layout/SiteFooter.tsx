import { Landmark } from "lucide-react";

export const SiteFooter = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Branding */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground font-body text-sm">
              ISU Permanent Art Collection
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Preserving and sharing Indiana State University's artistic heritage
            for education, research, and public engagement.
          </p>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground font-body">Location</h4>
          <address className="text-sm text-muted-foreground not-italic leading-relaxed">
            Cunningham Memorial Library<br />
            Indiana State University<br />
            510 N 6½ St<br />
            Terre Haute, IN 47809
          </address>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground font-body">Resources</h4>
          <div className="flex flex-col gap-2">
            <a href="https://www.indstate.edu" target="_blank" rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Indiana State University
            </a>
            <a href="https://library.indstate.edu" target="_blank" rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cunningham Memorial Library
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Indiana State University. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
