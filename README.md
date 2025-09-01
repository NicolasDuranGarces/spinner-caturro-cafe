# Caturro Café — Ruleta & Puntos

Aplicación full‑stack (FastAPI + Vite/React + MySQL + Docker) para:

- Registro/login de clientes por cédula + contraseña (sesión persistente en el cliente).
- Sistema de promociones y ruleta con probabilidades configurables.
- Sistema de puntos por compra y redención solo desde punto físico (vía panel admin).
- Panel de administración protegido por token, validado una sola vez y persistido.

## Tabla de Contenidos

- Introducción
- Arquitectura y Tecnologías
- Estructura del Proyecto
- Variables de Entorno
- Puesta en Marcha (Docker Compose)
- Desarrollo Local y Hot Reload
- Endpoints Principales (API)
- Panel de Administración
- Notas de Seguridad y Buenas Prácticas
- Solución de Problemas Comunes (FAQ)

## Introducción

Este proyecto expone una API con FastAPI, un frontend con Vite/React y una base de datos MySQL, orquestados con Docker Compose. El frontend permite a los usuarios registrarse/iniciar sesión con su cédula y participar en una ruleta de promociones; además, muestra sus puntos acumulados y el historial de tiros. El panel admin permite gestionar promociones y sumar/redimir puntos a clientes desde el punto físico (no desde la app del cliente).

## Arquitectura y Tecnologías

- Backend: FastAPI (Uvicorn), SQLAlchemy, Pydantic (pydantic‑settings), Passlib (bcrypt), PyMySQL
- Frontend: Vite + React, lucide‑react (iconos)
- Base de datos: MySQL 8
- Orquestación: Docker Compose

## Estructura del Proyecto

```
.
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ deps.py
│  │  │  └─ routes.py
│  │  ├─ core/
│  │  │  ├─ config.py         # Settings (env), CORS, root_path, etc.
│  │  │  ├─ database.py       # Engine, SessionLocal, Base
│  │  │  └─ security.py       # Hash/verify password (bcrypt)
│  │  ├─ models/
│  │  │  ├─ cliente.py        # cedula, password_hash, puntos
│  │  │  ├─ promocion.py
│  │  │  ├─ registro_ruleta.py
│  │  │  └─ movimiento_puntos.py
│  │  ├─ schemas/
│  │  │  ├─ auth.py           # Register/Login DTOs
│  │  │  ├─ cliente.py
│  │  │  ├─ promocion.py
│  │  │  ├─ registro.py
│  │  │  └─ puntos.py
│  │  └─ __init__.py
│  ├─ main.py                 # App factory, CORS, rutas, auto‑ALTER simple
│  ├─ requirements.txt
│  └─ Dockerfile
│
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ Navbar.jsx
│  │  │  ├─ Toast.jsx
│  │  │  ├─ RouletteWheel.jsx
│  │  │  ├─ PointsPanel.jsx
│  │  │  ├─ HistoryList.jsx
│  │  │  └─ PromoEditRow.jsx
│  │  ├─ hooks/
│  │  │  └─ useLocalStorage.js
│  │  ├─ lib/
│  │  │  └─ api.js            # apiGet/apiPost...
│  │  ├─ utils/
│  │  │  └─ errors.js         # parseo seguro de errores
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  └─ styles.css
│  ├─ Dockerfile
│  ├─ package.json
│  └─ vite.config.js
│
├─ database/
│  └─ init.sql                # Seed/DDL inicial (montado en MySQL)
│
├─ docker-compose.yml
├─ .env.example               # Plantilla de variables del proyecto
├─ .gitignore
└─ README.md
```

## Variables de Entorno

Usa el archivo de ejemplo y crea tu `.env` en la raíz:

```
cp .env.example .env
```

Variables clave (raíz `.env`):

- Backend
  - `DATABASE_URL` — DSN de SQLAlchemy. Si tu contraseña tiene caracteres especiales, usa URL encoding (p. ej. `!` → `%21`).
  - `ADMIN_TOKEN` — Token para el panel admin (enviado como header `X-Admin-Token`).
  - `CORS_ORIGINS` — Lista separada por comas.
- MySQL (usadas por el contenedor `mysql`)
  - `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- Frontend
  - `VITE_API_URL` — URL base pública del backend (ej. `http://localhost:8005/api`).
- Generales
  - `TZ` — Zona horaria de los contenedores.

Notas:

- El backend ignora variables extra en `.env` (configurado con `extra="ignore"`).
- `docker-compose.yml` consume el `.env` de la raíz.

## Puesta en Marcha (Docker Compose)

1. Construir e iniciar servicios (primera vez o tras cambios de dependencias):

```
docker compose up -d --build
```

2. Servicios disponibles:

- Backend (FastAPI): `http://localhost:8005/api`
- Frontend (Vite dev server): `http://localhost:3005`
- Adminer (DB UI): `http://localhost:8080`

3. Credenciales MySQL en Adminer (si usas el servicio del compose):

- Servidor: `mysql`
- Usuario: `${MYSQL_USER}`
- Contraseña: `${MYSQL_PASSWORD}`
- Base de datos: `${MYSQL_DATABASE}`

4. Logs (opcional):

```
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

## Desarrollo Local y Hot Reload

- Backend: corre con `uvicorn --reload` montando `./backend:/app` (hot reload activo).
- Frontend: corre `npm run dev` en el contenedor Vite (hot reload en `:3005`).
- Cualquier cambio en código dentro de `backend/` o `frontend/` se refleja sin reconstruir imagen (salvo cambios en dependencias).

Si agregas paquetes Python o Node, reconstruye el servicio correspondiente:

```
docker compose build backend
docker compose build frontend
```

## Endpoints Principales (API)

Base: `GET /api/` → `{ status: "ok" }`

- Auth (usuario)

  - `POST /api/auth/register` — { cedula, password, nombre_completo, semestre }
  - `POST /api/auth/login` — { cedula, password }

- Promociones

  - `GET /api/promociones?activas_solo=true`
  - `POST /api/promociones` (admin)
  - `PUT /api/promociones/{promo_id}` (admin)
  - `DELETE /api/promociones/{promo_id}` (admin)

- Ruleta

  - `POST /api/ruleta/{cliente_id}` — registra giro y retorna promoción ganadora + mensaje.
  - `GET /api/registros` (admin) — últimos giros (globales) con paginación.
  - `GET /api/clientes/{cliente_id}/registros` — historial de giros del cliente.

- Puntos

  - `GET /api/clientes/{cliente_id}/puntos` — saldo + movimientos (cliente).
  - `POST /api/puntos/agregar` (admin) — { cedula, puntos, descripcion }.
  - `POST /api/puntos/redimir` (admin) — { cedula, puntos, descripcion }.

- Utilidades admin
  - `GET /api/admin/ping` (admin) — valida `X-Admin-Token`.

Header admin: `X-Admin-Token: <ADMIN_TOKEN>`

## Panel de Administración

- Acceso con el token de admin (se valida contra `/api/admin/ping` y se guarda en `localStorage` para no pedirlo de nuevo).
- Funcionalidades:
  - Crear/editar/eliminar promociones y ver últimas tiradas globales.
  - Sumar/redimir puntos a clientes por cédula (redención solo desde admin/punto físico).

## Notas de Seguridad y Buenas Prácticas

- Secretos y configuración por variables de entorno (no en código).
- CORS configurable vía `CORS_ORIGINS`.
- Contraseñas de usuarios: hash con bcrypt (`passlib[bcrypt]`).
- Migraciones: el proyecto incluye auto‑ALTER simple para nuevas columnas; para producción se recomienda Alembic (migraciones versionadas).
- Frontend desacoplado por componentes y servicios (`lib/api.js`), con manejo uniforme de errores (`utils/errors.js`).

## Solución de Problemas Comunes (FAQ)

- Error MySQL “Access denied for user …”

  - Asegúrate que `DATABASE_URL` y `MYSQL_*` coinciden (usuario/clave/db). Si cambiaste `MYSQL_PASSWORD` con el volumen ya creado, actualiza la clave dentro de MySQL o recrea el volumen `mysql_data`.

- Contraseña con caracteres especiales en `DATABASE_URL`

  - Usa URL encoding: `!` → `%21`, `@` → `%40`, etc.

- Pydantic Settings: “Extra inputs are not permitted …”

  - La configuración usa `extra="ignore"` y `case_sensitive=False` para evitar fallos por variables adicionales o mayúsculas.

- CORS / VITE_API_URL

  - Verifica que `VITE_API_URL` apunta a `http://localhost:8005/api` (o tu dominio) y reconstruye el frontend si cambias `.env`.

- Falta de dependencias (p. ej. `pydantic-settings` o `passlib[bcrypt]`)
  - Reconstruye backend: `docker compose build backend && docker compose up -d backend`.

---

Hecho con cariño para Caturro Café (NIDUGA) ☕
