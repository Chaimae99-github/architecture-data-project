import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Compare from './pages/Compare';
import Timeline from './pages/Timeline';
import About from './pages/About';
import './styles/global.css';


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;