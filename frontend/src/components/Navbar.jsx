import React from 'react';
import { Link } from 'react-router-dom'; 
import './Navbar.css';

// Recibimos las dos funciones para abrir modales
const Navbar = ({ onOpenLogin, onOpenSeguimiento }) => {
    
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Sistema PQRS</Link>
            </div>

            <div className="navbar-menu">
                <Link to="/" className="nav-link">Radicar Solicitud</Link>
                
                {/* AHORA "Consultar Estado" ES UN BOTÓN QUE PARECE LINK */}
                <button 
                    onClick={onOpenSeguimiento} 
                    className="nav-link" 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit' }}
                >
                    Consultar Estado
                </button>
            </div>

            <div className="navbar-actions">
                <button 
                    className="btn-interno" 
                    onClick={onOpenLogin} 
                >
                    Acceso Interno
                </button>
            </div>
        </nav>
    );
};

export default Navbar;