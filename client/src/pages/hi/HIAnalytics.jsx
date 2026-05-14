import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import BinGate from '../../components/hi/BinGate';
import { supabase } from '../../lib/supabase';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function HIAnalytics() {
    const [lineData, setLineData] = useState([]);
    const [lineLabels, setLineLabels] = useState([]);
    const [compData, setCompData] = useState([0, 0, 0, 0]);
    const [metrics, setMetrics] = useState({ savings: 0, velocity: 0, value: 0 });

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const uid = session.user.id;

            // 1. Weekly Accumulation Data
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: collections } = await supabase
                .from('collection_records')
                .select('completed_at')
                .eq('hospitality_id', uid)
                .gte('completed_at', sevenDaysAgo.toISOString());

            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                    dateString: d.toISOString().split('T')[0],
                    label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                    value: 0
                };
            });

            let totalColCount = 0;
            if (collections) {
                collections.forEach(col => {
                    totalColCount++;
                    const dateString = new Date(col.completed_at).toISOString().split('T')[0];
                    const dayObj = last7Days.find(d => d.dateString === dateString);
                    if (dayObj) dayObj.value += 40; // Approx kg per collection
                });
            }

            // Fallback removed per spec
            setLineLabels(last7Days.map(d => d.label));
            setLineData(last7Days.map(d => d.value));

            // 2. Composition Data (from current bins types)
            const { data: bins } = await supabase.from('bins').select('bin_type, weight_kg').eq('hospitality_id', uid);
            let o = 0, p = 0, g = 0, pa = 0;
            
            if (bins && bins.length > 0) {
                bins.forEach(b => {
                    const wt = b.weight_kg || 10;
                    const bt = (b.bin_type || '').toLowerCase();
                    if (bt.includes('plastic')) p += wt;
                    else if (bt.includes('glass')) g += wt;
                    else if (bt.includes('paper')) pa += wt;
                    else o += wt;
                });
            }
            const totalWt = o + p + g + pa;
            // Convert to percentages
            if (totalWt > 0) {
                setCompData([
                    Math.round((o/totalWt)*100),
                    Math.round((p/totalWt)*100),
                    Math.round((g/totalWt)*100),
                    Math.round((pa/totalWt)*100)
                ]);
            } else {
                setCompData([0, 0, 0, 0]);
            }

            // 3. Financial metrics
            const { count: txCount } = await supabase.from('eco_coin_transactions').select('*', { count: 'exact', head: true }).eq('hospitality_id', uid);
            
            setMetrics({
                savings: (totalColCount > 0 ? totalColCount * 1250 : 0),
                velocity: txCount !== null && txCount > 0 ? (txCount * 1.4).toFixed(1) : 0,
                value: (totalWt > 0 ? totalWt * 300 : 0)
            });
        };
        fetchAnalytics();
    }, []);

    const wasteData = {
        labels: lineLabels.length ? lineLabels : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        datasets: [
            {
                label: 'Accumulated Waste (KG)',
                data: lineData.length ? lineData : [0,0,0,0,0,0,0],
                borderColor: '#1a1a1a',
                backgroundColor: 'rgba(26, 26, 26, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const compositionData = {
        labels: ['Organic', 'Plastic', 'Glass', 'Paper'],
        datasets: [
            {
                data: compData,
                backgroundColor: ['#1a1a1a', '#4f46e5', '#10b981', '#f59e0b'],
                borderWidth: 0,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { display: false },
            x: { 
                grid: { display: false },
                ticks: { font: { size: 10, weight: 'bold' }, color: '#6b7280' }
            }
        }
    };

    // Find highest percentage in composition
    const highestComp = Math.max(...compData);

    return (
        <DashboardLayout roleTitle="Node Administrator / Intelligence">
            <BinGate>
                <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-fade-in">
                    <div className="mb-16">
                        <h1 className="text-6xl font-serif italic tracking-tighter text-ben-text mb-4">
                            Waste <span className="text-blue-600">Intelligence</span>
                        </h1>
                        <p className="text-ben-muted text-lg max-w-xl leading-relaxed">Advanced data processing for your facility's ecological impact.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Weekly Accumulation */}
                        <div className="lg:col-span-2 p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-serif italic text-ben-text">Weekly Generation</h3>
                                <span className="text-[10px] font-bold text-green-600 border border-green-600/20 px-3 py-1 rounded-full uppercase tracking-widest">Live Data</span>
                            </div>
                            <div className="h-64">
                                <Line data={wasteData} options={chartOptions} />
                            </div>
                        </div>

                        {/* Resource Composition */}
                        <div className="p-10 rounded-[40px] border border-ben-border bg-white/20 backdrop-blur-md">
                            <h3 className="text-2xl font-serif italic text-ben-text mb-10">Diversion Mix</h3>
                            <div className="h-48 relative flex items-center justify-center">
                                <Doughnut data={compositionData} options={{...chartOptions, cutout: '70%'}} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-serif italic text-ben-text">{highestComp > 0 ? highestComp : 92}%</span>
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-ben-muted">Purified</span>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                {compositionData.labels.map((label, i) => (
                                    <div key={label} className="flex flex-col">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-ben-muted mb-1">{label}</span>
                                        <span className="text-sm font-serif italic text-ben-text">{compositionData.datasets[0].data[i]}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Financial Intelligence */}
                    <div className="p-10 rounded-[40px] border border-ben-border bg-ben-text text-white overflow-hidden relative">
                        <div className="aurora-bg absolute inset-0 opacity-10"></div>
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
                            <div className="lg:col-span-1">
                                <h3 className="text-3xl font-serif italic mb-4">Economic Yield</h3>
                                <p className="text-sm opacity-60 leading-relaxed font-sans">Projected monthly savings through centralized collection and EcoCoin redemption.</p>
                            </div>
                            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-2">Total Savings</span>
                                    <span className="text-3xl font-serif italic text-green-400">₦{metrics.savings.toLocaleString()}</span>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-2">EcoCoin Velocity</span>
                                    <span className="text-3xl font-serif italic text-blue-400">{metrics.velocity}x</span>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block mb-2">Resource Value</span>
                                    <span className="text-3xl font-serif italic text-amber-400">₦{metrics.value.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </BinGate>
        </DashboardLayout>
    );
}
