import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Skeleton from '../../components/Skeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function IndividualAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ labels: [], weight: [], coins: [] });

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) return;
            
            const { data: uploads } = await supabase
                .from('waste_uploads')
                .select('created_at, estimated_weight_kg, coins_awarded')
                .eq('individual_id', session.user.id)
                .order('created_at', { ascending: true });

            if (uploads) {
                const labels = uploads.map(u => new Date(u.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}));
                const weight = uploads.map(u => u.estimated_weight_kg);
                const coins = uploads.map(u => u.coins_awarded);
                setData({ labels, weight, coins });
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, []);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1a1a1a',
                padding: 12,
                titleFont: { size: 10, family: 'serif' },
                bodyFont: { size: 12, family: 'sans-serif' },
                cornerRadius: 12
            }
        },
        scales: {
            y: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } },
            x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } }
        }
    };

    return (
        <DashboardLayout roleTitle="Citizen / Individual">
            <div className="max-w-6xl mx-auto space-y-12 reveal">
                <div className="mb-12 reveal-left">
                    <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">Impact <span className="text-indigo-600">Metrics.</span></h1>
                    <p className="text-ben-muted text-lg max-w-xl leading-relaxed">Analyzing your ecological contribution over time.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md reveal">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-serif italic text-ben-text">Recycling Performance</h3>
                            <span className="text-[10px] uppercase font-bold text-ben-muted tracking-widest">(KG Diverted)</span>
                        </div>
                        {loading ? <Skeleton height="200px" /> : <Bar options={chartOptions} data={{ labels: data.labels, datasets: [{ data: data.weight, backgroundColor: '#4f46e5', borderRadius: 8 }] }} />}
                    </div>

                    <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md reveal reveal-delay-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-serif italic text-ben-text">Reward Accumulation</h3>
                            <span className="text-[10px] uppercase font-bold text-ben-muted tracking-widest">(EcoCoins Earned)</span>
                        </div>
                        {loading ? <Skeleton height="200px" /> : <Line options={chartOptions} data={{ labels: data.labels, datasets: [{ data: data.coins, borderColor: '#ca8a04', tension: 0.4, fill: false, pointBackgroundColor: '#ca8a04' }] }} />}
                    </div>
                </div>

                <div className="p-10 rounded-[40px] border border-ben-border bg-ben-text text-white relative overflow-hidden reveal-scale">
                    <div className="aurora-bg absolute inset-0 opacity-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2 block">Achievement Locked</span>
                            <h3 className="text-3xl font-serif italic mb-4">Carbon Neutral Pioneer</h3>
                            <p className="max-w-md opacity-70 text-sm">You are in the top 5% of contributors in your region. Divert 12kg more to reach 'Elite' status.</p>
                        </div>
                        <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl">military_tech</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
