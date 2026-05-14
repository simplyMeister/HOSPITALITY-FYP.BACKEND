import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function RegisterBinModal({ isOpen, onClose, onAdded }) {
    const [step, setStep] = useState(1); // 1: Form, 2: Success/Code
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [generatedCode, setGeneratedCode] = useState('');

    const [formData, setFormData] = useState({
        hospitality_id: '',
        label: '',
        bin_type: 'general',
        capacity_litres: 100,
        alert_threshold: 80,
        gps_lat: 55.6761,
        gps_lng: 12.5683
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            setStep(1);
        }
    }, [isOpen]);

    const fetchClients = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch HIs connected to this GCS
        const { data, error } = await supabase
            .from('hospitality_profiles')
            .select('id, business_name')
            .eq('primary_gcs_id', session.user.id);
        
        if (data) setClients(data);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const binCode = `ECO-BIN-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        const { error } = await supabase
            .from('bins')
            .insert([{
                ...formData,
                bin_code: binCode,
                status: 'inactive',
                fill_level_percent: 0,
                weight_kg: 0,
                last_updated: new Date().toISOString()
            }]);

        if (error) {
            toast.error(error.message);
        } else {
            setGeneratedCode(binCode);
            setStep(2);
            if (onAdded) onAdded();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[110] bg-ben-text/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-xl bg-white rounded-[40px] border border-ben-border p-10 shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16"></div>
                
                {step === 1 ? (
                    <>
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h3 className="text-3xl font-serif italic text-ben-text">Register <span className="text-indigo-600">New Bin</span></h3>
                            <button onClick={onClose} className="material-symbols-outlined text-ben-muted hover:text-ben-text transition-colors">close</button>
                        </div>

                        <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Assign to HI Client</label>
                                    <select 
                                        required
                                        value={formData.hospitality_id}
                                        onChange={(e) => setFormData({...formData, hospitality_id: e.target.value})}
                                        className="w-full bg-ben-bg border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all"
                                    >
                                        <option value="">Select a connected client...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.business_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Bin Label</label>
                                    <input 
                                        type="text" required
                                        value={formData.label}
                                        onChange={(e) => setFormData({...formData, label: e.target.value})}
                                        placeholder="e.g. Kitchen Bin" 
                                        className="w-full bg-ben-bg border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Bin Type</label>
                                    <select 
                                        required
                                        value={formData.bin_type}
                                        onChange={(e) => setFormData({...formData, bin_type: e.target.value})}
                                        className="w-full bg-ben-bg border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all"
                                    >
                                        <option value="general">General Waste</option>
                                        <option value="recyclable">Recyclables</option>
                                        <option value="organic">Organic / Food</option>
                                        <option value="hazardous">Hazardous</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Capacity (Litres)</label>
                                    <input 
                                        type="number" required
                                        value={formData.capacity_litres}
                                        onChange={(e) => setFormData({...formData, capacity_litres: e.target.value})}
                                        className="w-full bg-ben-bg border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Threshold (%)</label>
                                    <input 
                                        type="number" required
                                        value={formData.alert_threshold}
                                        onChange={(e) => setFormData({...formData, alert_threshold: e.target.value})}
                                        className="w-full bg-ben-bg border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-indigo-600 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button 
                                    disabled={loading || !formData.hospitality_id}
                                    className="w-full py-5 bg-ben-text text-white rounded-full font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-ben-text/20"
                                >
                                    {loading ? 'Generating Device Identity...' : 'Register Bin & Generate Code'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6 animate-fade-in relative z-10">
                        <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-8">
                            <span className="material-symbols-outlined text-4xl">verified</span>
                        </div>
                        <h3 className="text-3xl font-serif italic text-ben-text mb-2">Bin Registered Successfully</h3>
                        <p className="text-ben-muted text-sm mb-10">Program the following code into your Wokwi sketch.</p>
                        
                        <div className="bg-ben-bg border border-ben-border rounded-3xl p-8 mb-10 relative group">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ben-muted mb-4 block">Bin Device Code</span>
                            <span className="text-4xl font-mono font-black text-indigo-600 tracking-tighter">{generatedCode}</span>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedCode);
                                    toast.success("Code copied to clipboard");
                                }}
                                className="absolute top-4 right-4 p-2 rounded-xl border border-ben-border hover:bg-white transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                        </div>

                        <div className="text-left bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-10">
                            <p className="text-[11px] text-indigo-900 leading-relaxed">
                                <strong>Setup Instruction:</strong> Paste the code into your ESP32 sketch as <code>BIN_DEVICE_CODE</code>. The bin status will switch to <span className="text-green-600 font-bold uppercase">Active</span> once the first sensor ping is received.
                            </p>
                        </div>

                        <button 
                            onClick={onClose}
                            className="w-full py-5 bg-ben-text text-white rounded-full font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl"
                        >
                            Complete Registration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
