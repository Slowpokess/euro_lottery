import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RentRequestsList from './RentRequestsList';
import './RentRequests.css';

const RentRequests = () => {
  return (
    <Routes>
      <Route path="/" element={<RentRequestsList />} />
      <Route path="*" element={<Navigate to="/admin/rent-requests" replace />} />
    </Routes>
  );
};

export default RentRequests;