import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function RateProviderModal({ isOpen, onClose, gcsId, hospitalityId, onRated }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('gcs_ratings')
                .upsert({
                    hospitality_id: hospitalityId,
                    gcs_id: gcsId,
                    rating,
                    comment
                }, { onConflict: 'hospitality_id,gcs_id' });

            if (error) throw error;

            toast.success("Thank you for your feedback!");
            onRated();
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
                    <span className="material-symbols-outlined text-8xl text-indigo-600">reviews</span>
                </div>

                <div className="relative z-10">
                    <h3 className="text-3xl font-serif italic text-ben-text mb-2">Service <span className="text-indigo-600">Review</span></h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mb-8">Evaluate your connected GCS provider's performance</p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-4 ml-1">Overall Rating</label>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                            rating >= star ? 'bg-amber-500 text-white' : 'bg-ben-border/20 text-ben-muted'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined">{rating >= star ? 'star' : 'star_outline'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block ml-1">Comments (Optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us about the collection quality, punctuality..."
                                className="w-full h-32 bg-ben-bg border border-ben-border rounded-3xl p-6 outline-none focus:border-indigo-600 transition-all placeholder:text-ben-muted/50"
                            />
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
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Submit Rating'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
