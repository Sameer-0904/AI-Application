import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ImageGenerator from './components/ImageGenerator';
import ProductStudio from './components/ProductStudio';
import GenerativeFill from './components/GenerativeFill';
import ObjectEraser from './components/ObjectEraser';
import './App.css';

// Placeholders for future components
const Placeholder = ({ title }) => (
  <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '20vh' }}>
    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h2>
    <p style={{ color: 'var(--color-text-muted)' }}>This feature is coming up next!</p>
  </div>
);


function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [mobileOpen, setMobileOpen] = useState(false);
  const apiKey = import.meta.env.VITE_BRIA_API_KEY;

  const renderContent = () => {
    switch (activeTab) {
      case 'generate': return <ImageGenerator apiKey={apiKey} />;
      case 'product': return <ProductStudio apiKey={apiKey} />;
      case 'gen-fill': return <GenerativeFill />;
      case 'erase': return <ObjectEraser />;
      default: return <Placeholder title="Welcome" />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div style={{ flex: 1 }}>
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={() => setMobileOpen(true)} style={{ padding: '0.5rem' }}>Menu</button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Visionary</h1>
          </div>
        </header>
        <div className={`backdrop ${mobileOpen ? 'visible' : ''}`} onClick={() => setMobileOpen(false)} />
        <main className="main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
