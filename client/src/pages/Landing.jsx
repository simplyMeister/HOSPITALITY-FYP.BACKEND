import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import FloatingNav from '../components/FloatingNav';
import Preloader from '../components/Preloader';

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
    <div className="pointer-events-auto">
      <Link to="/" className="text-2xl font-serif font-black tracking-tight text-ben-text hover:opacity-70 transition-opacity">
        Eco<span style={{ color: 'var(--theme-color, #16a34a)' }}>Flow</span>
      </Link>
    </div>
    <div className="flex gap-4 pointer-events-auto">
      <Link to="/login" className="px-5 py-2 rounded-full border border-ben-border text-ben-text font-medium text-sm hover:bg-ben-border transition-colors">
        Login
      </Link>
    </div>
  </nav>
);

const TickerTape = () => (
  <div className="w-full overflow-hidden border-y border-ben-border/50 bg-white/30 backdrop-blur-sm py-3">
    <div className="flex w-[200%] animate-ticker">
      <div className="w-1/2 flex justify-around items-center text-[10px] font-bold uppercase tracking-[0.3em] text-ben-text/50">
        <span>Optimized Routing</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
        <span>Ultrasonic Monitoring</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
        <span>Predictive Analytics</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
        <span>EcoToken Economy</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
      </div>
      <div className="w-1/2 flex justify-around items-center text-[10px] font-bold uppercase tracking-[0.3em] text-ben-text/50">
        <span>Optimized Routing</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
        <span>Ultrasonic Monitoring</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
        <span>Predictive Analytics</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
        <span>EcoToken Economy</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
      </div>
    </div>
  </div>
);

const Hero = () => (
  <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 pt-32 pb-20 text-center overflow-hidden transition-colors duration-1000">
    <div className="relative z-10 max-w-4xl mx-auto mb-20">
      <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></span>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ben-muted">Mission: 001 — Living Infrastructure</span>
      </div>
      
      <h1 className="text-7xl md:text-9xl font-serif italic leading-[1.1] tracking-tighter text-ben-text mb-8 transition-colors duration-1000">
        <span className="text-white px-6 py-1 not-italic inline-block transform rotate-1 bg-ben-text rounded-2xl">Reframing</span> <br />
        <span className="text-ben-text px-6 py-1 not-italic inline-block transform -rotate-2 bg-[#d1d5db] rounded-2xl translate-y-1 mt-2">Resource</span>{' '}
        <span className="text-white px-8 py-2 not-italic inline-block transform -rotate-1 translate-y-2 md:translate-y-4 transition-colors duration-1000 rounded-2xl" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}>
          Flows
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-ben-muted max-w-2xl mx-auto mb-12 font-sans leading-relaxed transition-colors duration-1000">
        Building a decentralized ecosystem where waste isn't an end-point, but a beginning. EcoTrack connects the physical and digital dots of urban resilience.
      </p>

      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <Link to="/register" className="group relative px-12 py-5 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] overflow-hidden transition-all hover:scale-[1.02] active:scale-95" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}>
          <span className="relative z-10">Initialize Access</span>
        </Link>
        
        <button className="flex items-center gap-5 group px-8 py-5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-ben-border">
          <div className="w-12 h-12 rounded-full border border-ben-border flex items-center justify-center group-hover:bg-ben-text group-hover:border-ben-text transition-all duration-500">
            <span className="material-symbols-outlined text-ben-text group-hover:text-white transition-colors scale-125">play_arrow</span>
          </div>
          <span className="text-sm font-serif font-black italic tracking-widest text-ben-text group-hover:underline underline-offset-8 transition-colors duration-1000">Watch Mission</span>
        </button>
      </div>
    </div>

    <TickerTape />
  </section>
);

const SectionHero = ({ title, subtitle, italic = true }) => (
  <div className="mb-20 text-center flex flex-col items-center">
     <h2 className={`text-5xl md:text-7xl font-serif ${italic ? 'italic' : ''} tracking-tighter mb-4 transition-colors duration-1000`} style={{ color: 'var(--theme-color, #1a1a1a)' }}>
       {title}
     </h2>
     <p className="text-ben-muted text-lg max-w-xl mx-auto">{subtitle}</p>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="group p-8 rounded-3xl border border-ben-border hover:border-ben-text hover:bg-white/40 transition-all duration-500 backdrop-blur-sm">
    <div className="w-12 h-12 rounded-xl bg-ben-border flex items-center justify-center mb-6 transition-colors duration-500 group-hover:text-white" style={{ '--hover-bg': 'var(--theme-color, #1a1a1a)' }}>
       <style>{`.group:hover .feature-icon-bg { background-color: var(--theme-color, #1a1a1a); color: white; }`}</style>
       <div className="w-full h-full flex items-center justify-center rounded-xl transition-colors duration-500 feature-icon-bg">
          <span className="material-symbols-outlined">{icon}</span>
       </div>
    </div>
    <h3 className="text-2xl font-serif italic mb-3 text-ben-text">{title}</h3>
    <div className="text-ben-muted leading-relaxed font-sans">{desc}</div>
  </div>
);

const ImpactStats = () => (
  <section className="py-32 px-6 border-y border-ben-border">
    <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
                 <span className="text-[100px] font-serif leading-none tracking-tighter text-ben-text block mb-4">94<span className="text-4xl italic" style={{ color: 'var(--theme-color, #16a34a)' }}>%</span></span>
                 <span className="text-xs font-bold uppercase tracking-widest text-ben-muted">Diversion Velocity</span>
            </div>
            <div>
                 <span className="text-[100px] font-serif leading-none tracking-tighter text-ben-text block mb-4">1.2<span className="text-4xl italic" style={{ color: 'var(--theme-color, #16a34a)' }}>M</span></span>
                 <span className="text-xs font-bold uppercase tracking-widest text-ben-muted">CO2 Equilibrium</span>
            </div>
            <div>
                 <span className="text-[100px] font-serif leading-none tracking-tighter text-ben-text block mb-4">420<span className="text-4xl italic" style={{ color: 'var(--theme-color, #16a34a)' }}>+</span></span>
                 <span className="text-xs font-bold uppercase tracking-widest text-ben-muted">Active Partners</span>
            </div>
            <div className="flex items-center">
                 <p className="text-ben-muted font-serif italic text-xl leading-relaxed">
                   "Measuring what matters in the transition to a circular world."
                 </p>
            </div>
        </div>
    </div>
  </section>
);

const JoinCTA = () => (
  <section className="py-40 px-6 relative overflow-hidden">
    <div className="container mx-auto max-w-4xl relative z-10 text-center">
        <h2 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-ben-text mb-12">
           Ready to <span className="text-white px-6 py-2 not-italic inline-block transform rotate-1 transition-colors duration-1000" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}>Connect?</span>
        </h2>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-20 px-6 border-t border-ben-border bg-white/30 backdrop-blur-sm">
    <div className="container mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
        <div>
          <span className="text-3xl font-serif italic text-ben-text block mb-4">Eco<span style={{ color: 'var(--theme-color, #16a34a)' }}>Flow</span> Living Infrastructure</span>
          <p className="text-ben-muted max-w-xs font-sans text-sm">Building software for the next generation of ecological intelligence.</p>
        </div>
        <div className="flex gap-12 text-sm font-bold uppercase tracking-widest text-ben-text">
            <a href="#" className="hover:opacity-60 transition-opacity underline decoration-1 underline-offset-4">X / Twitter</a>
            <a href="#" className="hover:opacity-60 transition-opacity underline decoration-1 underline-offset-4">LinkedIn</a>
            <a href="#" className="hover:opacity-60 transition-opacity underline decoration-1 underline-offset-4">Contact</a>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-ben-border flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.3em] text-ben-muted">
         <span>© {new Date().getFullYear()} EcoFlow S.D.S.S</span>
         <span>Latency: 24ms / Healthy</span>
      </div>
    </div>
  </footer>
);



export default function Landing() {
  const handleThemeSelect = (theme) => {
    // Set root CSS variables for global accent theming
    document.documentElement.style.setProperty('--theme-color', theme.bg);
    
    // Optional: Log selection
    console.log("Global theme applied:", theme);
  };

  return (
    <div className="min-h-screen selection:bg-ben-text selection:text-white overflow-x-hidden">
      <Preloader onSelectTheme={handleThemeSelect} />
      <Navbar />
      
      <main className="relative z-10">
        <Hero />
        
        <section className="py-40 px-6 container mx-auto max-w-7xl">
           <SectionHero 
              title={<>The <span style={{ color: 'var(--theme-color, #16a34a)' }}>Living Network</span></>} 
              subtitle="Proprietary technology enabling a seamless loop of ecological intelligence." 
           />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon="sensors" 
                title="Neural Bins" 
                desc={<><span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">IoT-enabled</span> ultrasonic sensors tracking <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">fill levels</span> and <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">material density</span> in real-time.</>}
              />
              <FeatureCard 
                icon="psychology" 
                title="Routing Intelligence" 
                desc={<><span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">AI-driven logistics</span> engines minimizing <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">CO2 footprint</span> via spatial optimization.</>}
              />
              <FeatureCard 
                icon="loyalty" 
                title="Wealth Incentives" 
                desc={<><span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">EcoToken protocol</span> rewarding <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">verified recycling</span> habits at local partner hubs.</>}
              />
           </div>
        </section>

        <TickerTape />

        <ImpactStats />
        
        <section className="py-40 px-6 container mx-auto max-w-7xl">
           <SectionHero 
              title={<>The <span style={{ color: 'var(--theme-color, #16a34a)' }}>Ecosystem</span></>} 
              subtitle="EcoTrack is designed to unify diverse stakeholders into a single, high-fidelity resource network." 
           />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group relative p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md overflow-hidden transition-all duration-700 hover:border-ben-text flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: 'var(--theme-color, #16a34a)', filter: 'blur(80px)', opacity: 0.1 }}></div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-ben-muted mb-8 block">Role A — Operators</span>
                <h3 className="text-4xl font-serif italic text-ben-text mb-6">Garbage Collection Services</h3>
                <p className="text-ben-muted text-lg leading-relaxed mb-10 font-sans">
                  Optimize your fleet with <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">dynamic routing</span>, real-time <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">container analytics</span>, and <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">automated reporting</span>. Reduce operational overhead by up to 30%.
                </p>
                <div className="mt-auto">
                  <Link to="/register?role=gcs" className="inline-flex items-center gap-2 text-ben-text font-bold text-sm tracking-widest uppercase group/link">
                    Initialize Onboarding 
                    <span className="material-symbols-outlined text-sm group-hover/link:translate-x-2 transition-transform">arrow_forward</span>
                  </Link>
                </div>
              </div>

              <div className="group relative p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md overflow-hidden transition-all duration-700 hover:border-ben-text flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: 'var(--theme-color, #16a34a)', filter: 'blur(80px)', opacity: 0.1 }}></div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-ben-muted mb-8 block">Role B — Enterprise</span>
                <h3 className="text-4xl font-serif italic text-ben-text mb-6">Hospitality Industry</h3>
                <p className="text-ben-muted text-lg leading-relaxed mb-10 font-sans">
                  Verify your <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">ESG commitments</span> with granular <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">material recovery data</span>. Turn your sustainability efforts into a transparent, market-leading asset.
                </p>
                <div className="mt-auto">
                  <Link to="/register?role=hospitality" className="inline-flex items-center gap-2 text-ben-text font-bold text-sm tracking-widest uppercase group/link">
                    Apply for Access 
                    <span className="material-symbols-outlined text-sm group-hover/link:translate-x-2 transition-transform">arrow_forward</span>
                  </Link>
                </div>
              </div>

              <div className="group relative p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md overflow-hidden transition-all duration-700 hover:border-ben-text flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: 'var(--theme-color, #16a34a)', filter: 'blur(80px)', opacity: 0.1 }}></div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-ben-muted mb-8 block">Role C — Communities</span>
                <h3 className="text-4xl font-serif italic text-ben-text mb-6">Individuals</h3>
                <p className="text-ben-muted text-lg leading-relaxed mb-10 font-sans">
                  Join the movement. Track your personal <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">recycling footprint</span>, earn <span style={{ color: 'var(--theme-color, #16a34a)' }} className="font-bold">EcoTokens</span>, and see the tangible impact you have on your local environment.
                </p>
                <div className="mt-auto">
                  <Link to="/register?role=individual" className="inline-flex items-center gap-2 text-ben-text font-bold text-sm tracking-widest uppercase group/link">
                    Join the Loop 
                    <span className="material-symbols-outlined text-sm group-hover/link:translate-x-2 transition-transform">arrow_forward</span>
                  </Link>
                </div>
              </div>
           </div>
        </section>

        <TickerTape />

        <section className="py-40 px-6 container mx-auto max-w-7xl">
           <SectionHero 
              title={<>Global <span style={{ color: 'var(--theme-color, #16a34a)' }}>Ecosystem</span></>} 
              subtitle="Scaling the movement across every resilient city infrastructure." 
              italic={false}
           />
           <div className="relative aspect-video rounded-3xl overflow-hidden border border-ben-border bg-ben-border/20 group">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYE4Z6cFIZS8xl_AjQOn6ZRFVY1mMMhE2HDBw7vCC-go4eNfAARSicmiLHUfe2hl-qnnEdl0mb-0V850R2p6dxqOSCu3Yfk1UUKxpqJwRmrj9RJfz8yKcW11J6d0tw-34P4JEyIBkBfFEy_gCZA4UG3lQ6J1NHeoYY-a_6JjSd-V67Cu5uTARtOugvlzzY4bVP9R4wFJN2soCuzaCAKTMB9AjGx80-bJXVjFL-Jtr6qmVPchQTFlQtf13bNqGUW-lu6PRSJgOiLtMI" 
                alt="Global Footprint" 
                className="w-full h-full object-cover grayscale opacity-50 contrast-125 group-hover:scale-105 transition-transform duration-[2000ms]"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-center pointer-events-none transition-all duration-700">
                <div className="w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></div>
                <div className="px-6 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-xl">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-ben-text italic">Active deployment: Copenhagen 2.0</span>
                </div>
              </div>
           </div>
        </section>

        <TickerTape />

        <JoinCTA />
      </main>
      
      <Footer />
      <FloatingNav />
      
      {/* Simulation Toasts */}
      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
          <div className="bg-ben-text text-white px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-2xl animate-fade-in translate-x-12 opacity-0 [animation-fill-mode:forwards] [animation-delay:2s]">
             <span className="material-symbols-outlined text-green-400 text-sm">bolt</span>
             <span className="text-[10px] font-bold uppercase tracking-tighter">1.2kg CO2 saved locally</span>
          </div>
      </div>
    </div>
  );
}
