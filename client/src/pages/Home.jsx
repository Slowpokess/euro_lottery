import React, { useEffect } from 'react';
import HeroSection from '../components/sections/HeroSection';
import ThreeSectionsBlock from '../components/sections/ThreeSectionsBlock';
import RentSection from '../components/sections/RentSection';
import EventsSection from '../components/sections/EventsSection';
import NewsSection from '../components/sections/NewsSection';
import { useNews } from '../contexts/NewsContext';
import { useEvents } from '../contexts/EventsContext';
import './Home.css';

const Home = () => {
  const { fetchNews, setFilters: setNewsFilters } = useNews();
  const { fetchEvents, setFilters: setEventsFilters } = useEvents();
  
  useEffect(() => {
    // Загрузим последние новости для главной страницы
    setNewsFilters({
      status: 'published',
      sort: '-publishDate',
      limit: 3
    });
    fetchNews();
    
    // Начальная загрузка событий происходит в компоненте EventsSection
  }, [fetchNews, fetchEvents, setNewsFilters, setEventsFilters]);

  return (
    <div className="home-page">
      <HeroSection videoSrc="/videos/background-video.mp4" />
      <ThreeSectionsBlock />
      <RentSection bgImage="/images/rent-placeholder.jpg" />
      <EventsSection />
      <NewsSection />
    </div>
  );
};

export default Home;