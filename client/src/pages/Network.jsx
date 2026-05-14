import React from 'react';
import { Link } from 'react-router-dom';
import FloatingNav from '../components/FloatingNav';

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

const Footer = () => (
  <footer className="py-20 px-6 border-t border-ben-border bg-white/30 backdrop-blur-sm relative z-10">
    <div className="container mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
        <div>
          <span className="text-3xl font-serif italic text-ben-text block mb-4">EcoFlow Living Infrastructure</span>
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



export default function Network() {
  return (
    <div className="min-h-screen selection:bg-ben-text selection:text-white overflow-x-hidden bg-[#FBFBF9]">
      <div className="grid-bg opacity-30"></div>
      
      <Navbar />
      
      <main className="relative z-10 pt-40 pb-32 px-6">
        <div className="container mx-auto max-w-7xl">
           <div className="mb-20 text-center flex flex-col items-center">
             <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-ben-muted">Infrastructure Map</span>
             </div>
             
             <h1 className="text-6xl md:text-8xl font-serif tracking-tighter text-ben-text mb-6">
               The <span style={{ color: 'var(--theme-color, #16a34a)' }}>Global Grid</span>
             </h1>
             <p className="text-ben-muted text-lg max-w-2xl mx-auto font-sans leading-relaxed">
               Visualize the current state of our <span className="text-indigo-600 font-bold">decentralised ecological network</span>. Over <span className="text-blue-600 font-bold">420+ connected systems</span> making intelligent, <span className="text-blue-600 font-bold">real-time routing decisions</span>.
             </p>
           </div>
           
           <div className="relative aspect-[21/9] w-full rounded-[40px] border border-ben-border overflow-hidden bg-white/10 backdrop-blur-md mb-20 group">
             {/* Map Placeholder */}
             <div className="absolute inset-0 bg-ben-text/5 flex items-center justify-center">
               <div className="absolute inset-0 bg-ben-text/5"></div>
               
               {/* Pulsing Systems Simulation */}
               <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-color, #16a34a)' }}></div>
               <div className="absolute top-1/2 left-2/3 w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-color, #16a34a)', animationDelay: '0.5s' }}></div>
               <div className="absolute top-2/3 left-1/3 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-color, #16a34a)', animationDelay: '1s' }}></div>
               
               {/* Map Text Overlay */}
               <div className="z-10 text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl border border-ben-border shadow-2xl transition-transform group-hover:scale-105">
                 <span className="material-symbols-outlined text-4xl text-ben-text mb-4">public</span>
                 <h3 className="text-2xl font-serif italic text-ben-text">Live Telemetry</h3>
                 <p className="text-sm font-sans text-ben-muted uppercase tracking-widest mt-2">Connecting to Spatial Servers...</p>
               </div>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-12 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                <span className="material-symbols-outlined text-5xl text-indigo-600 mb-6">database</span>
                <h3 className="text-3xl font-serif italic text-ben-text mb-4">Distributed Ledger</h3>
                <p className="text-ben-muted font-sans leading-relaxed">
                  Every <span className="text-amber-600 font-bold">material transfer</span> is <span className="text-indigo-600 font-bold">cryptographically verified</span> and recorded asynchronously on our core infrastructure. Complete transparency from <span className="text-blue-600 font-bold">bin to facility</span>.
                </p>
              </div>
              <div className="p-12 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                <span className="material-symbols-outlined text-5xl text-blue-600 mb-6">route</span>
                <h3 className="text-3xl font-serif italic text-ben-text mb-4">Dynamic Routing</h3>
                <p className="text-ben-muted font-sans leading-relaxed">
                  Algorithms calculate <span className="text-blue-600 font-bold">peak pickup periods</span> via ultrasonic sensor data, diverting trucks from high-traffic zones and reducing unnecessary <span className="text-blue-600 font-bold">fuel expenditure</span>.
                </p>
              </div>
           </div>
        </div>
      </main>
      
      <Footer />
      <FloatingNav />
    </div>
  );
}
