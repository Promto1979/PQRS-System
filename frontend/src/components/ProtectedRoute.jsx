import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Función simple para verificar si el token existe
const isAuthenticated = () => {
    return localStorage.getItem("authToken") !== null;
};

const ProtectedRoute = () => {
    
    // 1. Verifica si el usuario está autenticado
    const auth = isAuthenticated();

    // 2. Si está autenticado, renderiza el componente hijo (Outlet)
    // 3. Si no, lo redirige al INICIO (/) porque el login ahora es un modal
    //    Usamos 'replace' para que no puedan volver atrás con el botón del navegador
    return auth ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;