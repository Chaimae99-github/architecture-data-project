import React from 'react';

const About = () => {
  const sources = [
    { name: 'OpenStreetMap', description: 'Données des rues de Paris', license: 'ODbL' },
    { name: 'Paris Data', description: 'Arrondissements, hotspots Wi-Fi', license: 'Open License' },
    { name: 'ANFR', description: 'Antennes mobiles (4G/5G)', license: 'Open Data' },
    { name: 'DVF', description: 'Transactions immobilières', license: 'Open License' },
  ];

  const kpis = [
    { name: 'Prix au m² médian', description: 'Prix médian par arrondissement' },
    { name: 'Logements sociaux', description: 'Part de logements sociaux' },
    { name: 'Couverture Wi-Fi', description: 'Densité de hotspots publics' },
    { name: 'Couverture mobile', description: 'Antennes 4G/5G par opérateur' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">À propos du projet</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Urban Data Explorer</h2>
        <p className="text-gray-700 mb-4">
          Explorer, comprendre et comparer les dynamiques du logement au cœur de Paris.
        </p>
        <p className="text-gray-700 mb-4">
          Ce dashboard interactif propose une navigation fluide par arrondissement, 
          avec cartes, graphiques, timeline et détails sur le marché et la production 
          de logements, l'achat et la location de biens immobiliers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🗺️</span> Sources de données
          </h3>
          <ul className="space-y-3">
            {sources.map((source, index) => (
              <li key={index} className="border-b pb-2">
                <span className="font-medium">{source.name}</span>
                <p className="text-sm text-gray-600">{source.description}</p>
                <span className="text-xs text-gray-400">Licence: {source.license}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Indicateurs clés
          </h3>
          <ul className="space-y-3">
            {kpis.map((kpi, index) => (
              <li key={index} className="border-b pb-2">
                <span className="font-medium">{kpi.name}</span>
                <p className="text-sm text-gray-600">{kpi.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🛠️</span> Technologies utilisées
        </h3>
        <div className="flex flex-wrap gap-2">
          {['React', 'Mapbox GL', 'Chart.js', 'Tailwind CSS', 'Node.js', 'FastAPI'].map(tech => (
            <span key={tech} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {tech}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4 pt-4 border-t">
          Projet réalisé dans le cadre d'un cursus Data Engineering - 2024
        </p>
      </div>
    </div>
  );
};

export default About;