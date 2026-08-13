import {
  getDaysRemaining,
  buildVehicleName,
  sanitizeHTML,
  sanitizeUrl,
  isValidImageUrl,
  formatCOP,
  validatePhotoFile,
  showAlert,
  estadoBadgeHTML,
  alertBadge
} from './utils.js';
import { getPhotoUrl } from '../supabase/storage.js';

/* ── PHOTO STATE ──────────────────────────── */
export let photoItems = [];
export let removedExistingUrls = [];

/* ── VIEW TOGGLES ──────────────────────────── */
export function showLogin() {
  document.getElementById("loginView").classList.remove("hidden");
  var dash = document.getElementById("mainDashboardView");
  dash.classList.add("hidden");
  dash.classList.remove("opacity-100");
  dash.classList.add("opacity-0");
}

export function showDashboard() {
  document.getElementById("loginView").classList.add("hidden");
  var dash = document.getElementById("mainDashboardView");
  dash.classList.remove("hidden");
  requestAnimationFrame(function () {
    dash.classList.remove("opacity-0");
    dash.classList.add("opacity-100");
  });
}

/* ── ALERTS BANNER ─────────────────────────── */
export function checkGlobalAlerts(vehicles) {
  var expired = 0;
  var expiring = 0;
  for (var vi = 0; vi < vehicles.length; vi++) {
    var v = vehicles[vi];
    var sd = getDaysRemaining(v.soatVence);
    var rd = getDaysRemaining(v.rtmVence);
    if (sd !== null) { if (sd < 0) expired++; else if (sd <= 30) expiring++; }
    if (rd !== null) { if (rd < 0) expired++; else if (rd <= 30) expiring++; }
  }
  var banner = document.getElementById("alertsBanner");
  var textEl = document.getElementById("alertsBannerText");
  if (expired + expiring > 0) {
    banner.classList.remove("hidden");
    textEl.innerHTML = "";
    var parts = [
      document.createTextNode("Se detectaron "),
      makeStrong((expired + expiring) + " alertas"),
      document.createTextNode(": "),
      makeSpan(expired + " VENCIDOS", "text-red-400"),
      document.createTextNode(" y "),
      makeSpan(expiring + " pr\u00f3ximos a vencer", "text-amber-400"),
      document.createTextNode(".")
    ];
    for (var pi = 0; pi < parts.length; pi++) textEl.appendChild(parts[pi]);
  } else {
    banner.classList.add("hidden");
  }
}

function makeStrong(text) {
  var el = document.createElement("strong");
  el.textContent = text;
  return el;
}

function makeSpan(text, cls) {
  var el = document.createElement("span");
  el.textContent = text;
  el.className = cls;
  return el;
}

/* ── METRICS ───────────────────────────────── */
export function updateMetrics(vehicles) {
  document.getElementById("metricActive").textContent = vehicles.filter(
    function (i) { return ["VENDIDO", "ALISTAMIENTO"].indexOf(i.estado) === -1; }
  ).length;
  document.getElementById("metricSold").textContent = vehicles.filter(
    function (i) { return i.estado === "VENDIDO"; }
  ).length;
  document.getElementById("metricPending").textContent = vehicles.filter(
    function (i) { return i.estado === "ALISTAMIENTO"; }
  ).length;
  document.getElementById("resultCount").textContent = "(" + vehicles.length + " veh\u00edculos)";
}

/* ── INVENTORY RENDER ──────────────────────── */
export function renderInventory(items) {
  var container = document.getElementById("inventoryContainer");
  var emptyState = document.getElementById("emptyState");
  container.innerHTML = "";
  if (!items || items.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  for (var ii = 0; ii < items.length; ii++) {
    var item = items[ii];
    var isSold = item.estado === "VENDIDO";
    var soatDays = getDaysRemaining(item.soatVence);
    var rtmDays = getDaysRemaining(item.rtmVence);
    var fullName = buildVehicleName(item.marca, item.linea, item.version);
    var safePlaca = sanitizeHTML(item.placa);
    var fotos = item.fotos || [];
    var fotoCount = fotos.length;
    var dotsHtml = "";
    for (var di = 0; di < fotoCount; di++) {
      dotsHtml += '<span id="dot_' + safePlaca + '_' + di + '" class="w-1.5 h-1.5 rounded-full transition-all ' + (di === 0 ? "bg-electric-blue scale-125" : "bg-white/40") + '"></span>';
    }
    var card = document.createElement("div");
    card.className = "glass-card rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:border-electric-blue/30" + (isSold ? " opacity-60 grayscale-[30%]" : "");
    card.dataset.placa = item.placa;
    card.innerHTML = renderCardContent(item, fullName, safePlaca, dotsHtml, fotoCount, soatDays, rtmDays);
    container.appendChild(card);
  }
}

function renderCardContent(item, fullName, safePlaca, dotsHtml, fotoCount, soatDays, rtmDays) {
  var fotos = item.fotos || [];
  var firstFoto = fotos[0] ? getPhotoUrl(fotos[0]) : '';
  var fotoSrc = firstFoto && isValidImageUrl(firstFoto) ? sanitizeUrl(firstFoto) :
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80";
  var flags = "";
  if (item.reporte) flags += '<span class="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold">\u26A0 REPORTE</span>';
  if (item.prenda) flags += '<span class="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-bold">\uD83D\uDD12 PRENDA</span>';

  return '<div class="flex">' +
    '<div class="w-[38%] relative h-40 cursor-pointer group" data-action="cycle-photo">' +
      '<img id="img_' + safePlaca + '" data-active-idx="0" class="w-full h-full object-cover transition-opacity duration-300" src="' + sanitizeHTML(sanitizeUrl(fotoSrc)) + '" alt="' + sanitizeHTML(fullName) + '" loading="lazy">' +
      '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>' +
      '<span id="photoCount_' + safePlaca + '" class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold">1/' + fotoCount + '</span>' +
      '<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">' + dotsHtml + '</div>' +
      '<span class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[9px] text-white px-1.5 py-0.5 rounded font-mono tracking-wider">' + sanitizeHTML(safePlaca) + '</span>' +
    '</div>' +
    '<div class="w-[62%] p-3 flex flex-col justify-between">' +
      '<div>' +
        '<div class="flex justify-between items-start mb-1">' +
          '<h3 class="font-bold text-on-surface text-[13px] leading-tight font-sora pr-1">' + sanitizeHTML(fullName) + '</h3>' +
          estadoBadgeHTML(item.estado) +
        '</div>' +
        '<p class="text-[11px] text-on-secondary-container">' + sanitizeHTML(String(item.anio)) + ' \u00B7 ' + sanitizeHTML(item.color) + ' \u00B7 ' + (item.kilometraje || 0).toLocaleString() + ' km \u00B7 ' + sanitizeHTML(item.transmision) + '</p>' +
      '</div>' +
      '<div class="flex gap-2 items-center text-[9px] text-on-secondary-container mt-1.5 pt-1.5 border-t border-outline-variant/15">' +
        '<span>SOAT: ' + sanitizeHTML(item.soatVence || "\u2014") + ' ' + alertBadge(soatDays) + '</span>' +
        '<span>RTM: ' + sanitizeHTML(item.rtmVence || "\u2014") + ' ' + alertBadge(rtmDays) + '</span>' +
      '</div>' +
      '<div class="flex justify-between items-center mt-2">' +
        '<span class="font-bold text-electric-blue text-sm font-sora">' + formatCOP(item.precioVenta) + '</span>' +
        '<div class="flex gap-1">' +
          '<button class="p-1.5 rounded-lg bg-surface-container-high/60 hover:bg-electric-blue/20 text-on-secondary-container hover:text-electric-blue transition-colors" data-action="edit" data-id="' + sanitizeHTML(item.id) + '" title="Editar">' +
            '<span class="material-symbols-outlined text-[16px]">edit</span>' +
          '</button>' +
          '<button class="p-1.5 rounded-lg bg-surface-container-high/60 hover:bg-red-500/20 text-on-secondary-container hover:text-red-400 transition-colors" data-action="delete" data-id="' + sanitizeHTML(item.id) + '" data-placa="' + sanitizeHTML(safePlaca) + '" title="Eliminar">' +
            '<span class="material-symbols-outlined text-[16px]">delete</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  (flags ? '<div class="px-3 pb-2 pt-0 flex gap-2">' + flags + '</div>' : "");
}

/* ── CARD EVENT DELEGATION ─────────────────── */
export function setupCardDelegation(handlers) {
  var container = document.getElementById("inventoryContainer");
  container.addEventListener("click", function (e) {
    var target = e.target.closest("[data-action]");
    if (!target) return;
    var action = target.dataset.action;
    if (action === "edit" && target.dataset.id) {
      handlers.onEdit(target.dataset.id);
    } else if (action === "delete" && target.dataset.id) {
      handlers.onDelete(target.dataset.id, target.dataset.placa);
    } else if (action === "cycle-photo") {
      var card = target.closest("[data-placa]");
      if (card) handlers.onCyclePhoto(card.dataset.placa);
    }
  });
}

/* ── PHOTO CYCLING ─────────────────────────── */
export function cycleCardPhoto(placa, vehicles) {
  for (var ci = 0; ci < vehicles.length; ci++) {
    if (vehicles[ci].placa === placa) {
      var car = vehicles[ci];
      if (!car || !car.fotos || car.fotos.length <= 1) return;
      var img = document.getElementById("img_" + placa);
      if (!img) return;
      var idx = (parseInt(img.dataset.activeIdx || 0, 10) + 1) % car.fotos.length;
      img.dataset.activeIdx = idx;
      var nextSrc = getPhotoUrl(car.fotos[idx]);
      img.src = isValidImageUrl(nextSrc) ? nextSrc : img.src;
      var countEl = document.getElementById("photoCount_" + placa);
      if (countEl) countEl.innerText = (idx + 1) + "/" + car.fotos.length;
      for (var d = 0; d < car.fotos.length; d++) {
        var dot = document.getElementById("dot_" + placa + "_" + d);
        if (dot) {
          dot.className = "w-1.5 h-1.5 rounded-full transition-all " + (d === idx ? "bg-electric-blue scale-125" : "bg-white/40");
        }
      }
      return;
    }
  }
}

/* ── NOTIFICATIONS ─────────────────────────── */
export function showNotifications(vehicles) {
  var list = [];
  for (var ni = 0; ni < vehicles.length; ni++) {
    var i = vehicles[ni];
    var sd = getDaysRemaining(i.soatVence);
    var rd = getDaysRemaining(i.rtmVence);
    var name = buildVehicleName(i.marca, i.linea, i.version);
    if (sd !== null && sd <= 30) {
      list.push("\u26A0\uFE0F " + name + " (" + i.placa + ") \u2014 SOAT " + (sd < 0 ? "VENCIDO" : "vence en " + sd + " d\u00edas"));
    }
    if (rd !== null && rd <= 30) {
      list.push("\u26A0\uFE0F " + name + " (" + i.placa + ") \u2014 RTM " + (rd < 0 ? "VENCIDO" : "vence en " + rd + " d\u00edas"));
    }
  }
  alert(list.length
    ? "Alertas de Documentos:\n\n" + list.join("\n")
    : "\u2705 Todo en orden. No hay alertas pendientes."
  );
}

/* ── FILTERS ───────────────────────────────── */
export function applyFilters(vehicles, activeFilterTab) {
  var search = (document.getElementById("searchInput").value || "").toLowerCase();
  var trFilter = document.getElementById("filterTr").value;
  var stFilter = document.getElementById("filterEstado").value;
  var alFilter = document.getElementById("filterAlerts").value;
  var items = vehicles.slice();

  if (activeFilterTab === "available") {
    items = items.filter(function (i) { return ["DISPONIBLE", "VIRTUAL", "SEPARADO"].indexOf(i.estado) !== -1; });
  } else if (activeFilterTab === "sold") {
    items = items.filter(function (i) { return i.estado === "VENDIDO"; });
  }

  if (search) {
    items = items.filter(function (i) {
      return (i.marca + " " + i.linea + " " + i.version).toLowerCase().indexOf(search) !== -1 ||
        i.placa.toLowerCase().indexOf(search) !== -1 ||
        i.color.toLowerCase().indexOf(search) !== -1 ||
        i.matriculaCiudad.toLowerCase().indexOf(search) !== -1;
    });
  }

  if (trFilter) items = items.filter(function (i) { return i.transmision === trFilter; });
  if (stFilter) items = items.filter(function (i) { return i.estado === stFilter; });

  if (alFilter) {
    items = items.filter(function (i) {
      var sd = getDaysRemaining(i.soatVence);
      var rd = getDaysRemaining(i.rtmVence);
      if (alFilter === "expired") return (sd !== null && sd < 0) || (rd !== null && rd < 0);
      if (alFilter === "expiring") return (sd !== null && sd >= 0 && sd <= 30) || (rd !== null && rd >= 0 && rd <= 30);
      if (alFilter === "any") return (sd !== null && sd <= 30) || (rd !== null && rd <= 30);
      return true;
    });
  }

  renderInventory(items);
  document.getElementById("resultCount").textContent = "(" + items.length + " de " + vehicles.length + ")";
}

export function toggleFilterDrawer() {
  var el = document.getElementById("filterDrawer");
  if (el.classList.contains("hidden")) el.classList.remove("hidden");
  else el.classList.add("hidden");
}

export function clearFilters() {
  document.getElementById("filterTr").value = "";
  document.getElementById("filterEstado").value = "";
  document.getElementById("filterAlerts").value = "";
  document.getElementById("searchInput").value = "";
}

export function filterExpiringOnly() {
  document.getElementById("filterAlerts").value = "any";
  document.getElementById("filterDrawer").classList.remove("hidden");
}

/* ── TAB SWITCHING ─────────────────────────── */
export function switchDashboardTab(tab) {
  var buttons = document.querySelectorAll("nav.fixed.bottom-0 button");
  var tabMap = { all: 0, available: 1, sold: 3 };
  var idx = tabMap[tab] !== undefined ? tabMap[tab] : -1;

  buttons.forEach(function (btn) {
    btn.classList.remove("text-electric-blue");
    btn.classList.add("text-on-secondary-container");
    var icon = btn.querySelector(".material-symbols-outlined");
    if (icon) icon.style.fontVariationSettings = "";
  });

  if (idx >= 0 && buttons[idx]) {
    buttons[idx].classList.remove("text-on-secondary-container");
    buttons[idx].classList.add("text-electric-blue");
    var icon = buttons[idx].querySelector(".material-symbols-outlined");
    if (icon) icon.style.fontVariationSettings = "'FILL' 1";
  }
  return tab;
}

/* ── MODAL HELPERS ─────────────────────────── */
export function openModal(modalId) {
  var el = document.getElementById(modalId);
  if (!el) return;
  el.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

export function closeModal(modalId) {
  var el = document.getElementById(modalId);
  if (!el) return;
  el.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ── PHOTO MANAGEMENT IN FORM ──────────────── */
export function resetPhotoState() {
  photoItems = [];
  removedExistingUrls = [];
  renderPhotoPreviews();
}

export function setPhotoItems(items) {
  photoItems = [];
  for (var si = 0; si < items.length; si++) {
    if (items[si] && items[si].trim() !== "") {
      photoItems.push({ src: items[si], isExisting: true });
    }
  }
  removedExistingUrls = [];
  renderPhotoPreviews();
}

export function triggerFileInput() {
  if (photoItems.length >= 10) {
    alert("M\u00E1ximo 10 fotos por veh\u00EDculo.");
    return;
  }
  document.getElementById("vehicleFileInput").click();
}

export function handleFileSelect(e) {
  var files = Array.from(e.target.files);
  if (!files.length) return;
  for (var fi = 0; fi < files.length; fi++) {
    var file = files[fi];
    if (photoItems.length >= 10) break;
    var err = validatePhotoFile(file);
    if (err) { showAlert(err, "error"); continue; }
    var reader = new FileReader();
    reader.onload = (function (f) {
      return function (ev) {
        photoItems.push({ src: ev.target.result, file: f, isExisting: false });
        renderPhotoPreviews();
      };
    })(file);
    reader.readAsDataURL(file);
  }
  e.target.value = "";
}

function removePhoto(index) {
  var item = photoItems[index];
  if (!item) return;
  if (item.isExisting) removedExistingUrls.push(item.src);
  photoItems.splice(index, 1);
  renderPhotoPreviews();
}

function renderPhotoPreviews() {
  var container = document.getElementById("photosContainer");
  container.innerHTML = "";
  for (var pi = 0; pi < photoItems.length; pi++) {
    var item = photoItems[pi];
    var thumb = document.createElement("div");
    thumb.className = "w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden relative group";
    var resolvedSrc = getPhotoUrl(item.src);
    var thumbSrc = isValidImageUrl(resolvedSrc) ? resolvedSrc : "";
    thumb.innerHTML =
      '<img src="' + sanitizeUrl(thumbSrc) + '" class="w-full h-full object-cover" alt="Foto ' + (pi + 1) + '">' +
      '<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">' +
        '<button class="bg-red-500/80 rounded-full p-1 photo-remove-btn" data-idx="' + pi + '">' +
          '<span class="material-symbols-outlined text-white text-[18px]">close</span>' +
        '</button>' +
      '</div>' +
      '<span class="absolute bottom-1 left-1 bg-electric-blue text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold">' + (pi + 1) + '</span>';
    container.appendChild(thumb);
  }
  container.querySelectorAll(".photo-remove-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      removePhoto(parseInt(btn.dataset.idx, 10));
    });
  });
}

/* ── FORM FILL HELPERS ─────────────────────── */
export function fillFormFields(vehicle) {
  document.getElementById("editVehicleId").value = vehicle.id || "";
  document.getElementById("formMarca").value = vehicle.marca || "";
  document.getElementById("formLinea").value = vehicle.linea || "";
  document.getElementById("formVersion").value = vehicle.version || "";
  document.getElementById("formPlaca").value = vehicle.placa || "";
  document.getElementById("formAnio").value = vehicle.anio || "";
  document.getElementById("formCilindraje").value = vehicle.cilindraje || "";
  document.getElementById("formColor").value = vehicle.color || "";
  document.getElementById("formTransmision").value = vehicle.transmision || "AT";
  document.getElementById("formKilometraje").value = vehicle.kilometraje || 0;
  document.getElementById("formMatricula").value = vehicle.matriculaCiudad || "";
  document.getElementById("formPrecioCompra").value = vehicle.precioCompra || 0;
  document.getElementById("formPrecioVenta").value = vehicle.precioVenta || 0;
  document.getElementById("formUbicacion").value = vehicle.ubicacion || "129";
  document.getElementById("formSoat").value = vehicle.soatVence || "";
  document.getElementById("formRtm").value = vehicle.rtmVence || "";
  document.getElementById("formReporte").value = vehicle.reporte ? "SI" : "NO";
  document.getElementById("formPrenda").value = vehicle.prenda ? "SI" : "NO";
  document.getElementById("formEstado").value = vehicle.estado || "DISPONIBLE";
  document.getElementById("formVisibleWeb").checked = vehicle.visibleWeb !== false;
  document.getElementById("formDescripcion").value = vehicle.descripcion || "";
}

export function resetFormFields() {
  var form = document.getElementById("vehicleForm");
  form.reset();
  document.getElementById("editVehicleId").value = "";
  document.getElementById("formUbicacion").value = "129";
  document.getElementById("formEstado").value = "DISPONIBLE";
  document.getElementById("formTransmision").value = "AT";
  document.getElementById("formReporte").value = "NO";
  document.getElementById("formPrenda").value = "NO";
  document.getElementById("formVisibleWeb").checked = true;
}

export function collectFormData() {
  return {
    marca: document.getElementById("formMarca").value.trim().toLowerCase(),
    linea: document.getElementById("formLinea").value.trim(),
    version: document.getElementById("formVersion").value.trim(),
    placa: document.getElementById("formPlaca").value.trim().toUpperCase(),
    anio: parseInt(document.getElementById("formAnio").value, 10) || 0,
    cilindraje: document.getElementById("formCilindraje").value.trim() || "0",
    color: document.getElementById("formColor").value.trim() || "N/A",
    transmision: document.getElementById("formTransmision").value,
    kilometraje: parseInt(document.getElementById("formKilometraje").value, 10) || 0,
    matriculaCiudad: document.getElementById("formMatricula").value.trim() || "Bogot\u00E1",
    precioCompra: parseInt(document.getElementById("formPrecioCompra").value, 10) || 0,
    precioVenta: parseInt(document.getElementById("formPrecioVenta").value, 10) || 0,
    ubicacion: document.getElementById("formUbicacion").value.trim() || "129",
    soatVence: document.getElementById("formSoat").value.trim(),
    rtmVence: document.getElementById("formRtm").value.trim(),
    reporte: document.getElementById("formReporte").value === "SI",
    prenda: document.getElementById("formPrenda").value === "SI",
    estado: document.getElementById("formEstado").value,
    visibleWeb: document.getElementById("formVisibleWeb").checked,
    descripcion: document.getElementById("formDescripcion").value.trim()
  };
}

export function validateForm(data) {
  var errors = [];
  if (!data.marca) errors.push("La marca es obligatoria.");
  if (!data.linea) errors.push("La l\u00ednea es obligatoria.");
  if (!data.placa) errors.push("La placa es obligatoria.");
  if (!data.anio || data.anio < 1900 || data.anio > 2100) errors.push("Ingresa un a\u00F1o v\u00E1lido.");
  if (!data.precioVenta || data.precioVenta <= 0) errors.push("El precio de venta debe ser mayor a 0.");
  if (data.kilometraje < 0) errors.push("El kilometraje no es v\u00E1lido.");
  if (!data.color) errors.push("El color es obligatorio.");
  return errors;
}

/* ── DELETE DIALOG ─────────────────────────── */
export function showDeleteConfirm(id, placa) {
  var dialog = document.getElementById("deleteDialog");
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  dialog.dataset.targetId = id;
  dialog.dataset.targetPlaca = placa;
}

export function closeDeleteDialog() {
  var dialog = document.getElementById("deleteDialog");
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  delete dialog.dataset.targetId;
  delete dialog.dataset.targetPlaca;
}

export function getDeleteTarget() {
  var dialog = document.getElementById("deleteDialog");
  return { id: dialog.dataset.targetId, placa: dialog.dataset.targetPlaca };
}