import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';

const GradientHeading = ({
  children,
  level = 1,
  gradient = 'primary',
  className = '',
  align = 'left',
  animated = false,
  style = {},
  ...props
}) => {
  const theme = useTheme();
  
  // Define gradients to use
  const gradients = {
    primary: theme?.colors?.gradient1 || 'linear-gradient(135deg, #4A3AFF 0%, #842FE8 100%)',
    secondary: theme?.colors?.gradient2 || 'linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)',
    tertiary: theme?.colors?.gradient3 || 'linear-gradient(135deg, #00C853 0%, #00BCD4 100%)',
    success: 'linear-gradient(135deg, #00C853 0%, #69F0AE 100%)',
    warning: 'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)',
    danger: 'linear-gradient(135deg, #F44336 0%, #FF9800 100%)'
  };
  
  // Define animations
  const animations = {
    fadeIn: 'fadeIn 1s ease forwards',
    slideUp: 'slideInUp 0.8s ease forwards',
    fadeInSlideUp: 'fadeIn 0.5s ease forwards, slideInUp 0.8s ease forwards',
    none: 'none'
  };

  const gradientToUse = gradients[gradient] || gradients.primary;
  
  // Base styles
  const baseStyle = {
    display: 'inline-block',
    backgroundImage: gradientToUse,
    backgroundSize: '100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    MozBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    MozTextFillColor: 'transparent',
    color: 'transparent',
    textAlign: align,
    fontFamily: theme?.typography?.fontFamilyAlt || "'Montserrat', sans-serif",
    fontWeight: 700,
    marginBottom: '0.5em',
    animation: animated ? animations[typeof animated === 'string' ? animated : 'fadeInSlideUp'] : 'none',
    ...style
  };
  
  // Heading style variations
  const headingStyles = {
    1: {
      fontSize: theme?.typography?.heading1?.fontSize || '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    2: {
      fontSize: theme?.typography?.heading2?.fontSize || '1.875rem',
      lineHeight: 1.3,
      letterSpacing: '-0.015em'
    },
    3: {
      fontSize: theme?.typography?.heading3?.fontSize || '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em'
    },
    4: {
      fontSize: '1.25rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em'
    },
    5: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0'
    },
    6: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0'
    }
  };
  
  // Combine styles
  const headingStyle = {
    ...baseStyle,
    ...headingStyles[level]
  };
  
  // Render the appropriate heading level
  const HeadingTag = `h${level}`;
  
  return (
    <HeadingTag 
      className={`gradient-heading ${className}`} 
      style={headingStyle}
      {...props}
    >
      {children}
    </HeadingTag>
  );
};

GradientHeading.propTypes = {
  children: PropTypes.node.isRequired,
  level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
  gradient: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger']),
  className: PropTypes.string,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  animated: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  style: PropTypes.object
};

export default GradientHeading;