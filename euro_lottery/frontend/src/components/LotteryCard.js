import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import LotteryIcon from './LotteryIcon';
import PremiumButton from './PremiumButton';

// Helper function to format jackpot amount with animations
const JackpotAmount = ({ amount, className = '' }) => {
  const theme = useTheme();
  
  // Format the amount
  const formattedAmount = typeof amount === 'string' && amount.includes('€') 
    ? amount 
    : `€${parseFloat(amount).toLocaleString()}`;
  
  // Split into parts for animation
  const [currency, mainPart, decimalPart] = formattedAmount.match(/^(€)(\d+(?:[.,]\d+)?)$/)?.slice(1) || ['€', amount, ''];
  
  return (
    <div 
      className={`jackpot-amount ${className}`}
      style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        color: theme?.colors?.jackpot,
        display: 'inline-flex',
        alignItems: 'center',
        textShadow: '0 2px 10px rgba(255, 189, 0, 0.2)',
        fontFamily: theme?.typography?.fontFamilyAlt
      }}
    >
      <span
        style={{
          display: 'inline-block',
          fontSize: '70%',
          marginRight: '2px',
          opacity: 0.9
        }}
      >
        {currency}
      </span>
      <span className="slide-up delay-2">{mainPart}</span>
      {decimalPart && (
        <span
          style={{
            fontSize: '60%',
            alignSelf: 'flex-start',
            opacity: 0.8
          }}
        >
          {decimalPart}
        </span>
      )}
    </div>
  );
};

JackpotAmount.propTypes = {
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  className: PropTypes.string
};

const LotteryCard = ({ 
  lottery, 
  compact = false, 
  actionText = 'View Details',
  onAction,
  className = '',
  highlighted = false,
  animationDelay = 0
}) => {
  const theme = useTheme();

  // Determine icon name based on lottery name
  const getLotteryIcon = (name) => {
    const nameLC = name.toLowerCase();
    if (nameLC.includes('euro') && nameLC.includes('million')) return 'euromillions';
    if (nameLC.includes('euro') && nameLC.includes('jackpot')) return 'eurojackpot';
    if (nameLC.includes('power')) return 'powerball';
    if (nameLC.includes('mega')) return 'megamillions';
    if (nameLC.includes('lotto')) return 'lotto';
    return 'ticket';
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate time remaining
  const getTimeRemaining = (drawDate) => {
    const total = Date.parse(drawDate) - Date.parse(new Date());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m remaining`;
    } else {
      return "Closing soon";
    }
  };

  // Handle action button click
  const handleAction = () => {
    if (onAction) {
      onAction(lottery);
    }
  };

  const iconName = getLotteryIcon(lottery.name);
  
  const cardStyle = {
    animation: `fadeIn 0.5s ease-out ${animationDelay}s forwards`,
    opacity: 0,
    transform: highlighted ? 'scale(1.03)' : 'scale(1)',
    boxShadow: highlighted ? theme?.shadows?.lg : theme?.shadows?.sm,
    height: '100%'
  };
  
  const headerGradient = iconName === 'euromillions'
    ? 'linear-gradient(135deg, #4A3AFF 0%, #842FE8 100%)'
    : iconName === 'eurojackpot'
      ? 'linear-gradient(135deg, #5146C0 0%, #9446E0 100%)'
      : iconName === 'powerball'
        ? 'linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)'
        : iconName === 'megamillions'
          ? 'linear-gradient(135deg, #00C853 0%, #009688 100%)'
          : 'linear-gradient(135deg, #4A3AFF 0%, #842FE8 100%)';

  return (
    <Card 
      className={`lottery-card ${className}`}
      style={cardStyle}
    >
      <div 
        className="lottery-card-header"
        style={{ 
          background: headerGradient,
          padding: compact ? '1rem' : '1.5rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: compact ? 'center' : 'flex-start',
          borderBottom: `1px solid ${theme?.colors?.border}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background pattern */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            pointerEvents: 'none'
          }}
        />
        
        <div 
          className="icon-wrapper float"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)'
          }}
        >
          <LotteryIcon 
            name={iconName} 
            size={compact ? 24 : 28} 
            color="white"
          />
        </div>
        
        <div>
          <h4 
            style={{ 
              margin: 0, 
              fontWeight: 700, 
              fontSize: compact ? '1.1rem' : '1.35rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {lottery.name}
          </h4>
          
          {/* Status badge */}
          {lottery.status && (
            <span 
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginTop: '0.5rem',
                backgroundColor: lottery.status === 'active' 
                  ? 'rgba(0, 200, 83, 0.3)' 
                  : 'rgba(255, 77, 106, 0.3)',
                color: lottery.status === 'active' 
                  ? '#00C853' 
                  : '#FF4D6A',
                border: `1px solid ${
                  lottery.status === 'active' 
                    ? 'rgba(0, 200, 83, 0.5)' 
                    : 'rgba(255, 77, 106, 0.5)'
                }`,
                letterSpacing: '0.03em'
              }}
            >
              {lottery.status === 'active' ? 'Open' : lottery.status}
            </span>
          )}
        </div>
      </div>

      <Card.Body 
        style={{
          padding: compact ? '1rem' : '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: theme?.colors?.card
        }}
      >
        {!compact && (
          <div>
            <p 
              style={{
                fontSize: '0.95rem',
                color: theme?.colors?.textMedium,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.6
              }}
            >
              {lottery.description}
            </p>
          </div>
        )}
        
        <div 
          style={{
            padding: '1rem',
            backgroundColor: theme?.name === 'light' ? '#F8F9FC' : '#252F47',
            borderRadius: theme?.borderRadius?.md,
            textAlign: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0, 6, 54, 0.06)'
          }}
        >
          <div 
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: theme?.colors?.textMedium,
              marginBottom: '0.25rem'
            }}
          >
            Current Jackpot
          </div>
          <JackpotAmount amount={lottery.currentJackpot} />
        </div>
        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: theme?.colors?.textMedium
              }}
            >
              Next Draw:
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: theme?.colors?.text
              }}
            >
              {formatDate(lottery.nextDrawDate)}
            </span>
          </div>
          
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: theme?.colors?.textMedium
              }}
            >
              Time Remaining:
            </span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: theme?.colors?.primary,
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: theme?.name === 'light' 
                  ? 'rgba(74, 58, 255, 0.1)' 
                  : 'rgba(109, 97, 255, 0.15)'
              }}
            >
              {getTimeRemaining(lottery.nextDrawDate)}
            </span>
          </div>
          
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: theme?.colors?.textMedium
              }}
            >
              Ticket Price:
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: theme?.colors?.text
              }}
            >
              €{lottery.ticketPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </Card.Body>
      
      <Card.Footer 
        style={{
          backgroundColor: theme?.colors?.card,
          borderTop: `1px solid ${theme?.colors?.border}`,
          padding: compact ? '1rem' : '1.25rem',
          textAlign: 'center'
        }}
      >
        {onAction ? (
          <PremiumButton
            variant="primary"
            onClick={handleAction}
            fullWidth={compact}
            size={compact ? 'sm' : 'md'}
            gradient={highlighted}
          >
            {actionText}
          </PremiumButton>
        ) : (
          <Link to={`/lotteries/${lottery.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <PremiumButton
              variant="primary"
              fullWidth={compact}
              size={compact ? 'sm' : 'md'}
              gradient={highlighted}
            >
              {actionText}
            </PremiumButton>
          </Link>
        )}
      </Card.Footer>
    </Card>
  );
};

LotteryCard.propTypes = {
  lottery: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    currentJackpot: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    nextDrawDate: PropTypes.string.isRequired,
    ticketPrice: PropTypes.number.isRequired,
    status: PropTypes.string
  }).isRequired,
  compact: PropTypes.bool,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string,
  highlighted: PropTypes.bool,
  animationDelay: PropTypes.number
};

export default LotteryCard;