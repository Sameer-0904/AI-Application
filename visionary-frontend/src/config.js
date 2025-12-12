export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiUrl = (endpoint) => {
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // If API_BASE_URL is just '/api' (default), we are using the proxy, so just append the path (but strip leading /api from path if present to avoid double /api/api if user passes full path)
    // Actually, keep it simple: API_BASE_URL + path
    // But wait, if defaults to '/api', and we call getApiUrl('/generate-image'), result is '/api/generate-image'.
    // The proxy rewrites '/api' -> ''.
    // So request goes to localhost:8000/generate-image. Correct.

    // If VITE_API_URL is 'https://backend.com', result is 'https://backend.com/generate-image'.
    // Note: Backend routes are like @app.post("/generate-image").
    // So 'https://backend.com/generate-image' is correct.

    // SPECIAL CASE: The proxy setup in vite.config.js maps '/api' -> target.
    // If we are in PROD, we don't have the proxy.
    // If VITE_API_URL is set, we use it directly.

    // If API_BASE_URL is just 'hostname.com' (from Render 'host' property), prepend https://
    let baseUrl = API_BASE_URL;
    if (!baseUrl.startsWith('http') && !baseUrl.startsWith('/')) {
        baseUrl = `https://${baseUrl}`;
    }

    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    // If the endpoint passed in ALREADY starts with /api/ and we are using a full URL, we might want to strip it IF the backend doesn't expect /api prefix.
    // The backend routes are root-level: @app.post("/generate-image").
    // So if the code currently calls `fetch('/api/generate-image')`, we need to change the call site to `fetch(getApiUrl('/generate-image'))`.

    return `${baseUrl}${path}`;
};
