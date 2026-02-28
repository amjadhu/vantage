"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runPipelineStep } from "@/app/settings/actions";
import { Card } from "@/components/ui/Card";

type Step = "fetch" | "enrich" | "connect" | "briefing";

const STEPS: { key: Step; label: string; desc: string }[] = [
  { key: "fetch", label: "Fetch Articles", desc: "Pull latest from all sources" },
  { key: "enrich", label: "Enrich", desc: "AI analysis of new articles" },
  { key: "connect", label: "Find Connections", desc: "Cross-article relationships" },
  { key: "briefing", label: "Generate Briefing", desc: "Daily intelligence summary" },
];

type StepStatus = "idle" | "running" | "done" | "error" | "skipped";

export function PipelineRunner() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<Step, StepStatus>>({
    fetch: "idle",
    enrich: "idle",
    connect: "idle",
    briefing: "idle",
  });
  const [messages, setMessages] = useState<Record<Step, string>>({
    fetch: "",
    enrich: "",
    connect: "",
    briefing: "",
  });
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setStatuses({ fetch: "idle", enrich: "idle", connect: "idle", briefing: "idle" });
    setMessages({ fetch: "", enrich: "", connect: "", briefing: "" });

    for (const step of STEPS) {
      setStatuses((prev) => ({ ...prev, [step.key]: "running" }));

      const result = await runPipelineStep(step.key);

      if (result.success) {
        const detail = result.details
          ? " — " + Object.entries(result.details).map(([k, v]) => `${k}: ${v}`).join(", ")
          : "";
        setStatuses((prev) => ({ ...prev, [step.key]: "done" }));
        setMessages((prev) => ({ ...prev, [step.key]: `Done${detail}` }));
      } else {
        setStatuses((prev) => ({ ...prev, [step.key]: "error" }));
        setMessages((prev) => ({ ...prev, [step.key]: result.message }));
        // Mark remaining steps as skipped
        const idx = STEPS.findIndex((s) => s.key === step.key);
        for (let i = idx + 1; i < STEPS.length; i++) {
          setStatuses((prev) => ({ ...prev, [STEPS[i].key]: "skipped" }));
          setMessages((prev) => ({ ...prev, [STEPS[i].key]: "Skipped due to earlier error" }));
        }
        break;
      }
    }

    setRunning(false);
    router.refresh();
  }

  async function runSingle(step: Step) {
    setRunning(true);
    setStatuses((prev) => ({ ...prev, [step]: "running" }));
    setMessages((prev) => ({ ...prev, [step]: "" }));

    const result = await runPipelineStep(step);

    if (result.success) {
      const detail = result.details
        ? " — " + Object.entries(result.details).map(([k, v]) => `${k}: ${v}`).join(", ")
        : "";
      setStatuses((prev) => ({ ...prev, [step]: "done" }));
      setMessages((prev) => ({ ...prev, [step]: `Done${detail}` }));
    } else {
      setStatuses((prev) => ({ ...prev, [step]: "error" }));
      setMessages((prev) => ({ ...prev, [step]: result.message }));
    }

    setRunning(false);
    router.refresh();
  }

  const statusIcon = (s: StepStatus) => {
    switch (s) {
      case "running": return "animate-spin text-accent";
      case "done": return "text-positive";
      case "error": return "text-critical";
      case "skipped": return "text-text-muted";
      default: return "text-text-muted";
    }
  };

  const statusLabel = (s: StepStatus) => {
    switch (s) {
      case "running": return "⟳";
      case "done": return "✓";
      case "error": return "✗";
      case "skipped": return "—";
      default: return "○";
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Run Pipeline
        </h3>
        <button
          onClick={runAll}
          disabled={running}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running ? "Running..." : "Run All Steps"}
        </button>
      </div>
      <p className="text-xs text-text-muted mb-4">
        Run the full pipeline (fetch → enrich → connect → briefing) or individual steps. Limited to 2 manual runs per step per day.
      </p>

      <div className="space-y-2">
        {STEPS.map((step) => (
          <div
            key={step.key}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-sm font-mono w-4 text-center ${statusIcon(statuses[step.key])}`}>
                {statusLabel(statuses[step.key])}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-text-primary font-medium">{step.label}</p>
                {messages[step.key] ? (
                  <p className={`text-xs ${statuses[step.key] === "error" ? "text-critical" : "text-text-muted"}`}>
                    {messages[step.key]}
                  </p>
                ) : (
                  <p className="text-xs text-text-muted">{step.desc}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => runSingle(step.key)}
              disabled={running}
              className="px-2 py-1 text-xs rounded border border-border text-text-secondary hover:text-text-primary hover:border-border-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Run
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
