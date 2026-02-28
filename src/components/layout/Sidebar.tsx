"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Newspaper,
  Rss,
  Shield,
  Cpu,
  TrendingUp,
  FileText,
  Settings,
  Zap,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Briefing", icon: Newspaper },
  { href: "/feed", label: "Intel Feed", icon: Rss },
  { href: "/cyber", label: "Cybersecurity", icon: Shield },
  { href: "/technology", label: "Technology", icon: Cpu },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/analysis", label: "Analysis", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <>
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <span className="text-lg font-bold text-text-primary tracking-tight">
            Vantage
          </span>
        </div>
        <button
          className="lg:hidden p-1 text-text-muted hover:text-text-primary"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-positive" />
          <span className="text-xs text-text-muted">Active</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-surface border border-border rounded-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5 text-text-primary" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 w-56 bg-surface border-r border-border flex flex-col z-[60] transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 bg-surface border-r border-border flex-col z-50">
        {nav}
      </aside>
    </>
  );
}
