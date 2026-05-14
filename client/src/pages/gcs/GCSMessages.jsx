import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { decryptMessage } from '../../lib/encryption';
import ChatWindow from '../../components/chat/ChatWindow';
import DashboardLayout from '../../components/DashboardLayout';

export default function GCSMessages() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeConversation, setActiveConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const initInbox = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const user = { id: session.user.id, role: 'gcs' };
            setCurrentUser(user);

            const fetchConversations = async () => {
                const { data, error } = await supabase
                    .from('conversations')
                    .select(`
                        id, 
                        last_message_at, 
                        last_message_preview, 
                        gcs_unread_count,
                        encryption_key,
                        hospitality_profiles(business_name, profiles(profile_image_url))
                    `)
                    .eq('gcs_id', user.id)
                    .order('last_message_at', { ascending: false });

                if (error) {
                    console.error("Inbox fetch error:", error);
                    toast.error("Failed to load inbox");
                } else {
                    // Decrypt previews
                    const decryptedConvs = await Promise.all((data || []).map(async (conv) => {
                        if (conv.last_message_preview) {
                            const decrypted = await decryptMessage(conv.last_message_preview, conv.encryption_key);
                            return { ...conv, last_message_preview: decrypted };
                        }
                        return conv;
                    }));
                    setConversations(decryptedConvs);
                }
                setLoading(false);
            };

            fetchConversations();

            // Subscribe to conversation updates (mainly for unread count & last message changes)
            const channel = supabase.channel(`gcs-inbox-${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `gcs_id=eq.${user.id}`
                }, (payload) => {
                    // Update specific conversation in state without full refetch
                    setConversations(current => {
                        const updated = current.map(c => 
                            c.id === payload.new.id ? { ...c, ...payload.new } : c
                        );
                        // Sort by last_message_at descending
                        return updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
                    });
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        };

        initInbox();
    }, []);

    // If active conversation is selected, display the thread
    if (activeConversation && currentUser) {
        return (
            <DashboardLayout roleTitle="GCS Operations">
                <div className="h-[calc(100vh-140px)] flex flex-col">
                    <button
                        onClick={() => setActiveConversation(null)}
                        className="self-start mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Inbox
                    </button>
                    <div className="flex-1 h-full min-h-0 bg-white rounded-[40px] shadow-sm transform transition-all duration-700 ease-out translate-y-0 opacity-100">
                        <ChatWindow 
                            conversation={activeConversation}
                            currentUser={currentUser}
                            partnerName={activeConversation.hospitality_profiles?.business_name}
                        />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Render Inbox Data
    return (
        <DashboardLayout roleTitle="GCS Operations">
            <div className="pt-2">
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-serif italic text-ben-text mb-4">Inbox.</h1>
                    <p className="text-sm text-ben-muted max-w-2xl">
                        Direct operational channels with your actively linked Hospitality Partners.
                    </p>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-24 bg-white/50 rounded-3xl"></div>
                        <div className="h-24 bg-white/50 rounded-3xl"></div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-12 text-center rounded-[40px] border border-dashed border-ben-border bg-white/10">
                        <span className="material-symbols-outlined text-4xl text-ben-muted mb-4 block">forum</span>
                        <p className="text-ben-muted font-serif italic text-lg">No active threads.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {conversations.map((conv) => (
                            <div 
                                key={conv.id}
                                onClick={() => setActiveConversation(conv)}
                                className="bg-white/40 border border-ben-border hover:border-indigo-300 hover:bg-white/80 p-6 rounded-[30px] flex items-center justify-between cursor-pointer transition-all hover:-translate-y-1 group relative"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center relative shadow-inner">
                                        <span className="material-symbols-outlined text-indigo-500">apartment</span>
                                        {conv.gcs_unread_count > 0 && (
                                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm ring-2 ring-red-500/20">
                                                {conv.gcs_unread_count}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-serif italic text-xl text-ben-text mb-1 group-hover:text-indigo-600 transition-colors">
                                            {conv.hospitality_profiles?.business_name || 'Hospitality Partner'}
                                        </h4>
                                        <p className="text-xs text-ben-muted truncate max-w-sm">
                                            {conv.last_message_preview ? `"${conv.last_message_preview}..."` : "Start a conversation."}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-2">
                                        {new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <span className="material-symbols-outlined text-ben-muted group-hover:text-ben-text group-hover:translate-x-1 transition-transform">
                                        arrow_forward
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
