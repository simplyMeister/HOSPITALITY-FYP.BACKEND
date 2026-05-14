import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import GlobalLoader from '../../components/GlobalLoader';

export default function HIEcoCoins() {
    const [profile, setProfile] = useState(null);
    const [hiProfile, setHiProfile] = useState(null);
    const [gcsProfile, setGcsProfile] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: profileData } = await supabase
                .from('hospitality_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileData) {
                setHiProfile(profileData);
                if (profileData.primary_gcs_id) {
                    const { data: gcs } = await supabase
                        .from('gcs_profiles')
                        .select('company_name')
                        .eq('id', profileData.primary_gcs_id)
                        .single();
                    if (gcs) setGcsProfile(gcs);
                }
            }

            const { data: paymentsData } = await supabase
                .from('payments')
                .select('*')
                .eq('hospitality_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (paymentsData) setPayments(paymentsData);
            setLoading(false);
        };
        init();
    }, []);

    if (loading) return <GlobalLoader />;

    const ecoScore = hiProfile?.eco_score || 0;
    const acceptsCoins = hiProfile?.accepts_eco_coins;
    const discountRate = hiProfile?.coin_discount_rate || 0;

    return (
        <DashboardLayout roleTitle="Partner / Hospitality">
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {/* Header */}
                <div>
                    <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                        Eco<span className="text-green-600">Coins</span>
                    </h1>
                    <p className="text-ben-muted">
                        Provider: <span className="text-ben-text font-bold">{gcsProfile?.company_name || 'Unlinked'}</span>
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-[40px] border border-ben-border bg-white/40">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-4">Eco Score</span>
                        <span className="text-5xl font-serif italic text-green-600">{ecoScore}</span>
                        <span className="text-ben-muted text-sm">/10</span>
                    </div>
                    <div className="p-8 rounded-[40px] border border-ben-border bg-white/40">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-4">Accepts Coins</span>
                        <span className={`text-2xl font-bold ${acceptsCoins ? 'text-green-600' : 'text-ben-muted'}`}>
                            {acceptsCoins ? '✓ Active' : 'Not Enabled'}
                        </span>
                    </div>
                    <div className="p-8 rounded-[40px] border border-ben-border bg-white/40">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-4">Coin Discount Rate</span>
                        <span className="text-5xl font-serif italic text-indigo-600">{discountRate}%</span>
                    </div>
                </div>

                {/* Info Banner */}
                {!acceptsCoins && (
                    <div className="p-8 rounded-[30px] bg-indigo-50 border border-indigo-100 flex items-start gap-6">
                        <span className="material-symbols-outlined text-indigo-500 text-3xl mt-1">info</span>
                        <div>
                            <p className="font-bold text-ben-text mb-2">Enable EcoCoin Rewards</p>
                            <p className="text-ben-muted text-sm leading-relaxed">
                                To accept EcoCoins from individual citizens at your establishment, enable coin acceptance in your <span className="font-bold text-indigo-600">Settings</span> page. You can configure your discount rate and reward structure there.
                            </p>
                        </div>
                    </div>
                )}

                {/* Payment/Invoice History */}
                <div>
                    <h3 className="text-2xl font-serif italic text-ben-text mb-6">Invoice History</h3>
                    {payments.length === 0 ? (
                        <div className="p-16 text-center border border-dashed border-ben-border rounded-[40px] bg-white/10">
                            <span className="material-symbols-outlined text-5xl text-ben-muted mb-4 block">receipt_long</span>
                            <p className="text-ben-muted font-serif italic">No invoices yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-6 rounded-[24px] border border-ben-border bg-white/30 hover:bg-white/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600">
                                            <span className="material-symbols-outlined text-sm">receipt</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ben-text">Invoice #{p.id?.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-[10px] text-ben-muted uppercase tracking-widest">
                                                {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-serif italic text-ben-text">₦{p.amount?.toLocaleString() || '0'}</span>
                                        <span className={`block text-[9px] font-bold uppercase tracking-widest ${p.status === 'paid' ? 'text-green-600' : 'text-amber-500'}`}>{p.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
