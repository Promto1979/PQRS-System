import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient.jsx';
import './DashboardPage.css'; 
import ModalGestion from './ModalGestion.jsx'; // <--- IMPORTANTE: Importar el modal

function DashboardPage() {
    const navigate = useNavigate();
    const [kpis, setKpis] = useState(null);
    const [listaPqrs, setListaPqrs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ESTADO PARA EL MODAL
    const [radicadoSeleccionado, setRadicadoSeleccionado] = useState(null); 

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        // Vamos al inicio, donde está el botón de Acceso Interno
        navigate('/'); 
    };

    // Función para cargar datos (la sacamos fuera del useEffect para reutilizarla)
    const fetchData = async () => {
        try {
            const kpiResponse = await apiClient.get('/dashboard/kpis');
            setKpis(kpiResponse.data);
            const listResponse = await apiClient.get('/dashboard/pqrs-list?page=1&per_page=50');
            setListaPqrs(listResponse.data.items);
        } catch (err) {
            console.error("Error cargando datos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Función que llama el Modal cuando se responde exitosamente
    const handleUpdateSuccess = () => {
        fetchData(); // Recargamos la lista para ver el cambio a CERRADO
    };

    if (loading) return <div className="dashboard-container">Cargando...</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Panel de Gestión PQRS</h1>
                <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
            </div>

            {/* Tarjetas KPIs */}
            {kpis && (
                <div className="kpi-grid">
                    <div className="kpi-card total"><h2>Total</h2><p>{kpis.total_pqrs}</p></div>
                    <div className="kpi-card recibido"><h2>Nuevos</h2><p>{kpis.total_recibido}</p></div>
                    <div className="kpi-card gestion"><h2>En Proceso</h2><p>{kpis.total_en_gestion}</p></div>
                    <div className="kpi-card cerrado"><h2>Cerrados</h2><p>{kpis.total_cerrado}</p></div>
                </div>
            )}

            <div className="table-container">
                <h2>Solicitudes Recientes</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table className="pqrs-table">
                        <thead>
                            <tr>
                                <th>Radicado</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Asunto</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaPqrs.length > 0 ? (
                                listaPqrs.map((pqrs) => (
                                    <tr key={pqrs.id_pqrs}>
                                        <td className="font-mono">{pqrs.numero_radicado}</td>
                                        <td>
                                            {/* Badge de TIPO */}
                                            <span className={`badge tipo-${pqrs.tipo_solicitud?.toLowerCase()}`}>
                                                {pqrs.tipo_solicitud}
                                            </span>
                                        </td>
                                        <td>{pqrs.fecha_creacion ? new Date(pqrs.fecha_creacion).toLocaleDateString() : 'N/A'}</td>
                                        <td>{pqrs.nombre_usuario}</td>
                                        <td>{pqrs.asunto}</td>
                                        <td>
                                            {/* Badge de ESTADO (Semaforización) */}
                                            <span className={`badge status-${pqrs.estado?.toLowerCase()}`}>
                                                {pqrs.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn-action"
                                                onClick={() => setRadicadoSeleccionado(pqrs.numero_radicado)}
                                            >
                                                Gestionar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                                        No hay solicitudes registradas actualmente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RENDERIZADO CONDICIONAL DEL MODAL */}
            {radicadoSeleccionado && (
                <ModalGestion 
                    radicado={radicadoSeleccionado} 
                    onClose={() => setRadicadoSeleccionado(null)} 
                    onUpdate={handleUpdateSuccess}
                />
            )}
        </div>
    );
}

export default DashboardPage;