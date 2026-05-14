import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function ReportDumpModal({ isOpen, onClose, individualId, onReported }) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate GPS coordinates (in a real app, use navigator.geolocation)
            const mockLat = 6.5244 + (Math.random() - 0.5) * 0.1;
            const mockLng = 3.3792 + (Math.random() - 0.5) * 0.1;

            const { error } = await supabase
                .from('illegal_dump_reports')
                .insert({
                    reported_by: individualId,
                    description,
                    gps_lat: mockLat,
                    gps_lng: mockLng,
                    status: 'open'
                });

            if (error) throw error;

            toast.success("Illegal dump reported. Authorities notified.");
            onReported();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ben-text/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-8xl text-red-600">report_problem</span>
                </div>

                <div className="relative z-10">
                    <h3 className="text-3xl font-serif italic text-ben-text mb-2">Report <span className="text-red-600">Illegal Dump</span></h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-8">Help us clean up the community by flagging unauthorized waste sites</p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block ml-1">Site Description</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the location and type of waste (e.g., Plastic heap near the bridge...)"
                                className="w-full h-32 bg-ben-bg border border-ben-border rounded-3xl p-6 outline-none focus:border-red-600 transition-all placeholder:text-ben-muted/50"
                            />
                        </div>

                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-4 items-start">
                            <span className="material-symbols-outlined text-red-600">location_on</span>
                            <div>
                                <span className="block text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">GPS Capture</span>
                                <p className="text-[10px] text-red-800 opacity-70">Your current coordinates will be automatically attached to this report for immediate dispatch.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 border border-ben-border text-ben-muted rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-4 bg-red-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl disabled:opacity-50"
                            >
                                {loading ? 'Transmitting...' : 'Dispatch Report'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
