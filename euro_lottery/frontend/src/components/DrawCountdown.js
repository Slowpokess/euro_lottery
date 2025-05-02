import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';

const DrawCountdown = ({ 
  drawDate, 
  onComplete,
  showLabels = true,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  size = 'medium',
  className = '',
  colorScheme = 'primary',
  compact = false,
  animated = true,
  style = {},
}) => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState({});
  const [completed, setCompleted] = useState(false);
  
  // Size presets
  const sizes = {
    small: {
      fontSize: '1rem',
      numberSize: '1.75rem',
      padding: '0.5rem',
      gap: '0.5rem',
      labelSize: '0.7rem'
    },
    medium: {
      fontSize: '1.25rem',
      numberSize: '2.25rem',
      padding: '0.75rem',
      gap: '0.75rem',
      labelSize: '0.8rem'
    },
    large: {
      fontSize: '1.5rem',
      numberSize: '3rem',
      padding: '1rem',
      gap: '1rem',
      labelSize: '0.9rem'
    }
  };
  
  // Color schemes
  const colorSchemes = {
    primary: {
      bg: theme?.name === 'dark' ? 'rgba(74, 58, 255, 0.15)' : 'rgba(74, 58, 255, 0.08)',
      color: theme?.colors?.primary || '#4A3AFF',
      border: theme?.name === 'dark' ? '1px solid rgba(74, 58, 255, 0.3)' : 'none',
      boxShadow: theme?.name === 'dark' ? 'none' : 'inset 0 2px 4px rgba(0, 6, 54, 0.06)'
    },
    secondary: {
      bg: theme?.name === 'dark' ? 'rgba(255, 78, 80, 0.15)' : 'rgba(255, 78, 80, 0.08)',
      color: theme?.colors?.secondary || '#FF4E50',
      border: theme?.name === 'dark' ? '1px solid rgba(255, 78, 80, 0.3)' : 'none',
      boxShadow: theme?.name === 'dark' ? 'none' : 'inset 0 2px 4px rgba(0, 6, 54, 0.06)'
    },
    tertiary: {
      bg: theme?.name === 'dark' ? 'rgba(255, 189, 0, 0.15)' : 'rgba(255, 189, 0, 0.08)',
      color: theme?.colors?.tertiary || '#FFBD00',
      border: theme?.name === 'dark' ? '1px solid rgba(255, 189, 0, 0.3)' : 'none',
      boxShadow: theme?.name === 'dark' ? 'none' : 'inset 0 2px 4px rgba(0, 6, 54, 0.06)'
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.1)',
      color: theme?.colors?.text || '#1A1C29',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }
  };
  
  // Selected size and color scheme
  const sizeStyle = sizes[size] || sizes.medium;
  const colorStyle = colorSchemes[colorScheme] || colorSchemes.primary;
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(drawDate) - new Date();
      
      if (difference > 0) {
        // Calculate time units
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        // Format with leading zeros
        const formattedDays = days.toString().padStart(2, '0');
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        return {
          days: formattedDays,
          hours: formattedHours,
          minutes: formattedMinutes,
          seconds: formattedSeconds,
          total: difference
        };
      }
      
      // Time has completed
      if (!completed) {
        setCompleted(true);
        if (onComplete) {
          onComplete();
        }
      }
      
      return {
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
        total: 0
      };
    };
    
    // Initialize
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    // Cleanup
    return () => clearInterval(timer);
  }, [drawDate, onComplete, completed]);
  
  // Conditional rendering based on compact mode
  if (compact) {
    return (
      <div 
        className={`countdown-compact ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: sizeStyle.labelSize,
          color: colorStyle.color,
          backgroundColor: colorStyle.bg,
          padding: '0.35em 0.75em',
          borderRadius: '99px',
          border: colorStyle.border,
          fontWeight: 600,
          ...style
        }}
      >
        {!completed ? (
          <>
            {showDays && parseInt(timeLeft.days) > 0 && `${timeLeft.days}d `}
            {showHours && `${timeLeft.hours}h `}
            {showMinutes && `${timeLeft.minutes}m `}
            {showSeconds && `${timeLeft.seconds}s`}
          </>
        ) : (
          'Closed'
        )}
      </div>
    );
  }
  
  // Full countdown display
  return (
    <div 
      className={`draw-countdown ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: sizeStyle.gap,
        fontSize: sizeStyle.fontSize,
        fontFamily: theme?.typography?.fontFamily,
        ...style
      }}
    >
      {showDays && (
        <div 
          className={`countdown-segment ${animated ? 'fade-in delay-1' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div 
            className="countdown-number"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: sizeStyle.numberSize,
              fontWeight: 700,
              width: 'auto',
              minWidth: '2.5em',
              height: '1.8em',
              lineHeight: 1,
              padding: sizeStyle.padding,
              borderRadius: theme?.borderRadius?.lg || '12px',
              color: colorStyle.color,
              backgroundColor: colorStyle.bg,
              boxShadow: colorStyle.boxShadow,
              fontFamily: theme?.typography?.fontFamilyAlt,
              border: colorStyle.border,
              backdropFilter: colorStyle.backdropFilter,
              WebkitBackdropFilter: colorStyle.WebkitBackdropFilter,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {timeLeft.days}
            
            {/* Background pattern */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.05,
                backgroundImage: 'radial-gradient(circle at 25px 25px, currentColor 2%, transparent 0%)',
                backgroundSize: '10px 10px',
                pointerEvents: 'none'
              }}
            />
          </div>
          {showLabels && (
            <div 
              className="countdown-label"
              style={{
                marginTop: '0.4em',
                fontSize: sizeStyle.labelSize,
                color: theme?.colors?.textMedium || '#4F566B',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Days
            </div>
          )}
        </div>
      )}
      
      {showHours && (
        <div 
          className={`countdown-segment ${animated ? 'fade-in delay-2' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div 
            className="countdown-number"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: sizeStyle.numberSize,
              fontWeight: 700,
              width: 'auto',
              minWidth: '2.5em',
              height: '1.8em',
              lineHeight: 1,
              padding: sizeStyle.padding,
              borderRadius: theme?.borderRadius?.lg || '12px',
              color: colorStyle.color,
              backgroundColor: colorStyle.bg,
              boxShadow: colorStyle.boxShadow,
              fontFamily: theme?.typography?.fontFamilyAlt,
              border: colorStyle.border,
              backdropFilter: colorStyle.backdropFilter,
              WebkitBackdropFilter: colorStyle.WebkitBackdropFilter,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {timeLeft.hours}
            
            {/* Background pattern */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.05,
                backgroundImage: 'radial-gradient(circle at 25px 25px, currentColor 2%, transparent 0%)',
                backgroundSize: '10px 10px',
                pointerEvents: 'none'
              }}
            />
          </div>
          {showLabels && (
            <div 
              className="countdown-label"
              style={{
                marginTop: '0.4em',
                fontSize: sizeStyle.labelSize,
                color: theme?.colors?.textMedium || '#4F566B',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Hours
            </div>
          )}
        </div>
      )}
      
      {showMinutes && (
        <div 
          className={`countdown-segment ${animated ? 'fade-in delay-3' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div 
            className="countdown-number"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: sizeStyle.numberSize,
              fontWeight: 700,
              width: 'auto',
              minWidth: '2.5em',
              height: '1.8em',
              lineHeight: 1,
              padding: sizeStyle.padding,
              borderRadius: theme?.borderRadius?.lg || '12px',
              color: colorStyle.color,
              backgroundColor: colorStyle.bg,
              boxShadow: colorStyle.boxShadow,
              fontFamily: theme?.typography?.fontFamilyAlt,
              border: colorStyle.border,
              backdropFilter: colorStyle.backdropFilter,
              WebkitBackdropFilter: colorStyle.WebkitBackdropFilter,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {timeLeft.minutes}
            
            {/* Background pattern */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.05,
                backgroundImage: 'radial-gradient(circle at 25px 25px, currentColor 2%, transparent 0%)',
                backgroundSize: '10px 10px',
                pointerEvents: 'none'
              }}
            />
          </div>
          {showLabels && (
            <div 
              className="countdown-label"
              style={{
                marginTop: '0.4em',
                fontSize: sizeStyle.labelSize,
                color: theme?.colors?.textMedium || '#4F566B',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Minutes
            </div>
          )}
        </div>
      )}
      
      {showSeconds && (
        <div 
          className={`countdown-segment ${animated ? 'fade-in delay-4' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div 
            className="countdown-number pulse"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: sizeStyle.numberSize,
              fontWeight: 700,
              width: 'auto',
              minWidth: '2.5em',
              height: '1.8em',
              lineHeight: 1,
              padding: sizeStyle.padding,
              borderRadius: theme?.borderRadius?.lg || '12px',
              color: colorStyle.color,
              backgroundColor: colorStyle.bg,
              boxShadow: colorStyle.boxShadow,
              fontFamily: theme?.typography?.fontFamilyAlt,
              border: colorStyle.border,
              backdropFilter: colorStyle.backdropFilter,
              WebkitBackdropFilter: colorStyle.WebkitBackdropFilter,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {timeLeft.seconds}
            
            {/* Background pattern */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.05,
                backgroundImage: 'radial-gradient(circle at 25px 25px, currentColor 2%, transparent 0%)',
                backgroundSize: '10px 10px',
                pointerEvents: 'none'
              }}
            />
          </div>
          {showLabels && (
            <div 
              className="countdown-label"
              style={{
                marginTop: '0.4em',
                fontSize: sizeStyle.labelSize,
                color: theme?.colors?.textMedium || '#4F566B',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Seconds
            </div>
          )}
        </div>
      )}
    </div>
  );
};

DrawCountdown.propTypes = {
  drawDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  onComplete: PropTypes.func,
  showLabels: PropTypes.bool,
  showDays: PropTypes.bool,
  showHours: PropTypes.bool,
  showMinutes: PropTypes.bool,
  showSeconds: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  colorScheme: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'glass']),
  compact: PropTypes.bool,
  animated: PropTypes.bool,
  style: PropTypes.object
};

export default DrawCountdown;