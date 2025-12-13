import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { getApiUrl } from '../config';

const ObjectEraser = () => {
    const [image, setImage] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [brushSize, setBrushSize] = useState(20);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const canvasRef = useRef(null);
    const maskCanvasRef = useRef(null);
    const imageRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (imageSrc && canvasRef.current && maskCanvasRef.current && imageRef.current) {
            const canvas = canvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            const img = imageRef.current;
            const width = img.width;
            const height = img.height;
            canvas.width = width;
            canvas.height = height;
            maskCanvas.width = width;
            maskCanvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ctxMask = maskCanvas.getContext('2d');
            ctxMask.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        }
    }, [imageSrc]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const url = URL.createObjectURL(file);
            setImageSrc(url);
            setResult(null);
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
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
        // Use a translucent overlay color so image is not fully covered while drawing
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
        // finish both paths
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

        setLoading(true);
        setResult(null);

        try {
            const canvas = canvasRef.current;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const maskCanvas = maskCanvasRef.current;
            const tempCtx = tempCanvas.getContext('2d');

            // create a black background + draw the mask (white strokes) on top
            tempCtx.fillStyle = 'black';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(maskCanvas, 0, 0);

            const maskBlob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));

            const formData = new FormData();
            formData.append('file', image);
            formData.append('mask_file', maskBlob, 'mask.png');

            const response = await fetch(getApiUrl('/edit/erase'), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to process');
            }
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
                <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Object Eraser</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Remove unwanted objects cleanly.</p>
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
                                    if (canvasRef.current) {
                                        canvasRef.current.width = imageRef.current.width;
                                        canvasRef.current.height = imageRef.current.height;
                                    }
                                }}
                                style={{ maxWidth: '100%', maxHeight: '600px', display: 'block', pointerEvents: 'none' }}
                            />
                            {/* visible overlay canvas for drawing mask */}
                            {!result && (
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
                                        touchAction: 'none',
                                        pointerEvents: 'auto'
                                    }}
                                />
                            )}
                            {/* hidden mask canvas used to create a white/black mask for the API */}
                            <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
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
                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                {/* actions moved to .section-actions */}
                            </div>
                        </>
                    )}
                    {result && (
                        <button onClick={() => setResult(null)} style={{ width: '100%', padding: '0.75rem', background: 'var(--color-primary)', color: 'white', borderRadius: '0.5rem' }}>
                            <FiRefreshCw /> Edit Again
                        </button>
                    )}
                    {!imageSrc && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Upload an image to start.</p>}
                </div>

                <div className="section-actions">
                    <button className="btn-secondary" style={{ width: '30%' }} onClick={() => {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        const maskCanvas = maskCanvasRef.current;
                        if (maskCanvas) { const ctxMask = maskCanvas.getContext('2d'); ctxMask.clearRect(0, 0, maskCanvas.width, maskCanvas.height); }
                    }}>Clear</button>
                    <button className="btn-primary" style={{ width: '70%' }} onClick={handleProcess} disabled={loading}>{loading ? 'Processing...' : 'Erase Object'}</button>
                </div>
            </div>

            {/* Floating actions for mobile: Clear + Erase */}
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
                <button className="btn-primary" onClick={handleProcess} disabled={loading}>{loading ? 'Processing...' : 'Erase'}</button>
            </div>
        </div>
    );
};

export default ObjectEraser;
