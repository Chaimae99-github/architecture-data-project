import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Barre de navigation principale
 */
const Navbar = ({ title = 'Urban Data Explorer' }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Accueil', icon: '🏠', ariaLabel: 'Page d\'accueil' },
    { path: '/compare', label: 'Comparer', icon: '📊', ariaLabel: 'Comparer deux arrondissements' },
    { path: '/timeline', label: 'Évolution', icon: '📈', ariaLabel: 'Évolution temporelle' },
    { path: '/about', label: 'À propos', icon: 'ℹ️', ariaLabel: 'Informations sur le projet' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40" role="navigation" aria-label="Navigation principale">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            aria-label="Accueil"
          >
            <span className="text-2xl" aria-hidden="true">🗺️</span>
            <span className="font-bold text-xl text-gray-800 hidden sm:inline">{title}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-4 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={item.ariaLabel}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2" role="menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                  isActive(item.path) ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                role="menuitem"
                aria-label={item.ariaLabel}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  title: PropTypes.string,
};

export default Navbar;