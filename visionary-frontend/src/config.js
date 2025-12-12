export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiUrl = (endpoint) => {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    let baseUrl = API_BASE_URL;
    
    // Handle Render backend format - convert hostname to full URL
    if (!baseUrl.startsWith('http') && !baseUrl.startsWith('/')) {
        baseUrl = `https://${baseUrl}`;
    }
    
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    return `${baseUrl}${path}`;
};
