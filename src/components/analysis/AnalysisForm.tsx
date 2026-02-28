"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestAnalysis } from "@/app/analysis/actions";
import { Card } from "@/components/ui/Card";

const ANALYSIS_TYPES = [
  { value: "trend", label: "Trend Report", desc: "Emerging patterns and trajectory analysis" },
  { value: "competitive", label: "Competitive Analysis", desc: "Market positioning and competitor comparison" },
  { value: "threat", label: "Threat Assessment", desc: "Cybersecurity threat landscape analysis" },
  { value: "regulatory", label: "Regulatory Impact", desc: "Compliance and regulatory change assessment" },
] as const;

export function AnalysisForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<"competitive" | "trend" | "regulatory" | "threat">("trend");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError("");

    const result = await requestAnalysis(topic, type);

    if (result.success && result.analysisId) {
      router.push(`/analysis/${result.analysisId}`);
      router.refresh();
    } else {
      setError(result.message);
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Request New Analysis
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Generate an AI deep-dive on any topic. The analysis will reference relevant articles from your feed. Limited to 2 per day.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-text-secondary font-medium mb-1">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., AI infrastructure trends, zero-trust architecture, cloud-native security..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-medium mb-1.5">
            Analysis Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ANALYSIS_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  type === t.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-secondary hover:border-border-bright hover:text-text-primary"
                }`}
                disabled={loading}
              >
                <p className="font-medium">{t.label}</p>
                <p className="text-text-muted mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-critical">{error}</p>
        )}

        <button
          type="submit"
          disabled={!topic.trim() || loading}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Generating analysis..." : "Generate Analysis"}
        </button>
      </form>
    </Card>
  );
}
