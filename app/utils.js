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
  if (dateStr.toUpperCase() === "ESTRENAR" || dateStr.toUpperCase() === "NO APLICA") return null;
  var parts = dateStr.split("/").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  var d = parts[0], m = parts[1], y = parts[2];
  var target = new Date(y, m - 1, d);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var diff = target - today;
  return Math.round(diff / 86400000);
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

var ESTADOS_VALIDOS = ["DISPONIBLE", "VIRTUAL", "SEPARADO", "ALISTAMIENTO", "VENDIDO"];

function estadoBadgeHTML(estado) {
  var safe = ESTADOS_VALIDOS.indexOf(estado) !== -1 ? estado : "DISPONIBLE";
  var emoji = estadoEmoji[safe] || "";
  return '<span class="text-[9px] font-bold">' + sanitizeHTML(emoji + " " + safe) + "</span>";
}

function sanitizeHTML(str) {
  if (typeof str !== "string") return str;
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

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
function buildVehicleName(marca, linea, version) {
  return [marca, linea, version].filter(Boolean).join(" ").toUpperCase();
}



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
