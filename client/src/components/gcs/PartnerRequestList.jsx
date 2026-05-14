import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ListRowSkeleton } from '../Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function PartnerRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeProfile, setActiveProfile] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        console.log('[PartnerRequestList] Fetching for GCS ID:', session.user.id);

        const { data, error: queryError } = await supabase
            .from('connection_requests')
            .select(`
                *,
                hospitality_profiles(*, profiles(full_name, state, lga, profile_image_url))
            `)
            .eq('gcs_id', session.user.id)
            .eq('status', 'pending');

        if (queryError) {
            console.error('[PartnerRequestList] Query error:', queryError);
            setError(queryError.message);
            toast.error(`Failed to load requests: ${queryError.message}`);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    const handleAction = async (requestId, hospitalityId, status) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 1. Update request status
            const { error: requestError } = await supabase
                .from('connection_requests')
                .update({ status, responded_at: new Date().toISOString() })
                .eq('id', requestId);

            if (requestError) throw requestError;

            // 2. If approved, link the HI profile to this GCS and initialize Chat
            if (status === 'accepted') {
                const { error: profileError } = await supabase
                    .from('hospitality_profiles')
                    .update({ primary_gcs_id: session.user.id })
                    .eq('id', hospitalityId);

                if (profileError) throw profileError;

                // 2b: Auto-create Chat Conversation
                const { data: conversation, error: convError } = await supabase
                    .from('conversations')
                    .insert({
                        gcs_id: session.user.id,
                        hospitality_id: hospitalityId
                    })
                    .select()
                    .single();
                    
                if (convError && convError.code !== '23505') { // Ignore unique constraint violation if retry
                    console.error("Conversation creation error:", convError);
                } else if (conversation) {
                    // 2c: Insert first system message
                    await supabase
                        .from('messages')
                        .insert({
                            conversation_id: conversation.id,
                            sender_id: session.user.id,
                            sender_role: 'gcs',
                            message_type: 'system',
                            content: 'Connection established. You can now communicate directly.'
                        });
                }
                
                toast.success("Partnership established!");
            } else {
                toast.success("Request declined");
            }

            setActiveProfile(null);
            fetchRequests();
        } catch (err) {
            toast.error(err.message);
        }
    };

    useEffect(() => {
        fetchRequests();

        let channel;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return;
            channel = supabase
                .channel(`gcs-requests-${session.user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'connection_requests',
                }, (payload) => {
                    fetchRequests();
                })
                .subscribe();
        });

        return () => { if (channel) channel.unsubscribe(); };
    }, []);

    if (loading) return (
        <div className="space-y-4">
            <ListRowSkeleton />
            <ListRowSkeleton />
        </div>
    );

    if (requests.length === 0) return (
        <div className="p-12 text-center rounded-[40px] border border-dashed border-ben-border bg-white/10">
            <span className="material-symbols-outlined text-4xl text-ben-muted mb-4 block">person_search</span>
            {error ? (
                <>
                    <p className="text-red-500 font-bold text-sm mb-2">Query Error</p>
                    <p className="text-red-400 text-xs font-mono mb-6">{error}</p>
                </>
            ) : (
                <p className="text-ben-muted font-serif italic text-lg mb-6">No pending partnership requests.</p>
            )}
            <button
                onClick={fetchRequests}
                className="px-6 py-2 border border-ben-border text-ben-muted rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all"
            >
                Refresh
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-end px-2">
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text transition-all"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Refresh
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((req) => (
                    <div key={req.id} className="p-8 rounded-[40px] border border-ben-border bg-white/30 backdrop-blur-md group hover:border-ben-text transition-all duration-500 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="text-2xl font-serif italic text-ben-text mb-1">
                                    {req.hospitality_profiles?.business_name || 'Unnamed Business'}
                                </h4>
                                <div className="flex gap-2">
                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        {req.hospitality_profiles?.business_type || 'Business'}
                                    </span>
                                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        {req.hospitality_profiles?.business_size || 'Standard'}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-ben-muted flex items-center gap-1 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {req.hospitality_profiles?.profiles?.lga || 'Unknown'}
                            </span>
                        </div>

                        <ul className="text-[11px] text-ben-muted mb-8 space-y-2">
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-indigo-600">delete</span> Waste: {req.hospitality_profiles?.waste_types?.slice(0, 3).join(', ')}...</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-indigo-600">schedule</span> Freq: {req.hospitality_profiles?.preferred_frequency || 'Weekly'}</li>
                        </ul>

                        <div className="flex gap-3 relative z-10">
                            <button
                                onClick={() => setActiveProfile(req)}
                                className="flex-1 py-4 bg-ben-text text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"
                            >
                                Audit Full Profile
                            </button>
                            <button
                                onClick={() => handleAction(req.id, req.hospitality_id, 'rejected')}
                                className="px-6 py-4 border border-red-100 text-red-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* HI Summary Detail Modal */}
            <AnimatePresence>
                {activeProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setActiveProfile(null)}
                            className="absolute inset-0 bg-ben-text/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[50px] border border-ben-border p-10 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                        {activeProfile.hospitality_profiles?.profiles?.profile_image_url ? (
                                            <img src={activeProfile.hospitality_profiles.profiles.profile_image_url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : <span className="material-symbols-outlined text-indigo-600">apartment</span>}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-serif italic text-ben-text">{activeProfile.hospitality_profiles.business_name}</h3>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{activeProfile.hospitality_profiles.business_type}</span>
                                            <span className="text-[10px] text-ben-muted uppercase tracking-widest">• {activeProfile.hospitality_profiles.business_size} Scale</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setActiveProfile(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="space-y-6">
                                    <div>
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-3 border-b border-indigo-50 pb-1">Operational Capacity</h5>
                                        <ul className="text-sm space-y-2 text-ben-text">
                                            <li><b>Guests:</b> {activeProfile.hospitality_profiles.avg_daily_guests || 0} / day</li>
                                            <li><b>Capacity:</b> {activeProfile.hospitality_profiles.rooms_count || 'N/A'}</li>
                                            <li><b>Staff:</b> {activeProfile.hospitality_profiles.staff_count || 0} personnel</li>
                                            <li><b>Floors:</b> {activeProfile.hospitality_profiles.floors_count} level(s)</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-3 border-b border-indigo-50 pb-1">Waste Profile</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {activeProfile.hospitality_profiles.waste_types?.map(t => (
                                                <span key={t} className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full uppercase">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-3 border-b border-indigo-50 pb-1">Service Logistics</h5>
                                        <ul className="text-sm space-y-2 text-ben-text">
                                            <li><b>Frequency:</b> {activeProfile.hospitality_profiles.preferred_frequency}</li>
                                            <li><b>Window:</b> {activeProfile.hospitality_profiles.preferred_time_window}</li>
                                            <li><b>Manifest:</b> {activeProfile.hospitality_profiles.requires_manifest ? 'Required' : 'Not Required'}</li>
                                            <li><b>Emergency:</b> {activeProfile.hospitality_profiles.emergency_collection_needed ? 'Yes' : 'No'}</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-3 border-b border-indigo-50 pb-1">Sustainability</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {activeProfile.hospitality_profiles.sustainability_practices?.slice(0, 3).map(p => (
                                                <span key={p} className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full uppercase">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-ben-bg/50 rounded-3xl border border-ben-border mb-10">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2">Access Instructions</h5>
                                <p className="text-xs text-ben-text leading-relaxed italic">
                                    "{activeProfile.hospitality_profiles.access_instructions || 'No specific instructions provided.'}"
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleAction(activeProfile.id, activeProfile.hospitality_id, 'accepted')}
                                    className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl"
                                >
                                    Accept Partnership
                                </button>
                                <button
                                    onClick={() => handleAction(activeProfile.id, activeProfile.hospitality_id, 'rejected')}
                                    className="px-10 py-5 border border-red-100 text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white"
                                >
                                    Decline
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
