import type { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlowCard({ children, className = "" }: GlowCardProps) {
  return (
    <div className={`glow-card rounded-xl border border-border bg-surface-1/80 p-6 transition-all duration-300 hover:border-border-light bento-card ${className}`}>
      {children}
    </div>
  );
}
