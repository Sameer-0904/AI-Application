import React from 'react';
import { FiImage, FiShoppingBag, FiEdit2, FiSettings, FiLayers } from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
    const menuItems = [
        { id: 'generate', label: 'Generate Image', icon: <FiImage /> },
        { id: 'product', label: 'Product Studio', icon: <FiShoppingBag /> },
        { id: 'gen-fill', label: 'Generative Fill', icon: <FiEdit2 /> },
        { id: 'erase', label: 'Object Eraser', icon: <FiLayers /> },
    ];

    return (
        <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                <div style={{
                    width: '32px', height: '32px',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                    borderRadius: '8px'
                }}></div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>Visionary</h1>
                <button className="btn-primary mobile-close" onClick={() => setMobileOpen(false)} style={{ padding: '0.25rem 0.5rem' }}>Close</button>
            </div>

            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {menuItems.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => { setActiveTab(item.id); if (setMobileOpen) setMobileOpen(false); }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: activeTab === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: activeTab === item.id ? '600' : '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        backgroundColor: 'transparent'
                    }}
                >
                    <FiSettings size={20} />
                    Settings
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
