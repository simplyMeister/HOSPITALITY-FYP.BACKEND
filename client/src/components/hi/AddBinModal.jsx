import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AddBinModal({ hiId, isOpen, onClose, onAdded }) {
    const [label, setLabel] = useState('');
    const [type, setType] = useState('general');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const binCode = `BIN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const { data, error } = await supabase
            .from('bins')
            .insert([{
                hospitality_id: hiId,
                label,
                bin_type: type,
                bin_code: binCode,
                status: 'normal',
                fill_level_percent: 0,
                weight_kg: 0,
                temperature_c: 24
            }]);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(`Unit ${binCode} registered to location`);
            onAdded();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[110] bg-ben-text/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-[40px] border border-ben-border p-10 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-serif italic text-ben-text">Register <span className="text-green-600">Living Unit</span></h3>
                    <button onClick={onClose} className="material-symbols-outlined text-ben-muted hover:text-ben-text transition-colors">close</button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Unit Label</label>
                        <input 
                            type="text" required
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Lobby Entrance" 
                            className="w-full bg-ben-bg border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Waste Protocol</label>
                        <select 
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-ben-bg border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all"
                        >
                            <option value="general">General Waste</option>
                            <option value="recyclable">Recyclables</option>
                            <option value="organic">Organic / Food</option>
                            <option value="hazardous">Hazardous</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button 
                            disabled={loading}
                            className="w-full py-5 bg-ben-text text-white rounded-full font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-ben-text/20"
                        >
                            {loading ? 'Initializing Interface...' : 'Link Unit to Infrastructure'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
