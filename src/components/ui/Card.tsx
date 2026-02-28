interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 ${
        hover ? "hover:border-border-bright hover:bg-surface-hover cursor-pointer transition-colors" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
