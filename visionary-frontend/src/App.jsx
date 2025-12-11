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
    <div style={{ display: 'flex' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{
        marginLeft: '280px',
        flex: 1,
        padding: '2rem',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, #1e2130 0%, #0f111a 60%)'
      }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
