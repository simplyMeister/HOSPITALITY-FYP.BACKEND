import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Skeleton, { ListRowSkeleton } from '../../components/Skeleton';
import ServiceRequests from '../../components/gcs/ServiceRequests';

const AlertRow = ({ bin, onCollect, loading }) => {
  if (loading) return <ListRowSkeleton />;
  
  return (
    <div className="flex items-center justify-between p-6 rounded-3xl border border-ben-border bg-white/40 hover:border-ben-text transition-all duration-300 group">
      <div className="flex items-center gap-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bin.fill_level_percent > 85 ? 'bg-red-500 text-white' : 'bg-ben-border text-ben-text'}`}>
              <span className="material-symbols-outlined">{bin.fill_level_percent > 85 ? 'warning' : 'notifications'}</span>
          </div>
          <div>
              <h4 className="font-serif italic text-lg text-ben-text">{bin.label || bin.bin_code}</h4>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">{bin.hospitality_profiles?.business_name}</span>
                  <span className="w-1 h-1 rounded-full bg-ben-border"></span>
                  <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">Code: {bin.bin_code}</span>
              </div>
          </div>
      </div>
      <div className="flex items-center gap-8">
          <div className="text-right">
              <span className={`text-2xl font-serif italic ${bin.fill_level_percent > 85 ? 'text-red-500' : 'text-ben-text'}`}>{bin.fill_level_percent}%</span>
              <span className="block text-[8px] uppercase font-bold tracking-widest text-ben-muted">Saturation</span>
          </div>
          <button 
            onClick={() => onCollect(bin)}
            className="w-10 h-10 rounded-full bg-ben-text text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
            title="Empty Bin"
          >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
          </button>
      </div>
  </div>
  );
};

export default function GCSDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ efficiency: '0.0', dispatch: [] });

  const fetchStats = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;
        
        const { data: recent } = await supabase.from('collections')
          .select('completed_at, hospitality_profiles(business_name)')
          .eq('gcs_id', session.user.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(3);

        const { count: completed } = await supabase.from('collections').select('*', { count: 'exact', head: true }).eq('gcs_id', session.user.id).eq('status', 'completed');
        const { count: total } = await supabase.from('collections').select('*', { count: 'exact', head: true }).eq('gcs_id', session.user.id);
        
        let eff = 0;
        if (total && total > 0) eff = (completed / total) * 100;

        let dispatch = [];
        if (recent && recent.length > 0) {
           dispatch = recent.map(r => ({
               time: new Date(r.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
               event: `Collected from ${r.hospitality_profiles?.business_name || 'Client'}`,
               status: 'Completed'
           }));
        }

        setStats({ efficiency: String(eff.toFixed(1)), dispatch });
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;

        // Fetch bins only for hospitalities connected to THIS GCS
        const { data, error } = await supabase
            .from('bins')
            .select(`
                *,
                hospitality_profiles!inner(primary_gcs_id, business_name)
            `)
            .eq('hospitality_profiles.primary_gcs_id', session.user.id)
            .gte('fill_level_percent', 80)
            .order('fill_level_percent', { ascending: false });
            
        if(error) throw error;
        if(data) setAlerts(data);
    } catch (error) {
        console.error("Error fetching scoped alerts:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchStats();

    const alertsChannel = supabase
      .channel('gcs-bin-alerts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bins'
      }, (payload) => {
        if (payload.new && payload.new.fill_level_percent > 85) {
            const isFull = payload.new.fill_level_percent >= 100;
            toast.error((t) => (
              <div className="flex flex-col gap-2">
                <span className="font-bold">{isFull ? '🛑 BIN FULL' : '🚨 CRITICAL OVERFLOW'}</span>
                <span>{isFull ? `${payload.new.label || payload.new.bin_code} is full` : `Bin ${payload.new.label || payload.new.bin_code} is almost full (${payload.new.fill_level_percent}%)`}</span>
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    handleCollection(payload.new);
                  }}
                  className="mt-1 px-3 py-1 bg-ben-text text-white rounded-full text-[9px] font-bold uppercase tracking-widest"
                >
                  Verify Collection
                </button>
              </div>
            ), {
                duration: 10000,
                id: `gcs-overflow-${payload.new.id}`
            });
        }
        fetchAlerts(); 
      })
      .subscribe();

    const partnerChannel = supabase
      .channel('gcs-partner-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hospitality_profiles'
      }, () => {
        fetchAlerts(); // Re-fetch alerts to include new partners
      })
      .subscribe();

    return () => {
        alertsChannel.unsubscribe();
        partnerChannel.unsubscribe();
    };
  }, []);

  const handleCollection = async (bin) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ben-text text-white flex items-center justify-center">
            <span className="material-symbols-outlined">delete_sweep</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-ben-text">Confirm Collection</p>
            <p className="text-[10px] text-ben-muted font-sans leading-tight">
              Verify clearance for <span className="font-bold text-ben-text">{bin.label || bin.bin_code}</span> at {bin.hospitality_profiles?.business_name}?
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              await executeCollection(bin);
            }}
            className="px-4 py-2 bg-ben-text text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Verify Now
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const executeCollection = async (bin) => {
    const loadingToast = toast.loading(`Synchronizing node ${bin.bin_code}...`);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No active session");

        await supabase.from('collections').insert({
            bin_ids: [bin.id],
            hospitality_id: bin.hospitality_id,
            gcs_id: session.user.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: `Collected ${bin.label || bin.bin_code}`
        });

        await supabase.from('bins').update({
            fill_level_percent: 0,
            status: 'active',
            last_collected_at: new Date().toISOString()
        }).eq('id', bin.id);

        await supabase.from('notifications').insert({
            recipient_id: bin.hospitality_id,
            category: 'operation',
            title: 'Collection Complete',
            message: `Your bin has been emptied by ${session.user.user_metadata?.company_name || 'your GCS provider'}.`,
            related_id: bin.id
        });

        toast.success("Collection verified. Saturation reset to 0%.", { id: loadingToast });
        fetchAlerts();
        fetchStats();
    } catch (error) {
        toast.error(error.message, { id: loadingToast });
    }
  };

  return (
    <DashboardLayout roleTitle="Ecosystem Operator / G.C.S">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 reveal">
            <div>
                 <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                     Operations <span className="text-blue-600">Center</span>
                 </h1>
                 <p className="text-ben-muted text-lg max-w-xl leading-relaxed">Coordination and route optimization for garbage collection.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2 space-y-8">
                {/* SDSS Visual Map */}

                <div className="space-y-4 reveal reveal-delay-100">
                    <div className="flex justify-between items-center mb-6 px-4">
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-ben-muted">Pending Service Requests</h3>
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Ad-hoc</span>
                    </div>
                    <ServiceRequests />
                </div>

                <div className="space-y-4 reveal reveal-delay-200">
                    <div className="flex justify-between items-center mb-6 px-4">
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-ben-muted">Urgent Bin Alerts</h3>
                        <span className="text-xs font-bold text-ben-text underline decoration-ben-border underline-offset-4">Auto-Refresh: Active</span>
                    </div>
                    {loading ? (
                        <>
                           <ListRowSkeleton />
                           <ListRowSkeleton />
                           <ListRowSkeleton />
                        </>
                    ) : (
                        alerts.length > 0 ? alerts.map((bin) => (
                             <AlertRow 
                                key={bin.id} 
                                bin={bin}
                                onCollect={handleCollection}
                            />
                        )) : (
                            <div className="p-12 text-center rounded-3xl border border-dashed border-ben-border/50 bg-white/10">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">No full bins detected. Collection routes are currently optimal.</span>
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="space-y-8">
                <div className="p-10 rounded-[40px] border border-ben-border bg-ben-text text-white relative overflow-hidden reveal-right">
                    <div className="aurora-bg absolute inset-0 opacity-20"></div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 block"><span className="text-blue-400">Fleet</span> <span className="text-indigo-400">Efficiency</span></span>
                        <div className="flex items-end gap-2 mb-8">
                            <span className="text-6xl font-serif italic">{stats.efficiency}</span>
                            <span className="text-lg font-serif italic mb-2 opacity-60">%</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="opacity-60">Active Techs</span>
                                <span>12 / 14</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="w-[86%] h-full bg-white" style={{ width: `${Math.min(100, Math.max(0, parseFloat(stats.efficiency)))}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md reveal-right reveal-delay-200">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-6"><span className="text-blue-600">Dispatch</span> <span className="text-indigo-600">Timeline</span></h4>
                    <div className="space-y-6">
                        {stats.dispatch.length > 0 ? stats.dispatch.map((t, i) => (
                            <div key={i} className="flex gap-4 group reveal">
                                <span className="text-[10px] font-bold text-ben-text w-10">{t.time}</span>
                                <div className="flex-1 flex flex-col pt-0.5">
                                    <span className="text-sm font-serif italic text-ben-text group-hover:underline underline-offset-4">{t.event}</span>
                                    <span className="text-[8px] uppercase font-bold text-ben-muted tracking-widest">{t.status}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-6 border border-dashed border-ben-border/50 rounded-2xl bg-white/10">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">0 active dispatches recorded</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
