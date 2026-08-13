# Vercar-Autos

Aplicación web para la gestión de inventario y catálogo vehicular con **backend as a service en Supabase** y **despliegue continuo en Vercel**. Panel de administración mobile-first, modo oscuro y actualización en tiempo real.

---

## ✨ Funcionalidades

- **Autenticación** — Inicio de sesión con email/contraseña vía Supabase Auth.
- **Inventario** — CRUD completo de vehículos con tarjetas visuales.
- **Fotografías** — Compresión automática (800px, calidad 70%) y subida a Supabase Storage; la base de datos guarda solo la ruta del archivo.
- **Filtros** — Búsqueda por texto, filtro por transmisión, estado y alertas de vencimiento (SOAT/RTM).
- **Notificaciones** — Alertas visuales para documentos próximos a vencer o vencidos.
- **Importación** — Importación desde Excel (.xlsx) o SQL (`INSERT INTO vehiculos`) y exportación de backup en Excel.
- **Tiempo real** — La vista se actualiza automáticamente con Supabase Realtime (`postgres_changes`).
- **Responsive** — Diseño mobile-first, modo oscuro, glassmorphism.

---

## 🏗️ Arquitectura de Autenticación y Seguridad

### Row Level Security (RLS)

Las políticas RLS de Supabase garantizan lectura/escritura seguras sobre la tabla `vehiculos`, distinguiendo los roles de la base:

| Rol | Operaciones permitidas |
|-----|------------------------|
| `anon` | Solo **lectura** de vehículos con `visible_web = true` (catálogo público). |
| `authenticated` | **Lectura, inserción, actualización y eliminación** de vehículos. |

Políticas definidas en `scripts/migration.sql`:

```sql
-- Lectura: autenticados o vehículos visibles en web (rol anon)
FOR SELECT USING (auth.role() = 'authenticated' OR visible_web = true);

-- Escritura (INSERT / UPDATE / DELETE): solo rol authenticated
WITH CHECK (auth.role() = 'authenticated');
```

El bucket de Storage `vehiculos` también tiene RLS: lectura pública para las fotos y escritura/borrado solo para `authenticated`.

### Manejo resiliente de sesión

- **Prevención de race conditions con `initApp()`** — Toda la inicialización (suscripción `onAuthChange`, registro de listeners y módulos) se ejecuta dentro de `initApp()` con el patrón `try/catch/finally`, garantizando que el indicador de carga se apague siempre y que el arranque no deje la UI en un estado inconsistente si falla la restauración de sesión.
- **Recuperación transparente con el SDK** — La sesión se restaura automáticamente al recargar mediante `getSession()` + `onAuthStateChange` (`INITIAL_SESSION`); el cliente configurado con `autoRefreshToken: true` y `persistSession: true` renueva el token y recupera el estado sin intervención del usuario.
- **Flujo de cambio de vista explícito** — Tras un login exitoso se invoca `handleAuthenticatedUser()` (`showDashboard()`, diagnóstico y arranque del listener Realtime) de forma directa, sin depender únicamente del evento de autenticación.
- **Cierre de sesión robusto** — El logout detiene las suscripciones Realtime **antes** de `signOut()` y, en un bloque `finally`, purga el inventario en memoria, limpia el DOM y regresa siempre a la pantalla de Login, incluso ante errores de red.

### Sanitización XSS

- **Renderizado del DOM** — Todo texto dinámico (nombres de vehículos, placas, ciudades, etc.) se escapa con `sanitizeHTML()` y las URLs se filtran con `sanitizeUrl()` antes de inyectarse en el HTML.
- **Importación de datos** — Los valores procesados desde Excel/SQL se normalizan y sanitizan antes de escribirse en la base y de renderizarse en el panel.

### Timeouts de red

Las llamadas críticas de autenticación (`login` y `logout`) están envueltas con `Promise.race` + `setTimeout` de **15 segundos** (`withTimeout` en `supabase/auth.js`). Si la red no responde, la operación falla de forma controlada, el `finally` apaga siempre el indicador de carga y la UI nunca queda bloqueada en "Iniciando…" o "Cerrando sesión…".

---

## ⚙️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | JavaScript (Vanilla / ES Modules) |
| Estilos | HTML5 / CSS3 + Tailwind CSS 3 |
| Backend | Supabase (Auth + Database/PostgreSQL + Realtime + Storage) |
| Despliegue | Vercel (deploy continuo desde GitHub) |

---

## 📁 Estructura del proyecto

```
index.html                ← Punto de entrada (módulo ES único)
│
├── app/
│   ├── main.js           ← Orquestador, eventos, initApp(), flujo de guardado
│   ├── ui.js             ← Renderizado, modales, filtros, fotos
│   ├── utils.js          ← Formateo, validación, sanitización XSS
│   └── import.js         ← Import/export Excel y SQL
│
├── supabase/
│   ├── config.js         ← Inicialización del cliente Supabase
│   ├── auth.js           ← Login, logout, onAuthChange, sesión, timeouts
│   ├── database.js       ← CRUD + listener en tiempo real
│   └── storage.js        ← Compresión y subida de imágenes
│
├── styles/
│   ├── input.css         ← Directivas @tailwind (input) + compatibilidad
│   ├── output.css        ← Tailwind compilado (generado)
│   └── main.css          ← Estilos personalizados
│
├── scripts/
│   └── migration.sql     ← Esquema, índices, RLS y políticas de Storage
│
├── env.js                ← Configuración del cliente (URL + anon key)
├── logo_empresa/
│   └── logo.jpg          ← Logotipo de la empresa
│
├── tailwind.config.js    ← Tema personalizado Tailwind
├── package.json          ← Scripts npm para build CSS
├── .env.example          ← Plantilla de variables de configuración
└── REQUIREMENTS.txt      ← Documento de requerimientos
```

### Flujo de datos

```
Usuario → index.html (HTTP) → Supabase (JS SDK, módulos ES)
  ├── Auth → Supabase Auth (email/password)
  ├── PostgreSQL → Tabla "vehiculos" (CRUD + Realtime)
  ├── Storage → Bucket "vehiculos" (fotos comprimidas)
  └── Fotos → Compresión (canvas → toBlob) → Storage → URL pública
```

---

## 🚀 Guía de configuración local y despliegue

### Configuración local

1. **Supabase** — Crear un proyecto (o usar uno existente) en [supabase.com](https://supabase.com).
2. **Supabase Auth** — Habilitar el proveedor de email/contraseña y crear al menos un usuario.
3. **Esquema y RLS** — Ejecutar `scripts/migration.sql` en el SQL Editor de Supabase (crea la tabla `vehiculos`, índices, Realtime, políticas RLS y reglas de Storage).
4. **Storage** — Crear un bucket público llamado `vehiculos`.
5. **Realtime** — En `Database > Replication`, habilitar la replicación para la tabla `public.vehiculos`.
6. **Configuración del cliente** — Copiar `env.js` con `SUPABASE_URL` y `SUPABASE_ANON_KEY` (ver `.env.example`). Estos valores se obtienen en `Supabase Dashboard > Project Settings > API`.

> ⚠️ La anon key es pública y se usa solo del lado del cliente. Las claves de servicio (`service_role`) nunca se exponen.

### Puesta en marcha local

Servir la app con un servidor HTTP estático (los ES modules requieren HTTP, no `file://`):

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080` e iniciar sesión con el usuario creado en Supabase Auth.

### Tailwind CSS (desarrollo)

Si se modifican clases de Tailwind en HTML/JS, reconstruir el CSS:

```bash
npm install
npm run build:css      # Generar styles/output.css
npm run watch:css      # Reconstrucción automática
```

### Despliegue en Vercel

1. Subir el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importar el repositorio.
3. **Framework Preset**: `Other` (sitio estático, sin framework).
4. **Build Command**: vacío o `npm run build:css` (solo si se modifican clases de Tailwind).
5. **Output Directory**: raíz del proyecto (dejar vacío).
6. **Deploy** — Vercel genera una URL pública y configura el **despliegue continuo**: cada `git push` a `main` dispara una nueva versión automáticamente.

> No se requieren variables de entorno en Vercel para el frontend: la configuración de Supabase va en `env.js` (anon key pública).
