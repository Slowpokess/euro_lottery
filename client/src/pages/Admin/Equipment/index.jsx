import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EquipmentList from './EquipmentList';
import EquipmentForm from './EquipmentForm';
import './Equipment.css';

const Equipment = () => {
  return (
    <Routes>
      <Route path="/" element={<EquipmentList />} />
      <Route path="/create" element={<EquipmentForm />} />
      <Route path="/edit/:id" element={<EquipmentForm />} />
      <Route path="*" element={<Navigate to="/admin/equipment" replace />} />
    </Routes>
  );
};

export default Equipment;