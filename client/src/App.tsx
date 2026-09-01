import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { PCSession } from './pages/PCSession.js';
import { MobileUpload } from './pages/MobileUpload.js';

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pc" element={<PCSession />} />
        <Route path="/upload/:token" element={<MobileUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
