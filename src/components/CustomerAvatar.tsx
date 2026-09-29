import React from 'react';

interface CustomerAvatarProps {
  initials: string;
  colorClass?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  initials,
  colorClass = 'bg-secondary-fixed text-on-secondary-fixed',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-16 h-16 text-2xl font-bold rounded-2xl',
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-caption-strong select-none flex-shrink-0 ${sizeClasses[size]} ${colorClass}`}
    >
      {initials}
    </div>
  );
};
