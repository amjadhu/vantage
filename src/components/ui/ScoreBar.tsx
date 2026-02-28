interface ScoreBarProps {
  score: number; // 0-1
  label?: string;
  className?: string;
}

export function ScoreBar({ score, label, className = "" }: ScoreBarProps) {
  const percentage = Math.round(score * 100);
  const color =
    score >= 0.8
      ? "bg-critical"
      : score >= 0.6
        ? "bg-high"
        : score >= 0.4
          ? "bg-medium"
          : "bg-low";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-text-muted w-16">{label}</span>}
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-text-muted w-8 text-right">{percentage}%</span>
    </div>
  );
}
