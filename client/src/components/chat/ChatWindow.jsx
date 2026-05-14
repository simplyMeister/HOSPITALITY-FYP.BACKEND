import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { encryptMessage, decryptMessage } from '../../lib/encryption';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow({ conversation, currentUser, partnerName }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [sending, setSending] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const messagesEndRef = useRef(null);
    const encryptionKey = conversation?.encryption_key;

    // Initial Fetch & Mark Read
    useEffect(() => {
        if (!conversation?.id) return;

        const loadMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Message load error:", error);
                return;
            }

            const decryptedMessages = await Promise.all((data || []).map(async (msg) => {
                if (msg.message_type === 'text' && !msg.is_deleted) {
                    return { ...msg, content: await decryptMessage(msg.content, encryptionKey) };
                }
                return msg;
            }));

            setMessages(decryptedMessages);
            markMessagesRead();
        };

        const markMessagesRead = async () => {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversation.id)
                .neq('sender_role', currentUser.role)
                .eq('is_read', false);

            const unreadField = currentUser.role === 'gcs' ? 'gcs_unread_count' : 'hi_unread_count';
            await supabase.from('conversations').update({ [unreadField]: 0 }).eq('id', conversation.id);
        };

        loadMessages();

        // Realtime Subscription
        const channel = supabase
            .channel(`chat:${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, async (payload) => {
                let newMsg = payload.new;
                if (newMsg.message_type === 'text' && !newMsg.is_deleted) {
                    newMsg.content = await decryptMessage(newMsg.content, encryptionKey);
                }
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                if (newMsg.sender_role !== currentUser.role) markMessagesRead();
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, async (payload) => {
                const updatedMsg = payload.new;
                if (updatedMsg.message_type === 'text' && !updatedMsg.is_deleted) {
                    updatedMsg.content = await decryptMessage(updatedMsg.content, encryptionKey);
                }
                setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation?.id, currentUser.role, encryptionKey]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const originalContent = newMessage.trim();

        try {
            if (!encryptionKey) {
                toast.error("Security Key Missing: Please refresh your dashboard.");
                setSending(false);
                return;
            }

            if (editingMessage) {
                // OPTIMISTIC EDIT
                const oldContent = editingMessage.content;
                setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: originalContent, is_edited: true } : m));
                
                const encryptedContent = await encryptMessage(originalContent, encryptionKey);
                setNewMessage('');
                setEditingMessage(null);

                const { error } = await supabase
                    .from('messages')
                    .update({ 
                        content: encryptedContent, 
                        is_edited: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingMessage.id);
                
                if (error) {
                    setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: oldContent, is_edited: false } : m));
                    throw new Error(`Edit failed: ${error.message}`);
                }
            } else {
                // OPTIMISTIC NEW MESSAGE
                const tempId = `temp-${Date.now()}`;
                const tempMsg = {
                    id: tempId,
                    conversation_id: conversation.id,
                    sender_id: currentUser.id,
                    sender_role: currentUser.role,
                    content: originalContent,
                    message_type: 'text',
                    created_at: new Date().toISOString(),
                    is_read: false
                };
                setMessages(prev => [...prev, tempMsg]);
                setNewMessage('');

                const encryptedContent = await encryptMessage(originalContent, encryptionKey);
                
                const { data: insertedMsg, error: msgError } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversation.id,
                        sender_id: currentUser.id,
                        sender_role: currentUser.role,
                        content: encryptedContent,
                        message_type: 'text'
                    })
                    .select()
                    .single();

                if (msgError) {
                    // Remove temp message if failed
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    throw new Error(`Send failed: ${msgError.message}`);
                }

                // Replace temp message with real one (decrypted)
                setMessages(prev => prev.map(m => m.id === tempId ? { ...insertedMsg, content: originalContent } : m));

                const unreadField = currentUser.role === 'gcs' ? 'hi_unread_count' : 'gcs_unread_count';
                const { error: rpcError } = await supabase.rpc('increment', { row_id: conversation.id, column_name: unreadField });
                if (rpcError) console.warn("Unread count update skipped:", rpcError.message);
                
                await supabase.from('conversations').update({
                    last_message_at: new Date().toISOString(),
                    last_message_preview: encryptedContent,
                }).eq('id', conversation.id);
            }
        } catch (err) {
            console.error("Chat Action Error:", err);
            toast.error(err.message || "Failed to process message");
        } finally {
            setSending(false);
        }
    };

    const deleteMessage = async (msgId) => {
        // OPTIMISTIC DELETE
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m));

        const { error } = await supabase
            .from('messages')
            .update({ is_deleted: true, content: 'DELETED' })
            .eq('id', msgId);
        
        if (error) {
            // Rollback could be complex here, usually a reload is better or toast
            toast.error("Could not delete message");
        }
    };

    const addReaction = async (msgId, emoji) => {
        // OPTIMISTIC REACTION
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
                const newReactions = { ...(m.reactions || {}) };
                newReactions[currentUser.id] = emoji;
                return { ...m, reactions: newReactions };
            }
            return m;
        }));

        const msg = messages.find(m => m.id === msgId);
        const currentReactions = { ...(msg?.reactions || {}) };
        currentReactions[currentUser.id] = emoji;

        const { error } = await supabase
            .from('messages')
            .update({ reactions: currentReactions })
            .eq('id', msgId);
        
        setShowReactionPicker(null);
        if (error) toast.error("Reaction failed");
    };

    const formatMessageDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className="flex flex-col h-full bg-ben-bg/20 rounded-[40px] border border-ben-border overflow-hidden relative">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-ben-border p-5 flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-600">
                            {currentUser.role === 'gcs' ? 'apartment' : 'local_shipping'}
                        </span>
                    </div>
                    <div>
                        <h4 className="font-serif italic text-lg text-ben-text m-0 p-0 leading-tight">
                            {partnerName || 'Partner'}
                        </h4>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-ben-muted">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('init-call', { detail: { type: 'audio', conversation } }))} className="w-10 h-10 rounded-full border border-ben-border flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all text-ben-muted" title="Audio Call"><span className="material-symbols-outlined">call</span></button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('init-call', { detail: { type: 'video', conversation } }))} className="w-10 h-10 rounded-full border border-ben-border flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all text-ben-muted" title="Video Call"><span className="material-symbols-outlined">videocam</span></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                {messages.map((msg, idx) => {
                    const isMine = msg.sender_role === currentUser.role;
                    const dateTag = formatMessageDate(msg.created_at);
                    const showDate = idx === 0 || formatMessageDate(messages[idx-1].created_at) !== dateTag;

                    return (
                        <div key={msg.id}>
                            {showDate && (
                                <div className="flex justify-center my-6">
                                    <span className="bg-white/50 border border-ben-border text-[8px] font-black uppercase tracking-[0.2em] text-ben-muted px-4 py-1 rounded-full">{dateTag}</span>
                                </div>
                            )}
                            
                            <div className={`flex w-full group relative ${isMine ? 'justify-end' : 'justify-start'}`}>
                                {!isMine && !msg.is_deleted && (
                                    <div className="absolute left-0 -top-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                        {['👍', '❤️', '😂', '😮', '😢'].map(e => (
                                            <button key={e} onClick={() => addReaction(msg.id, e)} className="hover:scale-125 transition-transform">{e}</button>
                                        ))}
                                    </div>
                                )}

                                <div className={`max-w-[70%] relative ${msg.is_deleted ? 'bg-ben-bg border border-dashed border-ben-border text-ben-muted italic' : isMine ? 'bg-ben-text text-white rounded-l-3xl rounded-tr-3xl' : 'bg-white border border-ben-border text-ben-text rounded-r-3xl rounded-tl-3xl'} px-5 py-3 shadow-sm transition-all hover:shadow-md`}>
                                    {msg.is_deleted ? (
                                        <div className="flex items-center gap-2 opacity-60">
                                            <span className="material-symbols-outlined text-sm">block</span>
                                            <span className="text-xs">This message was deleted</span>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start opacity-60'}`}>
                                                <span className="text-[8px] font-bold uppercase tracking-widest">{formatTime(msg.created_at)}</span>
                                                {msg.is_edited && <span className="text-[8px] italic opacity-60">(edited)</span>}
                                                {isMine && (
                                                    <span className={`material-symbols-outlined text-[12px] ${msg.is_read ? 'text-blue-400' : 'text-white/40'}`}>
                                                        {msg.is_read ? 'done_all' : 'check'}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Reactions Display */}
                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                <div className="absolute -bottom-3 right-2 flex gap-1 bg-white border border-ben-border rounded-full px-1.5 py-0.5 shadow-sm">
                                                    {Object.values(msg.reactions).slice(0, 3).map((emoji, i) => (
                                                        <span key={i} className="text-[10px]">{emoji}</span>
                                                    ))}
                                                    {Object.keys(msg.reactions).length > 1 && <span className="text-[8px] font-bold text-ben-muted">{Object.keys(msg.reactions).length}</span>}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Options Menu for MY messages */}
                                {isMine && !msg.is_deleted && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 ml-2 self-center">
                                        <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); }} className="w-8 h-8 rounded-full bg-white border border-ben-border flex items-center justify-center hover:bg-ben-bg transition-colors" title="Edit"><span className="material-symbols-outlined text-xs text-ben-muted">edit</span></button>
                                        <button onClick={() => deleteMessage(msg.id)} className="w-8 h-8 rounded-full bg-white border border-ben-border flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete"><span className="material-symbols-outlined text-xs text-ben-muted hover:text-red-500">delete</span></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-5 border-t border-ben-border">
                <AnimatePresence>
                    {editingMessage && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-4 p-3 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-xl flex justify-between items-center">
                            <div>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-600 block">Editing Message</span>
                                <p className="text-xs text-ben-muted truncate max-w-md italic">"{editingMessage.content}"</p>
                            </div>
                            <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-indigo-600"><span className="material-symbols-outlined text-sm">close</span></button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <form onSubmit={handleSend} className="flex gap-3">
                    <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} placeholder="Type a message..." className="flex-1 bg-ben-bg border border-ben-border rounded-[20px] px-5 py-3 text-sm focus:outline-none focus:border-indigo-600 resize-none h-[50px] custom-scrollbar transition-all" rows="1" />
                    <button type="submit" disabled={!newMessage.trim() || sending} className={`h-[50px] px-6 rounded-[20px] font-bold text-[10px] uppercase tracking-widest hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-2 ${editingMessage ? 'bg-indigo-600 text-white' : 'bg-ben-text text-white'}`}>
                        {editingMessage ? 'Update' : 'Send'}
                        <span className="material-symbols-outlined text-sm">{editingMessage ? 'done' : 'send'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
