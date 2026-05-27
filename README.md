# Vecar Autos — Titanium Showroom Panel

Panel de administración de inventario vehicular para **Titanium Showroom**. Aplicación frontend 100% del lado del cliente que utiliza Firebase (Auth + Firestore) como backend, sin necesidad de servidor propio.

---

## ✨ Funcionalidades

- **Autenticación** — Inicio de sesión con email/contraseña vía Firebase Auth.
- **Inventario** — CRUD completo de vehículos con tarjetas visuales.
- **Fotografías** — Subida, compresión automática (800px, calidad 70%) y almacenamiento en base64 dentro de Firestore. Sin necesidad de Firebase Storage.
- **Filtros** — Búsqueda por texto, filtro por transmisión, estado, alertas de vencimiento (SOAT/RTM).
- **Notificaciones** — Alertas visuales para documentos próximos a vencer o vencidos.
- **Importación** — Carga de datos semilla precargados para pruebas.
- **Tiempo real** — La vista se actualiza automáticamente con Firestore `onSnapshot`.
- **Responsive** — Diseño mobile-first, modo oscuro, glassmorphism.

---

## 🚀 Cómo usar

### Requisitos previos

1. **Firebase Console** — Crear proyecto (o usar `vercar-autos`).
2. **Firebase Auth** — Habilitar proveedor de correo electrónico/contraseña y crear al menos un usuario.
3. **Firestore** — Crear base de datos en modo de prueba o producción.
4. **Reglas de Firestore** — Publicar reglas que permitan acceso solo a usuarios autenticados:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vehiculos/{vehicleId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Puesta en marcha

1. Abrir `index.html` con doble-click (o servir con cualquier HTTP server).
2. Iniciar sesión con el usuario creado en Firebase Auth.
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
index.html                ← Punto de entrada (doble-click)
│
├── firebase/
│   ├── config.js         ← Inicialización de Firebase
│   ├── auth.js           ← Login, logout, onAuthChange
│   ├── firestore.js      ← CRUD + listener en tiempo real
│   └── storage.js        ← Compresión de imágenes a base64
│
├── app/
│   ├── utils.js          ← Formateo, validación, sanitización
│   ├── ui.js             ← Renderizado, modales, filtros, fotos
│   └── main.js           ← Orquestador, eventos, flujo de guardado
│
├── styles/
│   ├── input.css         ← Directivas @tailwind (input)
│   ├── output.css        ← Tailwind compilado (generado)
│   └── main.css          ← Estilos personalizados
│
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
Usuario → index.html (file://) → Firebase SDK (CDN)
  ├── Auth → Firebase Auth (email/password)
  ├── Firestore → Colección "vehiculos" (CRUD + onSnapshot)
  └── Fotos → Compresión (canvas) → base64 → Firestore
```

---

## ⚙️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + Tailwind CSS 3 + JavaScript (compat) |
| Backend | Firebase Auth + Firestore |
| SDK | Firebase compat v10.14.1 (CDN) |
| Fuentes | Hanken Grotesk, Sora, Material Symbols |
| Build | Tailwind CLI (únicamente para CSS) |

---

## 📋 Limitaciones

- **Firebase Spark (gratuito):** No incluye Firebase Storage. Las fotos se almacenan como base64 en Firestore.
- **Tamaño máximo por documento:** 1 MB en Firestore (~5-8 fotos comprimidas por vehículo).
- **Sin servidor:** La app funciona desde `file://`, no requiere instalación de dependencias para el usuario final.

---

## 🔒 Seguridad

- Autenticación requerida para toda operación.
- Reglas de Firestore restringen acceso a usuarios autenticados.
- No se exponen claves de servicio en el frontend.
- Las contraseñas se manejan exclusivamente en Firebase Auth.

---

## 📝 Licencia

Uso interno — Titanium Showroom.
# appweb-vecar-autos
