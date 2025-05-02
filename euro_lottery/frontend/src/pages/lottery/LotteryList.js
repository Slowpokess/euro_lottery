import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import LotteryCard from '../../components/LotteryCard';
import useApi from '../../hooks/useApi';
import apiService from '../../services/api';
import { LoadingPlaceholder, useLoading } from '../../components/LoadingOverlay';
import { FaSync, FaWifiSlash } from 'react-icons/fa';

const LotteryList = () => {
  const theme = useTheme();
  const { isOnline } = useSelector(state => state.network);
  const [lotteries, setLotteries] = useState([]);
  const [dataSource, setDataSource] = useState('network'); // 'network', 'cache', 'mock'
  
  // Доступ к API и индикаторам загрузки
  const { loading, error, execute } = useApi();
  const { startLoading, stopLoading } = useLoading();
  
  // ID для индикатора загрузки
  const loadingId = 'lotteries-loading';
  
  // Mock lottery data - for development only
  const mockLotteries = [
    {
      id: 1,
      name: 'EuroMillions',
      description: 'Play Europe\'s biggest lottery game with huge jackpots! Match 5 numbers plus 2 Lucky Stars to win the top prize.',
      currentJackpot: '€130,000,000',
      nextDrawDate: '2025-04-26T20:00:00',
      ticketPrice: 2.50,
      status: 'active'
    },
    {
      id: 2,
      name: 'EuroJackpot',
      description: 'Win life-changing prizes every Tuesday and Friday! Match 5 numbers plus 2 Euro Numbers to win the jackpot.',
      currentJackpot: '€90,000,000',
      nextDrawDate: '2025-04-25T20:00:00',
      ticketPrice: 2.00,
      status: 'active'
    },
    {
      id: 3,
      name: 'PowerBall',
      description: 'The American classic with record-breaking jackpots! Match 5 numbers plus the PowerBall to win millions.',
      currentJackpot: '€50,000,000',
      nextDrawDate: '2025-04-27T22:00:00',
      ticketPrice: 3.00,
      status: 'active'
    },
    {
      id: 4,
      name: 'MegaMillions',
      description: 'One of America\'s biggest lottery games with enormous jackpots. Match 5 numbers plus the Mega Ball to win big!',
      currentJackpot: '€70,000,000',
      nextDrawDate: '2025-04-28T22:00:00',
      ticketPrice: 3.00,
      status: 'active'
    }
  ];

  // Загрузка списка лотерей
  const fetchLotteries = async (forceRefresh = false) => {
    // Запускаем глобальный индикатор загрузки для UI
    startLoading(loadingId, { 
      text: 'Загрузка лотерей...',
      global: false,
      minimal: true
    });
    
    // Выполняем запрос с использованием нашего API сервиса
    try {
      const result = await execute(
        () => apiService.lottery.getLotteries({}, { forceRefresh }),
        {
          onSuccess: (data, meta) => {
            // Устанавливаем источник данных
            if (meta.fromCache) {
              setDataSource(meta.offline ? 'cache-offline' : 'cache');
            } else {
              setDataSource('network');
            }
          },
          useOfflineFallback: true, // Использовать кэш при отсутствии соединения
          retryCount: 1 // Одна дополнительная попытка при ошибке
        }
      );
      
      if (result && Array.isArray(result)) {
        setLotteries(result);
      } else {
        // Если ответ не содержит массив, используем тестовые данные
        setLotteries(mockLotteries);
        setDataSource('mock');
      }
    } catch (error) {
      console.error('Error fetching lotteries:', error);
      
      // В случае ошибки используем тестовые данные
      setLotteries(mockLotteries);
      setDataSource('mock');
    } finally {
      // Останавливаем индикатор загрузки
      stopLoading(loadingId);
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchLotteries();
    
    // Очистка индикатора загрузки при размонтировании
    return () => stopLoading(loadingId);
  }, []);

  // Обработчик для принудительного обновления данных
  const handleRefresh = () => {
    fetchLotteries(true); // Принудительное обновление из сети
  };
  
  // Определяем сообщение о источнике данных
  const getDataSourceMessage = () => {
    switch (dataSource) {
      case 'network':
        return 'Данные загружены с сервера';
      case 'cache':
        return 'Данные загружены из кэша';
      case 'cache-offline':
        return 'Данные загружены из кэша (оффлайн-режим)';
      case 'mock':
        return 'Используются тестовые данные';
      default:
        return '';
    }
  };
  
  // Отображаем ошибку, если она есть
  if (error && !loading && lotteries.length === 0) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Ошибка загрузки лотерей</Alert.Heading>
          <p>{error.message || 'Произошла непредвиденная ошибка. Пожалуйста, повторите попытку позже.'}</p>
          
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger" 
              onClick={handleRefresh}
              disabled={!isOnline}
            >
              <FaSync className="me-2" />
              Повторить
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container 
      className="py-4" 
      style={{ 
        animation: 'fadeIn 0.5s ease-in-out',
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ color: theme?.colors?.primary }}>
          Доступные лотереи
        </h1>
        
        <div className="d-flex align-items-center">
          {/* Индикатор источника данных */}
          {dataSource !== 'network' && (
            <span 
              className="me-3"
              style={{ 
                fontSize: '0.8rem', 
                color: theme?.colors?.textLight,
                backgroundColor: theme?.name === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {dataSource === 'cache-offline' && <FaWifiSlash className="me-1" size={10} />}
              {getDataSourceMessage()}
            </span>
          )}
          
          {/* Кнопка обновления */}
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={handleRefresh}
            disabled={!isOnline || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem'
            }}
          >
            <FaSync 
              className={loading ? 'rotating' : ''} 
              style={{ marginRight: '0.35rem' }} 
            />
            Обновить
          </Button>
        </div>
      </div>
      
      {/* Placeholder при загрузке */}
      {loading && lotteries.length === 0 ? (
        <LoadingPlaceholder 
          height="300px" 
          text="Загрузка лотерей..." 
          isLoading={true} 
        />
      ) : (
        <>
          {/* Сообщение если нет лотерей */}
          {lotteries.length === 0 ? (
            <Alert variant="info">
              В настоящее время нет доступных лотерей. Пожалуйста, проверьте позже.
            </Alert>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {lotteries.map(lottery => (
                <Col key={lottery.id}>
                  <LotteryCard 
                    lottery={lottery} 
                    actionText="Подробнее"
                  />
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
      
      {/* Показываем индикатор загрузки внизу списка при обновлении уже загруженных данных */}
      {loading && lotteries.length > 0 && (
        <div 
          className="text-center my-4 py-3"
          style={{
            backgroundColor: theme?.name === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '0.5rem'
          }}
        >
          <FaSync className="rotating" style={{ color: theme?.colors?.primary }} />
          <p className="mb-0 mt-2" style={{ fontSize: '0.85rem', color: theme?.colors?.textMedium }}>
            Обновление данных...
          </p>
        </div>
      )}
    </Container>
  );
};

export default LotteryList;