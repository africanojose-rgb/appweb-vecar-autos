# Vecar Autos — Titanium Showroom Panel

Panel de administración de inventario vehicular para **Titanium Showroom**. Aplicación frontend que utiliza **Supabase** (Auth + PostgreSQL + Storage + Realtime) como backend, sin necesidad de servidor propio.

---

## ✨ Funcionalidades

- **Autenticación** — Inicio de sesión con email/contraseña vía Supabase Auth.
- **Inventario** — CRUD completo de vehículos con tarjetas visuales.
- **Fotografías** — Compresión automática (800px, calidad 70%) y subida a Supabase Storage; la base de datos guarda solo la ruta del archivo.
- **Filtros** — Búsqueda por texto, filtro por transmisión, estado, alertas de vencimiento (SOAT/RTM).
- **Notificaciones** — Alertas visuales para documentos próximos a vencer o vencidos.
- **Importación** — Importación desde Excel (.xlsx) o SQL (`INSERT INTO vehiculos`) y exportación de backup en Excel.
- **Tiempo real** — La vista se actualiza automáticamente con Supabase Realtime (`postgres_changes`).
- **Responsive** — Diseño mobile-first, modo oscuro, glassmorphism.

---

## 🚀 Cómo usar

### Requisitos previos

1. **Supabase** — Crear proyecto (o usar uno existente).
2. **Supabase Auth** — Habilitar proveedor de correo electrónico/contraseña y crear al menos un usuario.
3. **Esquema** — Ejecutar `scripts/migration.sql` en el SQL Editor de Supabase para crear la tabla `vehiculos`.
4. **Storage** — Crear un bucket público llamado `vehiculos`.
5. **Config** — Copiar `env.js` con `SUPABASE_URL` y `SUPABASE_ANON_KEY` del proyecto (ver `.env.example`).

### Puesta en marcha

1. Servir la app con un servidor HTTP estático (los ES modules requieren HTTP, no `file://`):

   ```bash
   python3 -m http.server 8080
   ```

2. Abrir `http://localhost:8080` e iniciar sesión con el usuario creado en Supabase Auth.
3. Gestionar el inventario.

### Tailwind CSS (desarrollo)

Si se modifican clases de Tailwind en HTML/JS, reconstruir el CSS:

```bash
npm run build:css      # Generar styles/output.css
npm run watch:css      # Reconstrucción automática
```

---

## 🏗️ Arquitectura

```
index.html                ← Punto de entrada (módulo ES único)
│
├── supabase/
│   ├── config.js         ← Inicialización del cliente Supabase
│   ├── auth.js           ← Login, logout, onAuthChange, sesión
│   ├── database.js       ← CRUD + listener en tiempo real
│   └── storage.js        ← Compresión y subida de imágenes
│
├── app/
│   ├── utils.js          ← Formateo, validación, sanitización
│   ├── ui.js             ← Renderizado, modales, filtros, fotos
│   ├── main.js           ← Orquestador, eventos, flujo de guardado
│   └── import.js         ← Import/export Excel y SQL
│
├── styles/
│   ├── input.css         ← Directivas @tailwind (input) + compatibilidad
│   ├── output.css        ← Tailwind compilado (generado)
│   └── main.css          ← Estilos personalizados
│
├── env.js                ← Configuración del cliente (URL + anon key)
├── logo_empresa/
│   └── logo.jpg          ← Logotipo de la empresa
│
├── tailwind.config.js    ← Tema personalizado Tailwind
├── package.json          ← Scripts npm para build CSS
├── REQUIREMENTS.txt      ← Documento de requerimientos
└── README.md
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

## ⚙️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + Tailwind CSS 3 + JavaScript (ES modules) |
| Backend | Supabase (Auth + PostgreSQL + Storage + Realtime) |
| SDK | Supabase JS v2 (bundle local `supabase/supabase.umd.js`) |
| Fuentes | Hanken Grotesk, Sora, Material Symbols |
| Build | Tailwind CLI (únicamente para CSS) |

---

## 🔒 Seguridad

- Autenticación requerida para toda operación.
- Políticas RLS en Supabase restringen el acceso a usuarios autenticados.
- Se usa la anon key (pública) únicamente del lado del cliente; nunca se exponen claves de servicio.
- Las contraseñas se manejan exclusivamente en Supabase Auth.
