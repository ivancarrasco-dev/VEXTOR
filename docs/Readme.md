# Documentación Técnica de VEXTOR

Bienvenido a la documentación técnica de **VEXTOR**, la plataforma SaaS de gestión de flotas vehiculares, seguimiento GPS en tiempo real, asignación de rutas, mantenimientos y analítica logísticas.

Esta carpeta contiene la documentación detallada del sistema dividida por tópicos arquitectónicos y funcionales para facilitar el onboarding de desarrolladores y administradores del sistema.

---

## Índice de Documentación Técnica

| Documento | Descripción |
| :--- | :--- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura del sistema, topología de capas (Frontend React, FastAPI Backend, PostgreSQL Supabase, OSRM Docker), diagramas de componentes y mapas de dependencias. |
| [API.md](./API.md) | Especificación completa de los endpoints HTTP/REST y WebSockets de FastAPI, incluyendo payloads, parámetros, respuestas y RBAC. |
| [DATABASE.md](./DATABASE.md) | Modelo relacional de PostgreSQL, esquemas de tablas, llaves primarias UUID v4, llaves foráneas, índices, restricciones CheckConstraint y datos semilla. |
| [FLOWS.md](./FLOWS.md) | Flujos funcionales de extremo a extremo (Autenticación, Registro público con rol Usuario, Gestión de Vehículos, Asignación y Operación de Rutas con GPS en tiempo real, Notificaciones y Auditoría). |
| [SECURITY.md](./SECURITY.md) | Esquema de seguridad, autenticación JWT, cookies HttpOnly, sesiones dinámicas en `sesion_usuario`, hash bcrypt de contraseñas, cambio obligatorio de clave y rate limiting. |
| [OSRM.md](./OSRM.md) | Instancia propia de OSRM en Docker (MLD Colombia puerto 5000), pipeline de procesamiento con `osrm-tools`, proxy FastAPI y pruebas de routing. |
| [backlog/Readme.md](./backlog/Readme.md) | Documentación de requisitos funcionales (RFS), requisitos no funcionales (RNFS), historias de usuario (HUS), restricciones y Product Backlog. |

---

## Módulos de Código

Para explorar la documentación técnica a nivel de código y carpetas específicas:

- **Frontend (React 19 + Tailwind CSS v4):** [`../vextor_fe/README.md`](../vextor_fe/README.md)
- **Backend (FastAPI + SQLAlchemy):** [`../vextor_be/README.md`](../vextor_be/README.md)
- **Base de Datos (PostgreSQL SQL DDL):** [`../vextor_bd/Readme.md`](../vextor_bd/Readme.md)

---

## Navegación de la Documentación

```text
                  README.md (Raíz del proyecto)
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
   docs/README.md (Técnico General)   vextor_fe/README.md / vextor_be/README.md
         │                                     │
 ┌───────┼───────┬────────┬────────┐           └─► Módulos individuales / componentes
 ▼       ▼       ▼        ▼        ▼
ARCH.   API.md  DB.md   FLOWS.md  SEC.md
```
