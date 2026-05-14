import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function GCSSettings() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form Data State
    const [formData, setFormData] = useState({
        // Profile
        company_name: '',
        rc_number: '',
        year_established: '',
        tagline: '',
        business_type: '',
        primary_email: '',
        primary_phone: '',
        secondary_phone: '',
        office_address: '',
        website_url: '',
        
        // Operations
        fleet_size: '',
        worker_count: '',
        max_hi_clients: '',
        
        // Geographies
        service_states: '',
        service_lgas: '',
        max_service_radius_km: '',
        
        // Finance
        pricing_model: '',
        starting_price: '',
        invoice_cycle: '',
        accepts_online_payment: false,
    });

    const [serviceTypes, setServiceTypes] = useState({});
    const [vehicleTypes, setVehicleTypes] = useState({});
    const [frequency, setFrequency] = useState({});

    // Load Initial Data
    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const [gcsData, profileData] = await Promise.all([
                supabase.from('gcs_profiles').select('*').eq('id', session.user.id).single(),
                supabase.from('profiles').select('email, phone').eq('id', session.user.id).single()
            ]);

            if (gcsData.data && profileData.data) {
                const g = gcsData.data;
                const p = profileData.data;
                
                setFormData({
                    company_name: g.company_name || '',
                    rc_number: g.rc_number || '',
                    year_established: g.year_established || '',
                    tagline: g.tagline || '',
                    business_type: g.business_type || '',
                    primary_email: p.email || '',
                    primary_phone: p.phone || '',
                    secondary_phone: g.secondary_phone || '',
                    office_address: g.office_address || '',
                    website_url: g.website_url || '',
                    fleet_size: g.fleet_size || '',
                    worker_count: g.worker_count || '',
                    max_hi_clients: g.max_hi_clients || '',
                    service_states: g.service_states ? g.service_states.join(', ') : '',
                    service_lgas: g.service_lgas ? g.service_lgas.join(', ') : '',
                    max_service_radius_km: g.max_service_radius_km || '',
                    pricing_model: g.pricing_model || '',
                    starting_price: g.starting_price || '',
                    invoice_cycle: g.invoice_cycle || '',
                    accepts_online_payment: g.accepts_online_payment || false,
                });

                // Arrays boolean map
                const sTypesObj = {};
                (g.service_types || []).forEach(t => sTypesObj[t] = true);
                setServiceTypes(sTypesObj);

                const vTypesObj = {};
                (g.vehicle_types || []).forEach(t => vTypesObj[t] = true);
                setVehicleTypes(vTypesObj);

                const freqObj = {};
                (g.collection_frequency || []).forEach(t => freqObj[t] = true);
                setFrequency(freqObj);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleToggle = (setter, target) => {
        setter(prev => ({ ...prev, [target]: !prev[target] }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const toastId = toast.loading('Saving updates...');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Authentication error");

            // Profiles update
            const { error: pErr } = await supabase.from('profiles').update({
                email: formData.primary_email,
                phone: formData.primary_phone
            }).eq('id', session.user.id);
            if (pErr) throw pErr;

            // Arrays
            const sTypes = Object.entries(serviceTypes).filter(([_, v]) => v).map(([k]) => k);
            const freq = Object.entries(frequency).filter(([_, v]) => v).map(([k]) => k);
            const vehicles = Object.entries(vehicleTypes).filter(([_, v]) => v).map(([k]) => k);
            const sStates = formData.service_states ? formData.service_states.split(',').map(s => s.trim()) : [];
            const sLgas = formData.service_lgas ? formData.service_lgas.split(',').map(s => s.trim()) : [];

            // GCS profiles update
            const gcsPayload = {
                company_name: formData.company_name,
                rc_number: formData.rc_number,
                year_established: parseInt(formData.year_established) || null,
                tagline: formData.tagline,
                business_type: formData.business_type,
                secondary_phone: formData.secondary_phone,
                office_address: formData.office_address,
                website_url: formData.website_url,
                service_states: sStates,
                service_lgas: sLgas,
                max_service_radius_km: parseInt(formData.max_service_radius_km) || null,
                service_types: sTypes,
                fleet_size: parseInt(formData.fleet_size) || 1,
                vehicle_types: vehicles,
                worker_count: parseInt(formData.worker_count) || null,
                max_hi_clients: parseInt(formData.max_hi_clients) || null,
                collection_frequency: freq,
                pricing_model: formData.pricing_model,
                starting_price: formData.starting_price,
                invoice_cycle: formData.invoice_cycle,
                accepts_online_payment: formData.accepts_online_payment
            };

            const { error: gErr } = await supabase.from('gcs_profiles').update(gcsPayload).eq('id', session.user.id);
            if (gErr) throw gErr;

            toast.success("Settings updated successfully!", { id: toastId });
            setActiveTab('overview');
        } catch (err) {
            toast.error(err.message, { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout roleTitle="Ecosystem Operator / G.C.S">
                <div className="flex justify-center p-20"><div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout roleTitle="Ecosystem Operator / G.C.S">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative z-10 pb-10">
                {/* Header Back Logic */}
                <div className="flex justify-between items-end px-4">
                    <div>
                        <div className="flex items-center gap-3">
                            {activeTab !== 'overview' && (
                                <button onClick={() => setActiveTab('overview')} className="p-2 -ml-2 rounded-full hover:bg-white/50 text-ben-text transition-colors">
                                    <span className="material-symbols-outlined shrink-0 text-xl">arrow_back</span>
                                </button>
                            )}
                            <h1 className="text-4xl font-serif italic text-ben-text mb-1">
                                {activeTab === 'overview' ? 'Fleet' : activeTab === 'company' ? 'Company' : activeTab === 'geography' ? 'Service' : 'Financial'} <span className="text-blue-600">{activeTab === 'overview' ? 'Configuration' : activeTab === 'geography' ? 'Geographies' : 'Profile'}</span>
                            </h1>
                        </div>
                        <p className="text-sm text-ben-muted tracking-tight ml-1">
                            {activeTab === 'overview' ? 'Manage account details and system preferences.' : 'Update your operational parameters directly on the network.'}
                        </p>
                    </div>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div onClick={() => setActiveTab('company')} className="p-6 rounded-[32px] border border-ben-border bg-white/40 flex items-center justify-between group hover:border-blue-300 transition-all hover:bg-white/70 cursor-pointer shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                                    <span className="material-symbols-outlined">badge</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-ben-text mb-1">Company Profile</h4>
                                    <p className="text-xs text-ben-muted">Update business name, fleet size, and contact information.</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-ben-muted group-hover:text-blue-600 transition-colors group-hover:translate-x-1">chevron_right</span>
                        </div>

                        <div onClick={() => setActiveTab('geography')} className="p-6 rounded-[32px] border border-ben-border bg-white/40 flex items-center justify-between group hover:border-indigo-300 transition-all hover:bg-white/70 cursor-pointer shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <span className="material-symbols-outlined">map</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-ben-text mb-1">Service Geographies</h4>
                                    <p className="text-xs text-ben-muted">Define LGA coverage limits and operational zones.</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-ben-muted group-hover:text-indigo-600 transition-colors group-hover:translate-x-1">chevron_right</span>
                        </div>

                        <div onClick={() => setActiveTab('finance')} className="p-6 rounded-[32px] border border-ben-border bg-white/40 flex items-center justify-between group hover:border-green-300 transition-all hover:bg-white/70 cursor-pointer shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-ben-text mb-1">Financial & Contracts</h4>
                                    <p className="text-xs text-ben-muted">Define rate cards and payment processing flows.</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-ben-muted group-hover:text-green-600 transition-colors group-hover:translate-x-1">chevron_right</span>
                        </div>
                    </div>
                )}

                {/* FORM SHARED WRAPPER FOR TABS */}
                {activeTab !== 'overview' && (
                    <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl border border-ben-border p-8 rounded-[32px] shadow-sm space-y-8 animate-fade-in">
                        
                        {/* COMPANY TAB */}
                        {activeTab === 'company' && (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">Identity & Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Company Name</label>
                                        <input name="company_name" required value={formData.company_name} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">RC Number</label>
                                        <input name="rc_number" value={formData.rc_number} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Primary Email</label>
                                        <input type="email" name="primary_email" required value={formData.primary_email} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Primary Phone</label>
                                        <input name="primary_phone" required value={formData.primary_phone} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Office Address</label>
                                        <input name="office_address" value={formData.office_address} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                </div>

                                <h3 className="text-xs font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 pt-6 mb-6">Operational Assets</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Total Fleet Size</label>
                                        <input type="number" name="fleet_size" required value={formData.fleet_size} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                     </div>
                                     <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Field Workers / Drivers</label>
                                        <input type="number" name="worker_count" value={formData.worker_count} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                     </div>
                                     <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1 block mb-3">Vehicle Types</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Tricycle (Keke)', 'Pick-up Truck', 'Compactor Truck', 'Tipper Truck'].map(type => (
                                                <button type="button" key={type} onClick={() => handleToggle(setVehicleTypes, type)} className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${vehicleTypes[type] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white/50 border-ben-border text-ben-muted hover:border-blue-400'}`}>
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                </div>
                            </div>
                        )}

                        {/* GEOGRAPHY TAB */}
                        {activeTab === 'geography' && (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">Territory Definition</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Service States (Comma separated)</label>
                                        <input name="service_states" required value={formData.service_states} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Service LGAs (Comma separated)</label>
                                        <input name="service_lgas" required value={formData.service_lgas} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1 block mb-3">Supported Waste Streams</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['General Waste', 'Recyclables', 'Organic / Food Waste', 'Hazardous Waste', 'E-Waste', 'Bulk / Industrial Waste'].map(type => (
                                                <button type="button" key={type} onClick={() => handleToggle(setServiceTypes, type)} className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${serviceTypes[type] ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white/50 border-ben-border text-ben-muted hover:border-indigo-400'}`}>
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FINANCE TAB */}
                        {activeTab === 'finance' && (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">Rate Books & Processing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Pricing Model</label>
                                        <select name="pricing_model" value={formData.pricing_model} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none">
                                            <option>Fixed Monthly Fee</option>
                                            <option>Per-Collection Fee</option>
                                            <option>Weight-Based (per kg)</option>
                                            <option>Volume-Based (per bin size)</option>
                                            <option>Custom Quote</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Starting Price/Rate</label>
                                        <input name="starting_price" value={formData.starting_price} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Invoice Cycle</label>
                                        <select name="invoice_cycle" value={formData.invoice_cycle} onChange={handleChange} className="w-full mt-2 bg-white/70 border border-ben-border rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none">
                                            <option>Weekly</option>
                                            <option>Bi-weekly</option>
                                            <option>Monthly</option>
                                            <option>Pay-as-you-go</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center mt-6">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData.accepts_online_payment ? 'bg-green-600 border-green-600' : 'border-ben-border bg-white/50 group-hover:border-green-400'}`}>
                                                {formData.accepts_online_payment && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                            </div>
                                            <input type="checkbox" name="accepts_online_payment" checked={formData.accepts_online_payment} onChange={handleChange} className="hidden" />
                                            <div>
                                                <span className="block text-sm font-bold text-ben-text">Accepts Online Payment</span>
                                                <span className="block text-[10px] text-ben-muted">Allows clients to pay via Network Gateway</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="md:col-span-2 pt-6">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1 block mb-3">Collection Frequencies Supported</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Daily', 'Every 2 Days', 'Twice Weekly', 'Weekly', 'On-Demand / Alert-Based only'].map(type => (
                                                <button type="button" key={type} onClick={() => handleToggle(setFrequency, type)} className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${frequency[type] ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white/50 border-ben-border text-ben-muted hover:border-green-400'}`}>
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-6 border-t border-ben-border">
                            <button type="submit" disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50">
                                {saving ? 'Applying Update...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
}
