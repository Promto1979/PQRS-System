import React, { useState } from 'react';
import axios from 'axios';
import './FormularioPQRS.css';

// URL de la API del Backend 
const API_URL = "http://localhost:8000"; 

// --- 1. Definición de las opciones (Debe coincidir con tu Enum de Python) ---
const TIPOS_SOLICITUD = [
    { value: 'PETICION', label: 'Petición (P)' },
    { value: 'QUEJA',    label: 'Queja (Q)' },
    { value: 'RECLAMO',  label: 'Reclamo (R)' },
    { value: 'SUGERENCIA', label: 'Sugerencia (S)' },
];

function FormularioPQRS() {
    
    // --- 2. Estado de la Data ---
    const [formData, setFormData] = useState({
        tipo_solicitud: TIPOS_SOLICITUD[0].value, // Inicializa con 'PETICION'
        asunto: '',
        descripcion: '',
        nombre_usuario: '',
        email_usuario: '',
    });
    const [archivo, setArchivo] = useState(null);
    const [errores, setErrores] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [respuestaAPI, setRespuestaAPI] = useState(null);

    // --- Funciones de Manejo de Estado ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errores[name]) setErrores({ ...errores, [name]: null });
    };

    const handleFileChange = (e) => {
        setArchivo(e.target.files[0]);
    };

    const validarFormulario = () => {
        let nuevosErrores = {};
        if (!formData.asunto.trim()) nuevosErrores.asunto = "El asunto es obligatorio.";
        if (!formData.descripcion.trim()) nuevosErrores.descripcion = "La descripción es obligatoria.";
        if (!formData.nombre_usuario.trim()) nuevosErrores.nombre_usuario = "Su nombre es obligatorio.";
        if (!formData.email_usuario.trim()) {
             nuevosErrores.email_usuario = "El correo es obligatorio.";
        } else if (!/\S+@\S+\.\S+/.test(formData.email_usuario)) {
             nuevosErrores.email_usuario = "El formato del correo no es válido.";
        }
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    // --- FUNCIÓN DE ENVÍO ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setRespuestaAPI(null); 
        
        if (validarFormulario()) {
            setEnviando(true);
            
            const dataParaAPI = new FormData();
            dataParaAPI.append('tipo_solicitud', formData.tipo_solicitud);
            dataParaAPI.append('asunto', formData.asunto);
            dataParaAPI.append('descripcion', formData.descripcion);
            dataParaAPI.append('nombre_usuario', formData.nombre_usuario);
            dataParaAPI.append('email_usuario', formData.email_usuario);
            
            if (archivo) {
                dataParaAPI.append('adjunto', archivo, archivo.name);
            }

            try {
                const response = await axios.post(`${API_URL}/pqrs/`, dataParaAPI, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                setRespuestaAPI({
                    exito: true,
                    radicado: response.data.numero_radicado,
                });
                
                // Limpiar formulario
                setFormData({
                    tipo_solicitud: TIPOS_SOLICITUD[0].value,
                    asunto: '', descripcion: '', nombre_usuario: '', email_usuario: '',
                });
                setArchivo(null);
                e.target.reset(); 

            } catch (error) {
                console.error("Error al enviar a la API:", error);
                
                // Inicializamos el mensaje genérico
                let mensajeError = "Error al radicar la solicitud. Intente más tarde.";

                // Lógica para leer el error 422 (Validación)
                if (error.response && error.response.status === 422) {
                    let detalles = "Revise los datos.";
                    if (Array.isArray(error.response.data.detail)) {
                        detalles = error.response.data.detail
                            .map(d => `${d.loc[1]}: ${d.msg}`)
                            .join('; ');
                    }
                    mensajeError = `Fallo de validación: ${detalles}`;
                } else if (error.response && error.response.data && error.response.data.detail) {
                     // Otros errores del servidor
                     mensajeError = `Error: ${error.response.data.detail}`;
                }
                
                setRespuestaAPI({ exito: false, mensaje: mensajeError });
            } finally {
                setEnviando(false);
            }
        }
    };

    // --- Renderizado ---
    return (
        <div className="form-container">
            <h2>Creación de PQRS</h2>
            <p>Registre su solicitud a través del siguiente formulario.</p>

            {respuestaAPI && (
                <div className={respuestaAPI.exito ? "alert-success" : "alert-danger"}>
                    {respuestaAPI.exito ? 
                        `¡Éxito! Su solicitud ha sido registrada con el radicado: ${respuestaAPI.radicado}` :
                        respuestaAPI.mensaje
                    }
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="tipo_solicitud">Tipo de Solicitud *</label>
                    <select 
                        name="tipo_solicitud" 
                        value={formData.tipo_solicitud} 
                        onChange={handleInputChange}
                    >
                        {TIPOS_SOLICITUD.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="asunto">Asunto *</label>
                    <input type="text" name="asunto" value={formData.asunto} onChange={handleInputChange} />
                    {errores.asunto && <p className="error-message">{errores.asunto}</p>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="descripcion">Descripción *</label>
                    <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange}></textarea>
                    {errores.descripcion && <p className="error-message">{errores.descripcion}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="nombre_usuario">Su Nombre Completo *</label>
                    <input type="text" name="nombre_usuario" value={formData.nombre_usuario} onChange={handleInputChange} />
                    {errores.nombre_usuario && <p className="error-message">{errores.nombre_usuario}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="email_usuario">Correo Electrónico *</label>
                    <input type="email" name="email_usuario" value={formData.email_usuario} onChange={handleInputChange} />
                    {errores.email_usuario && <p className="error-message">{errores.email_usuario}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="adjunto">Adjuntar Archivo (Opcional)</label>
                    <input type="file" name="adjunto" onChange={handleFileChange} />
                </div>

                <div className="form-group">
                    <button type="submit" disabled={enviando}>
                        {enviando ? "Enviando..." : "Radicar Solicitud"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FormularioPQRS;