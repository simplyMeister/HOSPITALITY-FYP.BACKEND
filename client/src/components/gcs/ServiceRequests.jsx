import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function ServiceRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('collections')
            .select(`
                *,
                hospitality_profiles(business_name, address, business_type)
            `)
            .eq('gcs_id', session.user.id)
            .neq('status', 'completed')
            .order('created_at', { ascending: false });
        
        if (data) setRequests(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();

        const channel = supabase
            .channel('collections-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, () => {
                fetchRequests();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const updateStatus = async (id, status, reqData) => {
        try {
            const { error: updateError } = await supabase
                .from('collections')
                .update({ 
                    status,
                    completed_at: status === 'completed' ? new Date().toISOString() : null
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Generate payment record if completed
            if (status === 'completed') {
                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert({
                        hospitality_id: reqData.hospitality_id,
                        gcs_id: reqData.gcs_id,
                        collection_id: id,
                        amount: 25000, // Fixed demo fee
                        currency: 'NGN',
                        status: 'pending',
                        payment_reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                    });
                
                if (paymentError) console.error("Payment generation failed:", paymentError);
                toast.success(`Mission Success: Collection completed for ${reqData.hospitality_profiles?.business_name}`, { icon: '✅' });
            } else {
                toast.success(`Route Initialized: Proceeding to ${reqData.hospitality_profiles?.business_name}`, { icon: '🚚' });
            }

            fetchRequests();
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="animate-pulse space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-ben-border/20 rounded-3xl"></div>)}</div>;

    if (requests.length === 0) {
        return (
            <div className="p-10 text-center border border-dashed border-ben-border rounded-[40px] bg-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">No pending service requests</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((req) => (
                <div key={req.id} className="p-6 rounded-3xl border border-ben-border bg-white/40 hover:border-ben-text transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`}></span>
                                <h4 className="font-serif italic text-lg text-ben-text">{req.hospitality_profiles?.business_name}</h4>
                            </div>
                            <p className="text-[10px] font-bold text-ben-muted uppercase tracking-widest mb-4">
                                {req.hospitality_profiles?.address || 'Location Unspecified'}
                            </p>
                            <div className="px-3 py-1 bg-ben-text/5 rounded-lg inline-block border border-ben-border/50">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-ben-muted">Request Notes:</span>
                                <p className="text-[10px] text-ben-text mt-1 italic">{req.notes || 'No specific notes provided'}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {req.status === 'pending' ? (
                                <button 
                                    onClick={() => {
                                        toast((t) => (
                                          <div className="flex flex-col gap-3 min-w-[280px]">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                                                <span className="material-symbols-outlined">local_shipping</span>
                                              </div>
                                              <div>
                                                <p className="text-[11px] font-bold uppercase tracking-widest text-ben-text">Start Collection?</p>
                                                <p className="text-[10px] text-ben-muted font-sans leading-tight">
                                                  Confirming route to <span className="font-bold text-ben-text">{req.hospitality_profiles?.business_name}</span>?
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2 justify-end pt-2">
                                              <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text">Cancel</button>
                                              <button onClick={async () => { toast.dismiss(t.id); await updateStatus(req.id, 'in_progress', req); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Start Mission</button>
                                            </div>
                                          </div>
                                        ));
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-[8px] uppercase tracking-widest hover:bg-blue-700"
                                >
                                    Accept Request
                                </button>
                            ) : (
                                <button 
                                    onClick={() => {
                                        toast((t) => (
                                          <div className="flex flex-col gap-3 min-w-[280px]">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center">
                                                <span className="material-symbols-outlined">task_alt</span>
                                              </div>
                                              <div>
                                                <p className="text-[11px] font-bold uppercase tracking-widest text-ben-text">Confirm Collection?</p>
                                                <p className="text-[10px] text-ben-muted font-sans leading-tight">
                                                  Verify that you have cleared waste for <span className="font-bold text-ben-text">{req.hospitality_profiles?.business_name}</span> at {req.hospitality_profiles?.address || 'nil'}?
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2 justify-end pt-2">
                                              <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text">Cancel</button>
                                              <button onClick={async () => { toast.dismiss(t.id); await updateStatus(req.id, 'completed', req); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Verify Success</button>
                                            </div>
                                          </div>
                                        ));
                                    }}
                                    className="px-6 py-2 bg-green-600 text-white rounded-full font-bold text-[8px] uppercase tracking-widest hover:bg-green-700"
                                >
                                    Mark Collected
                                </button>
                            )}
                            <button className="px-6 py-2 border border-ben-border text-ben-muted rounded-full font-bold text-[8px] uppercase tracking-widest hover:bg-white transition-all">
                                View Map
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
