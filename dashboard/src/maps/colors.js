/**
 * Couleurs et palettes pour les choroplèthes et les rues
 */

// Palettes de couleurs pour les choroplèthes
export const colorScales = {
  // Prix au m² (rouge → plus cher)
  prix_m2: {
    stops: [
      [0, '#fee5d9'],
      [5000, '#fcae91'],
      [10000, '#fb6a4a'],
      [15000, '#de2d26'],
      [20000, '#a50f15'],
    ],
    getColor: (value) => {
      if (value <= 5000) return '#fee5d9';
      if (value <= 10000) return '#fcae91';
      if (value <= 15000) return '#fb6a4a';
      if (value <= 20000) return '#de2d26';
      return '#a50f15';
    },
  },

  // Logements sociaux (vert → plus de sociaux)
  logements_sociaux: {
    stops: [
      [0, '#edf8e9'],
      [10, '#bae4b3'],
      [20, '#74c476'],
      [30, '#31a354'],
      [40, '#006d2c'],
    ],
    getColor: (value) => {
      if (value <= 10) return '#edf8e9';
      if (value <= 20) return '#bae4b3';
      if (value <= 30) return '#74c476';
      if (value <= 40) return '#31a354';
      return '#006d2c';
    },
  },

  // Densité Wi-Fi (bleu → plus de hotspots)
  wifi_density: {
    stops: [
      [0, '#f0f9e8'],
      [5, '#bae4bc'],
      [10, '#7bccc4'],
      [15, '#43a2ca'],
      [20, '#0868ac'],
    ],
    getColor: (value) => {
      if (value <= 5) return '#f0f9e8';
      if (value <= 10) return '#bae4bc';
      if (value <= 15) return '#7bccc4';
      if (value <= 20) return '#43a2ca';
      return '#0868ac';
    },
  },

  // Antennes mobiles (violet → plus d'antennes)
  antennes_density: {
    stops: [
      [0, '#f3e8ff'],
      [10, '#d8b4fe'],
      [20, '#c084fc'],
      [30, '#a855f7'],
      [40, '#7e22ce'],
    ],
    getColor: (value) => {
      if (value <= 10) return '#f3e8ff';
      if (value <= 20) return '#d8b4fe';
      if (value <= 30) return '#c084fc';
      if (value <= 40) return '#a855f7';
      return '#7e22ce';
    },
  },
};

// Couleurs par type de rue
export const streetColors = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  tertiary: '#45B7D1',
  residential: '#96CEB4',
  service: '#FFEAA7',
  motorway: '#FF8C42',
  trunk: '#D90368',
  default: '#D3D3D3',
};

/**
 * Retourne la couleur d'une rue selon son type
 * @param {string} type - Type de rue (primary, secondary, etc.)
 * @returns {string} Code couleur hexadécimal
 */
export const getStreetColor = (type) => {
  return streetColors[type] || streetColors.default;
};

/**
 * Génère une légende pour une palette
 * @param {Object} palette - Palette de couleurs
 * @param {string} unit - Unité de mesure
 * @returns {Array} Tableau d'objets { color, label }
 */
export const generateLegend = (palette, unit = '') => {
  const legend = [];
  for (let i = 0; i < palette.stops.length; i++) {
    const [value, color] = palette.stops[i];
    const nextValue = palette.stops[i + 1]?.[0];
    const label = nextValue ? `${value} - ${nextValue}${unit}` : `${value}+${unit}`;
    legend.push({ color, label });
  }
  return legend;
};

export default colorScales;