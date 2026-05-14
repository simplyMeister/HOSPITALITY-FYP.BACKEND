import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Skeleton, { ListRowSkeleton } from '../../components/Skeleton';

const MetricsCard = ({ label, value, subtext, loading }) => (
  <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md group hover:border-ben-text transition-all duration-700">
    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ben-muted block mb-4">{label}</span>
    {loading ? (
      <Skeleton width="180px" height="80px" className="mb-4" />
    ) : (
      <h3 className="text-7xl font-serif italic text-ben-text mb-4 lg:text-8xl">{value}</h3>
    )}
    <p className="text-ben-muted text-sm font-sans italic">
      {loading ? <Skeleton width="140px" height="14px" /> : subtext}
    </p>
  </div>
);

export default function AdminDashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({ volume: "1,204", nodes: "420", credits: "12.8M" });
  const [loading, setLoading] = useState(true);

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_approved')
      .eq('is_approved', false)
      .in('role', ['hospitality', 'gcs'])
      .limit(5);

    if (data) {
        setPendingRequests(data.map(p => ({
            id: p.id,
            name: p.full_name || 'Unnamed Node',
            type: p.role === 'gcs' ? 'G.C.S' : 'Hospitality',
            status: 'Pending Verification'
        })));
    }
  };

  const fetchStats = async () => {
    try {
        // Active Nodes
        const { count: nodesCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('role', ['hospitality', 'gcs'])
            .eq('is_approved', true);
        
        // Total Volume (from waste uploads)
        const { data: volumeData } = await supabase.from('waste_uploads').select('estimated_weight_kg');
        let totalVol = 0;
        if (volumeData) {
            totalVol = volumeData.reduce((acc, row) => acc + (row.estimated_weight_kg || 0), 0);
        }

        // Total Credits
        const { data: creditsData } = await supabase.from('eco_coin_transactions').select('amount');
        let totalCredits = 0;
        if (creditsData) {
            totalCredits = creditsData.reduce((acc, row) => acc + (Math.abs(row.amount) || 0), 0);
        }

        setStats({
            volume: totalVol.toLocaleString(undefined, { maximumFractionDigits: 1 }),
            nodes: nodesCount !== null ? nodesCount.toString() : "0",
            credits: totalCredits >= 1000000 ? (totalCredits/1000000).toFixed(1) + "M" : totalCredits.toLocaleString()
        });
    } catch (e) {
        console.error(e);
    }
  };

  const authorizeNode = async (node) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-ben-text">Authorize Partner?</p>
            <p className="text-[10px] text-ben-muted font-sans leading-tight">
              Grant <span className="font-bold text-ben-text">{node.name}</span> access to the EcoTrack ecosystem?
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text transition-colors"
          >
            Review Later
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              await executeAuthorization(node.id);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Authorize Now
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const executeAuthorization = async (id) => {
    const loadingToast = toast.loading("Verifying network identity...");
    try {
        await supabase.from('profiles').update({ is_approved: true }).eq('id', id);
        toast.success("Partner node authorized and live.", { id: loadingToast });
        fetchPendingRequests();
        fetchStats();
    } catch (error) {
        toast.error(error.message, { id: loadingToast });
    }
  };

  useEffect(() => {
    const initData = async () => {
        setLoading(true);
        await Promise.all([fetchPendingRequests(), fetchStats()]);
        setLoading(false);
    };
    initData();
  }, []);

  return (
    <DashboardLayout roleTitle="System Administrator">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
            <div>
                 <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4 lg:text-8xl"><span className="text-indigo-600">Control</span> <span className="text-blue-600">Panel</span></h1>
                 <p className="text-ben-muted text-lg max-w-xl leading-relaxed">System-wide overview of the EcoFlow partner network.</p>
            </div>
            <div className="flex gap-4">
                <button className="px-8 py-4 bg-ben-text text-white rounded-full font-bold text-sm tracking-widest uppercase hover:scale-105 transition-all shadow-2xl">
                    System Configuration
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MetricsCard loading={loading} label="Global Volume" value={stats.volume} subtext="Kilograms processed / 24h" />
            <MetricsCard loading={loading} label="Active Partners" value={stats.nodes} subtext="Operational infrastructure" />
            <MetricsCard loading={loading} label="EcoCredits" value={stats.credits} subtext="Decentralized assets issued" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-serif italic text-ben-text">Registration Requests</h3>
                    <span className="text-[10px] font-bold text-ben-text underline decoration-ben-border underline-offset-4">Identity verification in progress</span>
                </div>
                <div className="space-y-4">
                    {loading ? (
                        <>
                           <ListRowSkeleton />
                           <ListRowSkeleton />
                           <ListRowSkeleton />
                        </>
                    ) : pendingRequests.length > 0 ? pendingRequests.map((node, i) => (
                        <div key={node.id || i} className="flex justify-between items-center p-6 rounded-3xl border border-ben-border/50 bg-white/10 group cursor-pointer hover:bg-white/40 transition-all">
                            <div>
                                <h4 className="font-serif italic text-lg text-ben-text">{node.name}</h4>
                                <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">{node.type} • {node.status}</span>
                            </div>
                            <button onClick={() => authorizeNode(node)} className="px-4 py-2 border border-ben-text rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-ben-text hover:text-white transition-all">
                                Authorize
                            </button>
                        </div>
                    )) : (
                        <div className="text-center p-6 bg-white/10 rounded-3xl border border-dashed border-ben-border/50">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">All partners authorized</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-10 rounded-[40px] border border-ben-border bg-ben-text text-white overflow-hidden relative">
                <div className="aurora-bg absolute inset-0 opacity-20"></div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-serif italic mb-6">Security & Resilience</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Version</span>
                            <span className="font-serif italic text-lg">v1.2.4-stable</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Database Shard Pulse</span>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="font-serif italic text-lg text-green-400">Synchronized</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Global Threat Level</span>
                            <span className="font-serif italic text-lg">Nominal</span>
                        </div>
                    </div>
                    <div className="mt-10 pt-8 border-t border-white/10">
                        <button className="w-full py-4 bg-white/20 border border-white/20 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-white/30 transition-all">
                            System Diagnostics
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
