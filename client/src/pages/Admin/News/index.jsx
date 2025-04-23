import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NewsList from './NewsList';
import NewsForm from './NewsForm';
import './News.css';

const News = () => {
  return (
    <Routes>
      <Route path="/" element={<NewsList />} />
      <Route path="/create" element={<NewsForm />} />
      <Route path="/edit/:id" element={<NewsForm />} />
      <Route path="*" element={<Navigate to="/admin/news" replace />} />
    </Routes>
  );
};

export default News;