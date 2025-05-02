import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext';
import './LotteryDrum.css';

/**
 * Компонент для отображения лотерейного барабана с шарами
 */
const LotteryDrum = ({
  ballCount = 49,
  selectedNumbers = [],
  type = 'main',
  status = 'idle',
  onDrawComplete,
  drawSpeed = 'normal',
  size = 'medium',
  showSelectedOnly = false
}) => {
  const theme = useTheme();
  const drumRef = useRef(null);
  const [balls, setBalls] = useState([]);
  const [activeBall, setActiveBall] = useState(null);
  const [drawnBalls, setDrawnBalls] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drummingSound] = useState(() => new Audio('/sounds/drum-rolling.mp3'));
  const [popSound] = useState(() => new Audio('/sounds/ball-pop.mp3'));
  
  // Определяем скорость анимации в миллисекундах
  const speedMap = {
    slow: 3000,
    normal: 1500,
    fast: 750,
    instant: 100
  };
  
  // Определяем размеры барабана
  const sizeMap = {
    small: { width: 200, height: 200, ballSize: 20 },
    medium: { width: 320, height: 320, ballSize: 32 },
    large: { width: 400, height: 400, ballSize: 40 },
  };
  
  const { width, height, ballSize } = sizeMap[size];
  
  // Цвета для шаров в зависимости от типа
  const getColors = () => {
    const colors = {
      main: {
        bg: theme?.colors?.primary || '#4A3AFF',
        text: '#FFFFFF'
      },
      extra: {
        bg: theme?.colors?.secondary || '#FF4E50',
        text: '#FFFFFF'
      },
      lucky: {
        bg: theme?.colors?.tertiary || '#FFBD00',
        text: '#1A1C29'
      }
    };
    
    return colors[type] || colors.main;
  };
  
  // Инициализация шаров
  useEffect(() => {
    if (status === 'idle' || status === 'ready') {
      // Создаем массив шаров
      const newBalls = [];
      for (let i = 1; i <= ballCount; i++) {
        // Определяем, выбран ли этот шар
        const isSelected = selectedNumbers.includes(i);
        
        // Если нужно показывать только выбранные шары и этот шар не выбран, пропускаем
        if (showSelectedOnly && !isSelected) {
          continue;
        }
        
        newBalls.push({
          id: i,
          number: i,
          isSelected,
          drawn: false,
          x: Math.random() * (width - ballSize - 10) + 5,
          y: Math.random() * (height - ballSize - 10) + 5,
          velocityX: (Math.random() - 0.5) * 2,
          velocityY: (Math.random() - 0.5) * 2,
          opacity: 1
        });
      }
      
      setBalls(newBalls);
      setDrawnBalls([]);
    }
  }, [ballCount, selectedNumbers, status, showSelectedOnly, width, height, ballSize]);
  
  // Анимация движения шаров
  useEffect(() => {
    if ((status === 'idle' || status === 'drawing') && balls.length > 0) {
      let animationId;
      let lastTime = 0;
      
      const animate = (timestamp) => {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        setBalls(currentBalls => {
          const updatedBalls = currentBalls.map(ball => {
            // Если шар уже вытянут, не двигаем его
            if (ball.drawn) return ball;
            
            let newX = ball.x + ball.velocityX;
            let newY = ball.y + ball.velocityY;
            let newVelocityX = ball.velocityX;
            let newVelocityY = ball.velocityY;
            
            // Обработка столкновений со стенками
            if (newX <= 0 || newX >= width - ballSize) {
              newVelocityX = -newVelocityX;
              newX = Math.max(0, Math.min(newX, width - ballSize));
            }
            
            if (newY <= 0 || newY >= height - ballSize) {
              newVelocityY = -newVelocityY;
              newY = Math.max(0, Math.min(newY, height - ballSize));
            }
            
            return {
              ...ball,
              x: newX,
              y: newY,
              velocityX: newVelocityX,
              velocityY: newVelocityY
            };
          });
          
          return updatedBalls;
        });
        
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      
      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }, [status, balls.length, width, height, ballSize]);
  
  // Процесс розыгрыша
  useEffect(() => {
    let drawTimer;
    
    const drawNextBall = (remainingNumbers, index = 0) => {
      if (index >= remainingNumbers.length) {
        setIsDrawing(false);
        if (onDrawComplete) {
          onDrawComplete(drawnBalls.concat(remainingNumbers));
        }
        return;
      }
      
      const nextNumber = remainingNumbers[index];
      setActiveBall(nextNumber);
      
      // Воспроизведение звука "вытягивания" шара
      try {
        popSound.currentTime = 0;
        popSound.play().catch(e => console.log('Failed to play sound:', e));
      } catch (e) {
        console.log('Failed to play sound:', e);
      }
      
      // Обновляем состояние шаров
      setBalls(currentBalls => 
        currentBalls.map(ball => 
          ball.number === nextNumber 
            ? { ...ball, drawn: true, opacity: 0 } 
            : ball
        )
      );
      
      // Добавляем вытянутый шар в список
      setTimeout(() => {
        setDrawnBalls(current => [...current, nextNumber]);
        
        // Переходим к следующему шару с задержкой
        drawTimer = setTimeout(() => {
          drawNextBall(remainingNumbers, index + 1);
        }, speedMap[drawSpeed]);
        
      }, 500);
    };
    
    if (status === 'drawing' && !isDrawing && selectedNumbers.length > 0) {
      setIsDrawing(true);
      
      // Начинаем воспроизведение звука барабана
      try {
        drummingSound.currentTime = 0;
        drummingSound.loop = true;
        drummingSound.play().catch(e => console.log('Failed to play sound:', e));
      } catch (e) {
        console.log('Failed to play sound:', e);
      }
      
      // Запускаем процесс розыгрыша с задержкой
      drawTimer = setTimeout(() => {
        drawNextBall([...selectedNumbers]);
      }, 2000);
    }
    
    return () => {
      clearTimeout(drawTimer);
      try {
        drummingSound.pause();
        popSound.pause();
      } catch (e) {
        console.log('Failed to pause sound:', e);
      }
    };
  }, [status, isDrawing, selectedNumbers, drawnBalls, drawSpeed, drummingSound, popSound, onDrawComplete]);
  
  // Получаем цвета в зависимости от типа
  const colors = getColors();
  
  return (
    <div className="lottery-drum-container">
      {/* Барабан */}
      <div 
        ref={drumRef}
        className={`lottery-drum ${status} ${size}`}
        style={{
          width: width,
          height: height,
          borderRadius: width / 2,
          backgroundColor: theme?.name === 'dark' ? '#1E1E2F' : '#F8F9FC',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          position: 'relative',
          border: `5px solid ${theme?.colors?.border || '#e5e5e5'}`,
          borderTopColor: theme?.colors?.border || '#e5e5e5',
          borderLeftColor: theme?.colors?.border || '#e5e5e5',
          borderBottomColor: theme?.colors?.borderDark || '#d0d0d0',
          borderRightColor: theme?.colors?.borderDark || '#d0d0d0',
        }}
      >
        {/* Шары внутри барабана */}
        {balls.map(ball => (
          <div
            key={ball.id}
            className={`lottery-ball ${ball.drawn ? 'drawn' : ''} ${ball.isSelected ? 'selected' : ''}`}
            style={{
              width: ballSize,
              height: ballSize,
              borderRadius: ballSize / 2,
              backgroundColor: ball.isSelected ? colors.bg : theme?.name === 'dark' ? '#3E3E5B' : '#e0e0e0',
              color: ball.isSelected ? colors.text : theme?.colors?.text,
              position: 'absolute',
              left: ball.x,
              top: ball.y,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: ballSize * 0.4,
              opacity: ball.opacity,
              transition: 'opacity 0.3s',
              boxShadow: ball.isSelected ? `0 2px 8px rgba(0,0,0,0.2)` : 'none',
            }}
          >
            {ball.number}
          </div>
        ))}
        
        {/* Стекло барабана - блик */}
        <div 
          className="lottery-drum-glass" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: width / 2,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      
      {/* Результаты розыгрыша */}
      <div 
        className="drawn-balls-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 20,
          gap: 10,
          flexWrap: 'wrap',
          minHeight: ballSize + 10,
        }}
      >
        {drawnBalls.map((number, index) => (
          <div
            key={`drawn-${number}`}
            className="drawn-ball pop-in"
            style={{
              width: ballSize,
              height: ballSize,
              borderRadius: ballSize / 2,
              backgroundColor: colors.bg,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: ballSize * 0.4,
              boxShadow: `0 4px 10px rgba(0,0,0,0.2)`,
              animation: `popIn 0.5s ${index * 0.1}s forwards`,
              opacity: 0,
              transform: 'scale(0)',
            }}
          >
            {number}
          </div>
        ))}
      </div>
      
      {/* Статус розыгрыша */}
      {status === 'drawing' && (
        <div 
          className="drawing-status"
          style={{
            textAlign: 'center',
            marginTop: 15,
            fontSize: '0.9rem',
            color: theme?.colors?.primary,
            fontWeight: 'bold',
          }}
        >
          {isDrawing ? 'Drawing balls...' : 'Preparing drum...'}
        </div>
      )}
      
      {status === 'complete' && (
        <div 
          className="drawing-complete"
          style={{
            textAlign: 'center',
            marginTop: 15,
            fontSize: '1.1rem',
            color: theme?.colors?.success,
            fontWeight: 'bold',
          }}
        >
          Draw Complete!
        </div>
      )}
    </div>
  );
};

LotteryDrum.propTypes = {
  ballCount: PropTypes.number,
  selectedNumbers: PropTypes.arrayOf(PropTypes.number),
  type: PropTypes.oneOf(['main', 'extra', 'lucky']),
  status: PropTypes.oneOf(['idle', 'ready', 'drawing', 'complete']),
  onDrawComplete: PropTypes.func,
  drawSpeed: PropTypes.oneOf(['slow', 'normal', 'fast', 'instant']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showSelectedOnly: PropTypes.bool
};

export default LotteryDrum;