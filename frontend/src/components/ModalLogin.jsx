import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient.jsx';
// REMOVE: Ya no necesitamos PaginaLogin.css
// import './PaginaLogin.css'; // Esto causaba que el modal fuera muy grande

import './Modal.css';       // Estilos base del overlay del modal
import './ModalLogin.css';  // <--- ¡AHORA IMPORTAMOS ESTOS ESTILOS ESPECÍFICOS!

function ModalLogin({ onClose }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!username || !password) {
            setError("Por favor ingresa usuario y contraseña.");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await apiClient.post('/token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            localStorage.setItem('authToken', response.data.access_token);
            
            alert("Bienvenido al Sistema");
            onClose(); 
            navigate('/dashboard'); 
            
        } catch (err) {
            console.error("Login error:", err);
            setError("Usuario o contraseña incorrectos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            {/* CLAVE: Usamos la nueva clase "modal-login-content" */}
            <div className="modal-login-content">
                
                <button className="close-modal-btn" onClick={onClose}>×</button>

                {/* Ya no necesitamos la clase login-container aquí */}
                <div> 
                    <h2>Iniciar Sesión</h2>
                    
                    {error && <p className="error-message">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Usuario (Email)</label>
                            <input 
                                type="text" 
                                id="username"
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input 
                                type="password" 
                                id="password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required
                            />
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? "Ingresando..." : "Ingresar"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ModalLogin;