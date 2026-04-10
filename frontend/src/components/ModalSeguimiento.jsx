import React, { useState } from 'react';
import apiClient from '../apiClient.jsx';
// REMOVE: import './FormularioPQRS.css';  <-- Ya no usamos este CSS conflictivo
import './Modal.css';      // Base del overlay
import './ModalSeguimiento.css'; // <-- NUEVOS ESTILOS ESPECÍFICOS

function ModalSeguimiento({ onClose }) {
    const [radicado, setRadicado] = useState('');
    const [pqrs, setPqrs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!radicado.trim()) return;

        setLoading(true);
        setError(null);
        setPqrs(null);

        try {
            const response = await apiClient.get(`/pqrs/${radicado.trim()}`);
            setPqrs(response.data);
        } catch (err) {
            console.error(err);
            setError("No se encontró ninguna solicitud con ese número de radicado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            {/* Usamos la clase nueva del CSS específico */}
            <div className="modal-seguimiento-content">
                <button className="close-modal-btn" onClick={onClose}>×</button>

                <h2>Consulta de Estado</h2>
                <p className="subtitle">
                    Ingrese su número de radicado para ver la respuesta oficial.
                </p>

                {/* BUSCADOR */}
                <form onSubmit={handleSearch} className="search-box">
                    <input 
                        type="text" 
                        placeholder="Ej: PQRS-2025..." 
                        value={radicado}
                        onChange={(e) => setRadicado(e.target.value)}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? "..." : "Consultar"}
                    </button>
                </form>

                {error && <div className="error-message" style={{color: 'red', textAlign: 'center', marginBottom: '15px'}}>{error}</div>}

                {/* RESULTADOS */}
                {pqrs && (
                    <div className="result-card">
                        <h3 style={{color: '#007bff', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                            {pqrs.numero_radicado}
                        </h3>
                        
                        <div className="info-row">
                            <span className="info-label">Estado:</span>
                            {/* Badge simple manual para no depender de CSS externo */}
                            <span style={{
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                backgroundColor: '#eee', 
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {pqrs.estado}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Fecha:</span>
                            <span className="info-value">
                                {new Date(pqrs.fecha_creacion).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Tipo:</span>
                            <span className="info-value">{pqrs.tipo_solicitud}</span>
                        </div>

                        <div style={{marginTop: '15px'}}>
                            <span className="info-label">Asunto:</span>
                            <p style={{margin: '5px 0', color: '#333'}}>{pqrs.asunto}</p>
                        </div>

                        {/* SECCIÓN DE RESPUESTA CON CLASES DINÁMICAS */}
                        {pqrs.detalle_respuesta ? (
                            <div className={`response-box ${pqrs.estado === 'RECHAZADO' ? 'rejected' : 'success'}`}>
                                <strong>
                                    {pqrs.estado === 'RECHAZADO' ? '🚫 Solicitud Rechazada' : '✅ Respuesta Oficial'}
                                    <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '5px', opacity: 0.8 }}>
                                        ({pqrs.fecha_respuesta ? new Date(pqrs.fecha_respuesta).toLocaleDateString() : ''})
                                    </span>
                                </strong>
                                <p style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                                    {pqrs.detalle_respuesta}
                                </p>
                            </div>
                        ) : (
                            <div className="response-box pending">
                                ⏳ Su solicitud se encuentra en trámite.
                            </div>
                        )}

                        {/* Enlace al adjunto */}
                        {pqrs.url_adjunto && (
                            <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                 <a href={`http://localhost:8000${pqrs.url_adjunto}`} target="_blank" rel="noreferrer" style={{ color: '#007bff', fontWeight: 'bold', textDecoration: 'none' }}>
                                    📎 Ver Adjunto
                                 </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModalSeguimiento;