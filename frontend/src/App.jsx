import React, { useState } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';

// Importamos componentes
import Navbar from './components/Navbar.jsx'; 
import FormularioPQRS from './components/FormularioPQRS.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import ModalLogin from './components/ModalLogin.jsx'; 
import ModalSeguimiento from './components/ModalSeguimiento.jsx'; // <--- NUEVA IMPORTACIÓN

// --- MODIFICAMOS EL LAYOUT PÚBLICO ---
const PublicLayout = () => {
    // Estados para controlar qué modal se muestra
    const [showLogin, setShowLogin] = useState(false);
    const [showSeguimiento, setShowSeguimiento] = useState(false);

    return (
        <div>
            {/* Pasamos ambas funciones al Navbar */}
            <Navbar 
                onOpenLogin={() => setShowLogin(true)} 
                onOpenSeguimiento={() => setShowSeguimiento(true)}
            />
            
            <Outlet /> 

            {/* Modales Condicionales */}
            {showLogin && <ModalLogin onClose={() => setShowLogin(false)} />}
            {showSeguimiento && <ModalSeguimiento onClose={() => setShowSeguimiento(false)} />}
        </div>
    );
};

function App() {
    return (
        <HashRouter>
            <Routes>
                {/* Rutas Públicas */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<FormularioPQRS />} />
                    {/* YA NO NECESITAMOS LA RUTA /seguimiento AQUI */}
                </Route>
                
                {/* Rutas Protegidas */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}

export default App;
