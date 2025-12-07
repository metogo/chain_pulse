import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AssetPage from './pages/AssetPage';
import { useRealTimeData } from './hooks/useRealTimeData';

function App() {
  useRealTimeData(); // Initialize Real-time Data Stream

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/asset/:id" element={<AssetPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
