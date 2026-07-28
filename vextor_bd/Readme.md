# Arquitectura de Base de Datos — VEXTOR 

Este repositorio contiene la definición formal y el esquema DDL de la base de datos relacional para la plataforma **VEXTOR**, estructurada sobre **PostgreSQL**. Está optimizada para garantizar integridad referencial, alta seguridad en la capa de persistencia y escalabilidad en entornos de logística de transporte.

---

## Arquitectura de Identificación UUID Nativa en PostgreSQL

El diseño aprovecha el tipo de dato nativo **`UUID`** de PostgreSQL junto a la función `gen_random_uuid()` para todas las Llaves Primarias (PK) y Foráneas (FK).

### Ventajas Técnicas del tipo `UUID` Nativo en PostgreSQL:
1. **Rendimiento de Almacenamiento:** PostgreSQL almacena internamente un tipo `UUID` en solo **16 bytes**, comparado con los 36 bytes que ocuparía un `VARCHAR` / `CHAR(36)`, optimizando el espacio en disco e índices B-Tree.
2. **Seguridad y Prevención de Scraping:** Elimina secuenciales enteros para evitar ataques de enumeración sobre la API o interfaz de usuario.
3. **Escalabilidad y Desacoplamiento:** Permite la generación de identificadores únicos directamente en el backend o en la base de datos sin colisión en arquitecturas distribuidas.

---

## Justificación y Dominio de la Base de Datos

La base de datos responde a los requerimientos clave del sistema:

* **Control de Acceso Basado en Roles (RBAC):** Gestión granular de perfiles mediante la segregación entre `ROL` y `USUARIO`.
* **Control Operativo de Flota:** Monitoreo activo de kilometraje y estado operativo de vehículos (`VEHICULO`).
* **Gestión de Personal:** Trazabilidad de licencias y estados del conductor (`CONDUCTOR`).
* **Despacho y Planificación:** Control preciso del ciclo de vida de cada itinerario (`RUTA`).
* **Asignaciones Dinámicas:** Registro histórico e independiente de qué conductor y vehículo cubren determinada ruta (`ASIGNACION_CONDUCTOR`, `ASIGNACION_VEHICULO`).
* **Gestión de Contingencias:** Captura en tiempo real de imprevistos operativos con soporte de evidencias (`NOVEDAD`).
* **Módulo de Auditoría y Métricas:** Trazabilidad de reportes generados por los usuarios (`REPORTE`).

---

## Diccionario de Entidades y Propósitos

| Entidad | Tipo Identificador | Descripción Técnica |
| :--- | :--- | :--- |
| **`ROL`** | `UUID` | Catálogo de perfiles y niveles de privilegios dentro del sistema. |
| **`USUARIO`** | `UUID` | Entidad principal de autenticación, hash de credenciales y estado del usuario. |
| **`CONDUCTOR`** | `UUID` | Perfil técnico y laboral del operador; vinculado 1:1 con `USUARIO`. |
| **`VEHICULO`** | `UUID` | Ficha técnica de flota, métricas de kilometraje y alertas de mantenimiento. |
| **`RUTA`** | `UUID` | Datos geográficos (origen/destino) y timestamps de ejecución. |
| **`ASIGNACION_CONDUCTOR`**| `UUID` | Relación N:M histórica entre rutas y conductores asignados. |
| **`ASIGNACION_VEHICULO`** | `UUID` | Relación N:M histórica entre rutas y la flota vehicular desplegada. |
| **`NOVEDAD`** | `UUID` | Bitácora de incidencias reportadas por conductores durante la ruta. |
| **`REPORTE`** | `UUID` | Registro de logs de exportación de informes analíticos. |

---

## Especificaciones Técnicas

* **Motor:** PostgreSQL 13+ (compatible con `gen_random_uuid()`).
* **Encoding:** `UTF8`.
* **Manejo de Fechas:** `TIMESTAMP` para eventos con fecha y hora, `DATE` para fechas laborales.
* **Integridad Reglada:** Restricciones `CHECK` para garantizar el cumplimiento de estados finitos en cada flujo.


