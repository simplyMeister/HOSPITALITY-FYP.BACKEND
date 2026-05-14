import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function IndividualEcosystem() {
    const [centers, setCenters] = useState([]);

    useEffect(() => {
        const fetchCenters = async () => {
            // In a real app, this would fetch from a 'collection_centers' table
            // For demo, we treat Hospitality businesses as drop-off points
            const { data } = await supabase.from('hospitality_profiles').select('*').limit(10);
            if (data) setCenters(data);
        };
        fetchCenters();
    }, []);

    return (
        <DashboardLayout roleTitle="Citizen / Individual">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="mb-12">
                    <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">Eco<span className="text-blue-600">Map.</span></h1>
                    <p className="text-ben-muted text-lg max-w-xl leading-relaxed">Discover active recycling hubs and collection centers near your location.</p>
                </div>

                <div className="rounded-[40px] border border-ben-border overflow-hidden h-[600px] relative z-0 bg-white shadow-2xl">
                    <MapContainer center={[6.5244, 3.3792]} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {centers.map(center => (
                            <Marker key={center.id} position={[center.gps_lat || 6.5244, center.gps_lng || 3.3792]}>
                                <Popup>
                                    <div className="p-2">
                                        <h4 className="font-serif italic font-bold">{center.business_name}</h4>
                                        <p className="text-[10px] text-ben-muted uppercase mb-2">Drop-off point active</p>
                                        <button className="w-full py-2 bg-ben-text text-white text-[8px] font-bold uppercase rounded-lg">View Incentives</button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                        <span className="material-symbols-outlined text-4xl text-green-600 mb-4 text-green-600 mb-4">eco</span>
                        <h4 className="text-xl font-serif italic text-ben-text mb-2">Sustainable Network</h4>
                        <p className="text-sm text-ben-muted">Connected to 14 verified recovery nodes across your region. System efficiency is currently optimal.</p>
                    </div>
                    <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                        <span className="material-symbols-outlined text-4xl text-blue-600 mb-4">hub</span>
                        <h4 className="text-xl font-serif italic text-ben-text mb-2">Community Impact</h4>
                        <p className="text-sm text-ben-muted">Your node contributed 12% of total diversion in this quadrant last month. Excellent progress.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
