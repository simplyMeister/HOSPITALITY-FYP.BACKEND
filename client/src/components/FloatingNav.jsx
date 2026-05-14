import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function FloatingNav() {
  const location = useLocation();
  const path = location.pathname;
  
  // Determine current active section
  let current = 'mission';
  if (path === '/network') current = 'network';
  if (path === '/impact') current = 'impact';

  const getLinkClass = (id) => {
    const isActive = current === id;
    return `px-6 py-2.5 rounded-full flex items-center gap-2 group transition-all ${
      isActive 
      ? 'text-green-600' 
      : 'text-ben-text hover:text-green-600'
    }`;
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-fit">
      <div className="flex items-center gap-1 p-1.5 bg-white/70 backdrop-blur-2xl rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-ben-border/50">
        <Link to="/" className={getLinkClass('mission')}>
          <span className={`material-symbols-outlined text-sm group-hover:rotate-12 transition-transform ${current === 'mission' ? 'text-green-600' : ''}`}>eco</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Mission</span>
        </Link>
        <Link to="/network" className={getLinkClass('network')}>
          <span className={`material-symbols-outlined text-sm group-hover:scale-110 transition-transform ${current === 'network' ? 'text-green-600' : ''}`}>hub</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Network</span>
        </Link>
        <Link to="/impact" className={getLinkClass('impact')}>
          <span className={`material-symbols-outlined text-sm group-hover:-rotate-12 transition-transform ${current === 'impact' ? 'text-green-600' : ''}`}>insights</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Impact</span>
        </Link>
      </div>
    </div>
  );
}
