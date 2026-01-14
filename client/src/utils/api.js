import axios from 'axios';

// URL de base de l'API :
// - En production : définir VITE_API_URL dans le .env de Vite (ex: l'URL Railway)
// - En développement : laisser vide pour utiliser le proxy Vite (/api -> backend local)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

