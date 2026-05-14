import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function EcoCoinTerminal({ hospitalityId }) {
    const [userLookup, setUserLookup] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.rpc('accept_eco_coins', {
                p_user_lookup: userLookup,
                p_amount: parseInt(amount),
                p_description: description || 'EcoCoin partial payment',
                p_hospitality_id: hospitalityId
            });

            if (error) throw error;

            toast.success(`Transaction Verified: ${amount} EcoCoins Accepted`, { icon: '💎' });
            setUserLookup('');
            setAmount('');
            setDescription('');
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to process transaction");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-indigo-600">currency_exchange</span>
            </div>

            <div className="relative z-10">
                <div className="mb-8">
                    <h3 className="text-3xl font-serif italic text-ben-text mb-2">Merchant <span className="text-indigo-600">Terminal</span></h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">Accept EcoCoins as partial service payment</p>
                </div>

                <form onSubmit={handleTransaction} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Customer Identifier (Email/Phone)</label>
                        <input 
                            type="text" required
                            value={userLookup}
                            onChange={(e) => setUserLookup(e.target.value)}
                            placeholder="customer@example.com or +234..."
                            className="w-full bg-white/40 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all placeholder:text-ben-muted/50"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Amount (EcoCoins)</label>
                            <div className="relative">
                                <input 
                                    type="number" required min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-white/40 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-indigo-600">Coins</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Reference/Service</label>
                            <input 
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Room 304 Discount"
                                className="w-full bg-white/40 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all placeholder:text-ben-muted/50"
                            />
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        type="submit"
                        className="w-full py-5 bg-indigo-600 text-white rounded-full font-bold text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? 'Processing Transaction...' : (
                            <>
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Confirm Redemption
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-[8px] font-bold uppercase tracking-widest text-ben-muted opacity-60">
                        * All transactions are permanent and recorded on the ecological ledger.
                    </p>
                </form>
            </div>
        </div>
    );
}
