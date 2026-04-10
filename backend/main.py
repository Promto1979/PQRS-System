import os 
import shutil 
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form 
from fastapi.staticfiles import StaticFiles
from .database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from typing import List, Optional, Annotated
from datetime import timedelta
from sqlalchemy.orm import Session, joinedload 
from .database import get_db
from . import models, services
from . import security

# Asegura que las tablas existan en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CARPETA DE ADJUNTOS ---
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True) 


# --- CREACIÓN DE DATOS INICIALES (SEMILLA) ---
def create_initial_data():
    """
    Crea los roles básicos y el usuario admin si no existen.
    """
    db = SessionLocal() 
    try:
        # 1. Crear Roles
        admin_rol = services.get_rol_by_name(db, models.UserRole.ADMIN.value)
        if not admin_rol:
            admin_rol = models.Rol(nombre_rol=models.UserRole.ADMIN.value)
            db.add(admin_rol)
        
        gestor_rol = services.get_rol_by_name(db, models.UserRole.GESTOR.value)
        if not gestor_rol:
            gestor_rol = models.Rol(nombre_rol=models.UserRole.GESTOR.value)
            db.add(gestor_rol)
        
        db.commit()

        # 2. Crear Usuario Admin
        admin_user = services.get_user_by_email(db, "admin@pqrs.com")
        if not admin_user:
            hashed_pass = security.get_password_hash("admin123")
            
            new_admin = models.Usuario(
                username="admin@pqrs.com", 
                email="admin@pqrs.com",
                hashed_password=hashed_pass,
                id_rol=admin_rol.id_rol 
            )
            db.add(new_admin)
            db.commit()
            print("INFO:     Usuario Administrador y Roles creados exitosamente.")

    except Exception as e:
        print(f"ERROR: Fallo la creación de datos iniciales: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    print("INFO:     Verificando datos iniciales...")
    create_initial_data()

# --- CONFIGURACIÓN DE CORS ---
origins = [
    "http://localhost:5173", 
    "http://localhost:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SERVICIO DE ARCHIVOS ESTÁTICOS ---
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Esquema de OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Dependencias de Seguridad (CORRECCIÓN CRÍTICA DE BLOQUEO) ---
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.Usuario: 
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # CORRECCIÓN DE BLOQUEO: Forzamos la carga del Rol (relación) para evitar el bug de bloqueo
    db_user = db.query(models.Usuario) \
                .options(joinedload(models.Usuario.rol)) \
                .filter(models.Usuario.email == username).first() 
    
    if db_user is None:
        raise credentials_exception
    
    return db_user

def RoleChecker(allowed_roles: List[models.UserRole]):
    def get_current_user_with_role(current_user: models.Usuario = Depends(get_current_user)):
        if not current_user.rol:
            # Si get_current_user falló en cargar el rol (lo cual no debería ocurrir ahora)
            raise HTTPException(status_code=403, detail="El usuario no tiene un rol asignado")
            
        user_role_name = current_user.rol.nombre_rol.upper() 

        try:
            user_role_enum = models.UserRole(user_role_name) 
        except ValueError:
            raise HTTPException(status_code=403, detail=f"Rol '{user_role_name}' no permitido o inválido")

        if user_role_enum not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El usuario no tiene permisos suficientes"
            )
        return current_user
    return get_current_user_with_role

# --- Endpoints de la API ---

@app.post("/token", summary="Módulo de inicio de sesión")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = services.get_user_by_email(db, email=form_data.username)
    if not db_user:
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    if not security.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": db_user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/")
def read_root():
    return {"message": "¡Servidor Backend de PQRS corriendo! Usa /docs para la API."}

@app.get("/users/me", response_model=models.User, summary="Verificar usuario actual")
async def read_users_me(current_user: models.Usuario = Depends(get_current_user)):
    return current_user

@app.get("/admin/panel")
async def read_admin_panel(
    current_user: models.Usuario = Depends(RoleChecker([models.UserRole.ADMIN, models.UserRole.SUPERVISOR]))
):
    return {"message": f"Bienvenido al panel de admin, {current_user.username}"}

# --- ENDPOINT DE CREACIÓN (PÚBLICO) ---
@app.post("/pqrs/", 
          response_model=models.PQRSResponse, 
          status_code=status.HTTP_201_CREATED,
          summary="Crea una nueva solicitud de PQRS")
async def create_pqrs(
    tipo_solicitud: Annotated[str, Form()],
    asunto: Annotated[str, Form()],
    descripcion: Annotated[str, Form()],
    nombre_usuario: Annotated[str, Form()],
    email_usuario: Annotated[EmailStr, Form()],
    adjunto: Annotated[Optional[UploadFile], File()] = None,
    db: Session = Depends(get_db) 
):
    # CORRECCIÓN DE ROBUSTEZ: Validar que el tipo de solicitud sea válido
    try:
        models.PQRSTipo(tipo_solicitud.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail="Tipo de solicitud inválido.")
        
    pqrs_data = models.PQRSCreation(
        tipo_solicitud=tipo_solicitud,
        asunto=asunto,
        descripcion=descripcion,
        nombre_usuario=nombre_usuario,
        email_usuario=email_usuario
    )

    adjunto_url_final = None
    if adjunto and adjunto.filename:
        file_name_safe = adjunto.filename.replace(" ", "_")
        file_path = os.path.join(UPLOAD_DIR, file_name_safe)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(adjunto.file, buffer) 
            
        adjunto_url_final = f"/uploads/{file_name_safe}"
    
    # Asumimos que create_new_pqrs es una función asíncrona en services.py
    nueva_pqrs = await services.create_new_pqrs(db, pqrs_data, adjunto_url_final)
    
    return nueva_pqrs

# --- NUEVO ENDPOINT DE GESTIÓN (CRUD: UPDATE) ---
@app.put("/pqrs/gestion/{id}", 
         response_model=models.PQRSDetailResponse,
         summary="Actualiza el estado y registra un comentario de gestión (Protegido)")
async def update_pqrs_status(
    id: int, # ID numérico de la PQRS
    update_data: models.PQRSUpdate, # Datos de la actualización (asumo este modelo en models.py)
    current_user: models.Usuario = Depends(RoleChecker([
        models.UserRole.ADMIN, 
        models.UserRole.SUPERVISOR, 
        models.UserRole.GESTOR
    ])),
    db: Session = Depends(get_db)
):
    """
    Permite a los gestores cambiar el estado (ej. de RECIBIDO a EN_GESTION) y añadir comentarios.
    """
    updated_pqrs = services.update_pqrs_status_and_comment(
        db,
        pqrs_id=id,
        nuevo_estado=update_data.nuevo_estado,
        comentario=update_data.comentario,
        usuario_gestor=current_user.email
    )
    
    if not updated_pqrs:
        raise HTTPException(status_code=404, detail="PQRS no encontrada.")
        
    return updated_pqrs


# --- ENDPOINT PÚBLICO DE CONSULTA ---
@app.get("/pqrs/{radicado}", 
          response_model=models.PQRSDetailResponse,
          summary="Consulta pública por número de radicado")
async def get_pqrs_details(
    radicado: str, 
    db: Session = Depends(get_db)
):
    db_pqrs = services.get_pqrs_by_radicado(db, radicado)
    
    if db_pqrs is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró ninguna solicitud con ese número de radicado.")
    
    return db_pqrs 

# --- ENDPOINT PROTEGIDO DE DETALLE ---
@app.get("/pqrs/detalle/{id}", 
          response_model=models.PQRSDetailResponse,
          summary="Obtiene el detalle completo de una PQRS para gestión (Protegido)")
async def get_pqrs_detail_for_management(
    id: int, # Recibimos el ID numérico
    current_user: models.Usuario = Depends(RoleChecker([
        models.UserRole.ADMIN, 
        models.UserRole.SUPERVISOR, 
        models.UserRole.GESTOR
    ])),
    db: Session = Depends(get_db)
):
    """
    Endpoint protegido para que un gestor vea el detalle completo
    de una solicitud antes de tomar acciones.
    """
    db_pqrs = services.get_pqrs_by_id(db, id)
    
    if db_pqrs is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PQRS no encontrada.")
    
    return db_pqrs

# --- ENDPOINT DE KPIs ---
@app.get("/dashboard/kpis", 
          response_model=models.DashboardKPIs,
          summary="Obtiene los KPIs principales del Dashboard")
async def get_kpis(
    current_user: models.Usuario = Depends(RoleChecker([
        models.UserRole.ADMIN, 
        models.UserRole.SUPERVISOR, 
        models.UserRole.GESTOR
    ])),
    db: Session = Depends(get_db)
):
    kpis = services.get_dashboard_kpis(db)
    return kpis

# --- ENDPOINT DE LISTADO ---
@app.get("/dashboard/pqrs-list",
          response_model=models.PaginatedPQRSResponse,
          summary="Obtiene la lista paginada de PQRS para el dashboard")
async def get_pqrs_list_endpoint(
    current_user: models.Usuario = Depends(RoleChecker([
        models.UserRole.ADMIN, 
        models.UserRole.SUPERVISOR, 
        models.UserRole.GESTOR
    ])),
    page: int = 1,
    per_page: int = 10,
    estado: Optional[str] = None,
    tipo_solicitud: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = services.get_pqrs_list(db, page, per_page, estado, tipo_solicitud)
    return models.PaginatedPQRSResponse(**result)
    
# --- ENDPOINT LEGADO (SIN SEGURIDAD) - LO DEJAMOS POR COMPATIBILIDAD PERO YA NO SE USA ---
@app.put("/pqrs/{radicado}/responder", summary="Responde y cierra una PQRS (LEGADO, INSEGURO)")
async def responder_pqrs_endpoint(
    radicado: str,
    datos: models.PQRSResponseData,
    db: Session = Depends(get_db),
):
    # NOTA: Este endpoint no tiene seguridad. Es una API legada. 
    # La nueva API de gestión debe usar /pqrs/gestion/{id}
    pqrs_actualizada = services.responder_pqrs(
        db, 
        radicado, 
        datos.detalle_respuesta, 
        datos.nuevo_estado
    )
    
    if not pqrs_actualizada:
        raise HTTPException(status_code=404, detail="PQRS no encontrada")
        
    return {"mensaje": "Respuesta guardada exitosamente", "estado": pqrs_actualizada.estado}