import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function GCSEcosystem() {
    return (
        <DashboardLayout roleTitle="Ecosystem Operator / G.C.S">
            <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
                <div className="flex justify-between items-center px-4">
                    <h3 className="text-3xl font-serif italic text-ben-text">Regional <span className="text-blue-600">Ecosystem</span></h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">Network Topology</span>
                </div>

                <div className="p-16 rounded-[40px] border border-ben-border bg-white/40 backdrop-blur-md text-center relative overflow-hidden group min-h-[500px] flex flex-col justify-center items-center">
                    <div className="absolute inset-0 grid-bg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                    
                    <span className="material-symbols-outlined text-6xl text-blue-600 mb-6 relative z-10 animate-pulse">hub</span>
                    <h4 className="text-2xl font-serif italic text-ben-text mb-4 relative z-10">Ecosystem Projection Initializing...</h4>
                    <p className="text-sm text-ben-muted max-w-md mx-auto relative z-10 leading-relaxed">
                        The regional ecosystem view will visualize collective data from all connected hospitality partners to create predictive models for city-wide waste reduction.
                    </p>
                    
                    <button className="mt-8 relative z-10 px-8 py-3 bg-ben-bg border border-ben-border rounded-full text-[10px] font-bold uppercase tracking-widest text-ben-muted hover:text-ben-text hover:border-ben-text transition-all">
                        Refresh Topology
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
