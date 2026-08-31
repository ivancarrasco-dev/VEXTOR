# Dependencias y Tecnologías de VEXTOR

Este documento detalla todas las librerías, dependencias de software e imports principales utilizados por **VEXTOR**, tanto en el **Frontend (React 19)** como en el **Backend (FastAPI)**.

---

## 1. Frontend (`vextor_fe`)

### 1.1 Dependencias de Producción (`dependencies` en `package.json`)

| Librería | Propósito / Función | Uso en VEXTOR | Ejemplo / Rol |
| :--- | :--- | :--- | :--- |
| **`react`** (`^19.0.0`) | Biblioteca principal para la construcción de interfaces mediante componentes. | Todo el cliente web (`src/`) | Componentes funcionales, JSX, `useState`, `useEffect`, `useContext`, `useRef`. |
| **`react-dom`** (`^19.0.0`) | Renderizador de React para el navegador web. | `src/main.jsx`, Modales (`createPortal`) | Montaje de la aplicación en el DOM (`createRoot`) y portales para cajones/notificaciones. |
| **`react-router-dom`** (`^7.1.5`) | Enrutamiento del cliente (SPA) e historial de navegación. | `src/routes/AppRouter.jsx` | Rutas protegidas (`ProtectedRoute`), navegación programática (`useNavigate`), parámetros (`useParams`). |
| **`axios`** (`^1.19.0`) | Cliente HTTP basando en Promesas para consumo de APIs REST. | `src/pages/*/services/` | Consumo de `/api/auth`, `/api/vehicles`, `/api/routes`, `/api/routing`, `/api/reports`, etc. |
| **`leaflet`** (`^1.9.4`) | Biblioteca JavaScript ligera para mapas interactivos y vectoriales. | `src/components/common/MapComponent.jsx` | Inicialización de mapa, polígonos, capas de teselas (Esri, OSM, OpenTopo), marcadores y popups. |
| **`framer-motion`** (`^12.0.1`) | Motor de animaciones declarativas para React. | `Sidebar.jsx`, `Dashboard.jsx`, modales | Transiciones de colapso de la barra lateral (260px vs 80px), animación de tarjetas y paneles. |
| **`lucide-react`** (`^0.474.0`) | Conjunto de iconos vectoriales modernos y ligeros. | Toda la UI (`src/components/`, `src/pages/`) | Iconos de estado, menú, vehículos (`Truck`), conductores (`User`), rutas (`MapPin`), alertas, etc. |
| **`sweetalert2`** (`^11.26.25`) | Popups y modales interactivos para alertas y confirmaciones. | `src/utils/sweetalert.js` | Confirmación de cierre de sesión, eliminación de registros, alertas de error personalizadas. |
| **`tailwind-merge`** (`^3.0.1`) & **`clsx`** (`^2.1.1`) | Utilidades para fusionar y combinar clases CSS de Tailwind dinámicamente. | `src/utils/cn.js` | Helper `cn(...)` para combinar condicionalmente clases de estilos utilitarios sin conflictos. |
| **`i18next`**, **`react-i18next`**, **`i18`** | Framework de internacionalización. | `src/i18/` | Soporte multilingüe (Español/Inglés). |

### 1.2 Dependencias de Desarrollo (`devDependencies` en `package.json`)

| Librería | Propósito / Función | Uso en VEXTOR |
| :--- | :--- | :--- |
| **`vite`** (`^6.0.7`) | Bundler y servidor de desarrollo ultrarrápido con HMR. | Scripts `pnpm run dev`, `pnpm run build` |
| **`@tailwindcss/vite`** & **`tailwindcss`** (`^4.0.0`) | Framework CSS utilitario versión v4. | Estilos globales (`src/index.css`), selector `.dark` |
| **`eslint`** (`^9.17.0`) | Linter para calidad y estándares de código JavaScript/React. | Script `pnpm run lint` |
| **`playwright`** (`^1.62.1`) | Framework para pruebas end-to-end (E2E) y automatización. | Verificación visual y pruebas automatizadas |

---

## 2. Backend (`vextor_be`)

### 2.1 Dependencias Principales (`requirements.txt`)

| Paquete Python | Propósito / Función | Uso en VEXTOR | Ejemplo / Rol |
| :--- | :--- | :--- | :--- |
| **`fastapi`** (`0.141.1`) | Framework web asíncrono para construir la API REST y WebSockets. | `main.py`, `router_*.py` | Definición de rutas (`APIRouter`), inyección de dependencias (`Depends`), manejo de excepciones HTTP. |
| **`uvicorn`** (`0.52.1`) | Servidor web ASGI de alto rendimiento para Python. | `main.py` | Ejecución del servidor ASGI en desarrollo y producción (`uvicorn main:app --reload`). |
| **`websockets`** (`>=13.0`) | Implementación de cliente y servidor WebSocket en Python. | `router_routes.py` | Canal en tiempo real `/ws/tracking` para retransmisión GPS entre conductores y panel de control. |
| **`SQLAlchemy`** (`2.0.51`) | ORM (Mapeador Objeto-Relacional) y Toolkit SQL para Python. | `database.py`, `models.py` | Conexión a la base de datos PostgreSQL, definición de modelos, ejecuciones de consultas y sesiones. |
| **`psycopg`** / **`psycopg-binary`** (`3.3.4`) | Adaptador oficial de PostgreSQL para Python 3. | `database.py` | Driver dialecto DB (`postgresql+psycopg://`) para comunicación de baja nivel con PostgreSQL/Supabase. |
| **`pydantic`** (`2.13.4`) & **`pydantic_core`** | Validación de datos, parsing y serialización con tipos de Python. | `schemas.py` | Definición de DTOs de entrada y salida, validación de placas, cédulas y celulares colombianos. |
| **`PyJWT[crypto]`** (`2.10.1`) | Creación, firma y verificación de JSON Web Tokens (JWT). | `router_auth.py`, `router_security.py` | Generación y decodificación de tokens de autenticación con algoritmo HS256 y claim `sid` de sesión. |
| **`bcrypt`** (`4.2.1`) | Algoritmo de hashing seguro para contraseñas. | `router_auth.py` | Encriptación unidireccional de contraseñas de usuario (`bcrypt.hashpw`, `bcrypt.checkpw`). |
| **`python-dotenv`** (`1.2.2`) | Carga de variables de entorno desde archivos `.env`. | `database.py`, `services/osrm_client.py` | Lectura de `DATABASE_URL`, `JWT_SECRET_KEY`, `OSRM_URL`, etc. |
| **`email-validator`** (`2.3.0`) | Validación de direcciones de correo electrónico. | `schemas.py` | Validación del formato RFC de correos en registro y modificación de usuarios. |
| **`python-multipart`** (`0.0.20`) | Parser para peticiones HTTP multipart/form-data. | `router_auth.py` | Procesamiento de formularios de login y carga de archivos en FastAPI. |

---

## 3. Clasificación de Imports por Responsabilidad

### 3.1 Frontend (`vextor_fe`)

```javascript
// 1. Interfaz de Usuario (UI & Iconografía)
import React, { useState, useEffect, useContext } from 'react';
import { Truck, User, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 2. Enrutamiento y Navegación SPA
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';

// 3. Mapas y Capas de Representación
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

// 4. Comunicación con la API REST Backend
import axios from 'axios';
import { routeService } from './services/routeService';
import { vehicleService } from './services/vehicleService';

// 5. Estado Global y Autenticación
import { AuthContext, useAuth } from '../context/AuthContext';
import { ThemeContext, useTheme } from '../context/ThemeContext';
```

### 3.2 Backend (`vextor_be`)

```python
# 1. API Framework y WebSockets
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# 2. Base de Datos y ORM (SQLAlchemy)
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, select, update
from sqlalchemy.orm import Session, relationship
from database import get_db, Base, engine

# 3. Validación y Serialización (Pydantic)
from pydantic import BaseModel, EmailStr, Field, field_validator

# 4. Autenticación y Criptografía
import jwt
import bcrypt

# 5. Servicios e Infraestructura Externa
import requests
from services.osrm_client import OsrmClient
```
