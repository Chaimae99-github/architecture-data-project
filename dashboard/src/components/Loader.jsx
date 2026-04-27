import React from 'react';
import PropTypes from 'prop-types';

/**
 * Spinner de chargement
 */
const Loader = ({ size = 'md', fullScreen = false, message = null }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`${sizes[size]} border-gray-200 border-t-blue-500 rounded-full animate-spin`}
        role="status"
        aria-label="Chargement en cours"
      />
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50"
        role="dialog"
        aria-label="Chargement"
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

Loader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullScreen: PropTypes.bool,
  message: PropTypes.string,
};

export default Loader;