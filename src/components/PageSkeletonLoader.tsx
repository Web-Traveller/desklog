import React from 'react';

export const PageSkeletonLoader: React.FC = () => {
  return (
    <div className="p-space-lg flex flex-col gap-space-lg animate-pulse w-full max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="flex justify-between items-center pb-space-md border-b border-surface-container">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 bg-surface-container-high rounded-lg"></div>
          <div className="h-4 w-72 bg-surface-container rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-surface-container-high rounded-full"></div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <div className="h-32 bg-surface-container-low rounded-2xl border border-surface-container/60"></div>
        <div className="h-32 bg-surface-container-low rounded-2xl border border-surface-container/60"></div>
        <div className="h-32 bg-surface-container-low rounded-2xl border border-surface-container/60"></div>
      </div>

      {/* Main content table skeleton */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container/60 flex flex-col gap-4">
        <div className="h-8 w-64 bg-surface-container rounded-md"></div>
        <div className="flex flex-col gap-3 mt-2">
          <div className="h-12 w-full bg-surface-container-low rounded-xl"></div>
          <div className="h-12 w-full bg-surface-container-low rounded-xl"></div>
          <div className="h-12 w-full bg-surface-container-low rounded-xl"></div>
          <div className="h-12 w-full bg-surface-container-low rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};
