import React from 'react';

interface TelemetryPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ title, children, className }) => (
  <div className={`font-mono text-xs text-cyan-400/70 space-y-2 ${className}`}>
    <p className="tracking-[0.2em] text-cyan-400/80 border-b border-cyan-500/20 pb-1">{title}</p>
    <div className="pt-1">
      {children}
    </div>
  </div>
);
