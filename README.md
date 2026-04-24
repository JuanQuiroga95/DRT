# Sistema DRT / AIE — Esc. N°1-004 "Dr. Guillermo Rawson"

**Refuerzo de Aprendizajes en Lengua y Matemática mediante TIC**

Godoy Cruz, Mendoza — 2026

---

## Stack

- **Next.js 14** (App Router)
- **Neon PostgreSQL** (serverless)
- **Vercel** (deploy)
- **jose** (JWT auth)
- **bcryptjs** (password hashing)

## Setup rápido

### 1. Crear base de datos en Neon

1. Ir a [neon.tech](https://neon.tech) y crear un proyecto
2. Copiar el connection string

### 2. Configurar variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=una_clave_secreta_super_larga_y_random
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Inicializar la base de datos

Después de deployar o en dev, hacer un POST a `/api/seed`:

```bash
curl -X POST http://localhost:3000/api/seed
```

Esto crea todas las tablas, el usuario admin y el cronograma por defecto.

### 5. Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | rawson2026 | Administrador |
| pamela | rawson2026 | DRT Mañana |
| julieta | rawson2026 | DRT Tarde |
| miriam | rawson2026 | AIE Mañana |
| cecilia | rawson2026 | AIE Tarde |
| juanq | rawson2026 | AIE Tarde |

**Cambiá las contraseñas después del primer login.**

### 6. Dev local

```bash
npm run dev
```

Abre http://localhost:3000

### 7. Deploy a Vercel

```bash
# Opción 1: CLI
npx vercel

# Opción 2: conectar repo de GitHub en vercel.com
```

Configurar las variables de entorno `DATABASE_URL` y `JWT_SECRET` en Vercel → Settings → Environment Variables.

Después del primer deploy, inicializar la DB visitando:
```
POST https://tu-app.vercel.app/api/seed
```

---

## Estructura del proyecto

```
├── app/
│   ├── layout.js              # Layout raíz
│   ├── page.js                # Login
│   ├── dashboard/
│   │   └── page.js            # App principal (7 pestañas)
│   └── api/
│       ├── auth/login/route.js # Login con JWT
│       ├── seed/route.js       # Inicializar DB
│       ├── students/route.js   # CRUD alumnos
│       ├── schedule/route.js   # Cronograma
│       ├── aie/route.js        # Seguimiento AIE
│       ├── evaluations/route.js# Evaluaciones con rúbricas
│       └── attendance/route.js # Asistencia
├── lib/
│   ├── db.js                  # Conexión Neon
│   └── auth.js                # JWT helpers
├── middleware.js               # Protección de rutas
├── schema.sql                  # Schema completo
└── next.config.js
```

## Funcionalidades

1. **Dashboard** — Vista general con stats, equipo docente, agenda del día
2. **Alumnos** — CRUD completo con búsqueda y filtros
3. **Cronograma** — Agenda semanal editable (turnos mañana/tarde)
4. **Seguimiento AIE** — Diagnóstico digital (partes de la PC, encendido/apagado, touchpad, teclado)
5. **Rúbricas** — G-Compris (8 criterios) y Propuesta DALE! (8 criterios)
6. **Evaluaciones** — Registro por alumno/programa con puntajes y niveles PS/S/MS
7. **Asistencia** — Control diario con estados Presente/Tarde/Ausente
