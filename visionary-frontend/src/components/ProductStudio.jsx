import React, { useState } from 'react';
import { FiUpload, FiBox, FiLayers, FiCamera, FiDownload } from 'react-icons/fi';
import { getApiUrl } from '../config';

const ProductStudio = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [mode, setMode] = useState('packshot'); // packshot, shadow, lifestyle
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Packshot State
    const [bgColor, setBgColor] = useState('#FFFFFF');

    // Shadow State
    const [shadowType, setShadowType] = useState('regular');

    // Lifestyle State
    const [sceneDescription, setSceneDescription] = useState('A professional studio setting');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const handleProcess = async () => {
        if (!image) return;
        setLoading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', image);

            let endpoint = '';

            if (mode === 'packshot') {
                endpoint = getApiUrl('/product/packshot');
                formData.append('background_color', bgColor);
                formData.append('force_rmbg', 'true'); // Default to true for convenience
            } else if (mode === 'shadow') {
                endpoint = getApiUrl('/product/shadow');
                formData.append('shadow_type', shadowType);
                formData.append('force_rmbg', 'true');
            } else if (mode === 'lifestyle') {
                endpoint = getApiUrl('/product/lifestyle-text');
                formData.append('scene_description', sceneDescription);
                formData.append('force_rmbg', 'true');
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Processing failed');
            }

            const data = await response.json();

            // Robust parsing for various API response formats
            let url = null;
            if (data.result_url) url = data.result_url;
            else if (data.result_urls && data.result_urls.length > 0) url = data.result_urls[0];
            else if (data.urls && data.urls.length > 0) url = data.urls[0];
            else if (data.result) {
                if (typeof data.result === 'string') url = data.result;
                else if (Array.isArray(data.result) && data.result.length > 0) url = data.result[0];
            }

            if (url) setResult(url);
            else throw new Error('No image URL found in response');

        } catch (err) {
            console.error(err);
            alert('Error processing image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Product Studio</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Professional tools for e-commerce photography.</p>
            </header>

            <div className="layout-grid">
                {/* Main: Image Display */}
                <div className="section-main">
                    <div className="glass-panel preview-container preview-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--color-border)' }}>
                        {!preview ? (
                            <label style={{ cursor: 'pointer', textAlign: 'center' }} className="upload-placeholder">
                                <FiUpload size={56} style={{ color: 'var(--color-text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>Upload Product Image</p>
                                    <p style={{ color: 'var(--color-text-muted)' }}>JPG or PNG</p>
                                </div>
                                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                            </label>
                        ) : (
                            <div style={{ width: '100%', position: 'relative' }}>
                                <img className="preview-img" src={result || preview} alt="Preview" />
                                {result && (
                                    <a href={result} download className="btn-primary" style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                        <FiDownload /> Download
                                    </a>
                                )}
                                {!loading && (
                                    <button onClick={() => { setPreview(null); setImage(null); setResult(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.5rem', borderRadius: '50%' }}>✕</button>
                                )}
                            </div>
                        )}
                        {loading && <p style={{ marginTop: '1rem' }}>Processing...</p>}
                    </div>
                </div>

                {/* Controls */}
                <div className="section-controls">
                    <div className="glass-panel mode-toggle" style={{ padding: '0.5rem', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {[
                            { id: 'packshot', label: 'Packshot', icon: <FiBox /> },
                            { id: 'shadow', label: 'Shadows', icon: <FiLayers /> },
                            { id: 'lifestyle', label: 'Lifestyle', icon: <FiCamera /> },
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: mode === m.id ? 'var(--color-primary)' : 'transparent',
                                    color: mode === m.id ? 'white' : 'var(--color-text-muted)',
                                    fontWeight: '500'
                                }}
                            >
                                {m.icon} {m.label}
                            </button>
                        ))}
                    </div>

                    <div className="section-controls glass-panel tools-panel" style={{ padding: '1.5rem' }}>
                        {mode === 'packshot' && (
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>Packshot Settings</h3>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Background Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ border: 'none', width: '40px', height: '40px', background: 'transparent' }} />
                                    <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', flex: 1 }} />
                                </div>
                            </div>
                        )}

                        {mode === 'shadow' && (
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>Shadow Settings</h3>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Shadow Type</label>
                                <select value={shadowType} onChange={(e) => setShadowType(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', color: 'white', borderRadius: '0.5rem' }}>
                                    <option value="regular">Regular Drop Shadow</option>
                                    <option value="float">Floating Shadow</option>
                                </select>
                            </div>
                        )}

                        {mode === 'lifestyle' && (
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>Lifestyle Shot</h3>
                                <p style={{ color: 'var(--color-text-muted)' }}>Generate a scene for your product.</p>
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Scene Description</label>
                                    <textarea
                                        value={sceneDescription}
                                        onChange={(e) => setSceneDescription(e.target.value)}
                                        placeholder="Describe the background scene..."
                                        style={{
                                            width: '100%',
                                            height: '100px',
                                            padding: '0.75rem',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            color: 'white',
                                            borderRadius: '0.5rem'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                    <div className="section-actions">
                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={handleProcess}
                            disabled={loading || !image}
                        >
                            {loading ? 'Processing...' : 'Apply Magic ✨'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductStudio;
