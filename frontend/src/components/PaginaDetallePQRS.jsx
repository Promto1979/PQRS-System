import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './PaginaDetallePQRS.css';

// Maqueta de la página de gestión
function PaginaDetallePQRS() {
    
    // useParams() nos permite leer el ":id" de la URL
    const { id } = useParams();

    return (
        <div className="detalle-container">
            <div className="detalle-header">
                <h2>Gestión de la Solicitud (ID: {id})</h2>
                <Link to="/dashboard" className="button-volver">
                    &larr; Volver al Dashboard
                </Link>
            </div>
            
            <div className="detalle-grid">
                <div className="detalle-info">
                    <h3>Detalles del Solicitante</h3>
                    <p>(Aquí cargarán los datos de la API...)</p>
                    
                    <h3>Acciones de Gestión</h3>
                    <div className="acciones-form">
                        <select>
                            <option value="">Cambiar Estado...</option>
                            <option value="En Gestión">En Gestión</option>
                            <option value="Cerrado">Cerrado</option>
                            <option value="Rechazado">Rechazado</option>
                        </select>
                        <button>Actualizar Estado</button>
                    </div>
                </div>
                
                <div className="detalle-historial">
                    <h3>Historial y Trazabilidad</h3>
                    <p>(Aquí cargará el historial completo...)</p>
                    
                    <textarea placeholder="Añadir comentario de gestión..."></textarea>
                    <button>Añadir Comentario</button>
                </div>
            </div>
        </div>
    );
}

export default PaginaDetallePQRS;