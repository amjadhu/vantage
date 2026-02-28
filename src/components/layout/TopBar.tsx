"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Sun, Moon, RefreshCw, X } from "lucide-react";
import { format } from "date-fns";
import { runPipelineStep, getRefreshStatus } from "@/app/settings/actions";
import { useRouter } from "next/navigation";

const STEPS = ["fetch", "enrich", "connect", "briefing"] as const;
const STEP_LABELS: Record<string, string> = {
  fetch: "Fetching articles",
  enrich: "Enriching",
  connect: "Finding connections",
  briefing: "Generating briefing",
};

export function TopBar() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [runsUsed, setRunsUsed] = useState(0);
  const [runsLimit, setRunsLimit] = useState(2);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(saved === "light" ? "light" : "dark");
    const lr = localStorage.getItem("lastRefresh");
    if (lr) setLastRefresh(lr);
  }, []);

  // Close dialog on outside click
  useEffect(() => {
    if (!showConfirm) return;
    function handleClick(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setShowConfirm(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showConfirm]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.className = next;
    localStorage.setItem("theme", next);
  }

  async function handleRefreshClick() {
    if (running) return;
    setLoadingStatus(true);
    setShowConfirm(true);
    try {
      const status = await getRefreshStatus();
      setRunsUsed(status.runsUsed);
      setRunsLimit(status.runsLimit);
    } catch {
      setRunsUsed(0);
      setRunsLimit(2);
    }
    setLoadingStatus(false);
  }

  async function confirmRefresh() {
    setShowConfirm(false);
    setRunning(true);
    setError("");

    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i];
      setStepIndex(i);
      setCurrentStep(STEP_LABELS[step]);

      const result = await runPipelineStep(step);

      if (!result.success) {
        setError(result.message);
        break;
      }
    }

    const now = new Date().toISOString();
    localStorage.setItem("lastRefresh", now);
    setLastRefresh(now);
    setRunning(false);
    setCurrentStep("");
    router.refresh();
  }

  function formatLastRefresh() {
    if (!lastRefresh) return null;
    const d = new Date(lastRefresh);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return format(d, "MMM d");
  }

  const remaining = runsLimit - runsUsed;

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
          Tech Intel
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search intelligence..."
            className="w-48 lg:w-64 bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Refresh */}
        <div className="relative">
          <button
            onClick={handleRefreshClick}
            disabled={running}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-bright disabled:opacity-70 transition-colors"
            title={lastRefresh ? `Last refresh: ${formatLastRefresh()}` : "Run pipeline"}
          >
            <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
            {running ? (
              <span className="text-xs text-accent hidden sm:block">
                {currentStep} ({stepIndex + 1}/{STEPS.length})
              </span>
            ) : (
              lastRefresh && (
                <span className="text-xs text-text-muted hidden sm:block">
                  {formatLastRefresh()}
                </span>
              )
            )}
          </button>

          {/* Confirmation dialog */}
          {showConfirm && (
            <div
              ref={dialogRef}
              className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl p-4 shadow-lg z-50"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-primary">Refresh Pipeline</h4>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-0.5 text-text-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loadingStatus ? (
                <p className="text-xs text-text-muted py-2">Checking usage...</p>
              ) : (
                <>
                  <p className="text-xs text-text-secondary mb-3">
                    This will fetch, enrich, connect, and generate a briefing.
                    Each step uses AI tokens which incur costs.
                  </p>
                  <div className="flex items-center justify-between py-2 px-3 mb-3 rounded-lg bg-background border border-border">
                    <span className="text-xs text-text-muted">Refreshes remaining today</span>
                    <span className={`text-sm font-semibold ${remaining <= 0 ? "text-critical" : remaining === 1 ? "text-medium" : "text-positive"}`}>
                      {remaining}/{runsLimit}
                    </span>
                  </div>
                  {remaining <= 0 ? (
                    <p className="text-xs text-critical">
                      No refreshes remaining today. Try again tomorrow.
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmRefresh}
                        className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                      >
                        Refresh Now
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Error toast */}
        {error && !running && (
          <span className="text-xs text-critical max-w-40 truncate hidden sm:block" title={error}>
            {error}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
