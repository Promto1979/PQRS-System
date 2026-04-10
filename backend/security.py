from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

# Configuración de cifrado
# Usamos sha256_crypt, que no tiene la limitación de 72 bytes
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# Configuración de Tokens JWT
SECRET_KEY = "TU_LLAVE_SECRETA_MUY_SEGURA" # Esto debe ir en variables de entorno
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña plana contra un hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Genera un hash para una contraseña.
    NOTA: Se trunca la contraseña a 72 bytes, ya que bcrypt no acepta más.
    """
    # ¡Línea CRÍTICA! Limita la contraseña a 72 caracteres
    truncated_password = password[:72] 
    
    # Asegúrate de usar la contraseña truncada aquí
    return pwd_context.hash(truncated_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un nuevo token de acceso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt