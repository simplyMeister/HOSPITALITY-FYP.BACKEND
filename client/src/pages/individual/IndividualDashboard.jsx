import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import Skeleton, { StatCardSkeleton, ListRowSkeleton } from '../../components/Skeleton';
import ReportDumpModal from '../../components/individual/ReportDumpModal';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, unit, trend, loading }) => {
  if (loading) return <StatCardSkeleton />;
  
  return (
    <div className="p-8 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md group hover:border-ben-text transition-all duration-500">
      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-ben-muted block mb-4">{label}</span>
      <div className="flex items-end gap-2 mb-4">
        <span className="text-7xl font-serif italic leading-none text-ben-text">{value}</span>
        <span className="text-xl font-serif italic text-green-600 mb-1">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-green-500"></span>
        <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">{trend}</span>
      </div>
    </div>
  );
};

export default function IndividualDashboard() {
  const [stats, setStats] = useState({ coins: 0, uploads: 0, weight: 0 });
  const [recentSyncs, setRecentSyncs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositForm, setDepositForm] = useState({ type: 'Plastic', weight: '' });
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const loadUserStats = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;
        setUserSession(session);
        
        const uid = session.user.id;
        
        const { data: profile } = await supabase.from('individual_profiles').select('eco_coin_balance').eq('id', uid).single();
        const { data: transactions } = await supabase
            .from('eco_coin_transactions')
            .select('*, hospitality_profiles(business_name)')
            .eq('individual_id', uid)
            .order('created_at', { ascending: false });

        if (profile) {
            setStats(s => ({ ...s, coins: profile.eco_coin_balance }));
        }
        if (transactions) {
            const earnings = transactions.filter(t => t.type === 'earned');
            
            const { data: uploads } = await supabase.from('waste_uploads').select('estimated_weight_kg').eq('individual_id', uid);
            const weightSum = uploads?.reduce((acc, u) => acc + (u.estimated_weight_kg || 0), 0) || 0;

            setStats(s => ({ ...s, uploads: earnings.length, weight: weightSum.toFixed(1) }));
            setRecentSyncs(transactions.slice(0, 10).map(t => ({
                id: t.id,
                title: t.type === 'earned' ? `${t.description || 'Waste Deposit'}` : `Merchant: ${t.hospitality_profiles?.business_name || 'Hospitality'}`,
                date: new Date(t.created_at).toLocaleDateString(),
                value: t.type === 'earned' ? `+${t.amount} ETHC` : `-${t.amount} ETHC`,
                type: t.type
            })));
        }
        setLoading(false);
    };
    loadUserStats();
  }, [showModal]);

  const handleDeposit = async (e) => {
      e.preventDefault();
      if(!userSession || !depositForm.weight) return;
      setDepositLoading(true);

      const weight = parseFloat(depositForm.weight);
      const coins = Math.floor(weight * 10);

      const { error: uploadError } = await supabase.from('waste_uploads').insert({
          individual_id: userSession.user.id,
          waste_category: depositForm.type.toLowerCase(),
          estimated_weight_kg: weight,
          coins_awarded: coins,
          status: 'pending'
      });

      if(!uploadError) {
          const newCoinTotal = stats.coins + coins;
          await supabase.from('individual_profiles')
            .update({ eco_coin_balance: newCoinTotal })
            .eq('id', userSession.user.id);
          
          toast.success(`Successfully uploaded ${weight}kg of ${depositForm.type}!`);
      } else {
          toast.error(uploadError.message);
      }

      setDepositLoading(false);
      setShowModal(false);
      setDepositForm({ type: 'Plastic', weight: '' });
  };

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoPayload, setPhotoPayload] = useState({ action: 'Recycling', photo: null });

  const handlePhotoUpload = async (e) => {
      e.preventDefault();
      if(!userSession) return;
      setPhotoLoading(true);
      const reward = 50;
      
      try {
          const { error: uploadError } = await supabase.from('waste_uploads').insert({
              individual_id: userSession.user.id,
              waste_category: 'positive_action',
              description: `Eco-Action: ${photoPayload.action}`,
              status: 'approved',
              coins_awarded: reward
          });

          if(!uploadError) {
              const newCoinTotal = stats.coins + reward;
              await supabase.from('individual_profiles')
                .update({ eco_coin_balance: newCoinTotal })
                .eq('id', userSession.user.id);
              
              toast.success(`Action Verified! +${reward} EcoCoins awarded.`, { icon: '📸' });
          }
      } catch (err) {
          toast.error("Failed to verify action.");
      } finally {
          setPhotoLoading(false);
          setShowPhotoModal(false);
          setPhotoPayload({ action: 'Recycling', photo: null });
          window.location.reload(); 
      }
  };

  return (
    <DashboardLayout roleTitle="Citizen / Individual">
      {/* Deposit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ben-bg/80 backdrop-blur-xl">
            <div className="bg-white/10 border border-ben-border p-10 rounded-[40px] shadow-2xl max-w-md w-full relative">
                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-ben-text hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h3 className="text-3xl font-serif italic text-ben-text mb-2">New Waste Deposit</h3>
                <p className="text-ben-muted text-sm mb-8">Record your waste collection to earn EcoCoins.</p>

                <form className="space-y-6" onSubmit={handleDeposit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted">Material Type</label>
                        <select 
                            value={depositForm.type}
                            onChange={(e) => setDepositForm({...depositForm, type: e.target.value})}
                            className="w-full bg-white/20 border border-ben-border rounded-xl px-6 py-4 outline-none text-ben-text focus:border-ben-text"
                        >
                            <option value="Plastic">Plastic</option>
                            <option value="Glass">Glass</option>
                            <option value="Organic">Organic Matter</option>
                            <option value="Metal">Alloy / Metal</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted">Mass (KG)</label>
                        <input 
                            type="number" step="0.1" required
                            value={depositForm.weight}
                            onChange={(e) => setDepositForm({...depositForm, weight: e.target.value})}
                            placeholder="0.0"
                            className="w-full bg-white/20 border border-ben-border rounded-xl px-6 py-4 outline-none text-ben-text focus:border-ben-text placeholder:text-ben-muted/50"
                        />
                    </div>
                    <button disabled={depositLoading} type="submit" className="w-full py-4 bg-ben-text text-white rounded-full font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4">
                        {depositLoading ? 'Processing...' : 'Complete Deposit'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Photo Reward Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ben-bg/80 backdrop-blur-xl animate-fade-in">
            <div className="bg-ben-text border border-white/10 p-10 rounded-[40px] shadow-2xl max-w-md w-full relative text-white">
                <button onClick={() => setShowPhotoModal(false)} className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-3xl text-indigo-400">camera_enhance</span>
                </div>
                <h3 className="text-3xl font-serif italic mb-2">Eco-Action Proof</h3>
                <p className="text-white/60 text-sm mb-8">Upload a photo of your contribution to earn 50 ETHC instantly.</p>

                <form className="space-y-6" onSubmit={handlePhotoUpload}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Type of Action</label>
                        <select 
                            value={photoPayload.action}
                            onChange={(e) => setPhotoPayload({...photoPayload, action: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 outline-none text-white focus:border-white/40"
                        >
                            <option value="Recycling">Recycling Plastic</option>
                            <option value="Beach Cleanup">Beach/Street Cleanup</option>
                            <option value="Tree Planting">Planting/Gardening</option>
                            <option value="Sustainable Transit">Sustainable Transit Flow</option>
                        </select>
                    </div>
                    <div className="space-y-4">
                        <div className="w-full aspect-video border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-4xl opacity-20">cloud_upload</span>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tap to Capture / Upload</p>
                            <input type="file" accept="image/*" className="hidden" />
                        </div>
                    </div>
                    <button disabled={photoLoading} type="submit" className="w-full py-5 bg-white text-ben-text rounded-full font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4">
                        {photoLoading ? 'Analyzing Model...' : 'Submit Verification'}
                    </button>
                </form>
            </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
                 <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4 text-ben-text mb-4"><span className="text-green-600">Impact</span> <span className="text-amber-600">Rewards</span></h1>
                 <p className="text-ben-muted text-lg max-w-xl leading-relaxed">Your personal dashboard for tracking contributions and rewards.</p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => setShowPhotoModal(true)} 
                    className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-[10px] tracking-widest uppercase hover:scale-105 transition-transform shadow-2xl flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    Proof of Action
                </button>
                <button 
                    onClick={() => setShowReportModal(true)} 
                    className="px-8 py-4 border border-red-500 text-red-500 rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-red-50 transition-all"
                >
                    Report Dump
                </button>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="px-8 py-4 bg-ben-text text-white rounded-full font-bold text-[10px] tracking-widest uppercase hover:scale-105 transition-transform shadow-2xl"
                >
                    New Waste Deposit
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="reveal"><StatCard loading={loading} label={<><span className="text-indigo-600">Tokenized</span> <span className="text-amber-600">Asset</span></>} value={stats.coins} unit="ETHC" trend="Available Balance" /></div>
          <div className="reveal reveal-delay-100"><StatCard loading={loading} label={<><span className="text-green-600">Diversion</span> <span className="text-blue-600">Volume</span></>} value={stats.weight} unit="KG" trend={`${stats.uploads} verified uploads`} /></div>
          <div className="reveal reveal-delay-200"><StatCard loading={loading} label={<><span className="text-indigo-600">Carbon</span> <span className="text-blue-600">Credit</span></>} value={(stats.weight * 0.12).toFixed(2)} unit="TONS" trend="System Verified" /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md reveal">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-serif italic text-ben-text"><span className="text-indigo-600">Activity</span> <span className="text-blue-600">Ledger</span></h3>
                    <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest underline decoration-ben-border underline-offset-4">Transaction History</span>
                </div>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                         <>
                            <ListRowSkeleton />
                            <ListRowSkeleton />
                            <ListRowSkeleton />
                         </>
                    ) : (
                        recentSyncs.length > 0 ? recentSyncs.map((item, i) => (
                            <div key={item.id || i} className="flex justify-between items-center py-5 border-b border-ben-border/50 last:border-0 group cursor-pointer hover:bg-white/10 px-4 rounded-2xl transition-all reveal">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'earned' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        <span className="material-symbols-outlined text-sm">{item.type === 'earned' ? 'add_circle' : 'shopping_cart'}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-serif italic text-lg text-ben-text group-hover:underline underline-offset-4">{item.title}</h4>
                                        <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">{item.date}</span>
                                    </div>
                                </div>
                                <span className={`font-serif italic text-xl ${item.type === 'earned' ? 'text-green-600' : 'text-red-500'}`}>{item.value}</span>
                            </div>
                        )) : (
                            <div className="p-12 text-center text-[10px] font-bold text-ben-muted uppercase tracking-widest border border-dashed border-ben-border/50 rounded-3xl">
                                No activity detected in the ecosystem ledger.
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="lg:col-span-2 p-10 rounded-[40px] border border-ben-border bg-ben-text text-white flex flex-col justify-between overflow-hidden relative reveal">
                <div className="aurora-bg absolute inset-0 opacity-20"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2 block">System Alert</span>
                    <h3 className="text-3xl font-serif italic leading-tight mb-6">New incentives active near your primary node.</h3>
                    <p className="opacity-70 text-sm leading-relaxed mb-8">Aluminum recovery tokens now yielding 1.5x for the next 48 hours. Connect to participate.</p>
                </div>
                <div className="relative z-10 pt-10 border-t border-white/20">
                    <button className="w-full py-4 bg-white text-ben-text rounded-full font-bold text-sm tracking-widest uppercase hover:bg-opacity-90 transition-all">
                        Map Active Centers
                    </button>
                </div>
            </div>
        </div>
        <ReportDumpModal 
            isOpen={showReportModal} 
            onClose={() => setShowReportModal(false)} 
            individualId={userSession?.user?.id}
            onReported={() => {}} 
        />
      </div>
    </DashboardLayout>
  );
}
