import React from 'react';
import { Link } from 'react-router-dom';
import FloatingNav from '../components/FloatingNav';

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
    <div className="pointer-events-auto">
      <Link to="/" className="text-2xl font-serif font-black tracking-tight text-ben-text hover:opacity-70 transition-opacity">
        Eco<span className="text-green-600">Flow</span>
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



const StatHighlight = ({ number, unit, label, trend }) => (
  <div className="border border-ben-border p-10 rounded-[30px] bg-white/40 backdrop-blur-sm hover:border-ben-text transition-colors duration-500">
    <div className="flex items-center justify-between mb-8">
      <span className="text-xs font-bold uppercase tracking-widest text-ben-muted">{label}</span>
      <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold bg-green-500/10 px-3 py-1 rounded-full">
         <span className="material-symbols-outlined text-xs">trending_up</span> {trend}
      </span>
    </div>
    <div className="flex items-end">
      <span className="text-7xl font-serif tracking-tighter leading-none text-ben-text">{number}</span>
      <span className="text-2xl font-serif italic text-ben-muted mb-2">{unit}</span>
    </div>
  </div>
);

export default function Impact() {
  return (
    <div className="min-h-screen selection:bg-ben-text selection:text-white overflow-x-hidden bg-[#FBFBF9]">
      <Navbar />
      
      <main className="relative z-10 pt-40 pb-32 px-6">
        <div className="container mx-auto max-w-7xl">
           <div className="mb-20 text-center flex flex-col items-center">
             <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-ben-muted">Impact Metrics</span>
             </div>
             
             <h1 className="text-6xl md:text-8xl font-serif tracking-tighter text-ben-text mb-6">
               Quantifying <span className="bg-green-600 text-white px-6 py-2 not-italic inline-block transform -rotate-1">Change</span>
             </h1>
             <p className="text-ben-muted text-lg max-w-2xl mx-auto font-sans leading-relaxed">
               We believe that <span className="text-indigo-600 font-bold">ecological accountability</span> requires <span className="text-blue-600 font-bold">high-fidelity data</span>. Our platform continuously measures the precise <span className="text-green-600 font-bold">carbon offsets</span> and <span className="text-blue-600 font-bold">diversion velocity</span> of the ecosystem.
             </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              <StatHighlight number="1.2" unit="M" label="CO2 Equilibrium" trend="+14% MoM" />
              <StatHighlight number="94" unit="%" label="Diversion Velocity" trend="+2.3% YoY" />
              <StatHighlight number="8.4" unit="k" label="Active EcoTokens" trend="+31% MoM" />
           </div>

            <div className="max-w-5xl mx-auto p-12 lg:p-20 rounded-[50px] border border-white/30 bg-indigo-950 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-400/20 transition-all duration-1000"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full -translate-x-1/2 translate-y-1/2"></div>
             
             <div className="relative z-10">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest mb-10">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                 Case Study 01 — Urban Deployment
               </div>
               
               <h2 className="text-5xl md:text-7xl font-serif italic mb-8 tracking-tighter leading-tight">
                 Proof of Concept: <span className="text-blue-400">CPH 2.0</span>
               </h2>
               
               <p className="text-white/80 font-sans text-xl md:text-2xl leading-relaxed mb-12 max-w-3xl">
                 In our inaugural city deployment, we documented a <span className="text-green-400 font-bold">30% reduction</span> in truck <span className="text-blue-400 font-bold">idling times</span> and an increase in <span className="text-green-400 font-bold">high-purity recycling rates</span> due to the <span className="text-amber-400 font-bold">EcoToken incentive model</span>.
               </p>
               
               <Link to="/register" className="inline-flex items-center gap-4 px-10 py-5 bg-white text-indigo-950 hover:bg-opacity-90 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-xl">
                 Read Full Case Study
                 <span className="material-symbols-outlined text-sm">arrow_forward</span>
               </Link>
             </div>
           </div>
        </div>
      </main>
      
      <Footer />
      <FloatingNav />
    </div>
  );
}
