import React from 'react';

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-ben-bg flex items-center justify-center">
      <div className="relative text-center">
        <div className="text-4xl font-serif font-black tracking-tighter text-ben-text mb-4 animate-pulse">
          Eco<span className="text-green-600">Flow</span>
        </div>
        <div className="flex justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
