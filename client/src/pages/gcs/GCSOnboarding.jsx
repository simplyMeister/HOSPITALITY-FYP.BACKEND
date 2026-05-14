import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GCSOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [logoFile, setLogoFile] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Identity
    company_name: '',
    rc_number: '',
    year_established: '',
    tagline: '',
    business_type: 'Private Company',
    
    // Step 2: Contact
    primary_email: '',
    primary_phone: '',
    secondary_phone: '',
    office_address: '',
    gps_lat: '',
    gps_lng: '',
    website_url: '',
    
    // Step 3: Coverage
    service_states: '',
    service_lgas: '',
    max_service_radius_km: '50',
    
    // Step 4: Capacity
    fleet_size: '1',
    worker_count: '1',
    max_hi_clients: '10',
    
    // Step 5: Pricing
    pricing_model: 'Fixed Monthly Fee',
    starting_price: '',
    accepts_online_payment: false,
    invoice_cycle: 'Monthly'
  });

  const [serviceTypes, setServiceTypes] = useState({
    'General Waste': true, 'Recyclables': false, 'Organic / Food Waste': false, 
    'Hazardous Waste': false, 'E-Waste': false, 'Bulk / Industrial Waste': false
  });
  const [frequency, setFrequency] = useState({
    'Daily': false, 'Every 2 Days': false, 'Twice Weekly': false, 
    'Weekly': true, 'On-Demand / Alert-Based only': false
  });
  const [vehicleTypes, setVehicleTypes] = useState({
    'Tricycle (Keke)': false, 'Pick-up Truck': true, 
    'Compactor Truck': false, 'Tipper Truck': false
  });

  useEffect(() => {
    const checkCompletion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: gcsData } = await supabase.from('gcs_profiles').select('is_profile_complete, company_name').eq('id', session.user.id).single();
      const meta = session.user.user_metadata || {};

      if (gcsData?.is_profile_complete) {
         navigate('/gcs');
      } else {
         setFormData(prev => ({ 
             ...prev, 
             company_name: gcsData?.company_name || meta.company_name || prev.company_name,
             primary_email: session.user.email || prev.primary_email,
             primary_phone: meta.phone || prev.primary_phone,
             fleet_size: meta.fleet_size || prev.fleet_size,
             rc_number: meta.license_number || prev.rc_number,
             service_states: meta.state || prev.service_states,
             service_lgas: meta.service_area || meta.lga || prev.service_lgas,
             office_address: meta.lga && meta.state ? `${meta.lga}, ${meta.state}` : prev.office_address
         }));
      }
    };
    checkCompletion();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleToggle = (setter, target) => {
    setter(prev => ({ ...prev, [target]: !prev[target] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      let logoUrl = null;

      // 1. Upload Logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(`gcs-logos/${fileName}`, logoFile, { upsert: true });

        if (uploadError) {
          console.error("Logo upload failed, continuing without it.", uploadError);
          // Don't throw here to prevent totally blocking the user if storage isn't configured perfectly
        } else {
          const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(`gcs-logos/${fileName}`);
          logoUrl = publicUrlData.publicUrl;
        }
      }

      // Arrays extraction
      const sTypes = Object.entries(serviceTypes).filter(([_,v]) => v).map(([k]) => k);
      const freq = Object.entries(frequency).filter(([_,v]) => v).map(([k]) => k);
      const vehicles = Object.entries(vehicleTypes).filter(([_,v]) => v).map(([k]) => k);
      
      const sStates = formData.service_states ? formData.service_states.split(',').map(s => s.trim()) : [];
      const sLgas = formData.service_lgas ? formData.service_lgas.split(',').map(s => s.trim()) : [];

      // 2. Update Primary Profile
      const profilePayload = {
          email: formData.primary_email,
          phone: formData.primary_phone,
          ...(logoUrl && { profile_image_url: logoUrl })
      };
      const { error: profileError } = await supabase.from('profiles').update(profilePayload).eq('id', session.user.id);
      if (profileError) throw profileError;

      // 3. Update GCS Profile
      const gcsPayload = {
        company_name: formData.company_name,
        rc_number: formData.rc_number,
        year_established: parseInt(formData.year_established) || null,
        tagline: formData.tagline,
        business_type: formData.business_type,
        
        secondary_phone: formData.secondary_phone,
        office_address: formData.office_address,
        gps_lat: parseFloat(formData.gps_lat) || null,
        gps_lng: parseFloat(formData.gps_lng) || null,
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
        accepts_online_payment: formData.accepts_online_payment,
        invoice_cycle: formData.invoice_cycle,
        
        is_profile_complete: true
      };

      const { error: gcsError } = await supabase.from('gcs_profiles').update(gcsPayload).eq('id', session.user.id);
      if (gcsError) throw gcsError;

      toast.success("Profile verified completely!");
      navigate('/gcs');

    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ben-bg flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
      <div className="vignette fixed inset-0 pointer-events-none"></div>
      <div className="grid-bg fixed inset-0 opacity-20 pointer-events-none"></div>
      <div className="aurora-bg absolute inset-0 opacity-10 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl bg-white/40 border border-ben-border rounded-[40px] shadow-2xl backdrop-blur-xl p-10 lg:p-16 animate-fade-in overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-10 text-center">
              <span className="material-symbols-outlined text-6xl text-blue-600 mb-4 inline-block">domain_verification</span>
              <h1 className="text-4xl font-serif italic text-ben-text mb-2">Provider <span className="text-blue-600">Verification</span></h1>
              <p className="text-sm text-ben-muted max-w-lg mx-auto">Complete your operational profile to unlock full dashboard access and enter the eco-hospitality marketplace.</p>
          </div>

          <div className="flex gap-2 mb-10 justify-center flex-wrap">
              {[1,2,3,4,5].map(s => (
                  <div key={s} className={`h-1.5 flex-1 max-w-[80px] rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-ben-border'}`} />
              ))}
          </div>

          <form onSubmit={step === 5 ? handleSave : (e) => { e.preventDefault(); setStep(step + 1); toast.success(`Step ${step} verified. Progress saved.`); }} className="space-y-8 animate-fade-in">
              {/* STEP 1: COMPANY IDENTITY */}
              {step === 1 && (
                 <div className="space-y-6 animate-fade-in">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">1. Company Identity</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Company Name *</label>
                            <input name="company_name" required value={formData.company_name} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">RC Number *</label>
                            <input name="rc_number" required value={formData.rc_number} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Year Established</label>
                            <input type="number" name="year_established" value={formData.year_established} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Business Type</label>
                            <select name="business_type" value={formData.business_type} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none">
                                <option>Private Company</option>
                                <option>NGO</option>
                                <option>Government Agency</option>
                                <option>Cooperative</option>
                            </select>
                         </div>
                         <div className="md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Company Logo</label>
                            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-2.5 text-ben-text focus:border-blue-600 outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Short Bio / Tagline</label>
                            <textarea name="tagline" placeholder="1-2 sentence description of your service" rows={2} value={formData.tagline} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none resize-none" />
                         </div>
                     </div>
                 </div>
              )}

              {/* STEP 2: CONTACT & LOCATION */}
              {step === 2 && (
                 <div className="space-y-6 animate-fade-in">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">2. Contact & Location</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Official Email *</label>
                            <input type="email" name="primary_email" required value={formData.primary_email} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Website URL (Optional)</label>
                            <input name="website_url" placeholder="https://" value={formData.website_url} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Primary Phone *</label>
                            <input name="primary_phone" required value={formData.primary_phone} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Secondary / WhatsApp</label>
                            <input name="secondary_phone" value={formData.secondary_phone} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Office Address *</label>
                            <input name="office_address" placeholder="Street, LGA, State" required value={formData.office_address} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">GPS Latitude (Optional)</label>
                            <input name="gps_lat" placeholder="e.g. 6.5244" value={formData.gps_lat} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none font-mono" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">GPS Longitude (Optional)</label>
                            <input name="gps_lng" placeholder="e.g. 3.3792" value={formData.gps_lng} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none font-mono" />
                         </div>
                     </div>
                 </div>
              )}

              {/* STEP 3: SERVICE COVERAGE */}
              {step === 3 && (
                 <div className="space-y-6 animate-fade-in">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">3. Service Coverage</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Service States (Comma separated) *</label>
                            <input name="service_states" placeholder="e.g. Lagos, Ogun" required value={formData.service_states} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Service LGAs (Comma separated) *</label>
                            <input name="service_lgas" placeholder="e.g. Ikeja, Lekki, Yaba" required value={formData.service_lgas} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Max Service Radius (km)</label>
                            <input type="number" name="max_service_radius_km" value={formData.max_service_radius_km} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div className="md:col-span-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1 block mb-3">Waste Categories Handled</label>
                             <div className="flex flex-wrap gap-2">
                                 {Object.keys(serviceTypes).map(type => (
                                     <button type="button" key={type} onClick={() => handleToggle(setServiceTypes, type)} className={`px-4 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${serviceTypes[type] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white/50 border-ben-border text-ben-muted hover:border-blue-400'}`}>
                                         {type}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
              )}

              {/* STEP 4: OPERATIONAL CAPACITY */}
              {step === 4 && (
                 <div className="space-y-6 animate-fade-in">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">4. Operational Capacity</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Total Fleet Size *</label>
                            <input type="number" name="fleet_size" required value={formData.fleet_size} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Field Workers / Drivers</label>
                            <input type="number" name="worker_count" value={formData.worker_count} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div className="md:col-span-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1 block mb-3">Vehicle Types in Fleet</label>
                             <div className="flex flex-wrap gap-2">
                                 {Object.keys(vehicleTypes).map(type => (
                                     <button type="button" key={type} onClick={() => handleToggle(setVehicleTypes, type)} className={`px-4 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${vehicleTypes[type] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white/50 border-ben-border text-ben-muted hover:border-blue-400'}`}>
                                         {type}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <div className="md:col-span-2 border-t border-ben-border pt-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Max Hospitality Clients Capacity</label>
                            <input type="number" name="max_hi_clients" value={formData.max_hi_clients} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                            <p className="text-xs text-ben-muted mt-2 ml-1">How many active businesses can your fleet realistically service simultaneously?</p>
                         </div>
                         <div className="md:col-span-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1 block mb-3">Supported Collection Frequencies</label>
                             <div className="flex flex-wrap gap-2">
                                 {Object.keys(frequency).map(type => (
                                     <button type="button" key={type} onClick={() => handleToggle(setFrequency, type)} className={`px-4 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${frequency[type] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white/50 border-ben-border text-ben-muted hover:border-blue-400'}`}>
                                         {type}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
              )}

              {/* STEP 5: PRICING & PAYMENT */}
              {step === 5 && (
                 <div className="space-y-6 animate-fade-in">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-ben-muted border-b border-ben-border pb-2 mb-6">5. Pricing & Payment</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Primary Pricing Model</label>
                            <select name="pricing_model" value={formData.pricing_model} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none">
                                <option>Fixed Monthly Fee</option>
                                <option>Per-Collection Fee</option>
                                <option>Weight-Based (per kg)</option>
                                <option>Volume-Based (per bin size)</option>
                                <option>Custom Quote</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Starting Price/Rate</label>
                            <input name="starting_price" placeholder="e.g. ₦15,000/month or ₦2,500/collection" value={formData.starting_price} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-ben-muted ml-1">Invoice Cycle</label>
                            <select name="invoice_cycle" value={formData.invoice_cycle} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-xl px-4 py-3 text-ben-text focus:border-blue-600 outline-none">
                                <option>Weekly</option>
                                <option>Bi-weekly</option>
                                <option>Monthly</option>
                                <option>Pay-as-you-go</option>
                            </select>
                         </div>
                         <div className="flex items-center mt-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData.accepts_online_payment ? 'bg-blue-600 border-blue-600' : 'border-ben-border bg-white/50 group-hover:border-blue-400'}`}>
                                    {formData.accepts_online_payment && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                </div>
                                <input type="checkbox" name="accepts_online_payment" checked={formData.accepts_online_payment} onChange={handleChange} className="hidden" />
                                <div>
                                    <span className="block text-sm font-bold text-ben-text">Accepts Online Payment</span>
                                    <span className="block text-[10px] text-ben-muted">Via Paystack / Flutterwave on platform</span>
                                </div>
                            </label>
                         </div>
                     </div>
                 </div>
              )}

              <div className="flex justify-between pt-6 border-t border-ben-border mt-8">
                  {step > 1 ? (
                      <button type="button" onClick={() => setStep(step - 1)} className="px-8 py-4 border border-ben-border text-ben-text rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all">Back</button>
                  ) : <div/>}

                  <button type="submit" disabled={loading} className="px-10 py-4 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {step === 5 ? (loading ? 'Saving Profile...' : 'Complete Registration') : 'Continue'}
                      {step !== 5 && !loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                  </button>
              </div>
          </form>
      </div>
    </div>
  );
}
