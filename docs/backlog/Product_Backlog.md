# Product Backlog – VEXTOR

**Estados:** Backlog → Sprint Actual → En Progreso → En Revisión (PR) → Hecho

**Sprints:** Sprint 1 a Sprint 8, uno por semana del bootcamp.

**Definition of Done:** criterios de aceptación cumplidos; PR revisado; CI en verde; merge a develop; sin debug/TODOs sueltos.

# Product Backlog – VEXTOR

## 1. Introducción

El Product Backlog de VEXTOR contiene el conjunto de Historias de Usuario que representan las funcionalidades necesarias para desarrollar el sistema.

VEXTOR es un sistema web orientado a la gestión de rutas, mantenimiento y seguimiento operativo de vehículos de transporte especial.

El Product Backlog permite organizar, priorizar y estimar el trabajo que realizará el equipo durante los diferentes Sprints.

La relación principal del proyecto es:

**RF → HU → Product Backlog → Issue → Sprint → Desarrollo → Pull Request → Implementación**

---

## 2. Objetivo

El objetivo del Product Backlog es:

- Organizar las Historias de Usuario del proyecto.
- Establecer el orden de prioridad de cada funcionalidad.
- Relacionar cada Historia de Usuario con su Requisito Funcional.
- Identificar la épica a la que pertenece cada historia.
- Estimar el esfuerzo mediante puntos de historia.
- Calcular el valor de priorización mediante WSJF.
- Proponer un Sprint para cada Historia de Usuario.
- Facilitar posteriormente la creación de Issues en GitHub Projects.
- Mantener la trazabilidad durante todo el desarrollo.

---

## 3. Estados del Backlog

Los estados utilizados para gestionar las Historias de Usuario son:

**Backlog → Sprint Actual → En Progreso → En Revisión (PR) → Hecho**

| Estado | Descripción |
|---|---|
| Backlog | Historia identificada y pendiente de planificación. |
| Sprint Actual | Historia seleccionada para el Sprint en curso. |
| En Progreso | Historia actualmente en desarrollo. |
| En Revisión (PR) | Desarrollo terminado y pendiente de revisión mediante Pull Request. |
| Hecho | Historia terminada y que cumple la Definition of Done. |

---

## 4. Sprints

El proyecto se organizará mediante Sprints semanales, siguiendo la planificación establecida por el bootcamp.

| Sprint | Descripción |
|---|---|
| Sprint 1 | Dominio y persistencia |
| Sprint 2 | Autenticación |
| Sprint 3 | API CRUD Core |
| Sprint 4 | Reglas de negocio |
| Sprint 5 | Integración Frontend – Backend |
| Sprint 6 | Flujos secundarios |
| Sprint 7 | Pruebas y corrección de errores |
| Sprint 8 | Cierre y entrega |

---

## 5. Criterios de priorización

Las Historias de Usuario serán priorizadas teniendo en cuenta:

- Valor para el usuario.
- Importancia para el funcionamiento del sistema.
- Dependencias con otras funcionalidades.
- Esfuerzo estimado.
- Riesgo técnico.
- Urgencia de implementación.

Para apoyar la priorización se utilizará el indicador **WSJF (Weighted Shortest Job First)**.

---

## 6. Product Backlog

| Orden | HU | Descripción | Rol | Épica | Prioridad | Puntos | WSJF | Sprint sugerido | Origen | Estado |
|---:|---|---|---|---|---|---:|---:|---|---|---|
| 1 | HU-01 | Registrar nuevos vehículos | Administrador | Gestión de vehículos | Alta | — | — | Sprint 1 | RF-004 | Backlog |
| 2 | HU-02 | Visualizar el listado de vehículos registrados | Administrador | Gestión de vehículos | Alta | — | — | Sprint 1 | RF-005 | Backlog |
| 3 | HU-03 | Modificar los datos de un vehículo | Administrador | Gestión de vehículos | Alta | — | — | Sprint 1 | RF-006 | Backlog |
| 4 | HU-04 | Marcar un vehículo como activo o inactivo | Administrador | Gestión de vehículos | Media | — | — | Sprint 1 | RF-006 | Backlog |
| 5 | HU-05 | Registrar conductores | Administrador | Gestión de conductores | Alta | — | — | Sprint 1 | RF-009 | Backlog |
| 6 | HU-06 | Registrar usuarios con los roles definidos | Administrador | Gestión de usuarios | Alta | — | — | Sprint 2 | RF-001 | Backlog |
| 7 | HU-07 | Iniciar sesión mediante correo y contraseña | Usuario | Autenticación | Alta | — | — | Sprint 2 | RF-002 | Backlog |
| 8 | HU-08 | Recuperar contraseña mediante correo electrónico | Usuario | Autenticación | Media | — | — | Sprint 2 | RF-003 | Backlog |
| 9 | HU-09 | Asignar conductores a vehículos y rutas | Administrador | Gestión operativa | Alta | — | — | Sprint 3 | RF-010 | Backlog |
| 10 | HU-10 | Crear rutas de transporte | Administrador | Gestión de rutas | Alta | — | — | Sprint 3 | RF-011 | Backlog |
| 11 | HU-11 | Programar fechas y horarios de las rutas | Administrador | Gestión de rutas | Alta | — | — | Sprint 3 | RF-012 | Backlog |
| 12 | HU-12 | Visualizar la ubicación de los vehículos mediante GPS | Jefe de Flota | Seguimiento operativo | Alta | — | — | Sprint 5 | RF-013 | Backlog |
| 13 | HU-13 | Reportar novedades durante la operación | Conductor | Novedades | Alta | — | — | Sprint 6 | RF-014 | Backlog |
| 14 | HU-14 | Generar reportes administrativos | Jefe de Flota | Reportes | Media | — | — | Sprint 6 | RF-015 | Backlog |
| 15 | HU-15 | Registrar mantenimientos preventivos y correctivos y consultar su historial | Jefe de Flota | Mantenimiento | Alta | — | — | Sprint 4 | RF-007 / RF-008 | Backlog |

> **Nota:** Los valores de Puntos y WSJF deberán corresponder a la estimación definida por el equipo en el backlog de trabajo.

---

## 7. Relación con los Requisitos Funcionales

Cada Historia de Usuario del Product Backlog tiene como origen uno o más Requisitos Funcionales.

| HU | Requisito Funcional |
|---|---|
| HU-01 | RF-004 |
| HU-02 | RF-005 |
| HU-03 | RF-006 |
| HU-04 | RF-006 |
| HU-05 | RF-009 |
| HU-06 | RF-001 |
| HU-07 | RF-002 |
| HU-08 | RF-003 |
| HU-09 | RF-010 |
| HU-10 | RF-011 |
| HU-11 | RF-012 |
| HU-12 | RF-013 |
| HU-13 | RF-014 |
| HU-14 | RF-015 |
| HU-15 | RF-007 / RF-008 |

---

## 8. Relación con GitHub Projects

Cada Historia de Usuario del Product Backlog será convertida posteriormente en un Issue de GitHub.

El proceso será:

```text
Product Backlog
      ↓
Historia de Usuario
      ↓
GitHub Issue
      ↓
GitHub Projects
      ↓
Sprint / Milestone
      ↓
feature/*
      ↓
Pull Request
      ↓
develop
      ↓
main