import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import GlobalLoader from '../GlobalLoader';
import { Link } from 'react-router-dom';

export default function BinGate({ children }) {
  const [hasBins, setHasBins] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBins = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { count, error } = await supabase
        .from('bins')
        .select('*', { count: 'exact', head: true })
        .eq('hospitality_id', session.user.id);
      
      if (!error) {
        setHasBins(count > 0);
      }
      setLoading(false);
    };

    checkBins();
  }, []);

  if (loading) return <GlobalLoader />;

  if (!hasBins) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-10 animate-fade-in">
        <div className="w-32 h-32 rounded-[40px] bg-indigo-600/10 flex items-center justify-center text-indigo-600 mb-10 overflow-hidden relative group">
            <div className="aurora-bg absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <span className="material-symbols-outlined text-5xl relative z-10 transition-transform group-hover:scale-110">sensors_off</span>
        </div>
        
        <h2 className="text-5xl font-serif italic text-ben-text mb-6">Hardware Integration <span className="text-blue-600">Required</span></h2>
        <p className="text-ben-muted text-lg max-w-xl mx-auto leading-relaxed mb-12">
            This workspace requires a verified <span className="text-indigo-600 font-bold">Living Infrastructure</span> connection. Please link your first bin unit from the overview dashboard to unlock real-time intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
            <Link 
                to="/hi" 
                className="inline-flex items-center gap-3 px-7 py-3 bg-green-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-green-700 hover:scale-[1.03] transition-all"
            >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Add My First Bin
            </Link>
            <Link 
                to="/hi/settings" 
                className="px-7 py-3 border border-ben-border text-ben-muted rounded-full font-bold text-[9px] uppercase tracking-widest hover:bg-white transition-all underline underline-offset-4"
            >
                Check System Settings
            </Link>
        </div>

        <div className="mt-20 pt-10 border-t border-ben-border w-full max-w-2xl">
            <div className="grid grid-cols-3 gap-8">
                <div className="opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-2">Sensor Mesh</span>
                   <span className="text-xs text-ben-text italic">Offline</span>
                </div>
                <div className="opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-2">Spatial SDSS</span>
                   <span className="text-xs text-ben-text italic">Unauthorized</span>
                </div>
                <div className="opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-2">Reward Engine</span>
                   <span className="text-xs text-ben-text italic">Cold Storage</span>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return children;
}
