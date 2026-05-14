import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Skeleton, { ListRowSkeleton } from '../../components/Skeleton';
import RegisterBinModal from '../../components/gcs/RegisterBinModal';

const EquipmentRow = ({ bin, onCollect, loading }) => {
    if (loading) return <ListRowSkeleton />;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'alert': return 'bg-red-500 text-white';
            case 'active': return 'text-white';
            case 'inactive': return 'bg-ben-border text-ben-muted';
            default: return 'bg-ben-border text-ben-text';
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[40px] border border-ben-border bg-white/40 hover:border-ben-text transition-all duration-500 group">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div 
                    className={`w-14 h-14 rounded-3xl flex items-center justify-center ${getStatusStyle(bin.status)} transition-colors duration-500 shadow-xl shadow-current/10`}
                    style={bin.status === 'active' ? { backgroundColor: 'var(--theme-color, #16a34a)' } : {}}
                >
                    <span className="material-symbols-outlined text-2xl">
                        {bin.status === 'alert' ? 'warning' : bin.status === 'active' ? 'sensors' : 'sensors_off'}
                    </span>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-serif italic text-xl text-ben-text">{bin.label || 'Unnamed Unit'}</h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-ben-border text-ben-muted uppercase tracking-widest">{bin.bin_code}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">business</span>
                            {bin.hospitality_profiles?.business_name || 'Unlinked'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-ben-border"></span>
                        <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest">
                            Type: {bin.bin_type}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-12 text-center">
                <div>
                    <span className={`text-2xl font-serif italic ${bin.status === 'alert' ? 'text-red-500' : 'text-ben-text'}`}>
                        {bin.fill_level_percent}%
                    </span>
                    <span className="block text-[8px] uppercase font-bold tracking-widest text-ben-muted">Saturation</span>
                </div>
                <div className="hidden lg:block">
                    <span className="text-xl font-serif italic text-ben-text">{bin.weight_kg}kg</span>
                    <span className="block text-[8px] uppercase font-bold tracking-widest text-ben-muted">Weight</span>
                </div>
                <div className="w-px h-10 bg-ben-border hidden md:block"></div>
                <button 
                    disabled={bin.status === 'inactive'}
                    onClick={() => onCollect(bin)}
                    className={`px-8 py-3 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all ${
                        bin.status === 'alert' 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' 
                        : 'bg-ben-text text-white hover:bg-black disabled:opacity-30'
                    }`}
                >
                    Mark Collected
                </button>
            </div>
        </div>
    );
};

export default function GCSEquipment() {
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const groupedBins = bins.reduce((acc, bin) => {
        const groupName = bin.hospitality_profiles?.business_name || 'Unassigned Hardware';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(bin);
        return acc;
    }, {});

    const fetchBins = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch bins for clients of THIS GCS
            const { data, error } = await supabase
                .from('bins')
                .select(`
                    *,
                    hospitality_profiles!inner(business_name, primary_gcs_id)
                `)
                .eq('hospitality_profiles.primary_gcs_id', session.user.id)
                .order('created_at', { ascending: false });

            if (data) setBins(data);
            if (error) throw error;
        } catch (error) {
            console.error("Error fetching equipment:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCollection = async (bin) => {
        toast((t) => (
          <div className="flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ben-text text-white flex items-center justify-center">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ben-text">Verify Collection?</p>
                <p className="text-[10px] text-ben-muted font-sans leading-tight">
                  Confirm collection for <span className="font-bold text-ben-text">{bin.label || bin.bin_code}</span> at {bin.hospitality_profiles?.business_name}?
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text transition-colors">Cancel</button>
              <button 
                onClick={async () => {
                  toast.dismiss(t.id);
                  await executeCollection(bin);
                }}
                className="px-4 py-2 bg-ben-text text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
              >
                Confirm Now
              </button>
            </div>
          </div>
        ), { duration: 6000 });
    };

    const executeCollection = async (bin) => {
        const loadingToast = toast.loading(`Resetting node ${bin.bin_code}...`);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            // 1. Log the collection event
            const { error: collectError } = await supabase
                .from('collections')
                .insert({
                    bin_ids: [bin.id],
                    hospitality_id: bin.hospitality_id,
                    gcs_id: session.user.id,
                    notes: `System-confirmed collection for unit ${bin.bin_code}`,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                });

            if (collectError) throw collectError;

            // 2. Reset the bin sensor state
            const { error: binError } = await supabase
                .from('bins')
                .update({
                    fill_level_percent: 0,
                    status: 'active',
                    last_collected_at: new Date().toISOString()
                })
                .eq('id', bin.id);

            if (binError) throw binError;

            // 3. Notify the HI Client
            await supabase.from('notifications').insert({
                recipient_id: bin.hospitality_id,
                category: 'operation',
                title: 'Collection Verified',
                message: `Your ${bin.label || 'Unit'} has been emptied by the collection service team.`,
                related_id: bin.id
            });

            toast.success("Collection recorded. Sensor state reset.", { id: loadingToast });
            fetchBins();
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        }
    };

    useEffect(() => {
        fetchBins();

        // Subscribe to live bin updates
        const channel = supabase
            .channel('gcs-equipment-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bins' }, () => {
                fetchBins();
            })
            .subscribe();

        return () => { channel.unsubscribe(); };
    }, []);

    return (
        <DashboardLayout roleTitle="Operations Center / Equipment">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                            Infrastructure <span style={{ color: 'var(--theme-color, #16a34a)' }}>Assets</span>
                        </h1>
                        <p className="text-ben-muted text-lg max-w-xl leading-relaxed">Deployed hardware monitoring and lifecycle management.</p>
                    </div>
                    <button 
                        onClick={() => setIsRegisterOpen(true)}
                        className="px-6 py-3 text-white rounded-full font-bold text-[9px] tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                        style={{ backgroundColor: 'var(--theme-color, #1a1a1a)' }}
                    >
                        Register New Bin Unit
                    </button>
                </div>

                <div className="space-y-8 animate-fade-in">
                    {loading ? (
                        <>
                            <ListRowSkeleton />
                            <ListRowSkeleton />
                            <ListRowSkeleton />
                        </>
                    ) : (
                        Object.keys(groupedBins).length > 0 ? (
                            Object.entries(groupedBins).map(([groupName, groupBins]) => (
                                <div key={groupName} className="bg-white/20 border border-ben-border rounded-[30px] overflow-hidden transition-all">
                                    <div 
                                        className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
                                        onClick={() => toggleGroup(groupName)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-ben-text text-white flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">business</span>
                                            </div>
                                            <h3 className="text-xl font-serif italic text-ben-text">{groupName}</h3>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 text-ben-muted border border-ben-border">{groupBins.length} Unit{groupBins.length > 1 ? 's' : ''}</span>
                                        </div>
                                        <span className={`material-symbols-outlined text-ben-muted transition-transform duration-300 ${expandedGroups[groupName] ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    </div>
                                    <div className={`transition-all duration-500 ease-in-out ${expandedGroups[groupName] ? 'max-h-[5000px] opacity-100 p-6 pt-0 border-t border-ben-border/50' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                        <div className="space-y-4 mt-6">
                                            {groupBins.map(bin => (
                                                <EquipmentRow key={bin.id} bin={bin} onCollect={handleCollection} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center rounded-[50px] border border-dashed border-ben-border bg-white/10">
                                <span className="material-symbols-outlined text-6xl text-ben-muted mb-6">sensors_off</span>
                                <h3 className="text-xl font-serif italic text-ben-text mb-2">No hardware registered</h3>
                                <p className="text-ben-muted text-sm max-w-md mx-auto mb-10">Start by registering your first IoT bin and assigning it to a connected hospitality client.</p>
                                <button 
                                    onClick={() => setIsRegisterOpen(true)}
                                    className="px-6 py-3 border border-ben-text text-ben-text rounded-full font-bold text-[9px] uppercase tracking-widest hover:bg-ben-text hover:text-white transition-all"
                                >
                                    Initialize First Unit
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>

            <RegisterBinModal 
                isOpen={isRegisterOpen} 
                onClose={() => setIsRegisterOpen(false)} 
                onAdded={fetchBins}
            />
        </DashboardLayout>
    );
}
