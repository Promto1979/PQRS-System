from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from . import models, security
from datetime import datetime, timedelta
from typing import Optional, List
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# --- CONSTANTES DE PLAZOS PARA SEMAFORIZACIÓN (TAREA 6) ---
PLAZOS_ATENCION = {
    models.PQRSTipo.PETICION.value: 15,    # 15 días
    models.PQRSTipo.QUEJA.value: 10,       # 10 días
    models.PQRSTipo.RECLAMO.value: 15,     # 15 días
    models.PQRSTipo.SUGERENCIA.value: 5    # 5 días
}
# UMBRAL AMARILLO: El 25% del plazo total.
UMBRAL_AMARILLO = 0.25

# --- SERVICIO DE NOTIFICACIONES (SMTP REAL - TAREA 2) ---

def send_email_notification(email_destinatario: str, radicado: str, asunto: str):
    """
    Envía un correo electrónico real usando Gmail SMTP.
    Requiere las variables de entorno EMAIL_USER y EMAIL_PASS.
    Si no están configuradas, hace un fallback a imprimir en consola.
    """
    # 1. Obtener credenciales de variables de entorno (Seguridad)
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")
    
    # Configuración por defecto para Gmail si no se especifican otras
    smtp_server = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("EMAIL_PORT", "587"))

    # 2. Verificar si tenemos credenciales para enviar real
    if not sender_email or not sender_password:
        print("-------------------------------------------------------")
        print(f"[ALERTA] Credenciales de correo no configuradas (EMAIL_USER/EMAIL_PASS).")
        print(f"         Simulando envío a {email_destinatario}...")
        print(f"[EMAIL SIMULADO] Asunto: {asunto}")
        print(f"[EMAIL SIMULADO] Radicado: {radicado}")
        print("-------------------------------------------------------")
        return

    try:
        # 3. Configurar el mensaje
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email_destinatario
        msg['Subject'] = asunto

        body = f"""
        Hola,
        
        Su solicitud con radicado {radicado} ha recibido una actualización o confirmación.
        
        Por favor ingrese a la plataforma para ver los detalles.
        
        Atentamente,
        Equipo de Atención al Ciudadano - Sistema PQRS
        """
        msg.attach(MIMEText(body, 'plain'))

        # 4. Conexión al servidor SMTP
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls() # Seguridad TLS
        server.login(sender_email, sender_password)
        
        # 5. Enviar
        text = msg.as_string()
        server.sendmail(sender_email, email_destinatario, text)
        server.quit()
        
        print(f"[EMAIL] Correo enviado exitosamente a {email_destinatario}")

    except Exception as e:
        print(f"[ERROR EMAIL] Fallo al enviar correo real: {e}")

# --- USUARIOS Y ROLES ---

def get_rol_by_name(db: Session, nombre_rol: str) -> Optional[models.Rol]:
    """ Busca un rol por su nombre. """
    return db.query(models.Rol).filter(models.Rol.nombre_rol == nombre_rol).first()

def get_rol_by_id(db: Session, id_rol: int) -> Optional[models.Rol]:
    """ Busca un rol por su ID (usado en dependencias de seguridad). """
    return db.query(models.Rol).filter(models.Rol.id_rol == id_rol).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.Usuario]:
    """
    Función para buscar un usuario por email (usado para el login y seguridad).
    Usamos joinedload para cargar el rol inmediatamente para evitar bloqueos.
    """
    return db.query(models.Usuario)\
             .options(joinedload(models.Usuario.rol))\
             .filter(models.Usuario.email == email).first()

# --- PQRS (Creación y Consulta) ---

async def create_new_pqrs(db: Session, pqrs_data: models.PQRSCreation, adjunto_url: str = None):
    # Generar radicado único
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    radicado = f"PQRS-{timestamp}"
    
    db_pqrs = models.PQRS(
        numero_radicado=radicado,
        tipo_solicitud=pqrs_data.tipo_solicitud,
        asunto=pqrs_data.asunto,
        descripcion=pqrs_data.descripcion,
        nombre_usuario=pqrs_data.nombre_usuario,
        email_usuario=pqrs_data.email_usuario,
        url_adjunto=adjunto_url,
        estado=models.PQRSEstado.RECIBIDO,
        fecha_creacion=datetime.now()
    )
    
    db.add(db_pqrs)
    db.commit()
    db.refresh(db_pqrs)
    
    # TAREA 2: ENVIAR NOTIFICACIÓN DE CREACIÓN
    send_email_notification(
        email_destinatario=db_pqrs.email_usuario, 
        radicado=radicado, 
        asunto=f"Confirmación de Radicado: {radicado}"
    )
    # TAREA 3: AUDITORÍA
    print(f"[AUDITORÍA] PQRS {radicado} creada por usuario externo.")
    
    return db_pqrs

def get_pqrs_by_radicado(db: Session, radicado: str) -> Optional[models.PQRS]:
    """ Busca una PQRS por su número de radicado. """
    return db.query(models.PQRS).filter(models.PQRS.numero_radicado == radicado).first()

def get_pqrs_by_id(db: Session, pqrs_id: int) -> Optional[models.PQRS]:
    """ Busca una PQRS por su ID de base de datos. """
    return db.query(models.PQRS).filter(models.PQRS.id_pqrs == pqrs_id).first()


# --- LÓGICA DE GESTIÓN (CRUD: ACTUALIZAR - TAREA 3: AUDITORÍA) ---

def update_pqrs_status_and_comment(
    db: Session,
    pqrs_id: int,
    nuevo_estado: str,
    comentario: str,
    usuario_gestor: str # El usuario que realiza la acción
) -> Optional[models.PQRS]:
    """
    Actualiza el estado de una PQRS, registra la auditoría y envía la notificación.
    """
    
    db_pqrs = get_pqrs_by_id(db, pqrs_id)
    
    if not db_pqrs:
        return None

    # Validar que el nuevo estado sea válido
    try:
        estado_enum = models.PQRSEstado(nuevo_estado.upper())
    except ValueError:
        return None 

    # 1. Actualizar el estado
    db_pqrs.estado = estado_enum
    
    # 2. Manejo de campos de respuesta (cierre y trazabilidad)
    if estado_enum == models.PQRSEstado.CERRADO or estado_enum == models.PQRSEstado.RECHAZADO:
        db_pqrs.detalle_respuesta = comentario 
        db_pqrs.fecha_respuesta = datetime.now()
    
    # 3. Guardar los cambios
    db.commit()
    db.refresh(db_pqrs)
    
    # TAREA 3: AUDITORÍA Y NOTIFICACIÓN
    print(f"[AUDITORÍA] PQRS {db_pqrs.numero_radicado} actualizada a {estado_enum.value} por {usuario_gestor}: {comentario}")
    
    send_email_notification(
        email_destinatario=db_pqrs.email_usuario, 
        radicado=db_pqrs.numero_radicado, 
        asunto=f"Actualización de estado: {estado_enum.value}"
    )

    return db_pqrs


# --- DASHBOARD (KPIs y Listas - TAREA 6: SEMAFORIZACIÓN) ---

def calcular_semaforo(pqrs: models.PQRS) -> str:
    """
    Calcula el color del semáforo (Verde, Amarillo, Rojo, Gris) basado en la fecha de creación y plazos.
    """
    # 1. Si está cerrado o rechazado, el semáforo es GRIS
    if pqrs.estado in [models.PQRSEstado.CERRADO, models.PQRSEstado.RECHAZADO]:
        return "GRIS" 

    # 2. Obtener el plazo total en días
    plazo_dias = PLAZOS_ATENCION.get(pqrs.tipo_solicitud.value, 30) 
    
    # 3. Calcular fechas
    fecha_limite = pqrs.fecha_creacion + timedelta(days=plazo_dias)
    dias_restantes_umbral = plazo_dias * UMBRAL_AMARILLO
    fecha_umbral_amarillo = fecha_limite - timedelta(days=dias_restantes_umbral)
    
    hoy = datetime.now()

    if hoy > fecha_limite:
        return "ROJO" # Vencido
    elif hoy > fecha_umbral_amarillo:
        return "AMARILLO" # Próximo a vencer (en el último 25%)
    else:
        return "VERDE" # Dentro del plazo

def get_dashboard_kpis(db: Session):
    try:
        total_pqrs = db.query(func.count(models.PQRS.id_pqrs)).scalar()
        total_recibido = db.query(func.count(models.PQRS.id_pqrs)).filter(models.PQRS.estado == models.PQRSEstado.RECIBIDO).scalar()
        total_en_gestion = db.query(func.count(models.PQRS.id_pqrs)).filter(models.PQRS.estado == models.PQRSEstado.EN_GESTION).scalar()
        total_cerrado = db.query(func.count(models.PQRS.id_pqrs)).filter(models.PQRS.estado == models.PQRSEstado.CERRADO).scalar()
        total_rechazado = db.query(func.count(models.PQRS.id_pqrs)).filter(models.PQRS.estado == models.PQRSEstado.RECHAZADO).scalar()

        return {
            "total_pqrs": total_pqrs or 0,
            "total_recibido": total_recibido or 0,
            "total_en_gestion": total_en_gestion or 0,
            "total_cerrado": total_cerrado or 0,
            "total_rechazado": total_rechazado or 0
        }
    except Exception as e:
        print(f"Error calculando KPIs: {e}")
        return {
            "total_pqrs": 0, "total_recibido": 0, "total_en_gestion": 0, 
            "total_cerrado": 0, "total_rechazado": 0
        }

def get_pqrs_list(db: Session, page: int = 1, per_page: int = 10, estado: str = None, tipo: str = None) -> dict:
    query = db.query(models.PQRS)
    
    if estado:
        query = query.filter(models.PQRS.estado == estado)
    if tipo:
        query = query.filter(models.PQRS.tipo_solicitud == tipo)
    
    total = query.count()
    offset = (page - 1) * per_page
    items = query.order_by(models.PQRS.fecha_creacion.desc()).offset(offset).limit(per_page).all()
    
    # Procesar la lista para añadir el semáforo (CRÍTICO)
    items_con_semaforo = []
    for pqrs_item in items:
        pqrs_dict = pqrs_item.__dict__.copy() 
        pqrs_dict['semaforo'] = calcular_semaforo(pqrs_item)
        items_con_semaforo.append(pqrs_dict)
    
    return {
        "items": items_con_semaforo, 
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0
    }