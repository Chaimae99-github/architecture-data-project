import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge coloré pour afficher des statuts ou types
 */
const Badge = ({ children, variant = 'default', className = '', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-500 text-white',
    primary: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    info: 'bg-cyan-500 text-white',
    // Types de rues
    primary_street: 'bg-red-500 text-white',
    secondary_street: 'bg-orange-500 text-white',
    tertiary_street: 'bg-yellow-500 text-white',
    residential: 'bg-green-500 text-white',
    service: 'bg-purple-500 text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      role="status"
      aria-label={typeof children === 'string' ? children : 'badge'}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default Badge;