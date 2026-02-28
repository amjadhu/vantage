"use client";

import { Search } from "lucide-react";
import { format } from "date-fns";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 h-14 bg-surface/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4 ml-10 lg:ml-0">
        <span className="text-sm text-text-muted hidden sm:block">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </span>
        <span className="text-sm text-text-muted sm:hidden">
          {format(new Date(), "MMM d")}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
          Executive
        </span>
      </div>

      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search intelligence..."
          className="w-48 lg:w-64 bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    </header>
  );
}
