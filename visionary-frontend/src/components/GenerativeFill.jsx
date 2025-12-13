import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { getApiUrl } from '../config';

const GenerativeFill = () => {
    const [image, setImage] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [brushSize, setBrushSize] = useState(20);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const canvasRef = useRef(null);
    const maskCanvasRef = useRef(null);
    const imageRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        // Ensure canvases match the underlying image natural dimensions to prevent zero-size drawImage errors
        if (imageSrc && canvasRef.current && maskCanvasRef.current && imageRef.current) {
            const canvas = canvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            const img = imageRef.current;
            // Use the natural size for precise pixel mapping
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            if (width > 0 && height > 0) {
                canvas.width = width;
                canvas.height = height;
                maskCanvas.width = width;
                maskCanvas.height = height;
                // Keep CSS responsive size while pixel backing is the natural resolution
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                maskCanvas.style.width = '100%';
                maskCanvas.style.height = 'auto';
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const ctxMask = maskCanvas.getContext('2d');
                ctxMask.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            }
        }
    }, [imageSrc]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const url = URL.createObjectURL(file);
            setImageSrc(url);
            setResult(null);
            setImageLoaded(false);
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const img = imageRef.current;
        if (img && canvas && (!canvas.width || !canvas.height)) {
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            if (width > 0 && height > 0) {
                canvas.width = width;
                canvas.height = height;
                maskCanvas.width = width;
                maskCanvas.height = height;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                maskCanvas.style.width = '100%';
                maskCanvas.style.height = 'auto';
            }
        }
        const ctx = canvas.getContext('2d');
        const ctxMask = maskCanvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        ctx.beginPath();
        ctx.moveTo(x, y);
        // draw a tiny stroke immediately so a single click creates a visible dot
        ctx.lineTo(x + 0.01, y + 0.01);
        ctx.stroke();
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 64, 0.45)';

        ctxMask.beginPath();
        ctxMask.moveTo(x, y);
        ctxMask.lineTo(x + 0.01, y + 0.01);
        ctxMask.stroke();
        ctxMask.lineWidth = brushSize;
        ctxMask.lineCap = 'round';
        ctxMask.strokeStyle = 'white';
        setIsDrawing(true);
    };

    const startTouch = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const ctxMask = maskCanvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineTo(x, y);
        ctx.stroke();
        ctxMask.lineTo(x, y);
        ctxMask.stroke();
    };

    const drawTouch = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        draw({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const endDrawing = () => {
        // close both paths
        const maskCanvas = maskCanvasRef.current;
        const canvas = canvasRef.current;
        if (maskCanvas) {
            const ctxMask = maskCanvas.getContext('2d');
            ctxMask.closePath();
        }
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.closePath();
        }
        setIsDrawing(false);
    };

    const endTouch = (e) => {
        e.preventDefault();
        endDrawing();
    };

    const handleProcess = async () => {
        if (!image) return;
        if (!prompt) return;

        setLoading(true);
        setResult(null);

        try {
            // Ensure canvas backing store sizes are set; this prevents drawImage errors when the image hasn't fully resized
            const canvas = canvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            const img = imageRef.current;
            if (img && canvas && maskCanvas && (!canvas.width || !canvas.height)) {
                const width = img.naturalWidth || img.width || 0;
                const height = img.naturalHeight || img.height || 0;
                if (width > 0 && height > 0) {
                    canvas.width = width;
                    canvas.height = height;
                    maskCanvas.width = width;
                    maskCanvas.height = height;
                }
            }
            const canvas = canvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            // If mask canvas backing store isn't ready, ask user to wait and avoid drawImage errors
            if (!maskCanvas || !maskCanvas.width || !maskCanvas.height) {
                alert('Please wait until the image finishes loading and draw a mask before generating.');
                setLoading(false);
                return;
            }
            const tempCanvas = document.createElement('canvas');
            const img = imageRef.current;
            const width = (canvas && canvas.width) || (img && (img.naturalWidth || img.width)) || 1024;
            const height = (canvas && canvas.height) || (img && (img.naturalHeight || img.height)) || 1024;
            tempCanvas.width = width;
            tempCanvas.height = height;
            const maskCanvas = maskCanvasRef.current;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = 'black';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(maskCanvas, 0, 0);

            // If the mask canvas has zero size, avoid calling drawImage on it — create a full-black mask
            if (!maskCanvas || !maskCanvas.width || !maskCanvas.height) {
                tempCtx.fillStyle = 'black';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            } else {
                try {
                    tempCtx.drawImage(maskCanvas, 0, 0);
                } catch (err) {
                    console.warn('drawImage failed, falling back to black mask', err);
                    tempCtx.fillStyle = 'black';
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                }
            }

            const maskBlob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));

            const formData = new FormData();
            formData.append('file', image);
            formData.append('mask_file', maskBlob, 'mask.png');
            formData.append('prompt', prompt);

            const response = await fetch(getApiUrl('/edit/generative-fill'), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Failed to process');
            const data = await response.json();

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
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Generative Fill</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Fill masked areas with AI generated content.</p>
            </header>

            <div className="layout-grid">
                <div className="section-main glass-panel preview-panel" style={{ padding: '2rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!imageSrc ? (
                        <label style={{ cursor: 'pointer', textAlign: 'center' }} className="upload-placeholder">
                            <FiUpload size={56} style={{ color: 'var(--color-text-muted)' }} />
                            <div>
                                <p style={{ fontSize: '1rem', fontWeight: '600' }}>Upload Image</p>
                                <p style={{ color: 'var(--color-text-muted)' }}>JPG or PNG</p>
                            </div>
                            <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                        </label>
                    ) : (
                        <div className="preview-container" style={{ position: 'relative', maxWidth: '100%', border: '1px solid var(--color-border)' }}>
                            <img
                                ref={imageRef}
                                src={result || imageSrc}
                                alt="Target"
                                onLoad={() => {
                                    // When the image loads ensure both canvases are sized to the image's natural dimensions
                                    if (canvasRef.current && maskCanvasRef.current && imageRef.current) {
                                        const img = imageRef.current;
                                        const width = img.naturalWidth || img.width || 0;
                                        const height = img.naturalHeight || img.height || 0;
                                        if (width > 0 && height > 0) {
                                            canvasRef.current.width = width;
                                            canvasRef.current.height = height;
                                            canvasRef.current.style.width = '100%';
                                            canvasRef.current.style.height = 'auto';
                                            maskCanvasRef.current.width = width;
                                            maskCanvasRef.current.height = height;
                                            maskCanvasRef.current.style.width = '100%';
                                            maskCanvasRef.current.style.height = 'auto';
                                        }
                                    }
                                    setImageLoaded(true);
                                }}
                                style={{ maxWidth: '100%', maxHeight: '600px', display: 'block', pointerEvents: 'none' }}
                            />
                            {!result && (
                                <>
                                    <canvas
                                        ref={canvasRef}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={endDrawing}
                                        onMouseLeave={endDrawing}
                                        onTouchStart={startTouch}
                                        onTouchMove={drawTouch}
                                        onTouchEnd={endTouch}
                                        style={{
                                            position: 'absolute',
                                            top: 0, left: 0,
                                            width: '100%', height: '100%',
                                            cursor: 'crosshair',
                                            touchAction: 'none'
                                        }}
                                    />
                                    <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
                                </>
                            )}
                            {result && (
                                <button onClick={async () => {
                                    try {
                                        const r = await fetch(result);
                                        const blob = await r.blob();
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'visionary-result.png';
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        URL.revokeObjectURL(url);
                                    } catch (err) { console.error('Download failed', err); }
                                }} className="btn-primary" style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                    <FiDownload /> Download
                                </button>
                            )}
                            <button onClick={() => { setImageSrc(null); setImage(null); setResult(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.5rem', borderRadius: '50%', zIndex: 10 }}>✕</button>
                        </div>
                    )}
                </div>

                <div className="section-controls glass-panel tools-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Tools</h3>
                    {imageSrc && !result && (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Brush Size: {brushSize}px</label>
                                <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={{ width: '100%' }} />
                            </div>
                            <button onClick={() => {
                                const canvas = canvasRef.current;
                                const ctx = canvas.getContext('2d');
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                const maskCanvas = maskCanvasRef.current;
                                if (maskCanvas) { const ctxMask = maskCanvas.getContext('2d'); ctxMask.clearRect(0, 0, maskCanvas.width, maskCanvas.height); }
                            }} style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'white', borderRadius: '0.5rem' }}>
                                Clear Mask
                            </button>
                            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="What should fill the masked area?"
                                    style={{ width: '100%', height: '80px', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', color: 'white', marginBottom: '0.5rem' }}
                                />
                            </div>
                        </>
                    )}
                    {result && (
                        <button onClick={() => setResult(null)} style={{ width: '100%', padding: '0.75rem', background: 'var(--color-primary)', color: 'white', borderRadius: '0.5rem' }}>
                            <FiRefreshCw /> Edit Again
                        </button>
                    )}
                </div>

                <div className="section-actions">
                    <button className="btn-secondary" style={{ width: '30%' }} onClick={() => {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        const maskCanvas = maskCanvasRef.current;
                        if (maskCanvas) { const ctxMask = maskCanvas.getContext('2d'); ctxMask.clearRect(0, 0, maskCanvas.width, maskCanvas.height); }
                    }}>Clear</button>
                    <button className="btn-primary" style={{ width: '70%' }} onClick={handleProcess} disabled={loading || !imageLoaded || !image}>{loading ? 'Processing...' : 'Generate Fill'}</button>
                </div>
            </div>

            {/* Floating actions for mobile: Clear + Generate */}
            <div className="floating-actions" role="toolbar">
                <button className="btn-secondary" onClick={() => {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const maskCanvas = maskCanvasRef.current;
                    if (maskCanvas) { const ctxMask = maskCanvas.getContext('2d'); ctxMask.clearRect(0, 0, maskCanvas.width, maskCanvas.height); }
                }}>
                    Clear
                </button>
                <button className="btn-primary" onClick={handleProcess} disabled={loading || !imageLoaded || !image}>{loading ? 'Processing...' : 'Generate'}</button>
            </div>
        </div>
    );
};

export default GenerativeFill;
