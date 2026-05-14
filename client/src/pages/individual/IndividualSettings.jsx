import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function IndividualSettings() {
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) return;
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (data) setProfile(data);
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('profiles').update(profile).eq('id', profile.id);
        if(!error) toast.success("Configuration Synced.");
        else toast.error("Sync failed.");
    };

    return (
        <DashboardLayout roleTitle="Citizen / Individual">
            <div className="max-w-4xl mx-auto py-12">
                <div className="mb-12">
                    <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">Node <span className="text-indigo-600">Settings.</span></h1>
                    <p className="text-ben-muted text-lg leading-relaxed">Customize your personal identity and ecosystem preferences.</p>
                </div>

                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted">Full Legal Name</label>
                        <input 
                            value={profile.full_name || ''}
                            onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                            className="w-full bg-white/20 border border-ben-border rounded-xl px-6 py-4 outline-none focus:border-ben-text transition-all" 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted">Primary Phone</label>
                        <input 
                            value={profile.phone || ''}
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                            className="w-full bg-white/20 border border-ben-border rounded-xl px-6 py-4 outline-none focus:border-ben-text transition-all" 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted">Operational LGA</label>
                        <input 
                            value={profile.lga || ''}
                            onChange={(e) => setProfile({...profile, lga: e.target.value})}
                            className="w-full bg-white/20 border border-ben-border rounded-xl px-6 py-4 outline-none focus:border-ben-text transition-all" 
                        />
                    </div>
                    
                    <div className="md:col-span-2 pt-8">
                        <button type="submit" className="px-12 py-5 bg-ben-text text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                            Commit Changes
                        </button>
                    </div>
                </form>

                <div className="mt-16 p-10 rounded-[40px] border border-red-200 bg-red-50/30">
                    <h3 className="text-xl font-serif italic text-red-600 mb-2">Account Deactivation</h3>
                    <p className="text-sm text-ben-muted mb-6">Permanently remove your identity from the EcoTrack network. This action is irreversible.</p>
                    <button className="px-8 py-3 border border-red-500 text-red-500 rounded-full font-bold text-[9px] uppercase tracking-widest hover:bg-red-50 transition-colors">
                        Initiate Deletion
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
