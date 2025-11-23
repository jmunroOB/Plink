// src/AuthService.js
import { API_BASE_URL, JWT_TOKEN_KEY } from './postgres_config';

/**
 * Handles user authentication and API interactions using JWT tokens.
 */

// --- Token Management ---

export const getToken = () => {
    return localStorage.getItem(JWT_TOKEN_KEY);
};

export const setToken = (token) => {
    localStorage.setItem(JWT_TOKEN_KEY, token);
};

export const removeToken = () => {
    localStorage.removeItem(JWT_TOKEN_KEY);
};

// --- Backend API Helpers ---

/**
 * Builds the headers needed for authenticated requests.
 * All admin/protected API calls MUST use this helper.
 */
export const getAuthHeaders = () => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        // Send the JWT as a Bearer Token, as required by the Flask backend
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};


// --- Authentication Logic ---

export const registerUser = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed.');
        }

        return { success: true, message: data.message };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const loginUser = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        // Store the JWT token upon successful login
        setToken(data.token);
        
        return { success: true, role: data.role };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const logoutUser = () => {
    removeToken();
    // In a full app, you might also redirect the user here
};

export const isAuthenticated = async () => {
    const token = getToken();
    if (!token) return false;

    try {
        // Ping a protected route (like verify_token) to check token validity and expiration
        const response = await fetch(`${API_BASE_URL}/admin/verify_token`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        // If the response is 200/201, the token is valid (and not expired)
        return response.ok; 
    } catch (e) {
        return false;
    }
};

// --- Example of a Protected API Call ---
export const getAdminOverview = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/analytics/overview`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admin data.');
    }
    return data;
};