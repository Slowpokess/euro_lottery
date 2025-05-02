import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';
import LotteryNumberBall from '../LotteryNumberBall';
import { FaTrophy, FaCheck, FaTimes, FaTicketAlt } from 'react-icons/fa';
import './LotteryTicketVisualizer.css';

/**
 * Компонент для визуализации лотерейного билета с подсветкой выигрышных номеров
 */
const LotteryTicketVisualizer = ({
  ticket, // Данные билета
  winningNumbers = [], // Выигрышные основные номера
  winningExtraNumbers = [], // Выигрышные дополнительные номера
  lotteryType = 'euromillions', // Тип лотереи
  showAnimation = true, // Показывать анимацию для выигрышных номеров
  highlightMode = 'auto', // Режим подсветки: auto, all, none
  showDetails = true // Показывать детали выигрыша
}) => {
  const theme = useTheme();
  const [isRevealing, setIsRevealing] = useState(showAnimation);
  const [revealedNumbers, setRevealedNumbers] = useState([]);
  const [ticketStatus, setTicketStatus] = useState('checking'); // checking, winning, losing
  const [matchInfo, setMatchInfo] = useState({
    mainMatches: 0,
    extraMatches: 0,
    prize: 0,
    prizeCategory: null
  });
  
  // Конфигурация лотерей
  const lotteryConfig = {
    euromillions: {
      name: 'EuroMillions',
      mainLabel: 'Numbers',
      extraLabel: 'Lucky Stars',
      mainType: 'main',
      extraType: 'lucky',
      currencySymbol: '€'
    },
    eurojackpot: {
      name: 'EuroJackpot',
      mainLabel: 'Numbers',
      extraLabel: 'Euro Numbers',
      mainType: 'main',
      extraType: 'extra',
      currencySymbol: '€'
    },
    powerball: {
      name: 'PowerBall',
      mainLabel: 'White Balls',
      extraLabel: 'PowerBall',
      mainType: 'main',
      extraType: 'extra',
      currencySymbol: '$'
    },
    megamillions: {
      name: 'MegaMillions',
      mainLabel: 'White Balls',
      extraLabel: 'Mega Ball',
      mainType: 'main',
      extraType: 'lucky',
      currencySymbol: '$'
    }
  };
  
  // Получаем конфигурацию для текущей лотереи
  const config = lotteryConfig[lotteryType] || lotteryConfig.euromillions;
  
  // Проверка совпадений и вычисление выигрыша
  useEffect(() => {
    if (ticket && winningNumbers.length > 0) {
      // Расчет соответствий для основных номеров
      const mainMatches = ticket.numbers.filter(num => winningNumbers.includes(num)).length;
      
      // Расчет соответствий для дополнительных номеров
      const extraMatches = ticket.extraNumbers 
        ? ticket.extraNumbers.filter(num => winningExtraNumbers.includes(num)).length 
        : 0;
      
      // Определяем категорию приза и сумму выигрыша
      let prizeAmount = 0;
      let prizeCategory = null;
      
      // Правила начисления выигрыша на основе типа лотереи
      // Это симуляция - в реальности эти данные должны приходить с сервера
      if (lotteryType === 'euromillions') {
        if (mainMatches === 5 && extraMatches === 2) {
          prizeCategory = 1;
          prizeAmount = ticket.jackpotAmount || 50000000;
        } else if (mainMatches === 5 && extraMatches === 1) {
          prizeCategory = 2;
          prizeAmount = 500000;
        } else if (mainMatches === 5) {
          prizeCategory = 3;
          prizeAmount = 50000;
        } else if (mainMatches === 4 && extraMatches === 2) {
          prizeCategory = 4;
          prizeAmount = 2500;
        } else if (mainMatches === 4 && extraMatches === 1) {
          prizeCategory = 5;
          prizeAmount = 150;
        } else if (mainMatches === 3 && extraMatches === 2) {
          prizeCategory = 6;
          prizeAmount = 80;
        } else if (mainMatches === 4) {
          prizeCategory = 7;
          prizeAmount = 60;
        } else if (mainMatches === 2 && extraMatches === 2) {
          prizeCategory = 8;
          prizeAmount = 20;
        } else if (mainMatches === 3 && extraMatches === 1) {
          prizeCategory = 9;
          prizeAmount = 15;
        } else if (mainMatches === 3) {
          prizeCategory = 10;
          prizeAmount = 12;
        } else if (mainMatches === 1 && extraMatches === 2) {
          prizeCategory = 11;
          prizeAmount = 10;
        } else if (mainMatches === 2 && extraMatches === 1) {
          prizeCategory = 12;
          prizeAmount = 8;
        } else if (mainMatches === 2) {
          prizeCategory = 13;
          prizeAmount = 4;
        }
      } else if (lotteryType === 'eurojackpot') {
        // Правила для EuroJackpot
        if (mainMatches === 5 && extraMatches === 2) {
          prizeCategory = 1;
          prizeAmount = ticket.jackpotAmount || 30000000;
        } else if (mainMatches === 5 && extraMatches === 1) {
          prizeCategory = 2;
          prizeAmount = 300000;
        } else if (mainMatches === 5) {
          prizeCategory = 3;
          prizeAmount = 100000;
        } else if (mainMatches === 4 && extraMatches === 2) {
          prizeCategory = 4;
          prizeAmount = 3000;
        } else if (mainMatches === 4 && extraMatches === 1) {
          prizeCategory = 5;
          prizeAmount = 200;
        } else if (mainMatches === 4) {
          prizeCategory = 6;
          prizeAmount = 90;
        } else if (mainMatches === 3 && extraMatches === 2) {
          prizeCategory = 7;
          prizeAmount = 50;
        } else if (mainMatches === 2 && extraMatches === 2) {
          prizeCategory = 8;
          prizeAmount = 20;
        } else if (mainMatches === 3 && extraMatches === 1) {
          prizeCategory = 9;
          prizeAmount = 15;
        } else if (mainMatches === 3) {
          prizeCategory = 10;
          prizeAmount = 12;
        } else if (mainMatches === 1 && extraMatches === 2) {
          prizeCategory = 11;
          prizeAmount = 10;
        } else if (mainMatches === 2 && extraMatches === 1) {
          prizeCategory = 12;
          prizeAmount = 8;
        }
      }
      
      // Обновляем информацию о совпадениях
      setMatchInfo({
        mainMatches,
        extraMatches,
        prize: prizeAmount,
        prizeCategory
      });
      
      // Устанавливаем статус билета
      setTicketStatus(prizeAmount > 0 ? 'winning' : 'losing');
      
      // Если нужно показывать анимацию, запускаем раскрытие номеров
      if (showAnimation) {
        setIsRevealing(true);
        setRevealedNumbers([]);
        
        // Интервал для постепенного раскрытия номеров
        const revealInterval = setInterval(() => {
          setRevealedNumbers(prev => {
            const allNumbers = [...ticket.numbers, ...(ticket.extraNumbers || [])];
            
            if (prev.length < allNumbers.length) {
              return [...prev, allNumbers[prev.length]];
            } else {
              clearInterval(revealInterval);
              setIsRevealing(false);
              return prev;
            }
          });
        }, 300);
        
        return () => clearInterval(revealInterval);
      } else {
        setIsRevealing(false);
        setRevealedNumbers([...ticket.numbers, ...(ticket.extraNumbers || [])]);
      }
    }
  }, [ticket, winningNumbers, winningExtraNumbers, lotteryType, showAnimation]);
  
  // Определяем, нужно ли подсвечивать номер
  const shouldHighlight = (number, isExtra = false) => {
    if (highlightMode === 'none') return false;
    if (highlightMode === 'all') return true;
    
    // Авто-режим: подсветка в зависимости от статуса
    return isExtra 
      ? winningExtraNumbers.includes(number) 
      : winningNumbers.includes(number);
  };
  
  // Определяем статус номера (matched, missed)
  const getNumberStatus = (number, isExtra = false) => {
    if (!revealedNumbers.includes(number)) return 'default';
    
    const isMatch = isExtra
      ? winningExtraNumbers.includes(number)
      : winningNumbers.includes(number);
    
    return isMatch ? 'matched' : 'missed';
  };
  
  // Если билет не предоставлен, отображаем сообщение
  if (!ticket) {
    return (
      <Card className="text-center p-4">
        <Card.Body>
          <FaTicketAlt size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h4>Ticket not available</h4>
          <p>Please select a valid lottery ticket to view.</p>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <div className="lottery-ticket-visualizer">
      <Card 
        className={`lottery-ticket ${ticketStatus}`}
        style={{
          borderColor: ticketStatus === 'winning' 
            ? theme?.colors?.success 
            : (ticketStatus === 'losing' ? theme?.colors?.border : theme?.colors?.primary),
          backgroundColor: theme?.colors?.card,
          borderWidth: ticketStatus === 'winning' ? '2px' : '1px',
          boxShadow: ticketStatus === 'winning' 
            ? '0 0 15px rgba(0, 200, 83, 0.3)' 
            : theme?.shadows?.sm
        }}
      >
        <Card.Header 
          style={{
            backgroundColor: ticketStatus === 'winning' 
              ? theme?.colors?.successLight 
              : (ticketStatus === 'losing' ? theme?.colors?.backgroundLight : theme?.colors?.primaryLight),
            color: ticketStatus === 'winning' 
              ? theme?.colors?.success 
              : (ticketStatus === 'losing' ? theme?.colors?.text : theme?.colors?.primary),
            borderBottom: `1px solid ${ticketStatus === 'winning' 
              ? theme?.colors?.success 
              : (ticketStatus === 'losing' ? theme?.colors?.border : theme?.colors?.primary)}`
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="m-0 d-flex align-items-center">
              <FaTicketAlt className="me-2" /> 
              {config.name} Ticket {ticket.id && `#${ticket.id}`}
            </h5>
            
            {ticketStatus === 'winning' && (
              <Badge 
                bg="success"
                className="winning-badge"
              >
                <FaTrophy className="me-1" /> Winner!
              </Badge>
            )}
            
            {ticketStatus === 'losing' && !isRevealing && (
              <Badge 
                bg="secondary"
                className="lose-badge"
              >
                <FaTimes className="me-1" /> No Win
              </Badge>
            )}
            
            {ticketStatus === 'checking' && (
              <Badge 
                bg="primary"
                className="checking-badge"
              >
                <div className="spinner-border spinner-border-sm me-1" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Checking...
              </Badge>
            )}
          </div>
        </Card.Header>
        
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <div className="ticket-numbers">
                <h6 className="mb-3">{config.mainLabel}</h6>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {ticket.numbers.map((number, index) => (
                    <LotteryNumberBall
                      key={`main-${index}-${number}`}
                      number={number}
                      type={config.mainType}
                      size="medium"
                      status={getNumberStatus(number)}
                      matched={shouldHighlight(number)}
                      pulse={shouldHighlight(number) && !isRevealing}
                      animated={revealedNumbers.includes(number)}
                      animationDelay={revealedNumbers.indexOf(number) * 0.1}
                    />
                  ))}
                </div>
              </div>
            </Col>
            
            {ticket.extraNumbers && ticket.extraNumbers.length > 0 && (
              <Col md={6}>
                <div className="ticket-extra-numbers">
                  <h6 className="mb-3">{config.extraLabel}</h6>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {ticket.extraNumbers.map((number, index) => (
                      <LotteryNumberBall
                        key={`extra-${index}-${number}`}
                        number={number}
                        type={config.extraType}
                        size="medium"
                        status={getNumberStatus(number, true)}
                        matched={shouldHighlight(number, true)}
                        pulse={shouldHighlight(number, true) && !isRevealing}
                        animated={revealedNumbers.includes(number)}
                        animationDelay={revealedNumbers.indexOf(number) * 0.1}
                      />
                    ))}
                  </div>
                </div>
              </Col>
            )}
          </Row>
          
          {showDetails && !isRevealing && (
            <div className="ticket-details mt-4">
              <Row className="text-center">
                <Col xs={6} md={3} className="mb-2">
                  <div className="detail-item">
                    <div className="detail-label">Draw Date</div>
                    <div className="detail-value">
                      {ticket.drawDate 
                        ? new Date(ticket.drawDate).toLocaleDateString() 
                        : 'N/A'}
                    </div>
                  </div>
                </Col>
                
                <Col xs={6} md={3} className="mb-2">
                  <div className="detail-item">
                    <div className="detail-label">Ticket Price</div>
                    <div className="detail-value">
                      {ticket.ticketPrice 
                        ? `${config.currencySymbol}${ticket.ticketPrice.toFixed(2)}` 
                        : 'N/A'}
                    </div>
                  </div>
                </Col>
                
                <Col xs={6} md={3} className="mb-2">
                  <div className="detail-item">
                    <div className="detail-label">Matched Numbers</div>
                    <div className="detail-value">
                      {matchInfo.mainMatches} + {matchInfo.extraMatches}
                    </div>
                  </div>
                </Col>
                
                <Col xs={6} md={3} className="mb-2">
                  <div className="detail-item">
                    <div className="detail-label">Prize Category</div>
                    <div className="detail-value">
                      {matchInfo.prizeCategory 
                        ? `Tier ${matchInfo.prizeCategory}` 
                        : 'None'}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
        
        {/* Футер с итоговой информацией о выигрыше */}
        {ticketStatus !== 'checking' && !isRevealing && (
          <Card.Footer 
            style={{
              backgroundColor: ticketStatus === 'winning' 
                ? theme?.colors?.successLight 
                : theme?.colors?.backgroundLight,
              borderTop: `1px solid ${ticketStatus === 'winning' 
                ? theme?.colors?.success 
                : theme?.colors?.border}`
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Prize:</strong>
              </div>
              
              <div className={`prize-amount ${ticketStatus}`}>
                {ticketStatus === 'winning' ? (
                  <span className="winning-amount">
                    {config.currencySymbol}{matchInfo.prize.toLocaleString()}
                  </span>
                ) : (
                  <span>No prize</span>
                )}
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
};

LotteryTicketVisualizer.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    numbers: PropTypes.arrayOf(PropTypes.number).isRequired,
    extraNumbers: PropTypes.arrayOf(PropTypes.number),
    drawDate: PropTypes.string,
    ticketPrice: PropTypes.number,
    status: PropTypes.string,
    jackpotAmount: PropTypes.number
  }),
  winningNumbers: PropTypes.arrayOf(PropTypes.number),
  winningExtraNumbers: PropTypes.arrayOf(PropTypes.number),
  lotteryType: PropTypes.oneOf(['euromillions', 'eurojackpot', 'powerball', 'megamillions']),
  showAnimation: PropTypes.bool,
  highlightMode: PropTypes.oneOf(['auto', 'all', 'none']),
  showDetails: PropTypes.bool
};

export default LotteryTicketVisualizer;