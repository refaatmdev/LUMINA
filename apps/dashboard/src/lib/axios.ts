import axios from 'axios';
import { supabase } from './supabase';

// Create a new axios instance
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '', // Fallback to empty string (relative) or specific URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the Supabase session token
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors (e.g., 401 Unauthorized)
        if (error.response?.status === 401) {
            // creating a side-effect here might be dangerous, but for now we'll just log
            console.warn('Unauthorized access', error);
            // Optional: redirect to login or clear session
        }
        return Promise.reject(error);
    }
);
