import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';

const PremiumButton = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  onClick,
  className = '',
  fullWidth = false,
  disabled = false,
  type = 'button',
  loading = false,
  pulse = false,
  gradient = false,
  ...rest
}) => {
  const theme = useTheme();
  
  const getBaseStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme?.typography?.fontFamily,
      fontWeight: 500,
      borderRadius: theme?.borderRadius?.md,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: 'none',
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      border: 'none',
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto'
    };
    
    // Size styles
    if (size === 'sm') {
      baseStyles.padding = '0.4rem 0.8rem';
      baseStyles.fontSize = '0.875rem';
      baseStyles.minHeight = '36px';
    } else if (size === 'md') {
      baseStyles.padding = '0.625rem 1.25rem';
      baseStyles.fontSize = '0.9375rem';
      baseStyles.minHeight = '44px';
    } else if (size === 'lg') {
      baseStyles.padding = '0.75rem 1.5rem';
      baseStyles.fontSize = '1rem';
      baseStyles.minHeight = '52px';
    }
    
    return baseStyles;
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: gradient ? theme?.colors?.gradient1 : theme?.colors?.primary,
          color: theme?.colors?.textOnPrimary,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme?.shadows?.md,
            background: theme?.colors?.primaryLight
          },
          '&:active': {
            transform: 'translateY(0)',
            background: theme?.colors?.primaryDark
          }
        };
      case 'secondary':
        return {
          background: gradient ? theme?.colors?.gradient2 : theme?.colors?.secondary,
          color: theme?.colors?.textOnPrimary,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme?.shadows?.md,
            background: theme?.colors?.secondaryLight
          }
        };
      case 'tertiary':
        return {
          background: gradient ? theme?.colors?.gradient3 : theme?.colors?.tertiary,
          color: '#121212',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme?.shadows?.md
          }
        };
      case 'outline':
        return {
          background: 'transparent',
          color: theme?.colors?.primary,
          border: `2px solid ${theme?.colors?.primary}`,
          '&:hover': {
            background: theme?.colors?.primary,
            color: theme?.colors?.textOnPrimary,
            transform: 'translateY(-2px)'
          }
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: theme?.colors?.primary,
          '&:hover': {
            background: `rgba(${theme?.colors?.primaryRgb || '74, 58, 255'}, 0.1)`,
            transform: 'translateY(-2px)'
          }
        };
      case 'text':
        return {
          background: 'transparent',
          color: theme?.colors?.primary,
          boxShadow: 'none',
          padding: '0.25rem 0.5rem',
          '&:hover': {
            textDecoration: 'underline'
          }
        };
      default:
        return {
          background: theme?.colors?.primary,
          color: theme?.colors?.textOnPrimary
        };
    }
  };
  
  // Combine all styles
  const buttonStyle = {
    ...getBaseStyles(),
    ...getVariantStyles()
  };
  
  // Apply hover effect manually
  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = theme?.shadows?.md;
      
      if (variant === 'outline') {
        e.currentTarget.style.background = theme?.colors?.primary;
        e.currentTarget.style.color = theme?.colors?.textOnPrimary;
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = `rgba(${theme?.colors?.primaryRgb || '74, 58, 255'}, 0.1)`;
      } else if (variant === 'primary') {
        e.currentTarget.style.background = theme?.colors?.primaryLight;
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = theme?.colors?.secondaryLight;
      }
    }
  };
  
  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
      
      if (variant === 'outline') {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = theme?.colors?.primary;
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = 'transparent';
      } else if (variant === 'primary' && gradient) {
        e.currentTarget.style.background = theme?.colors?.gradient1;
      } else if (variant === 'primary') {
        e.currentTarget.style.background = theme?.colors?.primary;
      } else if (variant === 'secondary' && gradient) {
        e.currentTarget.style.background = theme?.colors?.gradient2;
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = theme?.colors?.secondary;
      }
    }
  };
  
  return (
    <button
      type={type}
      className={`premium-button ${className} ${pulse ? 'pulse' : ''}`}
      onClick={!disabled && !loading ? onClick : undefined}
      style={buttonStyle}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {loading ? (
        <div className="loading-spinner" style={{ marginRight: children ? '8px' : 0 }}>
          <div 
            style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${theme?.colors?.textOnPrimary || '#fff'}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} 
          />
        </div>
      ) : icon ? (
        <span className="button-icon" style={{ marginRight: children ? '8px' : 0 }}>
          {icon}
        </span>
      ) : null}
      
      {children}
      
      {/* Ripple effect element */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </button>
  );
};

PremiumButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'outline', 'ghost', 'text']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.node,
  children: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  loading: PropTypes.bool,
  pulse: PropTypes.bool,
  gradient: PropTypes.bool
};

export default PremiumButton;