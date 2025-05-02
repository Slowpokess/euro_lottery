import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';

const LotteryNumberBall = ({ 
  number, 
  type = 'main', 
  size = 'medium', 
  status = 'default',
  onClick,
  selected = false,
  matched = false,
  className = '',
  pulse = false,
  animated = false,
  animationDelay = 0
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine sizes based on the size prop
  const sizes = {
    xs: { width: '24px', height: '24px', fontSize: '12px' },
    small: { width: '32px', height: '32px', fontSize: '14px' },
    medium: { width: '40px', height: '40px', fontSize: '16px' },
    large: { width: '48px', height: '48px', fontSize: '18px' },
    xl: { width: '60px', height: '60px', fontSize: '22px' }
  };

  // Define styles for different ball types
  const getTypeStyles = () => {
    // Map types to colors from theme
    const typeMap = {
      main: {
        selected: {
          bg: theme?.colors?.primary || '#4A3AFF',
          color: '#FFFFFF',
          shadow: '0 3px 6px rgba(74, 58, 255, 0.3)'
        },
        default: {
          bg: theme?.name === 'dark' ? '#252F47' : '#F0F3FA',
          color: theme?.colors?.text || '#1A1C29',
          shadow: 'none'
        },
        hover: {
          bg: theme?.colors?.primaryLight || '#6D61FF',
          color: '#FFFFFF',
          shadow: '0 4px 8px rgba(74, 58, 255, 0.4)'
        }
      },
      extra: {
        selected: {
          bg: theme?.colors?.secondary || '#FF4E50',
          color: '#FFFFFF',
          shadow: '0 3px 6px rgba(255, 78, 80, 0.3)'
        },
        default: {
          bg: theme?.name === 'dark' ? '#302B34' : '#FFF5F5',
          color: theme?.colors?.secondary || '#FF4E50',
          shadow: 'none'
        },
        hover: {
          bg: theme?.colors?.secondaryLight || '#FF6B6C',
          color: '#FFFFFF',
          shadow: '0 4px 8px rgba(255, 78, 80, 0.4)'
        }
      },
      lucky: {
        selected: {
          bg: theme?.colors?.tertiary || '#FFBD00',
          color: '#1A1C29',
          shadow: '0 3px 6px rgba(255, 189, 0, 0.3)'
        },
        default: {
          bg: theme?.name === 'dark' ? '#332E18' : '#FFFBEB',
          color: theme?.colors?.tertiary || '#FFBD00',
          shadow: 'none'
        },
        hover: {
          bg: '#FFCC33',
          color: '#1A1C29',
          shadow: '0 4px 8px rgba(255, 189, 0, 0.4)'
        }
      }
    };
    
    // Return styles based on selection state
    return selected ? typeMap[type].selected : 
           isHovered && onClick ? typeMap[type].hover : 
           typeMap[type].default;
  };

  // Define styles for different statuses
  const getStatusStyles = () => {
    const baseType = getTypeStyles();
    
    switch (status) {
      case 'matched':
        return {
          bg: theme?.colors?.success || '#00C853',
          color: '#FFFFFF',
          shadow: '0 3px 6px rgba(0, 200, 83, 0.3)',
          transform: 'scale(1.05)',
          border: '2px solid #FFFFFF'
        };
      case 'missed':
        return {
          bg: theme?.name === 'dark' ? '#252F47' : '#F0F3FA',
          color: theme?.colors?.textLight || '#8792A2',
          shadow: 'none',
          opacity: 0.7,
          textDecoration: 'line-through'
        };
      case 'winning':
        return {
          bg: theme?.colors?.success || '#00C853',
          color: '#FFFFFF',
          shadow: '0 3px 10px rgba(0, 200, 83, 0.5)',
          transform: 'scale(1.05)',
          border: '2px solid #FFFFFF'
        };
      default:
        return {
          bg: baseType.bg,
          color: baseType.color,
          shadow: baseType.shadow
        };
    }
  };

  // Get styles based on type and status
  const typeStyle = getTypeStyles();
  const statusStyle = getStatusStyles();
  
  // Create animation for the ball
  const getAnimation = () => {
    if (!animated) return {};
    
    return {
      opacity: 0,
      animation: `ballPop 0.5s ease forwards ${animationDelay}s`
    };
  };

  // Final combined styles
  const ballStyle = {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    margin: '4px',
    fontWeight: '600',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    position: 'relative',
    backgroundColor: matched ? statusStyle.bg : typeStyle.bg,
    color: matched ? statusStyle.color : typeStyle.color,
    boxShadow: matched ? statusStyle.shadow : typeStyle.shadow,
    transform: matched ? statusStyle.transform : 'scale(1)',
    border: matched ? statusStyle.border : 'none',
    opacity: matched ? 1 : (statusStyle.opacity || 1),
    textDecoration: statusStyle.textDecoration || 'none',
    ...sizes[size],
    ...getAnimation()
  };

  // Pulsating effect
  const getPulseStyle = () => {
    if (!pulse) return {};
    
    return {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '-4px',
        left: '-4px',
        right: '-4px',
        bottom: '-4px',
        borderRadius: '50%',
        border: `2px solid ${matched ? statusStyle.bg : typeStyle.bg}`,
        animation: 'pulsate 1.5s ease-out infinite'
      }
    };
  };

  const handleClick = () => {
    if (onClick && !matched) {
      onClick(number);
    }
  };

  return (
    <>
      <div 
        className={`lottery-number-ball ${matched ? 'matched' : ''} ${className} ${pulse ? 'pulse' : ''}`} 
        style={ballStyle} 
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {number}
      </div>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes pulsate {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        
        @keyframes ballPop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          70% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .pulse::after {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          border: 2px solid ${matched ? statusStyle.bg : typeStyle.bg};
          animation: pulsate 1.5s ease-out infinite;
        }
      `}</style>
    </>
  );
};

LotteryNumberBall.propTypes = {
  number: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  type: PropTypes.oneOf(['main', 'extra', 'lucky']),
  size: PropTypes.oneOf(['xs', 'small', 'medium', 'large', 'xl']),
  status: PropTypes.oneOf(['default', 'matched', 'missed', 'winning']),
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  matched: PropTypes.bool,
  className: PropTypes.string,
  pulse: PropTypes.bool,
  animated: PropTypes.bool,
  animationDelay: PropTypes.number
};

export default LotteryNumberBall;