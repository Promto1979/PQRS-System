from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any

# --- 1. ENUMERACIONES (Opciones Fijas) ---
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    GESTOR = "GESTOR"
    SUPERVISOR = "SUPERVISOR"
    USER = "USER"

class PQRSTipo(str, enum.Enum):
    PETICION = "PETICION"
    QUEJA = "QUEJA"
    RECLAMO = "RECLAMO"
    SUGERENCIA = "SUGERENCIA"

class PQRSEstado(str, enum.Enum):
    RECIBIDO = "RECIBIDO"
    EN_GESTION = "EN_GESTION"
    CERRADO = "CERRADO"
    RECHAZADO = "RECHAZADO"

# --- 2. MODELOS DE BASE DE DATOS (SQLAlchemy) ---

class Rol(Base):
    __tablename__ = "roles"
    id_rol = Column(Integer, primary_key=True, index=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)
    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuario = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Integer, default=1) # 1 = Activo, 0 = Inactivo
    id_rol = Column(Integer, ForeignKey("roles.id_rol"))
    rol = relationship("Rol", back_populates="usuarios")

class PQRS(Base):
    __tablename__ = "pqrs"
    
    id_pqrs = Column(Integer, primary_key=True, index=True)
    numero_radicado = Column(String(50), unique=True, index=True, nullable=False)
    
    # Usamos Enum para integridad en BD
    tipo_solicitud = Column(Enum(PQRSTipo), nullable=False)
    asunto = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    nombre_usuario = Column(String(150), nullable=False)
    email_usuario = Column(String(150), nullable=False)
    
    url_adjunto = Column(String(300), nullable=True)
    
    estado = Column(Enum(PQRSEstado), default=PQRSEstado.RECIBIDO)
    fecha_creacion = Column(DateTime, default=datetime.now)
    
    detalle_respuesta = Column(Text, nullable=True)
    fecha_respuesta = Column(DateTime, nullable=True)

# --- 3. SCHEMAS DE PYDANTIC (Validación API) ---

# --- USUARIOS ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: UserRole

class User(UserBase):
    id_usuario: int
    is_active: bool = Field(..., description="Estado de activación")
    
    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

# --- PQRS ---
class PQRSCreation(BaseModel):
    tipo_solicitud: str 
    asunto: str
    descripcion: str
    nombre_usuario: str
    email_usuario: EmailStr

class PQRSResponseData(BaseModel):
    detalle_respuesta: str
    nuevo_estado: str

class PQRSResponse(BaseModel):
    numero_radicado: str
    estado: PQRSEstado
    fecha_creacion: datetime
    class Config:
        from_attributes = True

class PQRSDetailResponse(PQRSResponse):
    id_pqrs: int
    tipo_solicitud: PQRSTipo
    asunto: str
    descripcion: str
    nombre_usuario: str
    email_usuario: str
    url_adjunto: Optional[str] = None
    detalle_respuesta: Optional[str] = None
    fecha_respuesta: Optional[datetime] = None

# --- GESTIÓN Y DASHBOARD ---

class PQRSUpdate(BaseModel):
    nuevo_estado: str
    comentario: str

class DashboardKPIs(BaseModel):
    total_pqrs: int
    total_recibido: int
    total_en_gestion: int
    total_cerrado: int
    total_rechazado: int

class PQRSListItem(BaseModel):
    id_pqrs: int
    numero_radicado: str
    asunto: str
    nombre_usuario: str
    email_usuario: EmailStr
    tipo_solicitud: str 
    estado: str       
    fecha_creacion: datetime
    
    # Campo calculado para semaforización
    semaforo: str = Field(..., description="Color: VERDE, AMARILLO, ROJO, GRIS")
    
    class Config:
        from_attributes = True

class PaginatedPQRSResponse(BaseModel):
    items: List[PQRSListItem]
    total: int
    page: int
    per_page: int
    total_pages: int