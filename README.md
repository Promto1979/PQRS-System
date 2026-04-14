# 📨 PQRS-System (Python & React Version)

### Gestión Avanzada de Peticiones, Quejas, Reclamos y Sugerencias
Un sistema moderno y desacoplado desarrollado por **Paramo Labs** para ofrecer una experiencia de usuario fluida y un backend escalable, diseñado para optimizar la atención al ciudadano y la gestión interna.

---

## 🛠️ Stack Tecnológico

### **Backend (Python & FastAPI)**
* **FastAPI:** Framework de alto rendimiento para la construcción de la API RESTful.
* **SQLAlchemy & PyMySQL:** ORM y conector para la gestión de base de datos MySQL (XAMPP) sin escribir SQL puro.
* **Pydantic:** Validación rigurosa de esquemas de datos y tipado.
* **Seguridad:** Implementación de **JWT (JSON Web Tokens)** mediante `python-jose` y cifrado de contraseñas con `Passlib` (sha256_crypt).
* **Notificaciones:** Gestión de envíos por correo electrónico mediante `Smtplib`.

### **Frontend (React & Vite)**
* **React 19:** Biblioteca principal para una interfaz de usuario reactiva y moderna.
* **Vite:** Herramienta de construcción ultra rápida para el flujo de desarrollo.
* **React Router Dom:** Gestión de rutas (Públicas y Protegidas para el Dashboard).
* **Axios:** Cliente HTTP configurado con un **Interceptor** para adjuntar automáticamente el token Bearer en cada petición.
* **CSS Vanilla:** Estilos personalizados y ligeros, priorizando el rendimiento sin dependencias pesadas.

---

## 🚀 Características Principales
- **Interfaz Reactiva:** Experiencia de usuario dinámica y fluida.
- **Seguridad Robusta:** Autenticación de usuarios y protección de rutas privadas.
- **Documentación Interactiva:** API documentada automáticamente con Swagger (disponible en `/docs`).
- **Arquitectura Desacoplada:** Facilita el mantenimiento independiente del Front y el Back.
- **Gestión de Proyectos:** Seguimiento de hitos (Fase 1 completada vía Trello).

---

## 💡 Roadmap de Profesionalización (Próximas Mejoras)
Actualmente, el proyecto se encuentra en una fase de optimización para alcanzar estándares de producción:

1.  **Seguridad de Credenciales:** Migración de claves sensibles (DB y JWT) a archivos de variables de entorno (`.env`).
2.  **Trazabilidad:** Implementación de una tabla de auditoría para registrar el historial de cambios de estado en las PQRS.
3.  **Validación de Adjuntos:** Restricción de formatos seguros (PDF, JPG, PNG) y límites de tamaño (máx 5MB).
4.  **Optimización de UX:** Incorporación de *Spinners* de carga y notificaciones visuales (*Toasts*) para feedback en tiempo real.
5.  **Refactorización:** Reorganización de lógica mediante `APIRouter` para segmentar rutas de autenticación y gestión.

---

## 👨‍💻 Autor
**Jose Alarcón** - Founder of **Paramo Labs S.A.S.**

---

### **Instrucciones para Ejecución Local**

1.  **Backend:**
    ```bash
    # Activar entorno virtual e iniciar servidor
    .\venv\Scripts\activate
    python -m uvicorn main:app --reload
    ```
2.  **Frontend:**
    ```bash
    # Instalar dependencias e iniciar modo desarrollo
    npm install
    npm run dev
    ```

---

## 👨‍💻 Autor
**Jose Alarcón** - Founder of **Paramo Labs S.A.S.**
