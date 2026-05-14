import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import Skeleton, { BinCardSkeleton } from '../../components/Skeleton';
import GCSSelector from '../../components/hi/GCSSelector';
import GCSPartnerCatalog from '../../components/hi/GCSPartnerCatalog';
import EcoCoinTerminal from '../../components/hi/EcoCoinTerminal';
import AddBinModal from '../../components/hi/AddBinModal';
import RateProviderModal from '../../components/hi/RateProviderModal';
import toast from 'react-hot-toast';
import GlobalLoader from '../../components/GlobalLoader';

const BinCard = ({ name, fill, type, health, weight, temp, loading, onSync }) => {
  if (loading) return <BinCardSkeleton />;
  
  return (
    <div className="p-8 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md group hover:border-ben-text transition-all duration-700">
      <div className="flex justify-between items-start mb-6">
          <div>
              <h4 className="text-2xl font-serif italic text-ben-text mb-1">{name}</h4>
              <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">{type} Protocol</span>
          </div>
          <div className={`px-3 py-1 rounded-full border border-ben-border flex items-center gap-2 ${health === 'Healthy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${health === 'Healthy' ? 'bg-green-500' : 'bg-red-500'} ${health !== 'Healthy' && 'animate-pulse'}`}></span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-ben-text">{health}</span>
          </div>
      </div>
      
      <div className="flex gap-4 mb-8">
          <div className="flex-1 p-4 rounded-2xl bg-white/10 border border-ben-border/50 text-center">
              <span className="block text-[10px] uppercase font-bold text-ben-muted tracking-widest mb-1">Weight</span>
              <span className="text-xl font-serif italic text-ben-text">{weight || '0'}kg</span>
          </div>
          <div className="flex-1 p-4 rounded-2xl bg-white/10 border border-ben-border/50 text-center">
              <span className="block text-[10px] uppercase font-bold text-ben-muted tracking-widest mb-1">Temp</span>
              <span className="text-xl font-serif italic text-ben-text">{temp || '24'}°C</span>
          </div>
      </div>

      <div className="flex flex-col items-center mb-8 py-4">
          <div className="w-20 h-40 border-2 border-ben-border rounded-2xl relative p-1.5 flex items-end overflow-hidden group-hover:border-ben-text transition-colors duration-700">
              <div 
                  className={`w-full rounded-xl transition-all duration-1000 relative ${fill > 80 ? 'bg-red-500' : 'bg-ben-text'}`}
                  style={{ height: `${fill}%` }}
              >
                  <div className={`absolute inset-0 blur-md opacity-20 ${fill > 80 ? 'bg-red-500' : 'bg-ben-text'}`}></div>
              </div>
              <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-8 h-[6px] bg-ben-border rounded-t-md group-hover:bg-ben-text transition-colors duration-700" />
          </div>
          
          <div className="mt-8 flex flex-col items-center text-center">
              <span className="text-4xl font-serif italic text-ben-text tracking-tighter">{fill}%</span>
              <span className="text-[10px] uppercase font-bold text-ben-muted tracking-[0.2em] mt-2">Filled-up</span>
          </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-ben-border/50">
          <span className="text-[10px] font-bold text-ben-muted uppercase tracking-[0.2em]">Real-time Telemetry</span>
          <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full border border-green-100 italic">Wokwi Active</span>
      </div>
    </div>
  );
};

export default function HIDashboard() {
  const [profile, setProfile] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiId, setHiId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState([]);
  const [isAddBinOpen, setIsAddBinOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [gcsProfile, setGcsProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const [chartData, setChartData] = useState(Array(7).fill({ day: '', value: 0, percentage: 0 }));
  const [collectionHistory, setCollectionHistory] = useState([]);

  const fetchAnalytics = async (userId) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: collections } = await supabase
          .from('collection_records')
          .select('completed_at')
          .eq('hospitality_id', userId)
          .gte('completed_at', sevenDaysAgo.toISOString());

      const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
              dateString: d.toISOString().split('T')[0],
              day: d.toLocaleDateString('en-US', { weekday: 'short' }),
              value: 0
          };
      });

      if (collections) {
          collections.forEach(col => {
              const dateString = new Date(col.completed_at).toISOString().split('T')[0];
              const dayObj = last7Days.find(d => d.dateString === dateString);
              if (dayObj) {
                  dayObj.value += 40; 
              }
          });
      }

      let maxVal = Math.max(...last7Days.map(d => d.value));
      if (maxVal === 0) maxVal = 1; // Prevent division by zero

      setChartData(last7Days.map(d => ({
          day: d.day,
          value: d.value,
          percentage: d.value > 0 ? Math.min(100, Math.max(5, (d.value / maxVal) * 100)) : 0
      })));
  };

  const fetchCollectionHistory = async (userId) => {
      const { data } = await supabase
          .from('collections')
          .select('completed_at, notes, gcs_profiles(company_name)')
          .eq('hospitality_id', userId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(10);
      if (data) setCollectionHistory(data);
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('hospitality_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
      if (data.primary_gcs_id) {
        const { data: gcs } = await supabase
          .from('gcs_profiles')
          .select('company_name, starting_price, pricing_model')
          .eq('id', data.primary_gcs_id)
          .single();
        if (gcs) setGcsProfile(gcs);
      } else {
        setGcsProfile(null);
      }
    }
  };

  const fetchBins = async (userId) => {
    setLoading(true);
    const { data } = await supabase.from('bins').select('*').eq('hospitality_id', userId);
    if(data) setBins(data);
    setLoading(false);
  };

  const fetchPayments = async (userId) => {
    const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('hospitality_id', userId)
        .order('created_at', { ascending: false });
    if(data) setPayments(data);
  };

  const fetchConnectionRequest = async (userId) => {
    const { data } = await supabase
        .from('connection_requests')
        .select('*, gcs_profiles(company_name)')
        .eq('hospitality_id', userId)
        .single();
    if (data) setPendingRequest(data);
    else setPendingRequest(null);
  };

  const subscribeToBins = (userId) => {
    supabase
      .channel('bin-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bins',
        filter: `hospitality_id=eq.${userId}`
      }, (payload) => {
        const isFull = payload.new.fill_level_percent >= 100;
        if (payload.new.fill_level_percent > 85) {
            toast.error(
                isFull 
                ? `Bin ${payload.new.label || payload.new.bin_code} is full`
                : `Urgent: Bin ${payload.new.label || payload.new.bin_code} is almost full (${payload.new.fill_level_percent}%)`, 
                {
                    icon: isFull ? '🛑' : '⚠️',
                    duration: Infinity,
                    id: `overflow-${payload.new.id}`
                }
            );
        }
        setBins((current) =>
             current.map((bin) => bin.id === payload.new.id ? payload.new : bin)
        );
      })
      .subscribe();
  };

  const subscribeToPayments = (userId) => {
    supabase
      .channel('payment-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payments',
        filter: `hospitality_id=eq.${userId}`
      }, (payload) => {
        setPayments(prev => [payload.new, ...prev]);
        toast.success("New invoice generated from GCS", { icon: '💳' });
      })
      .subscribe();
  };

  const subscribeToRequests = (userId) => {
    supabase
      .channel('request-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'connection_requests',
        filter: `hospitality_id=eq.${userId}`
      }, (payload) => {
        fetchConnectionRequest(userId);
        fetchProfile(userId);
      })
      .subscribe();
  };

  const requestPickup = async () => {
      if (!profile?.primary_gcs_id) {
          toast.error("No GCS partner connected");
          return;
      }

      try {
          const { error } = await supabase
              .from('collections')
              .insert({
                  hospitality_id: hiId,
                  gcs_id: profile.primary_gcs_id,
                  status: 'pending',
                  notes: 'Ad-hoc pickup requested via HI Dashboard'
              });

          if (error) throw error;
          toast.success("Pickup request sent to GCS!");
      } catch (error) {
          toast.error(error.message);
      }
  };

  const handleDisconnectGCS = async () => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">link_off</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-ben-text">Disconnect Provider?</p>
            <p className="text-[10px] text-ben-muted font-sans leading-tight">
              You will lose real-time telemetry from <span className="font-bold text-ben-text">{gcsProfile?.company_name}</span>.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text transition-colors"
          >
            Stay Connected
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              await executeDisconnect();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Confirm Disconnect
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const executeDisconnect = async () => {
      const loadingToast = toast.loading("Disconnecting service node...");
      try {
          await supabase.from('connection_requests').delete().eq('hospitality_id', hiId);
          const { error } = await supabase
              .from('hospitality_profiles')
              .update({ primary_gcs_id: null })
              .eq('id', hiId);

          if (error) throw error;
          
          toast.success("Disconnected from GCS Partner", { id: loadingToast });
          fetchProfile(hiId);
          fetchConnectionRequest(hiId);
      } catch (error) {
          toast.error(error.message, { id: loadingToast });
      }
  };

  useEffect(() => {
    const initData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setHiId(session.user.id);
            await fetchProfile(session.user.id);
            await fetchAnalytics(session.user.id);
            await fetchCollectionHistory(session.user.id);
            await fetchConnectionRequest(session.user.id);
            fetchBins(session.user.id);
            fetchPayments(session.user.id);
            subscribeToBins(session.user.id);
            subscribeToRequests(session.user.id);
            subscribeToPayments(session.user.id);
        }
    };
    initData();

    return () => {
        supabase.removeAllChannels();
    };
  }, []);

  if (loading) return <GlobalLoader />;

  if (profile && !profile.primary_gcs_id && !pendingRequest) {
      return (
          <div className="min-h-screen bg-ben-bg flex items-center justify-center p-6 selection:bg-ben-text selection:text-white">
              <div className="absolute top-6 right-10 z-[110]">
                  <button 
                    onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ben-muted hover:text-red-500 transition-colors"
                  >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Sign Out
                  </button>
              </div>
              <GCSSelector onSelected={() => fetchConnectionRequest(hiId)} />
          </div>
      );
  }

  if (pendingRequest?.status === 'pending' && !profile?.primary_gcs_id) {
      return (
          <div className="min-h-screen bg-ben-bg flex items-center justify-center p-6 selection:bg-ben-text selection:text-white">
              <div className="absolute top-6 right-10 z-[110]">
                  <button 
                    onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ben-muted hover:text-red-500 transition-colors"
                  >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Sign Out
                  </button>
              </div>
              <div className="w-full max-w-2xl bg-white/60 rounded-[50px] border border-ben-border p-12 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-indigo-600/10 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-10 animate-pulse">
                        <span className="material-symbols-outlined text-5xl">hourglass_empty</span>
                    </div>
                    <h2 className="text-5xl font-serif italic text-ben-text mb-6">Awaiting <span className="text-indigo-600">Verification</span></h2>
                    <p className="text-ben-muted text-lg leading-relaxed mb-10">
                        Your request to link with <span className="text-ben-text font-bold uppercase tracking-wider">{pendingRequest.gcs_profiles?.company_name}</span> is currently being reviewed by their operations team.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={async () => {
                                await supabase.from('connection_requests').delete().eq('hospitality_id', hiId);
                                fetchConnectionRequest(hiId);
                            }}
                            className="px-8 py-3 border border-ben-border text-ben-muted rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                        >
                            Cancel Request
                        </button>
                    </div>
                </div>
              </div>
          </div>
      );
  }

  if (!profile?.primary_gcs_id && pendingRequest) {
      return (
          <div className="min-h-screen bg-ben-bg flex items-center justify-center p-6 selection:bg-ben-text selection:text-white">
              <div className="absolute top-6 right-10 z-[110]">
                  <button 
                    onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ben-muted hover:text-red-500 transition-colors"
                  >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Sign Out
                  </button>
              </div>

              {pendingRequest.status === 'accepted' ? (
                  <div className="w-full max-w-2xl bg-white/60 rounded-[50px] border border-indigo-200 p-12 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-green-500/10 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-10">
                            <span className="material-symbols-outlined text-5xl">sync_problem</span>
                        </div>
                        <h2 className="text-4xl font-serif italic text-ben-text mb-6">Sync <span className="text-green-600">Issue</span></h2>
                        <p className="text-ben-muted text-lg leading-relaxed mb-4">
                            Your request was approved by <span className="text-ben-text font-bold">{pendingRequest.gcs_profiles?.company_name}</span>, but the profile link did not finalize correctly.
                        </p>
                        <p className="text-ben-muted text-sm mb-10">Click below to re-sync your connection.</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={async () => {
                                    await supabase.from('hospitality_profiles').update({ primary_gcs_id: pendingRequest.gcs_id }).eq('id', hiId);
                                    fetchProfile(hiId);
                                    fetchConnectionRequest(hiId);
                                }}
                                className="px-8 py-3 bg-ben-text text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"
                            >
                                Re-sync Connection
                            </button>
                            <button
                                onClick={async () => {
                                    await supabase.from('connection_requests').delete().eq('hospitality_id', hiId);
                                    await supabase.from('hospitality_profiles').update({ primary_gcs_id: null }).eq('id', hiId);
                                    fetchProfile(hiId);
                                    fetchConnectionRequest(hiId);
                                }}
                                className="px-8 py-3 border border-ben-border text-ben-muted rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                            >
                                Reset & Start Over
                            </button>
                        </div>
                    </div>
                  </div>
              ) : pendingRequest.status === 'rejected' ? (
                  <div className="w-full max-w-2xl bg-white rounded-[50px] border border-red-100 p-12 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <span className="material-symbols-outlined text-4xl">error</span>
                        </div>
                        <h2 className="text-4xl font-serif italic text-ben-text mb-6">Request <span className="text-red-500">Declined</span></h2>
                        <p className="text-ben-muted mb-10">
                            Unfortunately, the provider was unable to fulfill your request at this time. Please select a different GCS partner.
                        </p>
                        <button 
                            onClick={async () => {
                                await supabase.from('connection_requests').delete().eq('hospitality_id', hiId);
                                fetchConnectionRequest(hiId);
                            }}
                            className="px-10 py-4 bg-ben-text text-white rounded-full font-bold text-[10px] uppercase tracking-widest"
                        >
                            Try Another Partner
                        </button>
                  </div>
              ) : null}
          </div>
      );
  }

  return (
    <DashboardLayout roleTitle="Partner / Hospitality">
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
                 <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                     Partner <span className="text-indigo-600">Center</span>
                 </h1>
                 <p className="text-ben-muted text-lg max-w-xl leading-relaxed flex flex-wrap items-center gap-3">
                     <span>Connected to: <span className="text-ben-text font-bold">{gcsProfile?.company_name || (profile?.primary_gcs_id ? 'Verified Provider' : 'Unlinked')}</span></span>
                     {profile?.primary_gcs_id && (
                         <button 
                            onClick={handleDisconnectGCS}
                            className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                         >
                             (Disconnect)
                         </button>
                     )}
                 </p>
                 {profile?.primary_gcs_id && gcsProfile && (
                     <div className="flex gap-2 mt-4 animate-fade-in">
                        {gcsProfile.pricing_model && <span className="px-3 py-1 bg-indigo-50 text-[9px] font-bold uppercase tracking-widest text-indigo-600 rounded-full border border-indigo-100">{gcsProfile.pricing_model}</span>}
                        {gcsProfile.starting_price && <span className="px-3 py-1 bg-amber-50 text-[9px] font-bold uppercase tracking-widest text-amber-600 rounded-full border border-amber-100">Agreed Rate: ₦{gcsProfile.starting_price}</span>}
                     </div>
                 )}
            </div>
            <div className="flex flex-wrap gap-3">
                <button 
                    disabled={!profile?.primary_gcs_id}
                    onClick={() => setIsAddBinOpen(true)}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-full font-bold text-[9px] tracking-widest uppercase transition-all disabled:opacity-50 hover:bg-green-700"
                >
                    Add Bin Unit
                </button>
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-2.5 rounded-full font-bold text-[9px] tracking-widest uppercase transition-all ${
                        activeTab === 'overview' 
                        ? 'bg-indigo-600 text-white' 
                        : 'border border-ben-border text-ben-text bg-white/60 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('partners')}
                    className={`px-5 py-2.5 rounded-full font-bold text-[9px] tracking-widest uppercase transition-all ${
                        activeTab === 'partners' 
                        ? 'bg-indigo-600 text-white' 
                        : 'border border-ben-border text-ben-text bg-white/60 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                >
                    Partners
                </button>
            </div>
        </div>

        {activeTab === 'overview' && (
            <div className="space-y-12 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {bins.length > 0 ? bins.map((bin) => (
                        <BinCard 
                            key={bin.id} 
                            name={bin.label || bin.bin_code} 
                            fill={bin.fill_level_percent} 
                            weight={bin.weight_kg}
                            temp={bin.temperature_c}
                            type={bin.bin_type || 'General'} 
                            health={bin.status === 'alert' ? 'Action Required' : 'Healthy'} 
                            onSync={null}
                        />
                    )) : (
                        <div className="col-span-3 p-20 text-center border-t border-ben-border border-dashed rounded-[40px] bg-white/10">
                            <span className="material-symbols-outlined text-5xl text-ben-muted mb-4 block">sensors_off</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">
                                {profile?.primary_gcs_id 
                                    ? "No Living Bins linked to this center. Initialize first bin unit to begin." 
                                    : "Link a GCS Partner to unlock hardware integration."}
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-serif italic text-indigo-600">Ecological Intelligence</h3>
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-ben-muted italic">Volume processed / 7 days</span>
                        </div>
                    </div>
                    <div className="h-64 flex items-end gap-4 px-4">
                        {chartData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="w-full relative bg-ben-border/30 rounded-full flex items-end overflow-hidden h-full">
                                    <div 
                                        className="w-full bg-ben-text group-hover:bg-green-600 transition-all duration-700 relative" 
                                        style={{ height: `${d.percentage}%` }}
                                    >
                                        <div className="absolute opacity-0 group-hover:opacity-100 -top-8 left-1/2 -translate-x-1/2 bg-ben-text text-white text-[9px] px-2 py-1 rounded whitespace-nowrap transition-opacity">{d.value} kg</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Collection History Section */}
                <div className="p-10 rounded-[40px] border border-ben-border bg-white/40 shadow-xl overflow-hidden animate-fade-in mt-12">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-serif italic text-ben-text">Collection <span className="text-indigo-600">History</span></h3>
                        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-ben-muted italic">Recent Pickups</span>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {collectionHistory.length > 0 ? collectionHistory.map((col, idx) => (
                            <div key={idx} className="flex justify-between items-center p-6 rounded-3xl bg-white/30 border border-ben-border/50 hover:border-indigo-600/30 transition-all">
                                <div>
                                    <span className="block text-xs font-bold text-ben-text mb-1 uppercase tracking-widest">Collection Event</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-ben-muted uppercase tracking-widest">{new Date(col.completed_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-bold text-ben-text text-indigo-600">{col.gcs_profiles?.company_name || 'GCS Provider'}</span>
                                    <span className="text-[8px] uppercase font-bold text-ben-muted">{col.notes || 'Cleared & Resolved'}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center bg-ben-bg/50 rounded-3xl border border-dashed border-ben-border/50">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">0 Collection records found</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'partners' && (
            <div className="animate-fade-in space-y-8">
                <div className="flex justify-between items-center px-4">
                    <h3 className="text-3xl font-serif italic text-ben-text">GCS Partner <span className="text-indigo-600">Directory</span></h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">Verified Infrastructure Providers</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <GCSPartnerCatalog 
                        onSelected={() => fetchProfile(hiId)} 
                        currentGcsId={profile?.primary_gcs_id}
                        onDisconnect={handleDisconnectGCS}
                    />
                </div>
            </div>
        )}

        {activeTab === 'operations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <div className="p-10 rounded-[40px] border border-ben-border bg-white/40 shadow-xl">
                    <h3 className="text-2xl font-serif italic text-ben-text mb-8">Ad-hoc Service Request</h3>
                    <p className="text-ben-muted text-sm mb-10 leading-relaxed font-sans">Request an emergency pickup outside your regular schedule. Surcharge may apply based on your current GCS contract.</p>
                    <button 
                        onClick={requestPickup}
                        className="w-full py-5 bg-ben-text text-white rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                        Request Immediate Pickup
                    </button>
                    <div className="mt-8 pt-8 border-t border-ben-border flex justify-between items-center px-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">Provider Performance</span>
                            <button 
                                onClick={() => setIsRateModalOpen(true)}
                                className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest mt-1 text-left"
                            >
                                Rate Review →
                            </button>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-green-600">Available</span>
                    </div>
                </div>

                <div className="p-10 rounded-[40px] border border-ben-border bg-white/40 overflow-hidden">
                    <h3 className="text-2xl font-serif italic text-ben-text mb-8">Service Payment History</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {payments.length > 0 ? payments.map((pay) => (
                            <div key={pay.id} className="flex justify-between items-center p-6 rounded-3xl bg-white/30 border border-ben-border/50 hover:border-indigo-600/30 transition-all">
                                <div>
                                    <span className="block text-xs font-bold text-ben-text mb-1 uppercase tracking-widest">{pay.payment_reference}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-ben-muted uppercase tracking-widest">{new Date(pay.created_at).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-ben-border"></span>
                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${pay.status === 'successful' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {pay.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-lg font-serif italic text-ben-text">₦{pay.amount.toLocaleString()}</span>
                                    <button className="text-[8px] font-bold uppercase text-indigo-600 hover:underline">Download Receipt</button>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center bg-ben-bg/50 rounded-3xl border border-dashed border-ben-border/50">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">No transaction history found</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'rewards' && (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <EcoCoinTerminal hospitalityId={hiId} />
            </div>
        )}

        <AddBinModal 
            hiId={hiId}
            isOpen={isAddBinOpen}
            onClose={() => setIsAddBinOpen(false)}
            onAdded={() => fetchBins(hiId)}
        />

        <RateProviderModal 
            isOpen={isRateModalOpen}
            onClose={() => setIsRateModalOpen(false)}
            gcsId={profile?.primary_gcs_id}
            hospitalityId={hiId}
            onRated={() => fetchProfile(hiId)}
        />
      </div>
    </DashboardLayout>
  );
}
