import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Loader from '../components/Loader';
import KpiCard from '../components/KpiCard';
import { getKPIComparison } from '../api/getKPI';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Compare = () => {
  const [arr1, setArr1] = useState('1');
  const [arr2, setArr2] = useState('12');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  const arrondissements = Array.from({ length: 20 }, (_, i) => i + 1);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const data = await getKPIComparison(arr1, arr2, 'prix_m2');
      setComparisonData(data);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  const barData = comparisonData ? {
    labels: [`${comparisonData.arr1}ème`, `${comparisonData.arr2}ème`],
    datasets: [
      {
        label: 'Prix au m² (€)',
        data: [comparisonData.arr1_value, comparisonData.arr2_value],
        backgroundColor: ['#3B82F6', '#EF4444'],
        borderRadius: 8,
      },
    ],
  } : null;

  const difference = comparisonData 
    ? ((comparisonData.arr2_value - comparisonData.arr1_value) / comparisonData.arr1_value * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Comparaison d'arrondissements</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Premier arrondissement
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={arr1}
              onChange={(e) => setArr1(e.target.value)}
            >
              {arrondissements.map(arr => (
                <option key={arr} value={arr}>{arr}ème</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second arrondissement
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={arr2}
              onChange={(e) => setArr2(e.target.value)}
            >
              {arrondissements.map(arr => (
                <option key={arr} value={arr}>{arr}ème</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          onClick={handleCompare}
          disabled={loading}
        >
          {loading ? <Loader size="sm" /> : 'Comparer'}
        </button>
      </div>

      {comparisonData && !loading && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Graphique comparatif</h2>
            <Bar 
              data={barData} 
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false },
                },
              }}
            />
            <div className={`mt-4 text-center p-3 rounded-lg ${difference >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-lg">
                Le {comparisonData.arr2}ème est {Math.abs(difference).toFixed(1)}% 
                {difference >= 0 ? ' plus cher' : ' moins cher'} que le {comparisonData.arr1}ème
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Détails par arrondissement</h2>
            <div className="space-y-4">
              <KpiCard
                title={`${comparisonData.arr1}ème arrondissement`}
                value={comparisonData.arr1_value.toLocaleString()}
                unit="€/m²"
                icon="📍"
                color="#3B82F6"
              />
              <KpiCard
                title={`${comparisonData.arr2}ème arrondissement`}
                value={comparisonData.arr2_value.toLocaleString()}
                unit="€/m²"
                icon="📍"
                color="#EF4444"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;