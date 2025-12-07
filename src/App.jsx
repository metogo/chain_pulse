import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AssetPage from './pages/AssetPage';

function App() {
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
