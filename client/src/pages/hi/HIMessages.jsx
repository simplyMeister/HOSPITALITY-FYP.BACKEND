import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ChatWindow from '../../components/chat/ChatWindow';
import DashboardLayout from '../../components/DashboardLayout';

export default function HIMessages() {
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasGCS, setHasGCS] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const initChat = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const user = { id: session.user.id, role: 'hospitality' };
            setCurrentUser(user);

            // 1. Check if HI has a linked GCS
            const { data: profile, error: profileError } = await supabase
                .from('hospitality_profiles')
                .select('primary_gcs_id')
                .eq('id', user.id)
                .single();

            if (profileError || !profile?.primary_gcs_id) {
                setHasGCS(false);
                setLoading(false);
                return;
            }

            setHasGCS(true);

            // 2. Load the isolated conversation thread
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select(`
                    *,
                    gcs_profiles(company_name) 
                `)
                .eq('hospitality_id', user.id)
                .maybeSingle();

            if (convError && convError.code !== 'PGRST116') {
                console.error("Chat load error:", convError);
                toast.error("Could not load your communication channel.");
                setLoading(false);
            } else if (!convData && profile.primary_gcs_id) {
                // Auto-repair legacy connection without conversation row
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        gcs_id: profile.primary_gcs_id,
                        hospitality_id: user.id
                    })
                    .select('*, gcs_profiles(company_name)')
                    .single();
                
                if (!createError) {
                   setConversation(newConv);
                   // Push system msg
                   await supabase.from('messages').insert({
                        conversation_id: newConv.id,
                        sender_id: profile.primary_gcs_id,
                        sender_role: 'gcs',
                        message_type: 'system',
                        content: 'Communication channel initialized.'
                   });
                }
                setLoading(false);
            } else {
                setConversation(convData);
                setLoading(false);
            }
        };

        initChat();
    }, []);

    if (loading) {
        return (
            <div className="pt-8 h-[calc(100vh-140px)] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!hasGCS) {
        return (
            <div className="pt-8 h-[70vh] flex flex-col items-center justify-center">
                <div className="w-32 h-32 mb-8 relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-2 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                        <span className="material-symbols-outlined text-5xl text-indigo-400">link_off</span>
                    </div>
                </div>
                <h2 className="text-3xl font-serif italic text-ben-text mb-4">No Service Connection.</h2>
                <p className="text-sm text-ben-muted max-w-md text-center leading-relaxed mb-8">
                    Your facility is not currently partnered with an active Garbage Collection Service. 
                    Explore the network to find a provider and unlock direct communication channels.
                </p>
                <Link 
                    to="/hi/ecosystem"
                    className="px-8 py-4 bg-ben-text text-white rounded-[20px] font-bold text-[10px] uppercase tracking-widest hover:-translate-y-1 transition-all shadow-xl hover:shadow-2xl"
                >
                    Browse EcoSystem
                </Link>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="pt-8 text-center text-ben-muted">
                Thread not found. Please contact administration.
            </div>
        );
    }

    return (
        <DashboardLayout roleTitle="Hospitality Operations">
            <div className="h-[calc(100vh-140px)] flex flex-col">
                <div className="flex-1 min-h-0 bg-white rounded-[40px] shadow-sm transform transition-all duration-700 ease-out translate-y-0 opacity-100">
                    <ChatWindow 
                        conversation={conversation}
                        currentUser={currentUser}
                        partnerName={conversation.gcs_profiles?.company_name || 'Collection Service'}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
