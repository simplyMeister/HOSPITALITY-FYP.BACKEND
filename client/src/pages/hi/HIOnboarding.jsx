import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
    return position === null ? null : (
      <Marker position={position}></Marker>
    );
}

export default function HIOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [logoFile, setLogoFile] = useState(null);
  const [mapPosition, setMapPosition] = useState([6.5244, 3.3792]); // Default Lagos
  
  const [formData, setFormData] = useState({
    // Step 1: Identity
    business_name: '',
    business_type: 'hotel',
    business_size: 'Small',
    cac_number: '',
    year_established: '',
    tagline: '',
    
    // Step 2: Contact
    email: '',
    phone_primary: '',
    phone_secondary: '',
    address: '',
    
    // Step 3: Establishment
    rooms_count: '',
    seat_capacity: '',
    avg_daily_guests: '',
    floors_count: '1',
    staff_count: '',
    operating_hours: '24 Hours',
    
    // Step 5: Service
    preferred_frequency: 'Weekly',
    preferred_time_window: 'Early morning 5am–7am',
    requires_manifest: false,
    emergency_collection_needed: false,
    special_handling: '',
    access_instructions: '',
    
    // Step 7: EcoCoins
    accepts_eco_coins: false,
    coin_discount_rate: '0',
    max_coin_discount_percent: '10'
  });

  // Multi-select states
  const [peakDays, setPeakDays] = useState({
    'Weekdays': true, 'Weekends': true, 'Public Holidays': false
  });
  const [wasteTypes, setWasteTypes] = useState({
    'Food / Organic': true, 'General / Mixed': true, 'Glass': false, 
    'Plastic': false, 'Paper / Cardboard': false, 'Metal': false,
    'Textile': false, 'Hazardous': false, 'E-Waste': false, 'Grease / Oil': false
  });
  const [collectionDays, setCollectionDays] = useState({
    'Mon': false, 'Tue': false, 'Wed': false, 'Thu': false, 
    'Fri': false, 'Sat': false, 'Sun': false
  });
  const [sustainability, setSustainability] = useState({
    'Compost organic': false, 'Donate food': false, 'Biodegradable packaging': false,
    'Linen reuse': false, 'Waste tracking': false, 'Staff training': false
  });
  const [ecoGoals, setEcoGoals] = useState({
    'Reduce waste': false, 'Zero landfill': false, 'Green certification': false,
    'Carbon reduction': false, 'Guest satisfaction': false
  });
  const [ecoCoinServices, setEcoCoinServices] = useState({
    'Accommodation': false, 'Food & Drinks': false, 'Spa/Leisure': false, 'Event Booking': false
  });

  useEffect(() => {
    const fetchExisting = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        const { data: hiProfile } = await supabase.from('hospitality_profiles').select('*').eq('id', session.user.id).single();

        if (hiProfile?.is_profile_complete) {
            navigate('/hi');
            return;
        }

        if (profile) {
            setFormData(prev => ({
                ...prev,
                business_name: hiProfile?.business_name || prev.business_name,
                business_type: hiProfile?.business_type || prev.business_type,
                address: hiProfile?.address || prev.address,
                email: profile.email,
                phone_primary: profile.phone || prev.phone_primary
            }));
        }
    };
    fetchExisting();
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
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(`hi-logos/${fileName}`, logoFile);
        
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(`hi-logos/${fileName}`);
          logoUrl = publicUrlData.publicUrl;
        }
      }

      // Arrays extraction
      const pDays = Object.entries(peakDays).filter(([_,v]) => v).map(([k]) => k);
      const wTypes = Object.entries(wasteTypes).filter(([_,v]) => v).map(([k]) => k);
      const cDays = Object.entries(collectionDays).filter(([_,v]) => v).map(([k]) => k);
      const sPractices = Object.entries(sustainability).filter(([_,v]) => v).map(([k]) => k);
      const sGoals = Object.entries(ecoGoals).filter(([_,v]) => v).map(([k]) => k);
      const ecServices = Object.entries(ecoCoinServices).filter(([_,v]) => v).map(([k]) => k);

      // 1. Update Profiles Table
      await supabase.from('profiles').update({
        phone: formData.phone_primary,
        profile_image_url: logoUrl || undefined
      }).eq('id', session.user.id);

      // 2. Update Hospitality Profiles
      const hiPayload = {
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
        peak_days: pDays,
        
        waste_types: wTypes,
        preferred_frequency: formData.preferred_frequency,
        preferred_time_window: formData.preferred_time_window,
        collection_days: cDays,
        requires_manifest: formData.requires_manifest,
        emergency_collection_needed: formData.emergency_collection_needed,
        special_handling: formData.special_handling,
        access_instructions: formData.access_instructions,
        
        sustainability_practices: sPractices,
        sustainability_goals: sGoals,
        accepts_eco_coins: formData.accepts_eco_coins,
        coin_discount_rate: parseFloat(formData.coin_discount_rate) || 0,
        max_coin_discount_percent: parseFloat(formData.max_coin_discount_percent) || 0,
        eco_coin_services: ecServices,
        
        is_profile_complete: true
      };

      const { error: hiError } = await supabase.from('hospitality_profiles').update(hiPayload).eq('id', session.user.id);
      if (hiError) throw hiError;

      toast.success("Establishment profile verified!");
      navigate('/hi');

    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ben-bg flex items-center justify-center p-6 transition-colors duration-500">
      
      <div className="relative z-10 w-full max-w-4xl bg-white/70 border border-white shadow-2xl backdrop-blur-2xl rounded-[40px] p-8 md:p-12 overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-fade-in">
        <div className="mb-12 text-center">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <span className="material-symbols-outlined text-4xl text-indigo-600">apartment</span>
            </div>
            <h1 className="text-4xl font-serif italic text-ben-text mb-2">Establishment <span className="text-indigo-600">Verification</span></h1>
            <p className="text-sm text-ben-muted">Configure your venue for precision waste management and the EcoCoin network.</p>
        </div>

        <div className="flex gap-1.5 mb-12 justify-center">
            {[1,2,3,4,5,6,7].map(s => (
                <div key={s} className={`h-1.5 flex-1 max-w-[60px] rounded-full transition-all duration-500 ${s <= step ? 'bg-indigo-600' : 'bg-ben-border opacity-30'}`} />
            ))}
        </div>

        <form onSubmit={step === 7 ? handleSave : (e) => { e.preventDefault(); setStep(step + 1); toast.success(`Step ${step} verified. Progress saved.`); }} className="space-y-8">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: -20, opacity: 0 }} key="step1" className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2 mb-8">Part 01 — Business Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Business Name *</label>
                                <input name="business_name" required value={formData.business_name} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Category</label>
                                <select name="business_type" value={formData.business_type} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none">
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
                                <select name="business_size" value={formData.business_size} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none">
                                    <option>Micro (1–5 staff)</option>
                                    <option>Small (6–20 staff)</option>
                                    <option>Medium (21–100 staff)</option>
                                    <option>Large (100+ staff)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">CAC Number (Optional)</label>
                                <input name="cac_number" value={formData.cac_number} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Year Established</label>
                                <input type="number" name="year_established" value={formData.year_established} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Business Logo</label>
                                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="w-full mt-2 px-4 py-3 bg-white/50 border border-ben-border rounded-2xl text-[10px] font-bold text-ben-muted file:bg-indigo-50 file:border-0 file:rounded-xl file:px-4 file:py-2 file:mr-4 file:text-indigo-700 file:font-bold" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Tagline / Short Bio</label>
                                <textarea name="tagline" placeholder="Briefly describe your establishment" rows={2} value={formData.tagline} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none resize-none" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="step2" className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2 mb-8">Part 02 — Contact & Mapping</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Official Email *</label>
                                <input type="email" name="email" required readOnly value={formData.email} className="w-full mt-2 bg-ben-bg border border-ben-border rounded-2xl px-5 py-4 text-ben-muted outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Primary Phone *</label>
                                <input name="phone_primary" required value={formData.phone_primary} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Street Address *</label>
                                <input name="address" required value={formData.address} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest mb-3 block">Pin Physical Location (For GCS Planning)</label>
                                <div className="h-64 rounded-3xl overflow-hidden border border-ben-border shadow-inner relative z-0">
                                    <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                                    </MapContainer>
                                </div>
                                <div className="flex justify-between items-center mt-3 px-2">
                                    <span className="text-[9px] font-mono text-ben-muted">LAT: {mapPosition[0].toFixed(6)} | LNG: {mapPosition[1].toFixed(6)}</span>
                                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest italic">Click map to set pin</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="step3" className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2 mb-8">Part 03 — Scale & Capacity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest text-nowrap">Rooms / Capacity *</label>
                                <input name="rooms_count" required value={formData.rooms_count} onChange={handleChange} placeholder="e.g. 45 rooms" className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Daily Guests</label>
                                <input type="number" name="avg_daily_guests" value={formData.avg_daily_guests} onChange={handleChange} placeholder="est. footfall" className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">No. of Floors</label>
                                <input type="number" name="floors_count" value={formData.floors_count} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Operating Hours</label>
                                <input name="operating_hours" value={formData.operating_hours} onChange={handleChange} placeholder="e.g. 8am - 10pm" className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                             <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Total Staff</label>
                                <input type="number" name="staff_count" value={formData.staff_count} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest block mb-4">Peak Traffic Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(peakDays).map(day => (
                                        <button key={day} type="button" onClick={() => handleToggle(setPeakDays, day)} className={`px-5 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${peakDays[day] ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-ben-border text-ben-muted hover:border-indigo-400'}`}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="step4" className="space-y-6">
                         <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2 mb-8">Part 04 — Waste Profile</h3>
                         <p className="text-xs text-ben-muted italic mb-6">Categorize your primary waste streams to help GCS allocate specialized collection equipment.</p>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.keys(wasteTypes).map(type => (
                                <button key={type} type="button" onClick={() => handleToggle(setWasteTypes, type)} className={`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all duration-300 ${wasteTypes[type] ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-ben-border text-ben-muted hover:border-indigo-400'}`}>
                                    <span className="material-symbols-outlined text-2xl">
                                        {type.includes('Food') ? 'ebike' : type.includes('Glass') ? 'wine_bar' : type.includes('Plastic') ? 'layers' : 'delete'}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-center">{type}</span>
                                </button>
                            ))}
                         </div>
                    </motion.div>
                )}

                {step === 5 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="step5" className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2 mb-8">Part 05 — Service Needs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Preferred Frequency</label>
                                <select name="preferred_frequency" value={formData.preferred_frequency} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none">
                                    <option>Daily</option>
                                    <option>Every 2 Days</option>
                                    <option>Twice Weekly</option>
                                    <option>Weekly</option>
                                    <option>On-Demand (Sensor Based)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Time Window</label>
                                <select name="preferred_time_window" value={formData.preferred_time_window} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none">
                                    <option>Early morning 5am–7am</option>
                                    <option>Morning 8am–11am</option>
                                    <option>Afternoon 1pm–4pm</option>
                                    <option>Late night after 10pm</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest block mb-4">Preferred Collection Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(collectionDays).map(day => (
                                        <button key={day} type="button" onClick={() => handleToggle(setCollectionDays, day)} className={`w-12 h-12 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${collectionDays[day] ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-ben-border text-ben-muted hover:border-indigo-400'}`}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-10 py-4 px-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                     <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.requires_manifest ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-ben-border group-hover:border-indigo-400'}`}>
                                         {formData.requires_manifest && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                     </div>
                                     <input type="checkbox" name="requires_manifest" checked={formData.requires_manifest} onChange={handleChange} className="hidden" />
                                     <span className="text-[11px] font-bold text-ben-text uppercase tracking-widest">Requires Manifest Doc</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                     <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.emergency_collection_needed ? 'bg-red-600 border-red-600' : 'bg-white border-ben-border group-hover:border-red-400'}`}>
                                         {formData.emergency_collection_needed && <span className="material-symbols-outlined text-white text-xs">priority_high</span>}
                                     </div>
                                     <input type="checkbox" name="emergency_collection_needed" checked={formData.emergency_collection_needed} onChange={handleChange} className="hidden" />
                                     <span className="text-[11px] font-bold text-ben-text uppercase tracking-widest">Emergency Ready</span>
                                </label>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest">Access Instructions for Crew</label>
                                <textarea name="access_instructions" placeholder="e.g. Use the service lane at the back" rows={2} value={formData.access_instructions} onChange={handleChange} className="w-full mt-2 bg-white/50 border border-ben-border rounded-2xl px-5 py-4 text-ben-text focus:border-indigo-600 outline-none resize-none" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 6 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="step6" className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2 mb-8">Part 06 — Eco Commitment</h3>
                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest block mb-4">Current Green Practices</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.keys(sustainability).map(p => (
                                        <button key={p} type="button" onClick={() => handleToggle(setSustainability, p)} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${sustainability[p] ? 'bg-green-600/10 border-green-600/30 text-green-700 font-bold' : 'bg-white border-ben-border text-ben-muted hover:border-green-400'}`}>
                                            <span className="material-symbols-outlined text-lg">{sustainability[p] ? 'check_circle' : 'circle'}</span>
                                            <span className="text-[11px] uppercase tracking-widest">{p}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-ben-muted ml-1 tracking-widest block mb-4">Eco Goals (12 Months)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.keys(ecoGoals).map(g => (
                                        <button key={g} type="button" onClick={() => handleToggle(setEcoGoals, g)} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${ecoGoals[g] ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-700 font-bold' : 'bg-white border-ben-border text-ben-muted hover:border-indigo-400'}`}>
                                            <span className="material-symbols-outlined text-lg">flag</span>
                                            <span className="text-[11px] uppercase tracking-widest">{g}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 7 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="step7" className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 border-b border-indigo-100 pb-2 mb-8">Part 07 — EcoCoin Economy</h3>
                        <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl mb-8 relative overflow-hidden">
                             <div className="relative z-10">
                                 <div className="flex justify-between items-center mb-10">
                                     <div>
                                         <h4 className="text-2xl font-serif italic mb-1 text-white">Guest Rewards</h4>
                                         <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">EcoCoin Participation</p>
                                     </div>
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="accepts_eco_coins" checked={formData.accepts_eco_coins} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-14 h-7 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
                                     </label>
                                 </div>

                                 {formData.accepts_eco_coins && (
                                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 animate-fade-in">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                             <div className="space-y-4">
                                                 <label className="text-[10px] font-bold uppercase tracking-widest opacity-80">Discount Rate (₦ per coin)</label>
                                                 <input type="number" name="coin_discount_rate" value={formData.coin_discount_rate} onChange={handleChange} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white outline-none focus:border-white" placeholder="e.g. 50" />
                                             </div>
                                             <div className="space-y-4">
                                                 <label className="text-[10px] font-bold uppercase tracking-widest opacity-80">Max Discount Limit (%)</label>
                                                 <input type="number" name="max_coin_discount_percent" value={formData.max_coin_discount_percent} onChange={handleChange} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white outline-none focus:border-white" placeholder="e.g. 20" />
                                             </div>
                                         </div>
                                         <div>
                                             <label className="text-[10px] font-bold uppercase tracking-widest opacity-80 block mb-6">Eligible Services</label>
                                             <div className="flex flex-wrap gap-2">
                                                 {Object.keys(ecoCoinServices).map(svc => (
                                                     <button key={svc} type="button" onClick={() => handleToggle(setEcoCoinServices, svc)} className={`px-5 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${ecoCoinServices[svc] ? 'bg-white text-indigo-700 border-white' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                                                         {svc}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                     </motion.div>
                                 )}
                             </div>
                             <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center pt-8 border-t border-ben-border mt-12">
                {step > 1 ? (
                    <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 border border-ben-border text-ben-text rounded-full font-bold uppercase tracking-widest text-[9px] hover:bg-white transition-all">
                        Back
                    </button>
                ) : <div/>}

                <button type="submit" disabled={loading} className="px-8 py-3.5 bg-indigo-600 text-white rounded-full font-bold uppercase tracking-widest text-[9px] hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-600/20 active:scale-95">
                    {step === 7 ? (loading ? 'Finalizing Profile...' : 'Launch Establishment') : 'Advance to Next Phase'}
                    {step !== 7 && !loading && <span className="material-symbols-outlined text-[14px]">arrow_forward</span>}
                    {loading && <span className="material-symbols-outlined animate-spin text-[14px]">cached</span>}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
