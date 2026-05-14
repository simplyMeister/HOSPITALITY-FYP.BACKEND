import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import GlobalLoader from '../../components/GlobalLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';


export default function HISettings() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [hiId, setHiId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [mapPosition, setMapPosition] = useState([6.5244, 3.3792]);

    // Form State
    const [formData, setFormData] = useState({
        business_name: '',
        business_type: 'hotel',
        business_size: 'Small',
        cac_number: '',
        year_established: '',
        tagline: '',
        phone_primary: '',
        phone_secondary: '',
        address: '',
        rooms_count: '',
        seat_capacity: '',
        avg_daily_guests: '',
        floors_count: '1',
        staff_count: '',
        operating_hours: '24 Hours',
        preferred_frequency: 'Weekly',
        preferred_time_window: 'Early morning 5am–7am',
        requires_manifest: false,
        emergency_collection_needed: false,
        special_handling: '',
        access_instructions: '',
        accepts_eco_coins: false,
        coin_discount_rate: '0',
        max_coin_discount_percent: '10'
    });

    // Multi-select states
    const [peakDays, setPeakDays] = useState({});
    const [wasteTypes, setWasteTypes] = useState({});
    const [collectionDays, setCollectionDays] = useState({});
    const [sustainability, setSustainability] = useState({});
    const [ecoGoals, setEcoGoals] = useState({});
    const [ecoCoinServices, setEcoCoinServices] = useState({});

    const fetchProfile = async (userId) => {
        setLoading(true);
        const { data: hiProfile } = await supabase
            .from('hospitality_profiles')
            .select('*, profiles(full_name, email, phone, profile_image_url)')
            .eq('id', userId)
            .single();

        if (hiProfile) {
            setProfile(hiProfile);
            setMapPosition([hiProfile.gps_lat || 6.5244, hiProfile.gps_lng || 3.3792]);
            
            // Initialize form data
            setFormData({
                business_name: hiProfile.business_name || '',
                business_type: hiProfile.business_type || 'hotel',
                business_size: hiProfile.business_size || 'Small',
                cac_number: hiProfile.cac_number || '',
                year_established: hiProfile.year_established?.toString() || '',
                tagline: hiProfile.tagline || '',
                phone_primary: hiProfile.profiles?.phone || '',
                phone_secondary: hiProfile.phone_secondary || '',
                address: hiProfile.address || '',
                rooms_count: hiProfile.rooms_count || '',
                seat_capacity: hiProfile.seat_capacity || '',
                avg_daily_guests: hiProfile.avg_daily_guests?.toString() || '',
                floors_count: hiProfile.floors_count?.toString() || '1',
                staff_count: hiProfile.staff_count?.toString() || '',
                operating_hours: hiProfile.operating_hours || '24 Hours',
                preferred_frequency: hiProfile.preferred_frequency || 'Weekly',
                preferred_time_window: hiProfile.preferred_time_window || 'Early morning 5am–7am',
                requires_manifest: hiProfile.requires_manifest || false,
                emergency_collection_needed: hiProfile.emergency_collection_needed || false,
                special_handling: hiProfile.special_handling || '',
                access_instructions: hiProfile.access_instructions || '',
                accepts_eco_coins: hiProfile.accepts_eco_coins || false,
                coin_discount_rate: hiProfile.coin_discount_rate?.toString() || '0',
                max_coin_discount_percent: hiProfile.max_coin_discount_percent?.toString() || '10'
            });

            // Helper to convert array to toggle object
            const toToggle = (arr) => arr?.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}) || {};
            
            setPeakDays(toToggle(hiProfile.peak_days));
            setWasteTypes(toToggle(hiProfile.waste_types));
            setCollectionDays(toToggle(hiProfile.collection_days));
            setSustainability(toToggle(hiProfile.sustainability_practices));
            setEcoGoals(toToggle(hiProfile.sustainability_goals));
            setEcoCoinServices(toToggle(hiProfile.eco_coin_services));
        }
        setLoading(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            let logoUrl = profile.profiles?.profile_image_url;
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${hiId}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('profiles')
                    .upload(`hi-logos/${fileName}`, logoFile);
                
                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(`hi-logos/${fileName}`);
                    logoUrl = publicUrlData.publicUrl;
                }
            }

            // Extract active items from toggle objects
            const getActive = (obj) => Object.entries(obj).filter(([_, v]) => v).map(([k]) => k);

            // 1. Update Profile Metadata
            await supabase.from('profiles').update({
                phone: formData.phone_primary,
                profile_image_url: logoUrl
            }).eq('id', hiId);

            // 2. Update Hospitality Profile
            const { error } = await supabase.from('hospitality_profiles').update({
                business_name: formData.business_name,
                business_type: formData.business_type,
                business_size: formData.business_size,
                address: formData.address,
                cac_number: formData.cac_number,
                year_established: parseInt(formData.year_established) || null,
                tagline: formData.tagline,
                phone_secondary: formData.phone_secondary,
                gps_lat: mapPosition[0],
                gps_lng: mapPosition[1],
                rooms_count: formData.rooms_count,
                seat_capacity: formData.seat_capacity,
                avg_daily_guests: parseInt(formData.avg_daily_guests) || null,
                floors_count: parseInt(formData.floors_count) || 1,
                staff_count: parseInt(formData.staff_count) || null,
                operating_hours: formData.operating_hours,
                peak_days: getActive(peakDays),
                waste_types: getActive(wasteTypes),
                preferred_frequency: formData.preferred_frequency,
                preferred_time_window: formData.preferred_time_window,
                collection_days: getActive(collectionDays),
                requires_manifest: formData.requires_manifest,
                emergency_collection_needed: formData.emergency_collection_needed,
                special_handling: formData.special_handling,
                access_instructions: formData.access_instructions,
                sustainability_practices: getActive(sustainability),
                sustainability_goals: getActive(ecoGoals),
                accepts_eco_coins: formData.accepts_eco_coins,
                coin_discount_rate: parseFloat(formData.coin_discount_rate) || 0,
                max_coin_discount_percent: parseFloat(formData.max_coin_discount_percent) || 0,
                eco_coin_services: getActive(ecoCoinServices)
            }).eq('id', hiId);

            if (error) throw error;
            
            toast.success("Operational profile updated");
            setIsEditModalOpen(false);
            fetchProfile(hiId);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDisconnectGCS = async () => {
        toast((t) => (
          <div className="flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center">
                <span className="material-symbols-outlined">link_off</span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ben-text">Disconnect Partner?</p>
                <p className="text-[10px] text-ben-muted font-sans leading-tight">
                  Are you sure? Hardware monitoring will be suspended immediately.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text transition-colors">Cancel</button>
              <button 
                onClick={async () => {
                  toast.dismiss(t.id);
                  await executeDisconnect();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        ), { duration: 6000 });
    };

    const executeDisconnect = async () => {
        const loadingToast = toast.loading("Unlinking infrastructure...");
        try {
            const { error } = await supabase
                .from('hospitality_profiles')
                .update({ primary_gcs_id: null })
                .eq('id', hiId);

            if (error) throw error;
            toast.success("GCS Partner Unlinked", { id: loadingToast });
            fetchProfile(hiId);
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleToggle = (setter, target) => {
        setter(prev => ({ ...prev, [target]: !prev[target] }));
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setHiId(session.user.id);
                fetchProfile(session.user.id);
            }
        });
    }, []);

    if (loading) return <GlobalLoader />;

    return (
        <DashboardLayout roleTitle="Node Administrator / Settings">
            <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-fade-in">
                <div className="mb-16">
                    <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                        Node <span className="text-indigo-600">Configuration</span>
                    </h1>
                    <p className="text-ben-muted text-lg max-w-xl leading-relaxed">System-level preferences and partner orchestration for your facility.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Card */}
                    <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                        <h3 className="text-xl font-serif italic text-ben-text mb-8">Identity Profile</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden flex items-center justify-center">
                                    {profile?.profiles?.profile_image_url ? (
                                        <img src={profile.profiles.profile_image_url} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-indigo-300">apartment</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-serif italic text-ben-text">{profile?.business_name}</p>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">{profile?.business_type} • {profile?.business_size}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-ben-border">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-1">Administrative Email</span>
                                    <p className="text-sm font-sans text-ben-text">{profile?.profiles?.email}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted block mb-1">CAC Registration</span>
                                    <p className="text-sm font-sans text-ben-text">{profile?.cac_number || 'Not provided'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="w-full py-3 mt-4 bg-indigo-600/5 text-indigo-600 border border-indigo-600/20 rounded-2xl font-bold text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                            >
                                Edit Operational Profile →
                            </button>
                        </div>
                    </div>

                    {/* Partner Linkage */}
                    <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                        <h3 className="text-xl font-serif italic text-ben-text mb-8">Infrastructure Partner</h3>
                        {profile?.primary_gcs_id ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Active Connection</span>
                                </div>
                                <p className="text-sm text-ben-muted leading-relaxed">Your node is currently tethered to a verified GCS Infrastructure provider.</p>
                                <button 
                                    onClick={handleDisconnectGCS}
                                    className="w-full py-3 border border-red-500/30 text-red-500 rounded-2xl font-bold text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                >
                                    Disconnect GCS Link
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Unlinked Node</span>
                                </div>
                                <p className="text-sm text-ben-muted leading-relaxed">Hardware and analytics are offline. Link a partner to begin operations.</p>
                                <Link 
                                    to="/hi"
                                    className="w-full py-3 bg-ben-text text-white rounded-2xl font-bold text-[9px] uppercase tracking-widest hover:scale-105 transition-all block text-center"
                                >
                                    Browse Partners
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* IoT Thresholds */}
                <div className="p-10 rounded-[40px] border border-ben-border bg-ben-text text-white overflow-hidden relative">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl font-serif italic mb-6">IoT Alert Protocols</h3>
                            <p className="text-sm opacity-60 leading-relaxed mb-10">Configure how the Living Bin sensors trigger system alerts and automated collection requests.</p>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Fill Threshold</span>
                                        <span className="text-xs font-bold">85%</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[85%]"></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" checked readOnly className="w-4 h-4 rounded bg-white/10 border-white/20" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Enable Automated Pickup Dispatch</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <button className="w-full py-3.5 bg-white text-ben-text rounded-3xl font-bold uppercase tracking-widest text-[9px] hover:scale-105 transition-all shadow-xl shadow-white/10">
                                Update Sensor protocols
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Profile Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-ben-bg/95 backdrop-blur-xl" />
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: 50, scale: 0.95 }} 
                            className="relative w-full max-w-5xl bg-white rounded-[50px] border border-ben-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 border-b border-ben-border flex justify-between items-center bg-ben-bg/30">
                                <div>
                                    <h2 className="text-4xl font-serif italic text-ben-text">Operational <span className="text-indigo-600">Profile</span></h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-ben-muted mt-2">Modify establishment parameters & service needs</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 rounded-full border border-ben-border flex items-center justify-center hover:bg-white transition-all">
                                    <span className="material-symbols-outlined text-ben-muted">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-12 space-y-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {/* Section 1: Identity */}
                                <div className="space-y-8">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2">Part 01 — Business Identity</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Business Name</label>
                                            <input name="business_name" value={formData.business_name} onChange={handleChange} className="w-full mt-2 bg-ben-bg/30 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Category</label>
                                            <select name="business_type" value={formData.business_type} onChange={handleChange} className="w-full mt-2 bg-ben-bg/30 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none">
                                                <option value="hotel">Hotel</option>
                                                <option value="bar">Bar / Lounge</option>
                                                <option value="restaurant">Restaurant / Eatery</option>
                                                <option value="guesthouse">Guesthouse / Motel</option>
                                                <option value="resort">Resort</option>
                                                <option value="event_centre">Event Centre</option>
                                                <option value="club">Club / Nightlife</option>
                                                <option value="cafe">Café / Coffee Shop</option>
                                                <option value="fast_food">Fast Food Outlet</option>
                                                <option value="catering">Catering Company</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Business Size</label>
                                            <select name="business_size" value={formData.business_size} onChange={handleChange} className="w-full mt-2 bg-ben-bg/30 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none">
                                                <option>Micro (1–5 staff)</option>
                                                <option>Small (6–20 staff)</option>
                                                <option>Medium (21–100 staff)</option>
                                                <option>Large (100+ staff)</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Update Logo</label>
                                            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="w-full mt-2 px-4 py-3 bg-ben-bg/30 border border-ben-border rounded-2xl text-[10px] font-bold text-ben-muted file:bg-white file:border-ben-border file:rounded-xl file:px-4 file:py-2 file:mr-4 file:text-indigo-600 file:font-bold" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Scale */}
                                <div className="space-y-8">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2">Part 02 — Scale & Operations</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Rooms / Capacity</label>
                                            <input name="rooms_count" value={formData.rooms_count} onChange={handleChange} className="w-full mt-2 bg-ben-bg/30 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Avg Daily Guests</label>
                                            <input type="number" name="avg_daily_guests" value={formData.avg_daily_guests} onChange={handleChange} className="w-full mt-2 bg-ben-bg/30 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Operating Hours</label>
                                            <input name="operating_hours" value={formData.operating_hours} onChange={handleChange} className="w-full mt-2 bg-ben-bg/30 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest block mb-4">Peak Activity Days</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Weekdays', 'Weekends', 'Public Holidays', 'Event Days'].map(day => (
                                                    <button key={day} type="button" onClick={() => handleToggle(setPeakDays, day)} className={`px-5 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${peakDays[day] ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-ben-border text-ben-muted hover:border-indigo-400'}`}>
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Waste Profile */}
                                <div className="space-y-8">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2">Part 03 — Waste Ecosystem</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {['Food / Organic', 'General / Mixed', 'Glass', 'Plastic', 'Paper / Cardboard', 'Metal', 'Textile', 'Hazardous', 'E-Waste', 'Grease / Oil'].map(type => (
                                            <button key={type} type="button" onClick={() => handleToggle(setWasteTypes, type)} className={`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all duration-300 ${wasteTypes[type] ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-ben-border text-ben-muted hover:border-indigo-400'}`}>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-center">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 4: Map Location */}
                                <div className="space-y-8">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2">Part 04 — Geo-Location Precision</h3>
                                    <div className="grid grid-cols-2 gap-6 p-10 bg-ben-bg/30 rounded-[40px] border border-ben-border border-dashed">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Latitude</label>
                                            <input type="number" step="any" value={mapPosition[0]} onChange={(e) => setMapPosition([parseFloat(e.target.value), mapPosition[1]])} className="w-full mt-2 bg-white border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Longitude</label>
                                            <input type="number" step="any" value={mapPosition[1]} onChange={(e) => setMapPosition([mapPosition[0], parseFloat(e.target.value)])} className="w-full mt-2 bg-white border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                                        </div>
                                    </div>
                                    <div className="px-4">
                                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest italic">Manual coordinates input (Spatial Decision Support System)</span>
                                    </div>
                                </div>

                                {/* Section 5: EcoCoins */}
                                <div className="space-y-8">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2">Part 05 — Reward Economy</h3>
                                    <div className="p-10 rounded-[40px] bg-ben-text text-white relative overflow-hidden">
                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                            <div>
                                                <h4 className="text-2xl font-serif italic text-white mb-2">EcoCoin Network</h4>
                                                <p className="text-xs opacity-60 max-w-sm">Manage how your establishment participates in the ecological incentive system.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" name="accepts_eco_coins" checked={formData.accepts_eco_coins} onChange={handleChange} className="sr-only peer" />
                                                <div className="w-16 h-8 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>

                                        {formData.accepts_eco_coins && (
                                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/10 animate-fade-in">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Discount Rate (₦ per coin)</label>
                                                    <input type="number" name="coin_discount_rate" value={formData.coin_discount_rate} onChange={handleChange} className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-white/30" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Max Discount (%)</label>
                                                    <input type="number" name="max_coin_discount_percent" value={formData.max_coin_discount_percent} onChange={handleChange} className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-white/30" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-6">Applicable Services</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Accommodation', 'Food & Drinks', 'Spa/Leisure', 'Event Booking'].map(svc => (
                                                            <button key={svc} type="button" onClick={() => handleToggle(setEcoCoinServices, svc)} className={`px-5 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${ecoCoinServices[svc] ? 'bg-white text-ben-text border-white' : 'bg-white/5 border-white/10 hover:bg-white/20'}`}>
                                                                {svc}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-10 flex gap-4">
                                    <button 
                                        type="submit" 
                                        disabled={updating}
                                        className="flex-1 py-5 bg-indigo-600 text-white rounded-[30px] font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-600/20 transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {updating ? 'Persisting Changes...' : 'Save Operational Updates'}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-10 py-5 border border-ben-border text-ben-muted rounded-[30px] font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
