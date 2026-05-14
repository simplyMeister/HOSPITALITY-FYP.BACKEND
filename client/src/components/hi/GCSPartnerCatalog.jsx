import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function GCSPartnerCatalog({ onSelected, currentGcsId, onDisconnect }) {
    const [gcsList, setGcsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeProfile, setActiveProfile] = useState(null);

    useEffect(() => {
        const fetchGCS = async () => {
            let query = supabase
                .from('gcs_profiles')
                .select('*, profiles(full_name, state, lga)')
                .eq('is_profile_complete', true);
            
            // If already connected, HI should ONLY see their linked partner
            if (currentGcsId) {
                query = query.eq('id', currentGcsId);
            }

            const { data, error } = await query;
            
            if (error) {
                toast.error("Failed to load GCS partners");
            } else {
                setGcsList(data);
            }
            setLoading(false);
        };
        fetchGCS();
    }, [currentGcsId]);

    const handleConnect = async (gcsId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Use connection_requests instead of direct profile link
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
                if (error.code === '23505') {
                    toast.error("You already have a pending or active request.");
                } else {
                    throw error;
                }
                return;
            }
            
            toast.success("Connection request sent to GCS Partner");
            onSelected(gcsId);
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) {
        return Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-ben-border/20 rounded-[40px] animate-pulse"></div>
        ));
    }

    if (gcsList.length === 0) {
        return (
            <div className="col-span-3 py-20 text-center">
                <p className="text-ben-muted font-serif italic text-xl">No active GCS partners found.</p>
            </div>
        );
    }

    return (
        <div className="contents">
            {gcsList.map((gcs) => {
                const isConnected = gcs.id === currentGcsId;
                
                return (
                    <div 
                        key={gcs.id} 
                        className={`p-8 rounded-[40px] border transition-all duration-500 group flex flex-col justify-between ${isConnected ? 'border-indigo-600 bg-indigo-50/10 shadow-lg' : 'border-ben-border bg-white/40 hover:border-ben-text hover:bg-white'}`}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isConnected ? 'bg-indigo-600 text-white' : 'bg-indigo-600/10 text-indigo-600'}`}>
                                    <span className="material-symbols-outlined">{isConnected ? 'task_alt' : 'local_shipping'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-xs">star</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{gcs.average_rating || '5.0'}</span>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-2xl font-serif italic text-ben-text">{gcs.company_name}</h4>
                                    {isConnected && <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Linked</span>}
                                </div>
                                <p className="text-xs text-ben-muted line-clamp-2 leading-relaxed">{gcs.tagline || 'Premium waste collection partner'}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {gcs.service_types && gcs.service_types.slice(0,2).map(t => (
                                    <span key={t} className="px-3 py-1 bg-white border border-ben-border text-[8px] font-bold uppercase tracking-widest text-ben-muted rounded-full">
                                        {t}
                                    </span>
                                ))}
                                {gcs.collection_frequency && gcs.collection_frequency.slice(0,1).map(f => (
                                    <span key={f} className="px-3 py-1 bg-white border border-ben-border text-[8px] font-bold uppercase tracking-widest text-ben-muted rounded-full">
                                        {f}
                                    </span>
                                ))}
                                {(!gcs.service_types || gcs.service_types.length === 0) && (
                                    <span className="px-3 py-1 bg-white border border-ben-border text-[8px] font-bold uppercase tracking-widest text-ben-muted rounded-full">
                                        {gcs.profiles?.lga || 'Region'}
                                    </span>
                                )}
                            </div>

                            <div className="mb-8 flex justify-between items-end">
                                <div>
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-ben-muted block mb-1">Starting Price</span>
                                    <span className="text-sm font-bold text-ben-text">{gcs.starting_price ? `₦${gcs.starting_price}` : 'Available on Request'}</span>
                                </div>
                                <button 
                                    onClick={() => setActiveProfile(gcs)}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                    Read Profile <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                        
                        {isConnected ? (
                            <button 
                                onClick={onDisconnect}
                                className="w-full py-4 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm shadow-red-100"
                            >
                                Disconnect Provider
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleConnect(gcs.id)}
                                className="w-full py-4 bg-ben-text text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-ben-text/20 group-hover:bg-blue-600 group-hover:shadow-blue-600/20"
                            >
                                Request Connection
                            </button>
                        )}
                    </div>
                );
            })}

            {/* Profile Detail Modal */}
            {activeProfile && (
                <div className="fixed inset-0 z-[120] bg-ben-text/60 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[40px] border border-ben-border p-10 shadow-2xl animate-fade-in [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-serif italic text-ben-text mb-2">{activeProfile.company_name}</h3>
                                <p className="text-sm text-ben-muted">{activeProfile.tagline}</p>
                            </div>
                            <button onClick={() => setActiveProfile(null)} className="w-10 h-10 rounded-full bg-ben-bg flex items-center justify-center text-ben-text hover:bg-red-50 hover:text-red-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2 border-b border-ben-border pb-1">Coverage & Response</h5>
                                    <ul className="text-sm text-ben-text space-y-2 mt-2">
                                        <li><b>Radius: </b> {activeProfile.max_service_radius_km}km</li>
                                        <li><b>Response Time: </b> {activeProfile.avg_response_time}</li>
                                        <li><b>Emergency: </b> {activeProfile.emergency_collection ? 'Yes' : 'No'}</li>
                                        <li><b>Operating Hours: </b> {activeProfile.operating_hours}</li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2 border-b border-ben-border pb-1">Pricing Logic</h5>
                                    <ul className="text-sm text-ben-text space-y-2 mt-2">
                                        <li><b>Model: </b> {activeProfile.pricing_model}</li>
                                        <li><b>Starting Price: </b> {activeProfile.starting_price ? `₦${activeProfile.starting_price}` : 'Available on Request'}</li>
                                        <li><b>Invoice Cycle: </b> {activeProfile.invoice_cycle}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2 border-b border-ben-border pb-1">Capacity</h5>
                                    <ul className="text-sm text-ben-text space-y-2 mt-2">
                                        <li><b>Fleet Size: </b> {activeProfile.fleet_size} active units</li>
                                        <li><b>Field Techs: </b> {activeProfile.worker_count} personnel</li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-3">Service Focus</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {activeProfile.service_types?.map(t => (
                                            <span key={t} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-[8px] font-bold uppercase tracking-widest text-indigo-700 rounded-full">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-ben-border text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-4 opacity-60">HQ: {activeProfile.office_address} | {activeProfile.year_established && `Est. ${activeProfile.year_established}`}</p>
                            
                            {activeProfile.id !== currentGcsId && (
                                <button 
                                    onClick={() => { handleConnect(activeProfile.id); setActiveProfile(null); }}
                                    className="w-full sm:w-auto px-12 py-4 bg-ben-text text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-ben-text/20 hover:bg-blue-600"
                                >
                                    Initiate Partnership Request
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
