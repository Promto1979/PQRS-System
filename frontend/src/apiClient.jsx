import axios from 'axios';

// URL de la API del Backend
const API_URL = "http://localhost:8000";

const apiClient = axios.create({
    baseURL: API_URL,
});

// Interceptor: Esto se ejecuta ANTES de cada petición
apiClient.interceptors.request.use(
    (config) => {
        // 1. Obtener el token de localStorage
        const token = localStorage.getItem("authToken");
        
        // 2. Si el token existe, añadirlo a la cabecera (Header)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;