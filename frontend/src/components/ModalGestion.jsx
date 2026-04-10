import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient.jsx';
import './FormularioPQRS.css'; // Reutilizamos estilos del formulario
import './Modal.css'; // Importamos los estilos del modal

function ModalGestion({ radicado, onClose, onUpdate }) {
    const [pqrs, setPqrs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ESTADOS DEL FORMULARIO
    const [respuesta, setRespuesta] = useState("");
    const [nuevoEstado, setNuevoEstado] = useState("CERRADO"); 
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        const fetchDetalle = async () => {
            try {
                const response = await apiClient.get(`/pqrs/${radicado}`);
                setPqrs(response.data); 
            } catch (err) {
                console.error("Error:", err);
                setError("No se pudo cargar la información.");
            } finally {
                setLoading(false);
            }
        };
        if (radicado) fetchDetalle();
    }, [radicado]);

    const handleResponder = async () => {
        if (!respuesta.trim()) return alert("Por favor, escribe una respuesta, motivo o comentario.");
        
        try {
            setEnviando(true);
            await apiClient.put(`/pqrs/${radicado}/responder`, {
                detalle_respuesta: respuesta,
                nuevo_estado: nuevoEstado 
            });
            
            alert(`Solicitud gestionada exitosamente como: ${nuevoEstado}`);
            onUpdate(); 
            onClose();  
        } catch (err) {
            console.error(err);
            alert("Error al guardar la respuesta. Verifica la conexión.");
        } finally {
            setEnviando(false);
        }
    };

    if (!radicado) return null;

    // Estilos inline para asegurar visibilidad
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' };
    const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={onClose}>×</button>

                {loading && <p style={{textAlign:'center', color: '#333'}}>Cargando detalles...</p>}
                {error && <p className="error-message">{error}</p>}
                
                {pqrs && !loading && (
                    <div className="form-container" style={{boxShadow: 'none', padding: 0, width: '100%', margin: 0}}>
                        <h2 style={{color: '#007bff', marginTop: 0}}>Gestión: {pqrs.numero_radicado}</h2>
                        
                        {/* SECCIÓN DE DETALLES */}
                        <div className="detail-section" style={{color: '#333', maxHeight: '350px', overflowY: 'auto'}}>
                            <p><strong>Estado Actual:</strong> <span className="badge">{pqrs.estado}</span></p>
                            <p><strong>Tipo:</strong> {pqrs.tipo_solicitud}</p>
                            <hr />
                            <p><strong>Usuario:</strong> {pqrs.nombre_usuario}</p>
                            <p><strong>Asunto:</strong> {pqrs.asunto}</p>
                            <div className="description-box" style={{backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px'}}>
                                <p style={{margin: 0}}>{pqrs.descripcion}</p>
                            </div>

                            {pqrs.url_adjunto && (
                                <div style={{marginTop: '10px'}}>
                                     <a href={`http://localhost:8000${pqrs.url_adjunto}`} target="_blank" rel="noreferrer" style={{color: '#007bff'}}>
                                        📎 Ver Archivo Adjunto
                                     </a>
                                </div>
                            )}

                            {/* --- NUEVO: VISUALIZAR RESPUESTA SI YA EXISTE --- */}
                            {pqrs.detalle_respuesta && (
                                <div style={{marginTop: '15px', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px', border: '1px solid #b2d8b2'}}>
                                    <strong style={{color: '#2e7d32', display:'block', marginBottom:'5px'}}>
                                        ✅ Respuesta de Gestión ({pqrs.fecha_respuesta ? new Date(pqrs.fecha_respuesta).toLocaleDateString() : 'Fecha N/A'}):
                                    </strong>
                                    <p style={{margin: 0, color: '#333', whiteSpace: 'pre-wrap'}}>
                                        {pqrs.detalle_respuesta}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN DE ACCIONES */}
                        <div className="actions-section" style={{marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px'}}>
                            <h3 style={{color: '#333', marginTop: 0}}>Gestionar Solicitud</h3>
                            
                            {/* Si NO está finalizado, mostramos el formulario */}
                            {(pqrs.estado !== 'CERRADO' && pqrs.estado !== 'RECHAZADO') ? (
                                <>
                                    <div style={{marginBottom: '15px'}}>
                                        <label style={labelStyle}>Acción a realizar:</label>
                                        <select 
                                            value={nuevoEstado} 
                                            onChange={(e) => setNuevoEstado(e.target.value)}
                                            style={inputStyle}
                                        >
                                            <option value="CERRADO">🟢 Responder y CERRAR</option>
                                            <option value="RECHAZADO">🔴 RECHAZAR Solicitud</option>
                                            <option value="EN_GESTION">🔵 Poner EN GESTIÓN</option>
                                        </select>
                                    </div>

                                    <div style={{marginBottom: '15px'}}>
                                        <label style={labelStyle}>
                                            {nuevoEstado === 'RECHAZADO' ? 'Motivo del Rechazo:' : 'Respuesta / Comentarios:'}
                                        </label>
                                        <textarea 
                                            rows="4"
                                            placeholder={nuevoEstado === 'RECHAZADO' ? "Explique por qué se rechaza..." : "Escribe la respuesta..."}
                                            value={respuesta}
                                            onChange={(e) => setRespuesta(e.target.value)}
                                            style={{...inputStyle, resize: 'vertical', color: '#000'}} 
                                        />
                                    </div>
                                    
                                    <button 
                                        onClick={handleResponder} 
                                        disabled={enviando || !respuesta.trim()}
                                        style={{
                                            backgroundColor: nuevoEstado === 'RECHAZADO' ? '#dc3545' : '#28a745',
                                            color: 'white',
                                            padding: '12px',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            fontSize: '16px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {enviando ? "Procesando..." : (nuevoEstado === 'RECHAZADO' ? "Confirmar Rechazo" : "Guardar Gestión")}
                                    </button>
                                </>
                            ) : (
                                /* MENSAJE CUANDO YA ESTÁ CERRADO/RECHAZADO */
                                <div style={{padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', textAlign: 'center', border: '1px solid #dee2e6'}}>
                                    <strong style={{color: '#555', fontSize: '1.1em', display:'block', marginBottom:'8px'}}>
                                        Ticket Finalizado ({pqrs.estado})
                                    </strong>
                                    <div style={{textAlign: 'left', backgroundColor: '#fff', padding: '10px', border: '1px solid #eee', borderRadius: '4px'}}>
                                        <strong style={{color: '#333', fontSize: '0.9em'}}>Respuesta registrada:</strong>
                                        <p style={{margin: '5px 0', color: '#333', fontSize: '0.95em'}}>
                                            {pqrs.detalle_respuesta || "Sin respuesta registrada."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModalGestion;