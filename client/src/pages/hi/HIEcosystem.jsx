import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import BinGate from '../../components/hi/BinGate';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function HIEcosystem() {
    const center = [6.5244, 3.3792]; // Lagos center

    return (
        <DashboardLayout roleTitle="Node Administrator / Ecosystem">
            <BinGate>
                <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-fade-in">
                    <div className="mb-16">
                        <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                            Infrastructure <span className="text-indigo-600">Mesh</span>
                        </h1>
                        <p className="text-ben-muted text-lg max-w-xl leading-relaxed">Spatial visualization of your ecological nodes and collection logistics.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                        {/* Map View */}
                        <div className="lg:col-span-2 rounded-[40px] border border-ben-border overflow-hidden bg-white/20 shadow-xl relative">
                            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={center}>
                                    <Popup>
                                        <div className="font-serif italic p-2">
                                            <span className="font-bold text-indigo-600 block">Main Facility Node</span>
                                            Primary Bin Hub
                                        </div>
                                    </Popup>
                                </Marker>
                                <Circle 
                                    center={center} 
                                    radius={1000} 
                                    pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.1 }} 
                                />
                            </MapContainer>
                            <div className="absolute top-6 right-6 z-[10] flex flex-col gap-2">
                                <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-ben-border shadow-lg flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-ben-text">GCS Hub Online</span>
                                </div>
                            </div>
                        </div>

                        {/* Partner Status */}
                        <div className="space-y-6">
                            <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md h-full flex flex-col">
                                <h3 className="text-2xl font-serif italic text-ben-text mb-8 text-center sm:text-left">Network Partners</h3>
                                <div className="space-y-6 flex-1">
                                    <div className="p-6 rounded-3xl bg-white/40 border border-ben-border flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                                            <span className="material-symbols-outlined">electric_bolt</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest block">Primary GCS</span>
                                            <span className="font-serif italic text-lg text-ben-text">Ecologistics Hub</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 rounded-3xl border border-dashed border-ben-border text-center">
                                        <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest block mb-2">Secondary Node</span>
                                        <button className="text-indigo-600 text-xs font-bold uppercase tracking-widest hover:underline">+ Link Sub-page</button>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-ben-border">
                                    <div className="flex justify-between items-center mb-6 px-4 text-center sm:text-left flex-col sm:flex-row gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-ben-muted uppercase tracking-widest block">Total Node Weight</span>
                                            <span className="text-xl font-serif italic text-ben-text">1,402 KG / Week</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-600 px-3 py-1 bg-blue-500/10 rounded-full">Top 5% Facility</span>
                                    </div>
                                    <button className="w-full py-4 bg-ben-text text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                                        Open Full Network Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </BinGate>
        </DashboardLayout>
    );
}
