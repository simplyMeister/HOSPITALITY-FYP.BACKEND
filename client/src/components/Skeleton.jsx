import React from 'react';

export default function Skeleton({ className, width, height, circle }) {
  const style = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius: circle ? '50%' : undefined,
  };

  return (
    <div 
      className={`skeleton ${className || ''}`} 
      style={style}
    />
  );
}

// Pre-defined variants for common UI patterns
export const StatCardSkeleton = () => (
  <div className="p-8 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
    <Skeleton width="80px" height="12px" className="mb-4" />
    <div className="flex items-end gap-2 mb-4">
      <Skeleton width="120px" height="60px" />
      <Skeleton width="40px" height="24px" className="mb-2" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton circle width="6px" height="6px" />
      <Skeleton width="100px" height="10px" />
    </div>
  </div>
);

export const ListRowSkeleton = () => (
  <div className="flex items-center justify-between p-6 rounded-3xl border border-ben-border bg-white/40">
    <div className="flex items-center gap-6">
      <Skeleton width="48px" height="48px" className="rounded-2xl" />
      <div className="space-y-2">
        <Skeleton width="180px" height="20px" />
        <Skeleton width="100px" height="12px" />
      </div>
    </div>
    <Skeleton width="60px" height="30px" />
  </div>
);

export const BinCardSkeleton = () => (
  <div className="p-8 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
    <div className="flex justify-between items-start mb-10">
        <div className="space-y-2">
            <Skeleton width="140px" height="24px" />
            <Skeleton width="80px" height="10px" />
        </div>
        <Skeleton width="60px" height="20px" className="rounded-full" />
    </div>
    <div className="flex justify-center mb-8">
        <Skeleton circle width="140px" height="140px" />
    </div>
    <div className="flex justify-between items-center pt-6 border-t border-ben-border/50">
        <Skeleton width="100px" height="10px" />
        <Skeleton width="60px" height="14px" />
    </div>
  </div>
);
