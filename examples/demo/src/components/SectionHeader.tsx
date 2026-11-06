interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  className?: string;
}

export default function SectionHeader({
  badge,
  title,
  description,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`text-center max-w-2xl mx-auto mb-16 ${className}`}>
      {badge && (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full glass-card text-xs font-medium text-accent">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary mb-5 tracking-tight leading-[1.1]">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
