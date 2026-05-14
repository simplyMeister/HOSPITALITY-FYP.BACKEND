import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Register() {
    const navigate = useNavigate();
    const [role, setRole] = useState('individual');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Shared fields
    const [fullName, setFullName] = useState(''); // Used as 'Contact Person' for HI/GCS
    const [phone, setPhone] = useState('');
    const [state, setState] = useState('');
    const [lga, setLga] = useState('');

    // Hospitality specific
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('hotel');
    const [businessAddress, setBusinessAddress] = useState('');
    const [cacNumber, setCacNumber] = useState('');

    // GCS specific
    const [companyName, setCompanyName] = useState('');
    const [serviceArea, setServiceArea] = useState('');
    const [fleetSize, setFleetSize] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    const [loading, setLoading] = useState(false);

    const roles = [
      { id: 'individual', title: 'Individual', icon: 'person' },
      { id: 'hospitality', title: 'Hospitality', icon: 'hotel' },
      { id: 'gcs', title: 'GCS', icon: 'local_shipping' }
    ];

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        // Core profile data
        let payloadData = { 
            role,
            full_name: fullName,
            phone: phone,
            state: state,
            lga: lga
        };

        // Role-specific extensions
        if (role === 'hospitality') {
            payloadData.business_name = businessName;
            payloadData.business_type = businessType;
            payloadData.business_address = businessAddress;
            payloadData.cac_number = cacNumber;
        } else if (role === 'gcs') {
            payloadData.company_name = companyName;
            payloadData.service_area = serviceArea;
            payloadData.fleet_size = fleetSize;
            payloadData.license_number = licenseNumber;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: payloadData
            }
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            toast.success('Registration successful! Redirecting...');
            setTimeout(() => {
                navigate(`/${role === 'hospitality' ? 'hi' : role}`);
            }, 2000);
        }
    };

    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-ben-bg selection:bg-ben-text selection:text-white">
        {/* Premium UI Overlay Grid */}
        <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none"></div>

        {/* Dynamic Animated Mesh Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-[40%_60%_70%_30%] bg-gradient-to-br from-green-400/40 to-emerald-600/30 blur-[120px] animate-aurora mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[70%] rounded-[60%_40%_30%_70%] bg-gradient-to-tl from-indigo-400/40 to-teal-500/30 blur-[120px] animate-aurora mix-blend-multiply" style={{ animationDelay: '2s', animationDuration: '15s' }}></div>
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[50%] rounded-full bg-teal-300/30 blur-[120px] animate-pulse-slow mix-blend-multiply" style={{ animationDelay: '1s' }}></div>
        
        {/* Focus Vignette Mask */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(247,243,236,0.8)_100%)] pointer-events-none z-[1]"></div>
        
        <div className="relative z-10 w-full max-w-2xl">
          <div className="mb-12 text-center">
              <Link to="/" className="text-4xl font-serif font-black tracking-tight text-ben-text hover:opacity-70 transition-opacity">
                  Eco<span style={{ color: 'var(--theme-color, #16a34a)' }}>Flow</span>
              </Link>
          </div>

          <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] border border-ben-border p-10 shadow-[0_30px_100px_rgba(0,0,0,0.1)]">
              <h2 className="text-4xl font-serif italic text-ben-text mb-2 text-center">Initialize Access</h2>
              <p className="text-ben-muted text-sm font-sans mb-8 text-center font-medium">Join the <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">Resilient Resource Network</span>.</p>

              <form className="space-y-8" onSubmit={handleRegister}>
                  <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Ecosystem Role</label>
                      <div className="grid grid-cols-3 gap-4">
                          {roles.map((r) => (
                              <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => setRole(r.id)}
                               className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all duration-300 ${
                                      role === r.id 
                                      ? 'text-white border-transparent' 
                                      : 'bg-white/10 border-ben-border text-ben-text hover:bg-white/30'
                                  } uppercase tracking-widest text-[10px]`}
                                  style={role === r.id ? { backgroundColor: 'var(--theme-color, #1a1a1a)' } : {}}
                              >
                                  <span className={`material-symbols-outlined text-2xl ${role === r.id ? 'text-white' : 'text-ben-muted'}`}>
                                      {r.icon}
                                  </span>
                                  <span className="text-[10px] uppercase font-bold tracking-widest">{r.title}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Email Address</label>
                        <input 
                            type="email" required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mail@example.com" 
                            className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Contact Phone</label>
                        <input 
                            type="tel" required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+234 ..." 
                            className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">State</label>
                        <input 
                            type="text" required
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="e.g. Lagos" 
                            className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">LGA</label>
                        <input 
                            type="text" required
                            value={lga}
                            onChange={(e) => setLga(e.target.value)}
                            placeholder="e.g. Ikeja" 
                            className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-ben-border/30">
                    {/* Individual Fields */}
                    {role === 'individual' && (
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Full Name</label>
                            <input 
                                type="text" required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe" 
                                className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                            />
                        </div>
                    )}

                    {/* Hospitality Fields */}
                    {role === 'hospitality' && (
                        <>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Business Name</label>
                                <input 
                                    type="text" required
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="Azure Hotel & Suites" 
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Business Type</label>
                                <select 
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all"
                                >
                                    <option value="hotel">Hotel</option>
                                    <option value="bar">Bar</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Contact Person (Manager)</label>
                                <input 
                                    type="text" required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Jane Smith" 
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                                />
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Business Address</label>
                                <input 
                                    type="text" required
                                    value={businessAddress}
                                    onChange={(e) => setBusinessAddress(e.target.value)}
                                    placeholder="No. 45 Eco Drive, Central Area" 
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                                />
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">CAC Registration # (Optional)</label>
                                <input 
                                    type="text"
                                    value={cacNumber}
                                    onChange={(e) => setCacNumber(e.target.value)}
                                    placeholder="RC-XXXXXX" 
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                                />
                            </div>
                        </>
                    )}

                    {/* GCS Fields */}
                    {role === 'gcs' && (
                        <>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Company Name</label>
                                <input 
                                    type="text" required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="EcoLogistics Solutions Ltd." 
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Contact Person</label>
                                <input 
                                    type="text" required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Director Name" 
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Operational Area</label>
                                <input 
                                    type="text" required
                                    value={serviceArea}
                                    onChange={(e) => setServiceArea(e.target.value)}
                                    placeholder="e.g. Lagos Island" 
                                    className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-ben-border/30">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Security Key (Password)</label>
                        <input 
                            type="password" required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••" 
                            className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Confirm Key</label>
                        <input 
                            type="password" required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••" 
                            className="w-full bg-white/10 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        disabled={loading} 
                        type="submit" 
                        className="w-full py-3 rounded-full border border-ben-border text-ben-text font-bold text-sm hover:bg-ben-border transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        style={!loading ? { color: 'white', backgroundColor: 'var(--theme-color, #1a1a1a)', borderColor: 'var(--theme-color, #1a1a1a)' } : {}}
                    >
                        {loading ? 'Confirming Identity...' : 'Confirm Registration'}
                    </button>
                    <p className="mt-6 text-center text-ben-muted text-xs font-sans">
                        Already part of the network? <Link to="/login" className="text-ben-text font-bold hover:underline underline-offset-4">Sign in</Link>
                    </p>
                </div>
            </form>
          </div>
          
          <div className="mt-12 text-center pb-20">
               <Link to="/" className="inline-flex items-center gap-2 text-ben-muted text-[10px] font-bold uppercase tracking-widest hover:text-ben-text transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Return to Ecosystem
               </Link>
          </div>
        </div>
      </div>
    );
}
