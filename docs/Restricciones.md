# Restricciones del Proyecto – VEXTOR

## 1. Introducción

Las restricciones del proyecto VEXTOR corresponden a las condiciones, limitaciones y reglas que deben ser consideradas durante el desarrollo, gestión, implementación y funcionamiento del sistema.

Estas restricciones establecen los límites dentro de los cuales deberá desarrollarse el proyecto y complementan los Requisitos Funcionales (RF), Requisitos No Funcionales (RNF) y las Historias de Usuario (HU).

El cumplimiento de estas restricciones permite mantener un proceso de desarrollo organizado, seguro, trazable y acorde con las prácticas de trabajo definidas para el proyecto.

---

# 2. Objetivo

El objetivo de este documento es identificar y documentar las principales restricciones que afectan el desarrollo y gestión de VEXTOR.

Las restricciones permitirán:

- Establecer condiciones para el desarrollo del sistema.
- Definir reglas para el uso del repositorio.
- Establecer el flujo de trabajo mediante Git.
- Mantener la trazabilidad de los requisitos.
- Definir condiciones para la gestión del Product Backlog.
- Establecer condiciones de seguridad.
- Definir condiciones para la contenerización del sistema.
- Establecer condiciones relacionadas con integración continua.
- Mantener los criterios de calidad definidos para el proyecto.

---

# 3. Restricciones de Desarrollo

## R-001 – Tecnologías del proyecto

El sistema VEXTOR deberá desarrollarse utilizando las tecnologías, lenguajes, frameworks y herramientas seleccionadas por el equipo de desarrollo y establecidas en la arquitectura del proyecto.

Cualquier cambio significativo en las tecnologías utilizadas deberá ser evaluado por el equipo antes de su incorporación.

---

## R-002 – Repositorio oficial

El código fuente y la documentación del proyecto deberán mantenerse en el repositorio oficial de GitHub del equipo:

**VEXTOR**

El repositorio será utilizado como fuente principal para controlar las versiones del proyecto y mantener la documentación.

---

## R-003 – Control de versiones

El proyecto deberá utilizar Git como sistema de control de versiones.

Todos los cambios importantes realizados sobre el proyecto deberán quedar registrados mediante commits.

Los commits deberán utilizar mensajes descriptivos y seguir la convención definida por el equipo.

---

## R-004 – Flujo de ramas

El desarrollo deberá seguir el flujo de ramas establecido para el proyecto:

```text
feature/*
     ↓
Pull Request
     ↓
develop
     ↓
main

## R-005 – Uso de GitHub Projects

El Product Backlog y el seguimiento del trabajo del equipo deberán gestionarse mediante GitHub Projects.

---

## R-006 – Gestión por Sprints

El desarrollo del proyecto deberá organizarse mediante Sprints, de acuerdo con la planificación establecida para el proyecto.

---

## R-007 – Trazabilidad

Cada Historia de Usuario deberá estar relacionada con el Requisito Funcional que le dio origen y con los elementos correspondientes del proceso de desarrollo.

La trazabilidad será:

RF → HU → Product Backlog → Issue → Sprint → Pull Request → Implementación

---

## R-008 – Protección de credenciales

Las contraseñas, tokens, claves y demás información sensible no deberán almacenarse directamente en el código fuente ni publicarse en el repositorio.

---

## R-009 – Pull Request

Los cambios realizados en las ramas `feature/*` deberán integrarse mediante Pull Request hacia `develop`.

---

## R-010 – Revisión de código

Todo Pull Request deberá ser revisado por al menos un integrante del equipo antes de ser integrado a `develop`.

---

## R-011 – Integración Continua

Los Pull Requests deberán cumplir las validaciones de CI definidas para el proyecto antes de realizar el Merge.

---

## R-012 – Docker

El proyecto deberá utilizar Docker como herramienta de contenerización, siguiendo las directrices establecidas para el proyecto.

---

## R-013 – Definition of Done

Una Historia de Usuario solamente podrá pasar al estado `Hecho` cuando cumpla los criterios de aceptación, haya sido revisada mediante Pull Request, el CI esté en verde y haya sido integrada a `develop`. 