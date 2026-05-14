import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton, { ListRowSkeleton } from '../Skeleton';

export default function PartnerList() {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('hospitality_profiles')
                .select(`
                    id,
                    business_name,
                    business_type,
                    address,
                    created_at,
                    bins(count)
                `)
                .eq('primary_gcs_id', session.user.id);
            
            if (data) setPartners(data);
            setLoading(false);
        };
        
        fetchPartners();

        // Listen for new partnership links
        const setupSubscription = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (!session) return;

             const channel = supabase
                .channel('partner-list-sync')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'hospitality_profiles',
                    filter: `primary_gcs_id=eq.${session.user.id}`
                }, () => {
                    fetchPartners();
                })
                .subscribe();
             
             return channel;
        };

        const channelPromise = setupSubscription();

        return () => {
            channelPromise.then(channel => {
                if(channel) channel.unsubscribe();
            });
        };
    }, []);

    if (loading) return <ListRowSkeleton />;

    if (partners.length === 0) {
        return (
            <div className="p-20 text-center bg-white/10 rounded-[40px] border border-dashed border-ben-border">
                <span className="material-symbols-outlined text-4xl text-ben-muted mb-4">group_off</span>
                <p className="text-ben-muted font-serif italic text-lg">No hospitality partners connected yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((partner) => (
                <div key={partner.id} className="p-8 rounded-[40px] border border-ben-border bg-white/40 hover:border-ben-text transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-outlined">hotel</span>
                            </div>
                            <div>
                                <h4 className="text-xl font-serif italic text-ben-text">{partner.business_name}</h4>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">{partner.business_type}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-serif italic text-ben-text">{partner.bins?.[0]?.count || 0}</span>
                            <span className="block text-[8px] uppercase font-bold tracking-widest text-ben-muted">Active Bins</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-ben-border/30">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-ben-muted">Location</span>
                            <span className="text-ben-text">{partner.address || 'Standard Zone'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-ben-muted">Client Since</span>
                            <span className="text-ben-text">{new Date(partner.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
