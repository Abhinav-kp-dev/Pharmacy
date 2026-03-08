// API Configuration - uses environment variable in production, localhost in development
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
export const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";
