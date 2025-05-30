// src/services/api.js
import axios from 'axios';

// Use your backend URL; for development, this points to localhost:5000
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

export default API;
