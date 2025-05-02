import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Button, Card, ProgressBar } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';
import LotteryDrum from './LotteryDrum';
import LotteryNumberBall from '../LotteryNumberBall';
import { FaPlay, FaPause, FaRedo, FaStepForward, FaForward } from 'react-icons/fa';
import './DrawVisualizer.css';

/**
 * Компонент для визуализации процесса розыгрыша лотереи с поддержкой разных режимов
 */
const DrawVisualizer = ({
  lotteryType = 'euromillions', // тип лотереи (определяет правила и барабаны)
  winningNumbers = [], // уже известные выигрышные номера
  extraNumbers = [], // уже известные дополнительные номера
  mode = 'simulation', // режим: simulation (симуляция), live (прямой эфир), replay (воспроизведение)
  autoPlay = false, // автозапуск
  onDrawComplete // коллбэк по завершению розыгрыша
}) => {
  const theme = useTheme();
  const [mainStatus, setMainStatus] = useState('idle');
  const [extraStatus, setExtraStatus] = useState('idle');
  const [mainDrawnNumbers, setMainDrawnNumbers] = useState([]);
  const [extraDrawnNumbers, setExtraDrawnNumbers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [drawSpeed, setDrawSpeed] = useState('normal');
  const [visualizerState, setVisualizerState] = useState('waiting'); // waiting, main-drawing, extra-drawing, completed
  
  // Конфигурация лотерей: правила, количество шаров, и т.д.
  const lotteryConfig = {
    euromillions: {
      name: 'EuroMillions',
      mainBalls: 50,
      mainCount: 5,
      extraBalls: 12,
      extraCount: 2,
      mainType: 'main',
      extraType: 'lucky',
      mainLabel: 'Main Numbers',
      extraLabel: 'Lucky Stars'
    },
    eurojackpot: {
      name: 'EuroJackpot',
      mainBalls: 50,
      mainCount: 5,
      extraBalls: 12,
      extraCount: 2,
      mainType: 'main',
      extraType: 'extra',
      mainLabel: 'Main Numbers',
      extraLabel: 'Euro Numbers'
    },
    powerball: {
      name: 'PowerBall',
      mainBalls: 69,
      mainCount: 5,
      extraBalls: 26,
      extraCount: 1,
      mainType: 'main',
      extraType: 'extra',
      mainLabel: 'White Balls',
      extraLabel: 'PowerBall'
    },
    megamillions: {
      name: 'MegaMillions',
      mainBalls: 70,
      mainCount: 5,
      extraBalls: 25,
      extraCount: 1,
      mainType: 'main',
      extraType: 'lucky',
      mainLabel: 'White Balls',
      extraLabel: 'Mega Ball'
    }
  };
  
  // Получаем конфигурацию для текущей лотереи
  const config = lotteryConfig[lotteryType] || lotteryConfig.euromillions;
  
  // Инициализация розыгрыша: определяем выигрышные номера в зависимости от режима
  useEffect(() => {
    // Сбрасываем состояние при изменении типа лотереи или режима
    setMainStatus('idle');
    setExtraStatus('idle');
    setMainDrawnNumbers([]);
    setExtraDrawnNumbers([]);
    setCurrentStep(0);
    setProgress(0);
    setVisualizerState('waiting');
    
    // В режиме симуляции, если номера не предоставлены, генерируем случайные
    if (mode === 'simulation' && winningNumbers.length === 0) {
      // Генерация случайных чисел без повторений
      const generateRandomNumbers = (min, max, count) => {
        const numbers = [];
        while (numbers.length < count) {
          const num = Math.floor(Math.random() * (max - min + 1)) + min;
          if (!numbers.includes(num)) {
            numbers.push(num);
          }
        }
        return numbers.sort((a, b) => a - b);
      };
      
      // Генерируем основные и дополнительные номера
      const mainNums = generateRandomNumbers(1, config.mainBalls, config.mainCount);
      const extraNums = generateRandomNumbers(1, config.extraBalls, config.extraCount);
      
      // Устанавливаем сгенерированные номера
      setMainDrawnNumbers(mainNums);
      setExtraDrawnNumbers(extraNums);
    } else {
      // Используем предоставленные номера
      setMainDrawnNumbers(winningNumbers.slice(0, config.mainCount));
      setExtraDrawnNumbers(extraNumbers.slice(0, config.extraCount));
    }
  }, [lotteryType, mode, config]);
  
  // Управление процессом розыгрыша
  useEffect(() => {
    if (isPlaying) {
      if (visualizerState === 'waiting') {
        // Начинаем розыгрыш основных номеров
        setVisualizerState('main-drawing');
        setMainStatus('drawing');
      } else if (visualizerState === 'main-complete' && config.extraCount > 0) {
        // После основных номеров переходим к дополнительным
        setVisualizerState('extra-drawing');
        setExtraStatus('drawing');
      }
    } else {
      // Пауза
      if (visualizerState === 'main-drawing') {
        setMainStatus('ready');
      } else if (visualizerState === 'extra-drawing') {
        setExtraStatus('ready');
      }
    }
  }, [isPlaying, visualizerState, config.extraCount]);
  
  // Обработка завершения основного розыгрыша
  const handleMainDrawComplete = (drawnNumbers) => {
    setMainStatus('complete');
    setVisualizerState('main-complete');
    
    // Обновляем прогресс
    const newProgress = (config.extraCount > 0) ? 50 : 100;
    setProgress(newProgress);
    
    // Если у нас нет дополнительных чисел, завершаем процесс
    if (config.extraCount === 0) {
      setVisualizerState('completed');
      if (onDrawComplete) {
        onDrawComplete({
          main: drawnNumbers,
          extra: []
        });
      }
    } else if (isPlaying) {
      // Если автоматический режим, переходим к дополнительным числам
      setVisualizerState('extra-drawing');
      setExtraStatus('drawing');
    }
  };
  
  // Обработка завершения дополнительного розыгрыша
  const handleExtraDrawComplete = (drawnNumbers) => {
    setExtraStatus('complete');
    setVisualizerState('completed');
    setProgress(100);
    
    // Вызываем коллбэк с результатами розыгрыша
    if (onDrawComplete) {
      onDrawComplete({
        main: mainDrawnNumbers,
        extra: drawnNumbers
      });
    }
  };
  
  // Обработчик для кнопки воспроизведения/паузы
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Обработчик для кнопки сброса розыгрыша
  const handleReset = () => {
    setIsPlaying(false);
    setMainStatus('idle');
    setExtraStatus('idle');
    setVisualizerState('waiting');
    setProgress(0);
    
    // Если это симуляция, генерируем новые номера
    if (mode === 'simulation') {
      const generateRandomNumbers = (min, max, count) => {
        const numbers = [];
        while (numbers.length < count) {
          const num = Math.floor(Math.random() * (max - min + 1)) + min;
          if (!numbers.includes(num)) {
            numbers.push(num);
          }
        }
        return numbers.sort((a, b) => a - b);
      };
      
      const mainNums = generateRandomNumbers(1, config.mainBalls, config.mainCount);
      const extraNums = generateRandomNumbers(1, config.extraBalls, config.extraCount);
      
      setMainDrawnNumbers(mainNums);
      setExtraDrawnNumbers(extraNums);
    }
  };
  
  // Обработчик для кнопки пропуска (мгновенное завершение)
  const handleSkip = () => {
    if (visualizerState === 'waiting' || visualizerState === 'main-drawing') {
      setMainStatus('complete');
      setVisualizerState('main-complete');
      setProgress(config.extraCount > 0 ? 50 : 100);
      
      if (config.extraCount > 0) {
        setExtraStatus('drawing');
        setVisualizerState('extra-drawing');
        
        // Небольшая задержка перед завершением дополнительного розыгрыша
        setTimeout(() => {
          setExtraStatus('complete');
          setVisualizerState('completed');
          setProgress(100);
          
          if (onDrawComplete) {
            onDrawComplete({
              main: mainDrawnNumbers,
              extra: extraDrawnNumbers
            });
          }
        }, 500);
      } else {
        setVisualizerState('completed');
        
        if (onDrawComplete) {
          onDrawComplete({
            main: mainDrawnNumbers,
            extra: []
          });
        }
      }
    } else if (visualizerState === 'main-complete' || visualizerState === 'extra-drawing') {
      setExtraStatus('complete');
      setVisualizerState('completed');
      setProgress(100);
      
      if (onDrawComplete) {
        onDrawComplete({
          main: mainDrawnNumbers,
          extra: extraDrawnNumbers
        });
      }
    }
  };
  
  // Обработчик изменения скорости
  const handleSpeedChange = () => {
    const speeds = ['slow', 'normal', 'fast', 'instant'];
    const currentIndex = speeds.indexOf(drawSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setDrawSpeed(speeds[nextIndex]);
  };
  
  // Получаем метку скорости для отображения
  const getSpeedLabel = () => {
    switch (drawSpeed) {
      case 'slow': return '0.5x';
      case 'normal': return '1x';
      case 'fast': return '2x';
      case 'instant': return '10x';
      default: return '1x';
    }
  };
  
  return (
    <div className="draw-visualizer">
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="m-0">{config.name} Draw</h3>
            <span>{mode === 'live' ? 'LIVE' : mode === 'replay' ? 'REPLAY' : 'SIMULATION'}</span>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Прогресс розыгрыша */}
          <ProgressBar 
            now={progress} 
            variant="success" 
            className="mb-4" 
            style={{ height: '8px' }}
          />
          
          <Row>
            {/* Барабан с основными номерами */}
            <Col lg={6} className="mb-4">
              <Card className="h-100">
                <Card.Header className="text-center" style={{ backgroundColor: theme?.colors?.primary, color: 'white' }}>
                  <h4 className="m-0">{config.mainLabel}</h4>
                </Card.Header>
                <Card.Body className="text-center">
                  <LotteryDrum 
                    ballCount={config.mainBalls}
                    selectedNumbers={mainDrawnNumbers}
                    type={config.mainType}
                    status={mainStatus}
                    onDrawComplete={handleMainDrawComplete}
                    drawSpeed={drawSpeed}
                    size="medium"
                    showSelectedOnly={mode === 'replay'}
                  />
                </Card.Body>
              </Card>
            </Col>
            
            {/* Барабан с дополнительными номерами */}
            {config.extraCount > 0 && (
              <Col lg={6} className="mb-4">
                <Card className="h-100">
                  <Card.Header className="text-center" style={{ backgroundColor: config.extraType === 'lucky' ? '#FFBD00' : '#FF4E50', color: config.extraType === 'lucky' ? '#1A1C29' : 'white' }}>
                    <h4 className="m-0">{config.extraLabel}</h4>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <LotteryDrum 
                      ballCount={config.extraBalls}
                      selectedNumbers={extraDrawnNumbers}
                      type={config.extraType}
                      status={extraStatus}
                      onDrawComplete={handleExtraDrawComplete}
                      drawSpeed={drawSpeed}
                      size="medium"
                      showSelectedOnly={mode === 'replay'}
                    />
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
          
          {/* Контроллеры розыгрыша */}
          <div className="draw-controls">
            <Button 
              variant={isPlaying ? 'outline-warning' : 'outline-success'} 
              className="me-2" 
              onClick={handlePlayPause}
              disabled={visualizerState === 'completed'}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
              <span className="ms-2">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            
            <Button 
              variant="outline-secondary" 
              className="me-2" 
              onClick={handleReset}
            >
              <FaRedo />
              <span className="ms-2">Reset</span>
            </Button>
            
            <Button 
              variant="outline-info" 
              className="me-2" 
              onClick={handleSkip}
              disabled={visualizerState === 'completed'}
            >
              <FaStepForward />
              <span className="ms-2">Skip</span>
            </Button>
            
            <Button 
              variant="outline-primary" 
              onClick={handleSpeedChange}
              disabled={visualizerState === 'completed'}
            >
              <FaForward />
              <span className="ms-2">Speed: {getSpeedLabel()}</span>
            </Button>
          </div>
          
          {/* Результаты розыгрыша */}
          {visualizerState === 'completed' && (
            <div className="draw-results mt-4">
              <h4 className="text-center mb-3">Winning Numbers</h4>
              
              <Row className="justify-content-center">
                <Col md={8}>
                  <Card>
                    <Card.Body className="text-center">
                      <div className="mb-3">
                        <h5>{config.mainLabel}</h5>
                        <div className="d-flex justify-content-center flex-wrap gap-2">
                          {mainDrawnNumbers.map(num => (
                            <LotteryNumberBall 
                              key={`main-${num}`}
                              number={num}
                              type={config.mainType}
                              size="large"
                              status="winning"
                              pulse={true}
                              animated={true}
                              animationDelay={mainDrawnNumbers.indexOf(num) * 0.1}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {config.extraCount > 0 && (
                        <div>
                          <h5>{config.extraLabel}</h5>
                          <div className="d-flex justify-content-center flex-wrap gap-2">
                            {extraDrawnNumbers.map(num => (
                              <LotteryNumberBall 
                                key={`extra-${num}`}
                                number={num}
                                type={config.extraType}
                                size="large"
                                status="winning"
                                pulse={true}
                                animated={true}
                                animationDelay={extraDrawnNumbers.indexOf(num) * 0.1 + mainDrawnNumbers.length * 0.1}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

DrawVisualizer.propTypes = {
  lotteryType: PropTypes.oneOf(['euromillions', 'eurojackpot', 'powerball', 'megamillions']),
  winningNumbers: PropTypes.arrayOf(PropTypes.number),
  extraNumbers: PropTypes.arrayOf(PropTypes.number),
  mode: PropTypes.oneOf(['simulation', 'live', 'replay']),
  autoPlay: PropTypes.bool,
  onDrawComplete: PropTypes.func
};

export default DrawVisualizer;