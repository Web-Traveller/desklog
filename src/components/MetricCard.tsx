import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconColorClass?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColorClass = 'text-primary',
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container/60 flex flex-col gap-1 transition-all hover:shadow-md">
      <div className="flex items-center justify-between text-outline">
        <span className="font-fine-print text-fine-print uppercase font-semibold tracking-wider">
          {title}
        </span>
        <span className={`material-symbols-outlined text-lg ${iconColorClass}`}>{icon}</span>
      </div>
      <span className="font-tagline text-tagline text-on-surface font-semibold">{value}</span>
      {subtitle && (
        <span className="font-fine-print text-fine-print text-on-surface-variant truncate">
          {subtitle}
        </span>
      )}
    </div>
  );
};
