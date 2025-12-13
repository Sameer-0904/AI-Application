import React, { useState } from 'react';
import { FiDownload, FiMaximize2, FiCpu } from 'react-icons/fi';
import { getApiUrl } from '../config';

const ImageGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // Settings
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [numImages, setNumImages] = useState(1);
    const [style, setStyle] = useState('Realistic');
    const [enhancing, setEnhancing] = useState(false);

    const handleEnhancePrompt = async () => {
        if (!prompt) return;
        setEnhancing(true);
        try {
            const url = getApiUrl('/enhance-prompt');
            console.log('🔍 Enhance Prompt URL:', url);
            
            const formData = new FormData();
            formData.append('prompt', prompt);

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            console.log('✅ Enhance Response Status:', response.status);
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Enhance Data:', data);
            
            if (data.enhanced_prompt) {
                setPrompt(data.enhanced_prompt);
            }
        } catch (err) {
            console.error('❌ Enhance Error:', err);
            alert('Enhancement failed: ' + err.message);
        } finally {
            setEnhancing(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;

        setLoading(true);
        setError('');

        try {
            const url = getApiUrl('/generate-image');
            console.log('🖼️ Generate Image URL:', url);
            
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('num_results', numImages);
            formData.append('aspect_ratio', aspectRatio);
            formData.append('style', style);

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            console.log('✅ Generate Response Status:', response.status);
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Generate Data:', data);

            // Normalize response
            let urls = [];
            if (data.result_url) urls.push(data.result_url);
            else if (data.result_urls) urls = data.result_urls;
            else if (data.result && Array.isArray(data.result)) {
                data.result.forEach(item => {
                    if (item.urls) urls.push(...item.urls);
                    else if (typeof item === 'string') urls.push(item);
                });
            }

            setResult(urls);
        } catch (err) {
            console.error('❌ Generate Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (url, filename = 'visionary-result.png') => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Generate Images</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Turn your text descriptions into stunning visuals.</p>
            </header>

            <div className="layout-grid">
                {/* Main: Input & Results */}
                <div className="section-main">
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your imagination..."
                            style={{
                                width: '100%',
                                height: '150px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.1rem',
                                resize: 'none',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Results Grid */}
                    {result && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {result.map((url, idx) => (
                                <div key={idx} className="glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
                                    <img src={url} alt={`Result ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        onClick={() => handleDownload(url)}
                                        style={{
                                            position: 'absolute', bottom: '10px', right: '10px',
                                            background: 'white', color: 'black',
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0
                                        }}
                                    >
                                        <FiDownload />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                

                {/* Controls */}
                <div className="section-controls glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiCpu /> Settings
                    </h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Aspect Ratio</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '0.25rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: aspectRatio === ratio ? 'var(--color-primary)' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Style</label>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--color-border)',
                                color: 'white',
                                outline: 'none'
                            }}
                        >
                            {["Realistic", "Artistic", "Cartoon", "Sketch", "Watercolor", "Oil Painting", "Digital Art"].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Number of Images: {numImages}</label>
                        <input
                            type="range"
                            min="1" max="4"
                            value={numImages}
                            onChange={(e) => setNumImages(e.target.value)}
                            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="section-actions">
                    <button
                        onClick={handleEnhancePrompt}
                        disabled={enhancing || !prompt}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FiMaximize2 /> {enhancing ? 'Enhancing...' : 'Enhance Prompt'}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleGenerate}
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            {/* Floating mobile actions */}
            <div className="floating-actions" role="toolbar" aria-hidden={false}>
                <button className="btn-secondary" onClick={handleEnhancePrompt} disabled={enhancing || !prompt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ transform: 'rotate(45deg)', display: 'inline-block' }}><FiMaximize2 /></span>
                    Enhance
                </button>
                <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
                    {loading ? 'Generating' : 'Generate'}
                </button>
            </div>
        </div>
    );
};

export default ImageGenerator;
