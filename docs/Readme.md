# Documentación de Gestión Ágil — VEXTOR

## 1. Introducción

Este directorio contiene la documentación correspondiente a la gestión de requisitos, historias de usuario, restricciones y Product Backlog de nuestro proyecto **VEXTOR**.

VEXTOR es un sistema web orientado a la **gestión de rutas, mantenimiento y seguimiento operativo de vehículos de transporte especial**.

La documentación permite mantener la trazabilidad entre las necesidades del proyecto, los requisitos definidos, las historias de usuario y las actividades que posteriormente serán gestionadas mediante **GitHub Projects**.

El objetivo es que nuestro equipo pueda organizar el desarrollo de manera ágil, manteniendo una relación clara entre:

**Requisitos → Historias de Usuario → Product Backlog → Issues → Sprints → Desarrollo → Pull Requests → Entrega**

---

# 2. Objetivo de esta documentación

La documentación ubicada en esta carpeta tiene como objetivos:

- Organizar los requisitos funcionales y no funcionales del sistema.
- Definir las historias de usuario del proyecto.
- Identificar las restricciones que afectan el desarrollo.
- Construir y priorizar el Product Backlog.
- Mantener la trazabilidad entre requisitos e historias de usuario.
- Facilitar la planificación de los Sprints.
- Servir como referencia para la creación de Issues en GitHub.
- Permitir realizar seguimiento al avance del proyecto.
- Mantener una documentación organizada y versionada dentro del repositorio.

---

# 3. Estructura de la documentación

La carpeta `docs` contiene los siguientes documentos:

| Documento | Descripción |
|---|---|
| `RFS.md` | Contiene los Requisitos Funcionales del sistema VEXTOR. |
| `RNFS.md` | Contiene los Requisitos No Funcionales del sistema. |
| `HUS.md` | Contiene las Historias de Usuario que representan las necesidades de los usuarios del sistema. |
| `Restricciones.md` | Contiene las restricciones identificadas para el desarrollo y funcionamiento del sistema. |
| `Product_Backlog.md` | Contiene el Product Backlog priorizado y organizado para planificar el desarrollo. |
| `Readme.md` | Documento índice que explica la finalidad y relación de la documentación. |

---

# 4. Requisitos Funcionales

Los **Requisitos Funcionales (RF)** describen las funcionalidades que debe proporcionar el sistema VEXTOR.

Estos requisitos representan acciones, procesos y servicios que el sistema debe permitir realizar a los usuarios.

Los requisitos funcionales se encuentran documentados en:

**[RFS.md](./RFS.md)**

Cada requisito funcional sirve como fuente para identificar y construir historias de usuario relacionadas con una funcionalidad específica.

La trazabilidad esperada es:

**RF → HU → Issue → Sprint → Implementación**

---

# 5. Requisitos No Funcionales

Los **Requisitos No Funcionales (RNF)** establecen características de calidad y condiciones que debe cumplir el sistema.

Entre las categorías consideradas se encuentran:

- Rendimiento.
- Seguridad.
- Usabilidad.
- Disponibilidad.
- Mantenibilidad.
- Escalabilidad.

Los requisitos no funcionales se encuentran documentados en:

**[RNFS.md](./RNFS.md)**

Estos requisitos sirven como criterios generales que deben mantenerse durante el desarrollo del sistema.

---

# 6. Historias de Usuario

Las **Historias de Usuario (HU)** representan las necesidades de los usuarios desde una perspectiva funcional.

Cada historia utiliza la estructura:

> Como [rol], quiero [acción] para [beneficio].

Las historias de usuario permiten convertir los requisitos del sistema en unidades de trabajo que pueden ser gestionadas mediante Issues en GitHub.

Las historias se encuentran documentadas en:

**[HUS.md](./HUS.md)**

Cada historia debe contar con criterios de aceptación que permitan determinar cuándo una funcionalidad cumple con lo solicitado.

La estructura general de una historia es:

```text
HU-XX

Como [rol],
quiero [acción],
para [beneficio].

Criterios de aceptación:
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

# 7. Restricciones

Las **restricciones** corresponden a las condiciones, limitaciones y reglas que deben ser consideradas durante el desarrollo del sistema VEXTOR.

Estas condiciones pueden afectar las decisiones relacionadas con:

- Tecnologías utilizadas.
- Arquitectura del sistema.
- Seguridad.
- Desarrollo.
- Infraestructura.
- Metodología de trabajo.
- Herramientas utilizadas por el equipo.

Las restricciones definidas para el proyecto se encuentran documentadas en:

**[Restricciones.md](./Restricciones.md)**

Estas deben ser tenidas en cuenta durante la planificación y desarrollo de las historias de usuario.

---

# 8. Product Backlog

El **Product Backlog** contiene el conjunto de historias de usuario y trabajos identificados para el desarrollo de VEXTOR.

El backlog permite organizar, priorizar y planificar las funcionalidades que serán desarrolladas por el equipo.

El Product Backlog se encuentra documentado en:

**[Product_Backlog.md](./Product_Backlog.md)**

La información utilizada para organizar el backlog incluye:

- Orden.
- Identificador de Historia de Usuario.
- Descripción.
- Rol.
- Épica.
- Prioridad.
- Puntos de historia.
- WSJF.
- Sprint sugerido.
- Origen.

El Product Backlog constituye la fuente para posteriormente crear los Issues correspondientes en GitHub Projects.

---

# 9. Priorización del Backlog

Las historias de usuario son priorizadas teniendo en cuenta su importancia para el proyecto y el valor que aportan al desarrollo de VEXTOR.

La priorización permite determinar qué historias deben ser abordadas primero durante los diferentes Sprints.

El flujo de trabajo será:

**Product Backlog → Priorización → Sprint Planning → Sprint Actual**

Los puntos de historia permiten estimar el esfuerzo requerido para desarrollar cada historia.

El indicador **WSJF (Weighted Shortest Job First)** puede utilizarse como apoyo para ordenar las historias considerando su valor y esfuerzo.

---

# 10. Trazabilidad

La trazabilidad permite relacionar los requisitos del sistema con las historias de usuario y las actividades realizadas durante el desarrollo.

En VEXTOR se busca mantener la siguiente relación:

**RF → HU → Product Backlog → Issue → Sprint → Pull Request → Implementación**

De esta manera, cada funcionalidad puede ser relacionada con el requisito que le dio origen.

La trazabilidad permite responder:

- ¿Qué requisito origina la funcionalidad?
- ¿Qué historia de usuario representa ese requisito?
- ¿En qué Issue se está trabajando?
- ¿En qué Sprint fue planificada?
- ¿Qué Pull Request implementa la historia?
- ¿La historia cumple sus criterios de aceptación?

---

# 11. GitHub Projects

**GitHub Projects** será utilizado como herramienta principal para gestionar el trabajo del equipo y realizar seguimiento al Product Backlog.

El tablero tendrá los siguientes estados:

| Estado | Descripción |
|---|---|
| Backlog | Historias pendientes de planificación. |
| Sprint Actual | Historias seleccionadas para el Sprint. |
| En Progreso | Historias actualmente en desarrollo. |
| En Revisión (PR) | Historias cuyo desarrollo está pendiente de revisión mediante Pull Request. |
| Hecho | Historias que cumplen la Definition of Done. |

Cada Historia de Usuario del Product Backlog podrá convertirse en un Issue dentro del repositorio.

El título de los Issues seguirá el formato:

**[HU-XX] Como <rol>, quiero <acción> para <beneficio>**

Los Issues deberán incluir sus respectivos criterios de aceptación.

---

# 12. Sprints

El desarrollo del proyecto se organizará mediante Sprints.

Cada Sprint corresponde a un periodo de trabajo en el cual el equipo selecciona un conjunto de historias del Product Backlog que pueden ser desarrolladas.

El proceso será:

**Product Backlog → Sprint Planning → Sprint Actual → Desarrollo → Revisión → Hecho**

Los Sprints podrán ser agrupados mediante **Milestones de GitHub** para facilitar el seguimiento del avance.

---

# 13. Roles del equipo

Para la gestión ágil del proyecto se consideran los siguientes roles:

| Rol | Responsabilidad |
|---|---|
| Scrum Master | Facilita las ceremonias, ayuda a remover bloqueos y cuida el proceso. |
| Product Owner (PO) | Prioriza el Product Backlog y valida los criterios de aceptación. |
| Dev Backend | Desarrolla las funcionalidades correspondientes al backend. |
| Dev Frontend | Desarrolla las funcionalidades correspondientes al frontend. |
| QA | Verifica el cumplimiento de los criterios de aceptación. |

En un equipo pequeño los integrantes pueden asumir diferentes responsabilidades durante los Sprints.

---

# 14. Ceremonias Scrum

## 14.1 Daily

La Daily permite realizar un seguimiento rápido del trabajo realizado y de los posibles bloqueos.

Cada integrante responde:

**Ayer:** ¿Qué completé?

**Hoy:** ¿Qué voy a hacer?

**Bloqueos:** ¿Existe algo que me esté deteniendo?

---

## 14.2 Sprint Review

La Sprint Review permite presentar al instructor y al equipo el resultado del Sprint.

Se debe registrar:

- Objetivo del Sprint.
- Historias completadas.
- Historias no completadas y motivo.
- Funcionalidades demostradas.
- Porcentaje de avance acumulado.

---

## 14.3 Retrospectiva

La retrospectiva permite analizar el funcionamiento del equipo al finalizar el Sprint.

Se revisará:

- ¿Qué salió bien?
- ¿Qué no salió bien?
- ¿Qué vamos a cambiar en el próximo Sprint?

---

# 15. Definition of Done

Una Historia de Usuario solamente podrá pasar al estado **Hecho** cuando cumpla las condiciones establecidas por el equipo.

Como mínimo:

- [ ] El código cumple los criterios de aceptación.
- [ ] El Pull Request fue revisado por al menos un compañero.
- [ ] El CI pasó correctamente las pruebas y validaciones.
- [ ] El Pull Request fue integrado a `develop`.
- [ ] No existe código de depuración innecesario.
- [ ] No existen `console.log` o `print` utilizados únicamente para depuración.
- [ ] No existen TODOs sin un Issue asociado.

Una historia que no cumpla estos criterios no deberá considerarse terminada.

---

# 16. Flujo de trabajo

El trabajo del equipo seguirá un flujo basado en ramas:

**feature/* → develop → main**

Las ramas `feature/*` estarán relacionadas con una Historia de Usuario o tarea concreta.

El flujo general será:

```text
Product Backlog
      ↓
GitHub Issue
      ↓
Sprint
      ↓
feature/*
      ↓
Desarrollo
      ↓
Pull Request
      ↓
Revisión
      ↓
develop
      ↓
Checkpoint del Sprint
      ↓
main