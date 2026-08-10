# Trazabilidad de Requisitos – VEXTOR

## 1. Introducción

La trazabilidad de VEXTOR permite relacionar los requisitos funcionales con las historias de usuario y posteriormente con los elementos de gestión del desarrollo.

El objetivo es garantizar que cada funcionalidad desarrollada pueda relacionarse con un requisito previamente identificado.

El flujo de trazabilidad definido para el proyecto es:

**RF → HU → Product Backlog → Issue → Sprint → Pull Request → Implementación**

---

## 2. Matriz de Trazabilidad

| Requisito Funcional | Descripción RF | Historia de Usuario | Descripción HU | Estado de trazabilidad |
|---|---|---|---|---|
| RF-001 | Registro de usuarios | HU-06 | Registrar usuarios con los roles definidos | Identificado |
| RF-002 | Inicio de sesión | HU-07 | Iniciar sesión mediante correo y contraseña | Identificado |
| RF-003 | Recuperación de contraseña | HU-08 | Recuperar contraseña mediante correo electrónico | Identificado |
| RF-004 | Registro de vehículos | HU-01 | Registrar nuevos vehículos | Identificado |
| RF-005 | Consulta de vehículos | HU-02 | Visualizar el listado de vehículos registrados | Identificado |
| RF-006 | Actualización de vehículos | HU-03 | Modificar los datos de un vehículo | Identificado |
| RF-006 | Actualización de vehículos | HU-04 | Marcar un vehículo como activo o inactivo | Identificado |
| RF-007 | Registro de mantenimiento | HU-15 | Registrar mantenimientos preventivos y correctivos | Identificado |
| RF-008 | Alertas de mantenimiento | HU-15 | Consultar y gestionar información relacionada con mantenimiento y alertas | Identificado |
| RF-009 | Registro de conductores | HU-05 | Registrar conductores | Identificado |
| RF-010 | Asignación de conductores | HU-09 | Asignar conductores a vehículos y rutas | Identificado |
| RF-011 | Creación de rutas | HU-10 | Crear rutas de transporte | Identificado |
| RF-012 | Programación de rutas | HU-11 | Programar fechas y horarios de las rutas | Identificado |
| RF-013 | Seguimiento GPS | HU-12 | Visualizar la ubicación de los vehículos mediante GPS | Identificado |
| RF-014 | Reportes de novedades | HU-13 | Reportar novedades durante la operación | Identificado |
| RF-015 | Generación de reportes | HU-14 | Generar reportes administrativos | Identificado |

---

## 3. Relación RF → HU

### RF-001 → HU-06

**RF-001:** Registro de usuarios.

**HU-06:** Como Administrador, quiero registrar usuarios con los roles definidos para mejorar la gestión operativa.

---

### RF-002 → HU-07

**RF-002:** Inicio de sesión.

**HU-07:** Como Usuario, quiero iniciar sesión mediante correo y contraseña para mejorar la gestión operativa.

---

### RF-003 → HU-08

**RF-003:** Recuperación de contraseña.

**HU-08:** Como Usuario, quiero recuperar la contraseña mediante correo electrónico para mejorar la gestión operativa.

---

### RF-004 → HU-01

**RF-004:** Registro de vehículos.

**HU-01:** Como Administrador, quiero registrar nuevos vehículos para mejorar la gestión operativa.

---

### RF-005 → HU-02

**RF-005:** Consulta de vehículos.

**HU-02:** Como Administrador, quiero visualizar el listado de vehículos registrados para mejorar la gestión operativa.

---

### RF-006 → HU-03 y HU-04

**RF-006:** Actualización de vehículos.

**HU-03:** Como Administrador, quiero modificar los datos de un vehículo para mejorar la gestión operativa.

**HU-04:** Como Administrador, quiero marcar un vehículo como inactivo o activo para mejorar la gestión operativa.

---

### RF-007 → HU-15

**RF-007:** Registro de mantenimiento.

**HU-15:** Como Jefe de Flota, quiero registrar mantenimientos preventivos y correctivos y consultar su historial para mejorar la gestión operativa.

---

### RF-008 → HU-15

**RF-008:** Alertas de mantenimiento.

**HU-15:** Como Jefe de Flota, quiero registrar mantenimientos preventivos y correctivos y consultar su historial para mejorar la gestión operativa.

> HU-15 relaciona RF-007 y RF-008 debido a que integra las funcionalidades relacionadas con mantenimiento y sus alertas.

---

### RF-009 → HU-05

**RF-009:** Registro de conductores.

**HU-05:** Como Administrador, quiero registrar conductores para mejorar la gestión operativa.

---

### RF-010 → HU-09

**RF-010:** Asignación de conductores.

**HU-09:** Como Administrador, quiero asignar conductores a vehículos y rutas para mejorar la gestión operativa.

---

### RF-011 → HU-10

**RF-011:** Creación de rutas.

**HU-10:** Como Administrador, quiero crear rutas de transporte para mejorar la gestión operativa.

---

### RF-012 → HU-11

**RF-012:** Programación de rutas.

**HU-11:** Como Administrador, quiero programar fechas y horarios de las rutas para mejorar la gestión operativa.

---

### RF-013 → HU-12

**RF-013:** Seguimiento GPS.

**HU-12:** Como Jefe de Flota, quiero visualizar la ubicación de los vehículos mediante GPS para mejorar la gestión operativa.

---

### RF-014 → HU-13

**RF-014:** Reportes de novedades.

**HU-13:** Como Conductor, quiero reportar novedades durante la operación para mejorar la gestión operativa.

---

### RF-015 → HU-14

**RF-015:** Generación de reportes.

**HU-14:** Como Jefe de Flota, quiero generar reportes administrativos para mejorar la gestión operativa.

---

# 4. Trazabilidad con el Product Backlog

Cada Historia de Usuario será incorporada al Product Backlog para posteriormente convertirse en un Issue dentro de GitHub Projects.

La relación esperada será:

**RF → HU → Backlog → Issue**

Actualmente los elementos de gestión de GitHub todavía se encuentran pendientes de asignación:

| HU | RF | Product Backlog | Issue | Sprint | Pull Request | Estado |
|---|---|---|---|---|---|---|
| HU-01 | RF-004 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-02 | RF-005 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-03 | RF-006 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-04 | RF-006 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-05 | RF-009 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-06 | RF-001 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-07 | RF-002 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-08 | RF-003 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-09 | RF-010 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-10 | RF-011 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-11 | RF-012 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-12 | RF-013 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-13 | RF-014 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-14 | RF-015 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |
| HU-15 | RF-007 / RF-008 | Pendiente | Pendiente | Pendiente | Pendiente | Backlog |

---

# 5. Trazabilidad hacia GitHub Projects

Una vez creado el proyecto en GitHub Projects, cada Historia de Usuario será convertida en un Issue.

El flujo será:

```text
RF
 ↓
HU
 ↓
Product Backlog
 ↓
GitHub Issue
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

---

# 6. Criterios de trazabilidad

Una Historia de Usuario se considerará correctamente trazada cuando pueda relacionarse con los elementos correspondientes del proceso de desarrollo.

Los criterios definidos son:

- [ ] La Historia de Usuario tiene un identificador único.
- [ ] La Historia de Usuario está relacionada con uno o más Requisitos Funcionales.
- [ ] La Historia de Usuario está registrada en el Product Backlog.
- [ ] La Historia de Usuario tiene prioridad definida.
- [ ] La Historia de Usuario tiene una estimación en puntos de historia.
- [ ] La Historia de Usuario tiene un Sprint asignado cuando sea planificada.
- [ ] La Historia de Usuario tiene un Issue asociado en GitHub.
- [ ] El Issue contiene los criterios de aceptación correspondientes.
- [ ] El desarrollo de la Historia de Usuario está relacionado con una rama `feature/*`.
- [ ] El desarrollo cuenta con un Pull Request.
- [ ] El Pull Request fue revisado por al menos un integrante del equipo.
- [ ] El Pull Request fue integrado a `develop`.
- [ ] La Historia de Usuario cumple la Definition of Done antes de pasar a `Hecho`.

---

# 7. Estados de la trazabilidad

La trazabilidad se actualizará de acuerdo con el estado en el que se encuentre cada Historia de Usuario.

| Estado | Descripción |
|---|---|
| Backlog | La Historia de Usuario está identificada y pendiente de planificación. |
| Sprint Actual | La Historia fue seleccionada para el Sprint correspondiente. |
| En Progreso | La Historia se encuentra actualmente en desarrollo. |
| En Revisión (PR) | La implementación está terminada y se encuentra en revisión mediante Pull Request. |
| Hecho | La Historia cumple los criterios de aceptación y la Definition of Done. |

---

# 8. Actualización de la trazabilidad

La matriz de trazabilidad será actualizada durante el desarrollo del proyecto.

Inicialmente, los campos relacionados con GitHub Projects, Issues, Sprints y Pull Requests permanecerán como **Pendiente**, debido a que estos elementos serán creados durante la configuración y planificación del proyecto.

A medida que avance el desarrollo se actualizarán:

- Número del Issue.
- Sprint correspondiente.
- Milestone.
- Rama de desarrollo.
- Pull Request.
- Estado de la Historia de Usuario.
- Fecha de finalización, cuando corresponda.

De esta manera, la matriz reflejará el estado real del proyecto.

---

# 9. Relación con GitHub Projects

GitHub Projects será utilizado como herramienta para gestionar visualmente el Product Backlog y realizar seguimiento al trabajo del equipo.

Las Historias de Usuario documentadas en `HUS.md` serán utilizadas como base para crear los Issues.

El proceso será:

```text
HUS.md
   ↓
Product_Backlog.md
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