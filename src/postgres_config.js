// src/postgres_config.js

// --- CONFIGURATION FOR RENDER BACKEND ---
// Base URL for your deployed Flask API Service
// *** IMPORTANT: Update this to your final Render URL if it changes! ***
export const API_BASE_URL = "https://plink-backend-api.onrender.com";

// NOTE: This must match the JWT_SECRET_KEY set in your Render Web Service environment variable.
// This is used for creating the Authorization header on protected requests.
export const JWT_TOKEN_KEY = "authToken"; // Key used to store the JWT in local storage

// Helper for Admin API Key (For temporary testing if needed, though JWT is primary)
export const ADMIN_API_KEY = "YOUR_ADMIN_SECRET_KEY"; // REPLACE with your actual secret key