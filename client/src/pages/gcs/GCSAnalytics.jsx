import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
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
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GCSAnalytics() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [metrics, setMetrics] = useState({ totalDiversion: 0.0, activeFleet: 0, partnerSat: 4.9, incDiversion: 0 });

  useEffect(() => {
    const fetchAnalytics = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;

        // Fetch recent collections for charts and diversion
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);

        const { data: cols } = await supabase.from('collection_records').select('*').eq('gcs_id', uid);

        let totalD = 0;
        let lastMonthD = 0;

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                dateString: d.toISOString().split('T')[0],
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                value: 0
            };
        });

        if (cols && cols.length > 0) {
            cols.forEach(c => {
                const wt = 40; // Approx 40kg per collection for now
                totalD += wt;

                const cDate = new Date(c.completed_at);
                if (cDate > lastMonth) lastMonthD += wt;

                if (cDate > sevenDaysAgo) {
                    const ds = cDate.toISOString().split('T')[0];
                    const dayObj = last7Days.find(d => d.dateString === ds);
                    if (dayObj) dayObj.value += wt;
                }
            });
        }

        let finalLabels = last7Days.map(d => d.label);
        let finalData = last7Days.map(d => d.value);

        const { count: partnerCount } = await supabase.from('hospitality_profiles').select('*', { count: 'exact', head: true }).eq('primary_gcs_id', uid);

        setChartLabels(finalLabels);
        setChartData(finalData);
        setMetrics({
            totalDiversion: (totalD / 1000).toFixed(1), // In tonnes
            incDiversion: (lastMonthD / 1000).toFixed(1), // last month's yield
            activeFleet: partnerCount !== null ? partnerCount : 0,
            partnerSat: 0 // Will be updated when reviews module is built
        });

        setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: { display: false }
      },
      scales: {
          y: { display: false },
          x: {
              grid: { display: false, drawBorder: false },
              ticks: { color: '#9ca3af', font: { size: 10, family: 'Inter' } }
          }
      },
      elements: {
          line: { tension: 0.4 },
          point: { radius: 0 }
      }
  };

  const collectionData = {
      labels: chartLabels.length ? chartLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
          label: 'Waste Collected (kg)',
          data: chartData,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          borderWidth: 2
      }]
  };

  const efficiencyData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
          label: 'Route Efficiency (%)',
          data: [0, 0, 0, 0],
          backgroundColor: '#2563eb',
          borderRadius: 8
      }]
  };

  return (
    <DashboardLayout roleTitle="Ecosystem Operator / G.C.S">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="flex justify-between items-end px-4 mb-4">
            <div>
                 <h1 className="text-4xl font-serif italic text-ben-text mb-2">Fleet <span className="text-indigo-600">Analytics</span></h1>
                 <p className="text-sm text-ben-muted tracking-tight">Performance metrics and waste diversion tracking.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/40 border border-ben-border rounded-xl text-xs font-bold uppercase tracking-widest text-ben-text hover:bg-white transition-all">
                <span className="material-symbols-outlined text-sm">download</span> Export
            </button>
        </div>

        {loading ? (
             <div className="h-96 bg-white/20 border border-ben-border rounded-[40px] animate-pulse"></div>
        ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Metric Cards */}
                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px] group hover:scale-[1.02] transition-transform">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600/60 mb-8 block">Total Diversion</span>
                        <div className="text-5xl font-serif italic text-indigo-600">{metrics.totalDiversion}<span className="text-2xl ml-1">t</span></div>
                        <p className="text-xs font-bold text-indigo-900 mt-4">+{metrics.incDiversion}t from last month</p>
                    </div>
                    <div className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] group hover:scale-[1.02] transition-transform">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600/60 mb-8 block">Active Partners</span>
                        <div className="text-5xl font-serif italic text-blue-600">{metrics.activeFleet}</div>
                        <p className="text-xs font-bold text-blue-900 mt-4">Connected Hosp. Nodes</p>
                    </div>
                    <div className="p-8 bg-green-50 border border-green-100 rounded-[32px] group hover:scale-[1.02] transition-transform">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-green-600/60 mb-8 block">Partner Satisfaction</span>
                        <div className="text-5xl font-serif italic text-green-600">{metrics.partnerSat}<span className="text-lg ml-1 material-symbols-outlined absolute translate-y-1">star</span></div>
                        <p className="text-xs font-bold text-green-900 mt-4">Based on verified metrics</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="p-10 bg-white/40 border border-ben-border rounded-[40px]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-ben-muted mb-8">Weekly Tonnage</h3>
                        <div className="h-64">
                            <Line data={collectionData} options={chartOptions} />
                        </div>
                    </div>
                    
                    <div className="p-10 bg-white/40 border border-ben-border rounded-[40px]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-ben-muted mb-8">Route Efficiency</h3>
                        <div className="h-64">
                            <Bar data={efficiencyData} options={{...chartOptions, scales: { x: { grid: { display: false } }, y: { display: false } }}} />
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
    </DashboardLayout>
  );
}
