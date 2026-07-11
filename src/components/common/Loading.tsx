import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  type?: 'spinner' | 'skeleton-grid' | 'full-page';
  count?: number;
}

export const Loading: React.FC<LoadingProps> = ({ type = 'spinner', count = 3 }) => {
  if (type === 'full-page') {
    return (
      <div className="fixed inset-0 bg-slate-50/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-slate-100 shadow-xl">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Connecting to CampusConnect...</p>
        </div>
      </div>
    );
  }

  if (type === 'skeleton-grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-100 rounded-xl overflow-hidden p-4 flex flex-col gap-3 shadow-sm"
          >
            {/* Image Placeholder */}
            <div className="w-full h-44 bg-slate-100 rounded-lg animate-pulse" />
            {/* Meta Placeholder */}
            <div className="flex gap-2">
              <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
            </div>
            {/* Title Placeholder */}
            <div className="w-4/5 h-6 bg-slate-100 rounded animate-pulse mt-1" />
            {/* Description Placeholder */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="w-full h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-5/6 h-4 bg-slate-100 rounded animate-pulse" />
            </div>
            {/* Footer Placeholder */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
              <div className="w-20 h-5 bg-slate-100 rounded animate-pulse" />
              <div className="w-24 h-8 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
    </div>
  );
};

export default Loading;
