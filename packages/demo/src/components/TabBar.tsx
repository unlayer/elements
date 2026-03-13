import { useRef, useEffect, useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export default function TabBar({
  tabs,
  activeTab,
  onTabChange,
  size = "md",
  className = "",
}: TabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeTab]);

  const padClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-0.5 rounded-lg bg-surface-1 border border-border p-1 ${className}`}
    >
      {/* Sliding indicator */}
      <div
        className="tab-indicator absolute top-1 bottom-1 rounded-md bg-surface-3 z-0"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />

      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative z-10 inline-flex items-center gap-1.5 ${padClass} rounded-md font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap
            ${activeTab === tab.id ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
