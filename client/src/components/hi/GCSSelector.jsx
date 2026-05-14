import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function GCSSelector({ onSelected }) {
    const [gcsList, setGcsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeProfile, setActiveProfile] = useState(null);

    useEffect(() => {
        const fetchGCS = async () => {
            // Added explicit filter: only fully completed profiles appear
            const { data, error } = await supabase
                .from('gcs_profiles')
                .select('*, profiles(full_name, state, lga)')
                .eq('is_profile_complete', true);
            
            if (error) {
                toast.error("Failed to load GCS partners");
            } else {
                setGcsList(data);
            }
            setLoading(false);
        };
        fetchGCS();
    }, []);

    const handleSelect = async (gcsId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Insert a connection request instead of updating profile directly
            const { error } = await supabase
                .from('connection_requests')
                .insert([
                    { 
                        hospitality_id: session.user.id, 
                        gcs_id: gcsId, 
                        status: 'pending' 
                    }
                ]);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    toast.error("You already have a pending or active request.");
                } else {
                    throw error;
                }
                return;
            }
            
            toast.success("Connection request sent to GCS Partner");
            setActiveProfile(null);
            onSelected(gcsId);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-ben-bg flex items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-white/60 rounded-[50px] border border-ben-border p-12 shadow-[0_50px_150px_rgba(0,0,0,0.15)] relative overflow-hidden">


                <div className="relative z-10">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4 block animate-fade-in">Step 01 — Infrastructure Linkage</span>
                        <h2 className="text-5xl md:text-6xl font-serif italic tracking-tighter text-ben-text mb-6">Connect to <span className="text-blue-600">GCS Provider</span></h2>
                        <p className="text-ben-muted text-lg max-w-2xl mx-auto font-sans leading-relaxed">
                            To activate your Living Bin dashboard, you must establish a <span className="text-indigo-600 font-bold">Resilient Resource Link</span> with a verified Garbage Collection Service.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-40 bg-ben-border/20 rounded-[30px] animate-pulse"></div>
                            ))
                        ) : gcsList.length > 0 ? gcsList.map((gcs) => (
                            <div 
                                key={gcs.id}
                                className="group p-8 rounded-[30px] border border-ben-border bg-white/40 hover:border-ben-text transition-all duration-500 cursor-pointer flex flex-col justify-between hover:shadow-xl"
                                onClick={() => setActiveProfile(gcs)}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-serif italic text-ben-text">{gcs.company_name}</h3>
                                            <p className="text-xs text-ben-muted line-clamp-1">{gcs.tagline}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
                                            <span className="material-symbols-outlined text-sm shrink-0">star</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{gcs.average_rating || '5.0'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="px-3 py-1 bg-blue-500/10 text-[9px] font-bold uppercase tracking-widest text-blue-600 rounded-full border border-blue-500/20">
                                            {gcs.office_address ? gcs.office_address.split(',')[0] : (gcs.profiles?.lga || 'Region A')}
                                        </span>
                                        <span className="px-3 py-1 bg-green-500/10 text-[9px] font-bold uppercase tracking-widest text-green-600 rounded-full border border-green-500/20">
                                            Fleet: {gcs.fleet_size || '1'}
                                        </span>
                                        {gcs.pricing_model && (
                                            <span className="px-3 py-1 bg-indigo-50 text-[9px] font-bold uppercase tracking-widest text-indigo-600 rounded-full border border-indigo-100">
                                                {gcs.pricing_model}
                                            </span>
                                        )}
                                        {gcs.starting_price && (
                                            <span className="px-3 py-1 bg-amber-50 text-[9px] font-bold uppercase tracking-widest text-amber-600 rounded-full border border-amber-100">
                                                Rate: ₦{gcs.starting_price}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-ben-text text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all group-hover:bg-indigo-600 group-hover:shadow-lg flex items-center justify-center gap-2">
                                    View Detailed Profile <span className="material-symbols-outlined text-[12px]">visibility</span>
                                </button>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-20 bg-white/40 border border-ben-border rounded-[30px]">
                                <span className="material-symbols-outlined text-4xl text-ben-muted mb-4 block">search_off</span>
                                <p className="text-ben-muted font-serif italic text-2xl">No verified GCS providers available yet.</p>
                                <p className="text-sm text-ben-muted mt-2">Only providers with 100% completed profiles appear here.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ben-muted italic">
                            Connecting to the EcoTrack network...
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Detail Modal Layer */}
            {activeProfile && (
                <div className="fixed inset-0 z-[120] bg-ben-text/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setActiveProfile(null)}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[40px] border border-ben-border p-10 shadow-2xl animate-fade-in [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-3xl font-serif italic text-ben-text mb-1">{activeProfile.company_name}</h3>
                                    {activeProfile.is_admin_verified && (
                                        <span className="material-symbols-outlined text-blue-600" title="Admin Verified">verified</span>
                                    )}
                                </div>
                                <p className="text-sm text-ben-muted">{activeProfile.tagline}</p>
                            </div>
                            <button onClick={() => setActiveProfile(null)} className="w-10 h-10 rounded-full bg-ben-bg flex items-center justify-center text-ben-text hover:bg-red-50 hover:text-red-600 transition-colors shrink-0">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8 bg-ben-bg/50 p-6 rounded-3xl border border-ben-border">
                            <div className="space-y-6">
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2 border-b border-ben-border pb-1">Coverage & Response</h5>
                                    <ul className="text-sm text-ben-text space-y-2 mt-2">
                                        <li><b>Radius: </b> {activeProfile.max_service_radius_km ? `${activeProfile.max_service_radius_km}km` : 'Standard'}</li>
                                        <li><b>Response Time: </b> {activeProfile.avg_response_time || 'Standard SLA'}</li>
                                        <li className="flex items-center gap-1"><b>Online Payment: </b> {activeProfile.accepts_online_payment ? <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span> : <span className="material-symbols-outlined text-ben-muted text-sm">cancel</span>}</li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2 border-b border-ben-border pb-1">Pricing Logic</h5>
                                    <ul className="text-sm text-ben-text space-y-2 mt-2">
                                        <li><b>Model: </b> {activeProfile.pricing_model || 'Quote Based'}</li>
                                        <li><b>Starting Price: </b> {activeProfile.starting_price ? `₦${activeProfile.starting_price}` : 'Not Specified'}</li>
                                        <li><b>Invoice Cycle: </b> {activeProfile.invoice_cycle || 'Monthly'}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2 border-b border-ben-border pb-1">Operational Capacity</h5>
                                    <ul className="text-sm text-ben-text space-y-2 mt-2">
                                        <li><b>Fleet Size: </b> {activeProfile.fleet_size || 1} active units</li>
                                        <li><b>Field Techs: </b> {activeProfile.worker_count || 'N/A'} personnel</li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-3">Service Focus</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {activeProfile.service_types && activeProfile.service_types.length > 0 ? activeProfile.service_types.map(t => (
                                            <span key={t} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-[8px] font-bold uppercase tracking-widest text-indigo-700 rounded-full">{t}</span>
                                        )) : <span className="text-xs text-ben-muted">General Waste Default</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-ben-border text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-4 opacity-60">HQ: {activeProfile.office_address} | {activeProfile.year_established && `Est. ${activeProfile.year_established}`}</p>
                            
                            <button 
                                onClick={() => handleSelect(activeProfile.id)}
                                className="w-full sm:w-auto px-12 py-5 bg-indigo-600 text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 flex items-center justify-center gap-2 mx-auto"
                            >
                                <span className="material-symbols-outlined text-sm">link</span> Establish Connection Request
                            </button>
                            <p className="text-xs text-ben-muted mt-4">By connecting, this provider will receive your bin IoT telemetry data.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
