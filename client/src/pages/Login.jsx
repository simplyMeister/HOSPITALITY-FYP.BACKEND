import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
      e.preventDefault();
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
      });

      if (error) {
          toast.error(error.message);
          setLoading(false);
      } else {
          // Fetch exact role from profiles table (source of truth)
          console.log("Auth success, fetching profile for:", data.user.id);
          
          let role = 'individual';
          
          try {
              const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', data.user.id)
                  .single();

              if (!profileError && profile?.role) {
                  role = profile.role;
              } else {
                  // Fallback to metadata
                  role = data.user.user_metadata?.role || 'individual';
              }
          } catch (e) {
              role = data.user.user_metadata?.role || 'individual';
          }

          toast.success('Authorization successful!');
          setTimeout(() => {
              navigate(`/${role === 'hospitality' ? 'hi' : role}`);
          }, 1000);
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
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-12 text-center">
            <Link to="/" className="text-4xl font-serif font-black tracking-tight text-ben-text hover:opacity-70 transition-opacity">
                Eco<span style={{ color: 'var(--theme-color, #16a34a)' }}>Flow</span>
            </Link>
            <p className="text-ben-muted text-sm mt-4 font-sans tracking-wide uppercase font-medium">
                Experience the next generation of <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">ecological intelligence</span>.
            </p>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] border border-ben-border p-10 shadow-[0_30px_100px_rgba(0,0,0,0.1)]">
            <h2 className="text-4xl font-serif italic text-ben-text mb-2">Welcome Back</h2>
            <p className="text-ben-muted text-sm font-sans mb-6">Enter your credentials to access your dashboard.</p>
            
            <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Email Address</label>
                    <div className="relative group">
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mail@example.com" 
                            className="w-full bg-white/20 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ben-muted ml-1">Password</label>
                    <div className="relative group">
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••" 
                            className="w-full bg-white/20 border border-ben-border rounded-2xl px-6 py-4 font-sans text-ben-text outline-none focus:border-ben-text transition-all placeholder:text-ben-muted/50"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        disabled={loading} 
                        type="submit" 
                        className="w-full py-3 rounded-full border border-ben-border text-ben-text font-bold text-sm hover:bg-ben-border transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                        style={!loading ? { color: 'white', backgroundColor: 'var(--theme-color, #1a1a1a)', borderColor: 'var(--theme-color, #1a1a1a)' } : {}}
                    >
                        {loading ? 'Authorizing...' : 'Authorize Access'}
                    </button>
                </div>
            </form>

            <div className="mt-10 pt-8 border-t border-ben-border text-center">
                <p className="text-ben-muted text-xs font-sans">
                    New user, <Link to="/register" className="text-ben-text font-bold hover:underline underline-offset-4">create an account</Link>
                </p>
            </div>
        </div>
        
        <div className="mt-12 text-center">
             <Link to="/" className="inline-flex items-center gap-2 text-ben-muted text-[10px] font-bold uppercase tracking-widest hover:text-ben-text transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Home
             </Link>
        </div>
      </div>
    </div>
  );
}
