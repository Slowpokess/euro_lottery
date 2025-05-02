import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaTicketAlt, FaTrophy, FaWallet } from 'react-icons/fa';
import { fetchUpcomingDraws, fetchLotteryGames } from '../../store/slices/lotterySlice';
import { fetchUserTickets } from '../../store/slices/ticketSlice';
import { useTheme } from '../../context/ThemeContext';

// Components
import DrawCountdown from '../../components/DrawCountdown';
import LotteryCard from '../../components/LotteryCard';
import GradientHeading from '../../components/GradientHeading';
import PremiumButton from '../../components/PremiumButton';

const StatCard = ({ title, value, icon, trend, colorScheme = 'primary', onClick }) => {
  const theme = useTheme();
  
  // Color schemes
  const colorSchemes = {
    primary: {
      bgGradient: 'linear-gradient(135deg, rgba(74, 58, 255, 0.05) 0%, rgba(132, 47, 232, 0.1) 100%)',
      iconBg: theme?.colors?.primary || '#4A3AFF',
      valueColor: theme?.colors?.primary || '#4A3AFF',
      borderColor: 'rgba(74, 58, 255, 0.2)'
    },
    secondary: {
      bgGradient: 'linear-gradient(135deg, rgba(255, 78, 80, 0.05) 0%, rgba(249, 212, 35, 0.1) 100%)',
      iconBg: theme?.colors?.secondary || '#FF4E50',
      valueColor: theme?.colors?.secondary || '#FF4E50',
      borderColor: 'rgba(255, 78, 80, 0.2)'
    },
    success: {
      bgGradient: 'linear-gradient(135deg, rgba(0, 200, 83, 0.05) 0%, rgba(0, 188, 212, 0.1) 100%)',
      iconBg: theme?.colors?.success || '#00C853',
      valueColor: theme?.colors?.success || '#00C853',
      borderColor: 'rgba(0, 200, 83, 0.2)'
    },
    warning: {
      bgGradient: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 193, 7, 0.1) 100%)',
      iconBg: theme?.colors?.warning || '#FF9800',
      valueColor: theme?.colors?.warning || '#FF9800',
      borderColor: 'rgba(255, 152, 0, 0.2)'
    }
  };
  
  const scheme = colorSchemes[colorScheme] || colorSchemes.primary;
  
  return (
    <Card 
      className={`stat-card fade-in ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{
        background: scheme.bgGradient,
        borderRadius: theme?.borderRadius?.lg || '12px',
        border: `1px solid ${scheme.borderColor}`,
        boxShadow: theme?.shadows?.sm,
        padding: '1.5rem',
        height: '100%',
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: scheme.valueColor,
              marginBottom: '0.25rem',
              fontFamily: theme?.typography?.fontFamilyAlt
            }}
          >
            {value}
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: theme?.colors?.textMedium,
              margin: 0
            }}
          >
            {title}
          </p>
          
          {trend && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: '0.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: trend.type === 'increase' 
                  ? 'rgba(0, 200, 83, 0.1)' 
                  : trend.type === 'decrease'
                    ? 'rgba(255, 78, 80, 0.1)'
                    : 'rgba(74, 58, 255, 0.1)',
                color: trend.type === 'increase'
                  ? theme?.colors?.success
                  : trend.type === 'decrease'
                    ? theme?.colors?.secondary
                    : theme?.colors?.primary
              }}
            >
              {trend.icon} {trend.value}
            </div>
          )}
        </div>
        
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '48px',
            height: '48px',
            borderRadius: theme?.borderRadius?.md || '8px',
            backgroundColor: scheme.iconBg,
            color: 'white',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node,
  trend: PropTypes.shape({
    type: PropTypes.oneOf(['increase', 'decrease', 'neutral']),
    value: PropTypes.string,
    icon: PropTypes.node
  }),
  colorScheme: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning']),
  onClick: PropTypes.func
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { upcomingDraws, games, status: lotteryStatus } = useSelector(state => state.lottery);
  const { userTickets, status: ticketStatus } = useSelector(state => state.ticket) || { userTickets: [], status: 'idle' };
  const { profile } = useSelector(state => state.user);
  
  useEffect(() => {
    // Fetch upcoming draws
    dispatch(fetchUpcomingDraws());
    
    // Fetch lottery games
    dispatch(fetchLotteryGames());
    
    // Fetch user tickets
    dispatch(fetchUserTickets());
  }, [dispatch]);
  
  // Get next draw
  const nextDraw = upcomingDraws && upcomingDraws.length > 0 ? upcomingDraws[0] : null;
  
  // Get current user tickets count
  const ticketsCount = userTickets ? userTickets.length : 0;
  
  // Calculate won amount from tickets
  const calculateWonAmount = () => {
    if (!userTickets) return 0;
    
    return userTickets.reduce((total, ticket) => {
      if (ticket.result_status === 'winning') {
        return total + parseFloat(ticket.winning_amount);
      }
      return total;
    }, 0);
  };
  
  const wonAmount = calculateWonAmount();
  
  // Loading state
  const isLoading = lotteryStatus === 'loading' || ticketStatus === 'loading';
  
  // Mock upcoming draw if none exists in API response
  const mockNextDraw = {
    id: 1,
    draw_number: 1042,
    lottery_game: {
      id: 1,
      name: 'EuroMillions',
      description: 'Play Europe\'s biggest lottery game with huge jackpots!',
      rules: 'Select 5 numbers from 1-50 and 2 Lucky Stars from 1-12.',
      draw_days: 'Tuesday, Friday'
    },
    draw_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    jackpot_amount: '130000000',
    status: 'scheduled'
  };
  
  // Use real draw data or mock data
  const displayDraw = nextDraw || mockNextDraw;
  
  return (
    <Container fluid className="dashboard py-4">
      <Row className="mb-4">
        <Col>
          <GradientHeading 
            level={1} 
            gradient="primary" 
            animated="fadeInSlideUp"
            style={{ marginBottom: '1.5rem' }}
          >
            Welcome to Euro Lottery
          </GradientHeading>
        </Col>
      </Row>
      
      {/* User Stats */}
      <Row className="mb-4 g-3">
        <Col lg={3} md={6}>
          <StatCard
            title="Current Balance"
            value={`€${profile ? profile.balance.toFixed(2) : '0.00'}`}
            icon={<FaWallet size={20} />}
            colorScheme="primary"
            onClick={() => navigate('/wallet')}
          />
        </Col>
        
        <Col lg={3} md={6}>
          <StatCard
            title="Active Tickets"
            value={ticketsCount}
            icon={<FaTicketAlt size={20} />}
            colorScheme="secondary"
            onClick={() => navigate('/my-tickets')}
          />
        </Col>
        
        <Col lg={3} md={6}>
          <StatCard
            title="Next Draw"
            value={displayDraw ? new Date(displayDraw.draw_date).toLocaleDateString() : 'N/A'}
            icon={<FaCalendarAlt size={20} />}
            colorScheme="warning"
            onClick={() => navigate('/lotteries')}
          />
        </Col>
        
        <Col lg={3} md={6}>
          <StatCard
            title="Total Winnings"
            value={`€${wonAmount.toFixed(2)}`}
            icon={<FaTrophy size={20} />}
            colorScheme="success"
            onClick={() => navigate('/my-tickets', { state: { filter: 'winning' } })}
          />
        </Col>
      </Row>
      
      {/* Next Draw Section */}
      <Row className="mb-4">
        <Col>
          <Card 
            className="slide-up"
            style={{
              borderRadius: theme?.borderRadius?.xl,
              boxShadow: theme?.shadows?.md,
              border: 'none',
              overflow: 'hidden',
              backgroundColor: theme?.colors?.card
            }}
          >
            <Card.Header
              style={{
                background: 'linear-gradient(135deg, #4A3AFF 0%, #842FE8 100%)',
                color: 'white',
                border: 'none',
                position: 'relative',
                padding: '1.5rem'
              }}
            >
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
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 
                  style={{ 
                    margin: 0, 
                    fontSize: '1.75rem', 
                    fontWeight: 700,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  Next Draw: {displayDraw.lottery_game.name}
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                  Draw #{displayDraw.draw_number} • {new Date(displayDraw.draw_date).toLocaleString()}
                </p>
              </div>
            </Card.Header>
            
            <Card.Body
              style={{
                padding: '2rem'
              }}
            >
              <Row>
                <Col lg={6} className="mb-4 mb-lg-0">
                  <div 
                    style={{ 
                      marginBottom: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <h4 
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: theme?.colors?.textMedium,
                        margin: 0
                      }}
                    >
                      Current Jackpot
                    </h4>
                    <div 
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: theme?.colors?.jackpot,
                        fontFamily: theme?.typography?.fontFamilyAlt,
                        textShadow: '0 2px 10px rgba(255, 189, 0, 0.2)'
                      }}
                    >
                      €{parseInt(displayDraw.jackpot_amount).toLocaleString()}
                    </div>
                  </div>
                  
                  <p 
                    style={{
                      fontSize: '0.95rem',
                      color: theme?.colors?.textMedium,
                      marginBottom: '1.5rem'
                    }}
                  >
                    {displayDraw.lottery_game.description}
                  </p>
                  
                  <PremiumButton 
                    variant="primary"
                    size="lg"
                    gradient
                    onClick={() => navigate(`/lotteries/${displayDraw.lottery_game.id}/buy-tickets/${displayDraw.id}`)}
                  >
                    Buy Tickets Now
                  </PremiumButton>
                </Col>
                
                <Col lg={6}>
                  <div 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}
                  >
                    <h4 
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: theme?.colors?.textMedium,
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                      }}
                    >
                      Time Remaining
                    </h4>
                    
                    <DrawCountdown 
                      drawDate={displayDraw.draw_date} 
                      size="large"
                      colorScheme="primary"
                    />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Available Lotteries */}
      <Row className="mb-4">
        <Col>
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}
          >
            <GradientHeading level={2} gradient="secondary">
              Available Lotteries
            </GradientHeading>
            
            <PremiumButton
              variant="outline"
              onClick={() => navigate('/lotteries')}
            >
              View All
            </PremiumButton>
          </div>
          
          {isLoading ? (
            <div 
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '3rem'
              }}
            >
              <Spinner 
                animation="border" 
                style={{ color: theme?.colors?.primary }} 
              />
              <span 
                style={{ 
                  marginLeft: '1rem',
                  color: theme?.colors?.textMedium
                }}
              >
                Loading lotteries...
              </span>
            </div>
          ) : (
            <Row xs={1} md={2} lg={4} className="g-4">
              {(games?.length > 0 ? games : [
                {
                  id: 1,
                  name: 'EuroMillions',
                  description: 'Play Europe\'s biggest lottery game with huge jackpots! Match 5 numbers plus 2 Lucky Stars.',
                  currentJackpot: '€130,000,000',
                  nextDrawDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                  ticketPrice: 2.50,
                  status: 'active'
                },
                {
                  id: 2,
                  name: 'EuroJackpot',
                  description: 'Win life-changing prizes every Tuesday and Friday! Match 5 numbers plus 2 Euro Numbers.',
                  currentJackpot: '€90,000,000',
                  nextDrawDate: new Date(Date.now() + 86400000 * 1).toISOString(),
                  ticketPrice: 2.00,
                  status: 'active'
                },
                {
                  id: 3,
                  name: 'PowerBall',
                  description: 'The American classic with record-breaking jackpots! Match 5 numbers plus the PowerBall.',
                  currentJackpot: '€50,000,000',
                  nextDrawDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                  ticketPrice: 3.00,
                  status: 'active'
                },
                {
                  id: 4,
                  name: 'MegaMillions',
                  description: 'One of America\'s biggest lottery games with enormous jackpots!',
                  currentJackpot: '€70,000,000',
                  nextDrawDate: new Date(Date.now() + 86400000 * 4).toISOString(),
                  ticketPrice: 3.00,
                  status: 'active'
                }
              ]).slice(0, 4).map((lottery, index) => (
                <Col key={lottery.id}>
                  <LotteryCard 
                    lottery={lottery} 
                    compact={true}
                    actionText="Buy Tickets"
                    highlighted={index === 0}
                    animationDelay={0.1 * index}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
      
      {/* Recent Results Section */}
      <Row>
        <Col>
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}
          >
            <GradientHeading level={2} gradient="tertiary">
              Recent Results
            </GradientHeading>
            
            <PremiumButton
              variant="outline"
              onClick={() => navigate('/draws')}
            >
              View All Results
            </PremiumButton>
          </div>
          
          <Card 
            className="fade-in"
            style={{
              backgroundColor: theme?.colors?.card,
              borderRadius: theme?.borderRadius?.lg,
              boxShadow: theme?.shadows?.sm,
              border: `1px solid ${theme?.colors?.border}`
            }}
          >
            <Card.Body 
              style={{ 
                padding: '2rem',
                textAlign: 'center'
              }}
            >
              <p 
                style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.1rem',
                  color: theme?.colors?.textMedium
                }}
              >
                Check out the latest draw results and winning numbers
              </p>
              
              <PremiumButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/draws')}
              >
                View All Results
              </PremiumButton>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;