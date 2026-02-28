interface BadgeProps {
  variant?: "default" | "critical" | "high" | "medium" | "low" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-border text-text-secondary",
  critical: "bg-critical/15 text-critical",
  high: "bg-high/15 text-high",
  medium: "bg-medium/15 text-medium",
  low: "bg-low/15 text-low",
  info: "bg-info/15 text-info",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
