import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Loader from '../components/Loader';
import { getKPITimeline } from '../api/getKPI';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Timeline = () => {
  const [selectedKPI, setSelectedKPI] = useState('prix_m2');
  const [selectedArr, setSelectedArr] = useState('');
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(false);

  const arrondissements = ['', ...Array.from({ length: 20 }, (_, i) => i + 1)];

  const kpiOptions = [
    { value: 'prix_m2', label: 'Prix au m²' },
    { value: 'logements_sociaux_pct', label: 'Logements sociaux (%)' },
    { value: 'wifi_density', label: 'Densité Wi-Fi' },
    { value: 'antennes_count', label: 'Antennes mobiles' },
  ];

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const data = await getKPITimeline(selectedKPI, selectedArr || null);
        setTimelineData(data);
      } catch (error) {
        console.error('Timeline error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [selectedKPI, selectedArr]);

  const chartData = timelineData ? {
    labels: timelineData.years,
    datasets: [
      {
        label: selectedArr ? `${selectedArr}ème arrondissement` : 'Paris (moyenne)',
        data: timelineData.values,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: kpiOptions.find(k => k.value === selectedKPI)?.label },
      },
      x: {
        title: { display: true, text: 'Année' },
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Évolution temporelle</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indicateur
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedKPI}
              onChange={(e) => setSelectedKPI(e.target.value)}
            >
              {kpiOptions.map(kpi => (
                <option key={kpi.value} value={kpi.value}>{kpi.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arrondissement (optionnel)
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedArr}
              onChange={(e) => setSelectedArr(e.target.value)}
            >
              <option value="">Paris (moyenne)</option>
              {arrondissements.slice(1).map(arr => (
                <option key={arr} value={arr}>{arr}ème</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : chartData ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          Aucune donnée disponible pour cette sélection
        </div>
      )}
    </div>
  );
};

export default Timeline;