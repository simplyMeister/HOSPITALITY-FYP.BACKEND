import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import GlobalLoader from '../../components/GlobalLoader';

export default function HIOperations() {
    const [profile, setProfile] = useState(null);
    const [collections, setCollections] = useState([]);
    const [gcsProfile, setGcsProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hiId, setHiId] = useState(null);
    const [requesting, setRequesting] = useState(false);

    const fetchAll = async (userId) => {
        const { data: profileData } = await supabase
            .from('hospitality_profiles')
            .select('*, gcs_profiles(company_name)')
            .eq('id', userId)
            .single();

        if (profileData) {
            setProfile(profileData);
            if (profileData.primary_gcs_id) {
                const { data: gcs } = await supabase
                    .from('gcs_profiles')
                    .select('company_name')
                    .eq('id', profileData.primary_gcs_id)
                    .single();
                if (gcs) setGcsProfile(gcs);
            }
        }

        const { data: collectionsData } = await supabase
            .from('collections')
            .select('*, gcs_profiles(company_name)')
            .eq('hospitality_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (collectionsData) setCollections(collectionsData);
        setLoading(false);
    };

    const requestPickup = async () => {
        if (!profile?.primary_gcs_id) {
            toast.error("No GCS partner connected");
            return;
        }
        setRequesting(true);
        try {
            const { error } = await supabase.from('collections').insert({
                hospitality_id: hiId,
                gcs_id: profile.primary_gcs_id,
                status: 'pending',
                notes: 'Ad-hoc pickup requested via Operations page'
            });
            if (error) throw error;
            toast.success("Pickup request sent!");
            fetchAll(hiId);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setRequesting(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setHiId(session.user.id);
                await fetchAll(session.user.id);
            }
        };
        init();
    }, []);

    if (loading) return <GlobalLoader />;

    const statusColor = {
        pending: 'text-amber-500 bg-amber-50 border-amber-200',
        in_progress: 'text-blue-500 bg-blue-50 border-blue-200',
        completed: 'text-green-600 bg-green-50 border-green-200',
    };

    const hasActiveRequest = collections.some(c => c.status === 'pending');

    return (
        <DashboardLayout roleTitle="Partner / Hospitality">
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 reveal">
                    <div>
                        <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                            Waste <span className="text-indigo-600">Operations</span>
                        </h1>
                        <p className="text-ben-muted">
                            Provider: <span className="text-ben-text font-bold">{gcsProfile?.company_name || 'Unlinked'}</span>
                        </p>
                    </div>
                    <button
                        onClick={requestPickup}
                        disabled={!profile?.primary_gcs_id || requesting || hasActiveRequest}
                        className="px-8 py-4 bg-green-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-green-700 disabled:opacity-40 transition-all shadow-xl"
                    >
                        {requesting ? 'Sending...' : hasActiveRequest ? 'Request Pending' : 'Request Pickup'}
                    </button>
                </div>

                {/* Active Request Banner */}
                {collections.find(c => c.status === 'pending') && (
                    <div className="p-8 rounded-[40px] bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl animate-fade-in group">
                        <div className="aurora-bg absolute inset-0 opacity-30 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                <span className="material-symbols-outlined text-4xl animate-bounce">hourglass_empty</span>
                            </div>
                            <div>
                                <h4 className="text-2xl font-serif italic mb-1">Request under review.</h4>
                                <p className="text-white/70 text-sm max-w-sm">
                                    The <span className="text-white font-bold">{gcsProfile?.company_name || 'Service'}</span> team is reviewing your request. You'll be notified as soon as they're en route.
                                </p>
                            </div>
                        </div>
                        <div className="relative z-10 hidden md:block">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Operational Logic: Active</span>
                        </div>
                    </div>
                )}

                {/* Collections History */}
                <div className="reveal reveal-delay-200">
                    <h3 className="text-2xl font-serif italic text-ben-text mb-6">Collection History</h3>
                    {collections.length === 0 ? (
                        <div className="p-16 text-center border border-dashed border-ben-border rounded-[40px] bg-white/10 reveal">
                            <span className="material-symbols-outlined text-5xl text-ben-muted mb-4 block">inbox</span>
                            <p className="text-ben-muted font-serif italic">No collections recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {collections.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-6 rounded-[24px] border border-ben-border bg-white/30 hover:bg-white/50 transition-all reveal-scale">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <span className="material-symbols-outlined text-sm">local_shipping</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ben-text">{c.notes || 'Routine Collection'}</p>
                                            <p className="text-[10px] text-ben-muted uppercase tracking-widest">
                                                {c.gcs_profiles?.company_name || 'Service Partner'} • {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${statusColor[c.status] || 'bg-white border-ben-border text-ben-muted'}`}>
                                        {c.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
