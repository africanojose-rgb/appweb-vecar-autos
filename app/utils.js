var MAX_PHOTO_SIZE = 5 * 1024 * 1024;
var ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function formatCOP(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(n);
}

function getDaysRemaining(dateStr) {
  if (!dateStr || dateStr.trim() === "") return null;
<<<<<<< HEAD
  var parts = dateStr.split("/").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  var d = parts[0], m = parts[1], y = parts[2];
  var diff = new Date(y, m - 1, d) - new Date();
  return Math.ceil(diff / 86400000);
=======
  if (dateStr.toUpperCase() === "ESTRENAR" || dateStr.toUpperCase() === "NO APLICA") return null;
  var parts = dateStr.split("/").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  var d = parts[0], m = parts[1], y = parts[2];
  var target = new Date(y, m - 1, d);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var diff = target - today;
  return Math.round(diff / 86400000);
>>>>>>> f1f0a6b (actualizacion con descarga y backup)
}

function alertBadge(days) {
  if (days === null) return "";
  if (days < 0) {
    return '<span class="inline-block bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">VENCIDO</span>';
  }
  if (days <= 30) {
    return '<span class="inline-block bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">' + days + 'd</span>';
  }
  return "";
}

var estadoEmoji = {
  DISPONIBLE: "\u{1F7E2}",
  VIRTUAL: "\u{1F535}",
  SEPARADO: "\u{1F7E0}",
  ALISTAMIENTO: "\u{1F7E1}",
  VENDIDO: "\u{1F3C6}"
};

<<<<<<< HEAD
function estadoBadgeHTML(estado) {
  var emoji = estadoEmoji[estado] || "";
  return '<span class="text-[9px] font-bold">' + emoji + " " + estado + "</span>";
=======
var ESTADOS_VALIDOS = ["DISPONIBLE", "VIRTUAL", "SEPARADO", "ALISTAMIENTO", "VENDIDO"];

function estadoBadgeHTML(estado) {
  var safe = ESTADOS_VALIDOS.indexOf(estado) !== -1 ? estado : "DISPONIBLE";
  var emoji = estadoEmoji[safe] || "";
  return '<span class="text-[9px] font-bold">' + sanitizeHTML(emoji + " " + safe) + "</span>";
>>>>>>> f1f0a6b (actualizacion con descarga y backup)
}

function sanitizeHTML(str) {
  if (typeof str !== "string") return str;
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

<<<<<<< HEAD
=======
function sanitizeUrl(url) {
  if (typeof url !== "string") return "";
  var trimmed = url.trim();
  var lower = trimmed.toLowerCase();
  if (lower.indexOf("javascript:") === 0) return "";
  if (lower.indexOf("vbscript:") === 0) return "";
  if (lower.indexOf("data:") === 0 && lower.indexOf("data:image/") !== 0) return "";
  return trimmed;
}

function isValidImageUrl(url) {
  if (typeof url !== "string") return false;
  if (url.indexOf("data:image/") === 0) return true;
  if (url.indexOf("https://") === 0 || url.indexOf("http://") === 0) return true;
  return false;
}

>>>>>>> f1f0a6b (actualizacion con descarga y backup)
function buildVehicleName(marca, linea, version) {
  return [marca, linea, version].filter(Boolean).join(" ").toUpperCase();
}

<<<<<<< HEAD
function parseVehicleNameFromOldFormat(vehiculo) {
  var knownBrands = [
    "APRILIA", "AUDI", "BAJAJ", "BMW", "CHEVROLET", "FORD",
    "JEEP", "KIA", "MERCEDES BENZ", "MERCEDES", "VOLVO"
  ];
  var upper = vehiculo.toUpperCase();
  for (var i = 0; i < knownBrands.length; i++) {
    var brand = knownBrands[i];
    if (upper.startsWith(brand)) {
      var resto = vehiculo.slice(brand.length).trim();
      var partsArray = resto.split(" ");
      var linea = partsArray[0] || resto;
      var version = partsArray.slice(1).join(" ");
      return { marca: brand, linea: linea, version: version };
    }
  }
  return { marca: vehiculo, linea: "", version: "" };
}

function mapOldToNewSchema(old) {
  var parsed = parseVehicleNameFromOldFormat(old.vehiculo);
  return {
    marca: parsed.marca.toLowerCase(),
    linea: parsed.linea,
    version: parsed.version,
    anio: old.modelo || 2024,
    cilindraje: old.cc || "0",
    color: old.color || "N/A",
    descripcion: old.especificaciones || "",
    estado: old.estado || "DISPONIBLE",
    fotos: old.fotos || [],
    kilometraje: old.km || 0,
    matriculaCiudad: old.matricula || "Bogotá",
    placa: old.placa || "",
    precioCompra: 0,
    precioVenta: old.precio || 0,
    prenda: old.prenda === "SI",
    reporte: old.reporte !== "NO",
    transmision: old.tr || "AT",
    ubicacion: old.ubicacion || "129",
    visibleWeb: true,
    soatVence: old.soat || "",
    rtmVence: old.rtm || ""
  };
}
=======

>>>>>>> f1f0a6b (actualizacion con descarga y backup)

function getEstadoOptions() {
  return [
    { value: "DISPONIBLE", label: "DISPONIBLE" },
    { value: "VIRTUAL", label: "VIRTUAL" },
    { value: "SEPARADO", label: "SEPARADO" },
    { value: "ALISTAMIENTO", label: "ALISTAMIENTO" },
    { value: "VENDIDO", label: "VENDIDO" }
  ];
}

function showAlert(message, type) {
  var container = document.getElementById("alertContainer");
  if (!container) return;
  var bg = type === "error"
    ? "bg-red-500/15 border-red-500/35 text-red-400"
    : type === "success"
    ? "bg-green-500/15 border-green-500/35 text-green-400"
    : "bg-amber-500/15 border-amber-500/35 text-amber-400";
<<<<<<< HEAD
  container.innerHTML =
    '<div class="' + bg + ' border rounded-xl p-4 flex items-start gap-3 text-body-sm animate-in fade-in duration-300">' +
    '<span class="material-symbols-outlined flex-shrink-0 mt-0.5">' + (type === "error" ? "error" : type === "success" ? "check_circle" : "warning") + '</span>' +
    '<div class="flex-grow text-xs">' + sanitizeHTML(message) + '</div>' +
    '<button class="flex-shrink-0 text-on-secondary-container hover:text-white" onclick="this.parentElement.remove()">' +
    '<span class="material-symbols-outlined text-[18px]">close</span></button></div>';
=======
  var icon = type === "error" ? "error" : type === "success" ? "check_circle" : "warning";
  var div = document.createElement("div");
  div.className = bg + " border rounded-xl p-4 flex items-start gap-3 text-body-sm animate-in fade-in duration-300 pointer-events-auto";
  div.innerHTML =
    '<div class="flex items-start gap-3 w-full">' +
    '<span class="material-symbols-outlined flex-shrink-0 mt-0.5">' + icon + '</span>' +
    '<div class="flex-grow text-xs">' + sanitizeHTML(message) + '</div>' +
    '<button class="close-alert flex-shrink-0 text-on-secondary-container hover:text-white">' +
    '<span class="material-symbols-outlined text-[18px]">close</span></button></div>';
  var closeBtn = div.querySelector(".close-alert");
  if (closeBtn) closeBtn.addEventListener("click", function () { div.remove(); });
  container.appendChild(div);
  setTimeout(function () {
    if (div.parentElement) div.remove();
  }, 5000);
>>>>>>> f1f0a6b (actualizacion con descarga y backup)
}

function validatePhotoFile(file) {
  if (!file) return "No se seleccionó ningún archivo.";
  if (ALLOWED_MIME_TYPES.indexOf(file.type) === -1) {
    return "Formato no permitido. Usa JPG, PNG, WebP o AVIF.";
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return "La foto excede el máximo de 5MB (" + (file.size / 1024 / 1024).toFixed(1) + "MB).";
  }
  return null;
}
