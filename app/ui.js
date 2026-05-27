/* ── PHOTO STATE ──────────────────────────── */
var photoItems = [];
var removedExistingUrls = [];

/* ── VIEW TOGGLES ──────────────────────────── */
function showLogin() {
  document.getElementById("loginView").classList.remove("hidden");
  var dash = document.getElementById("mainDashboardView");
  dash.classList.add("hidden");
  dash.classList.remove("opacity-100");
  dash.classList.add("opacity-0");
}

function showDashboard() {
  document.getElementById("loginView").classList.add("hidden");
  var dash = document.getElementById("mainDashboardView");
  dash.classList.remove("hidden");
  requestAnimationFrame(function () {
    dash.classList.remove("opacity-0");
    dash.classList.add("opacity-100");
  });
}

/* ── ALERTS BANNER ─────────────────────────── */
function checkGlobalAlerts(vehicles) {
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
function updateMetrics(vehicles) {
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
function renderInventory(items) {
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
  var fotoSrc = fotos[0] ? sanitizeHTML(fotos[0]) :
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80";
  var flags = "";
  if (item.reporte) flags += '<span class="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold">\u26A0 REPORTE</span>';
  if (item.prenda) flags += '<span class="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-bold">\uD83D\uDD12 PRENDA</span>';

  return '<div class="flex">' +
    '<div class="w-[38%] relative h-40 cursor-pointer group" data-action="cycle-photo">' +
      '<img id="img_' + safePlaca + '" data-active-idx="0" class="w-full h-full object-cover transition-opacity duration-300" src="' + fotoSrc + '" alt="' + sanitizeHTML(fullName) + '" loading="lazy">' +
      '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>' +
      '<span id="photoCount_' + safePlaca + '" class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold">1/' + fotoCount + '</span>' +
      '<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">' + dotsHtml + '</div>' +
      '<span class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[9px] text-white px-1.5 py-0.5 rounded font-mono tracking-wider">' + safePlaca + '</span>' +
    '</div>' +
    '<div class="w-[62%] p-3 flex flex-col justify-between">' +
      '<div>' +
        '<div class="flex justify-between items-start mb-1">' +
          '<h3 class="font-bold text-on-surface text-[13px] leading-tight font-sora pr-1">' + sanitizeHTML(fullName) + '</h3>' +
          estadoBadgeHTML(item.estado) +
        '</div>' +
        '<p class="text-[11px] text-on-secondary-container">' + item.anio + ' \u00B7 ' + sanitizeHTML(item.color) + ' \u00B7 ' + (item.kilometraje || 0).toLocaleString() + ' km \u00B7 ' + item.transmision + '</p>' +
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
          '<button class="p-1.5 rounded-lg bg-surface-container-high/60 hover:bg-red-500/20 text-on-secondary-container hover:text-red-400 transition-colors" data-action="delete" data-id="' + sanitizeHTML(item.id) + '" data-placa="' + safePlaca + '" title="Eliminar">' +
            '<span class="material-symbols-outlined text-[16px]">delete</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  (flags ? '<div class="px-3 pb-2 pt-0 flex gap-2">' + flags + '</div>' : "");
}

/* ── CARD EVENT DELEGATION ─────────────────── */
function setupCardDelegation(handlers) {
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
function cycleCardPhoto(placa, vehicles) {
  for (var ci = 0; ci < vehicles.length; ci++) {
    if (vehicles[ci].placa === placa) {
      var car = vehicles[ci];
      if (!car || !car.fotos || car.fotos.length <= 1) return;
      var img = document.getElementById("img_" + placa);
      if (!img) return;
      var idx = (parseInt(img.dataset.activeIdx || 0, 10) + 1) % car.fotos.length;
      img.dataset.activeIdx = idx;
      img.src = car.fotos[idx];
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
function showNotifications(vehicles) {
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
function applyFilters(vehicles, activeFilterTab) {
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

function toggleFilterDrawer() {
  var el = document.getElementById("filterDrawer");
  if (el.classList.contains("hidden")) el.classList.remove("hidden");
  else el.classList.add("hidden");
}

function clearFilters() {
  document.getElementById("filterTr").value = "";
  document.getElementById("filterEstado").value = "";
  document.getElementById("filterAlerts").value = "";
  document.getElementById("searchInput").value = "";
}

function filterExpiringOnly() {
  document.getElementById("filterAlerts").value = "any";
  document.getElementById("filterDrawer").classList.remove("hidden");
}

/* ── TAB SWITCHING ─────────────────────────── */
function switchDashboardTab(tab) {
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
function openModal(modalId) {
  var el = document.getElementById(modalId);
  if (!el) return;
  el.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  var el = document.getElementById(modalId);
  if (!el) return;
  el.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ── PHOTO MANAGEMENT IN FORM ──────────────── */
function resetPhotoState() {
  photoItems = [];
  removedExistingUrls = [];
  renderPhotoPreviews();
}

function setPhotoItems(items) {
  photoItems = [];
  for (var si = 0; si < items.length; si++) {
    if (items[si] && items[si].trim() !== "") {
      photoItems.push({ src: items[si], isExisting: true });
    }
  }
  removedExistingUrls = [];
  renderPhotoPreviews();
}

function triggerFileInput() {
  if (photoItems.length >= 10) {
    alert("M\u00E1ximo 10 fotos por veh\u00EDculo.");
    return;
  }
  document.getElementById("vehicleFileInput").click();
}

function handleFileSelect(e) {
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
    thumb.innerHTML =
      '<img src="' + item.src + '" class="w-full h-full object-cover" alt="Foto ' + (pi + 1) + '">' +
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
function fillFormFields(vehicle) {
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

function resetFormFields() {
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

function collectFormData() {
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

function validateForm(data) {
  var errors = [];
  if (!data.marca) errors.push("La marca es obligatoria.");
  if (!data.linea) errors.push("La l\u00ednea es obligatoria.");
  if (!data.placa) errors.push("La placa es obligatoria.");
  if (!data.anio || data.anio < 1900 || data.anio > 2100) errors.push("Ingresa un a\u00F1o v\u00E1lido.");
  if (!data.precioVenta || data.precioVenta <= 0) errors.push("El precio de venta debe ser mayor a 0.");
  if (!data.kilometraje || data.kilometraje < 0) errors.push("El kilometraje no es v\u00E1lido.");
  if (!data.color) errors.push("El color es obligatorio.");
  return errors;
}

/* ── DELETE DIALOG ─────────────────────────── */
function showDeleteConfirm(id, placa) {
  var dialog = document.getElementById("deleteDialog");
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  dialog.dataset.targetId = id;
  dialog.dataset.targetPlaca = placa;
}

function closeDeleteDialog() {
  var dialog = document.getElementById("deleteDialog");
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  delete dialog.dataset.targetId;
  delete dialog.dataset.targetPlaca;
}

function getDeleteTarget() {
  var dialog = document.getElementById("deleteDialog");
  return { id: dialog.dataset.targetId, placa: dialog.dataset.targetPlaca };
}

/* ── SEED DATA ─────────────────────────────── */
function buildSeedVehicles() {
  return [
    { vehiculo: "APRILIA SXR 160 ABS", placa: "ODD81G", modelo: 2023, color: "Negro", cc: "160", tr: "MC", matricula: "Chia", km: 24000, soat: "11/06/2026", rtm: "13/06/2026", precio: 9900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Scooter premium de Aprilia, 160cc, frenos ABS, excelente estado de conservaci\u00F3n.", fotos: ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "AUDI Q5 SPORTBACK HYBRIDA", placa: "NIS258", modelo: 2023, color: "Plata", cc: "2.0", tr: "AT", matricula: "Bogot\u00E1", km: 24000, soat: "19/11/2026", rtm: "NO APLICA", precio: 193900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "VIRTUAL", especificaciones: "H\u00EDbrida autorrecargable, dise\u00F1o Sportback tipo coup\u00E9.", fotos: ["https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "AUDI Q7 BLINDADA", placa: "DT2138", modelo: 2018, color: "Gris", cc: "2.9", tr: "AT", matricula: "Barranquilla", km: 37000, soat: "ESTRENAR", rtm: "ESTRENAR", precio: 124900000, reporte: "SI+C", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Blindaje Nivel 3. Motor V6 2.9L Turbo.", fotos: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "BAJAJ PULSAR NS 200 FL", placa: "QLY65G", modelo: 2024, color: "Gris", cc: "200", tr: "MC", matricula: "In\u00EDrida", km: 37000, soat: "ESTRENAR", rtm: "ESTRENAR", precio: 10600000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Motocicleta Bajaj Pulsar NS 200 Fuel Injection.", fotos: ["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "BMW 320I F30 Sportline", placa: "FNO661", modelo: 2018, color: "Gris", cc: "2.0", tr: "AT", matricula: "Bogot\u00E1", km: 52300, soat: "10/09/2026", rtm: "15/09/2026", precio: 91900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "BMW Serie 3 F30 Sportline. Motor 2.0 TwinPower Turbo.", fotos: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "BMW X1 XDRIVE30", placa: "PCV412", modelo: 2025, color: "Blanco", cc: "0", tr: "AT", matricula: "Bogot\u00E1", km: 4800, soat: "26/03/2027", rtm: "NO APLICA", precio: 198900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Modelo 2025. Tracci\u00F3n integral xDrive.", fotos: ["https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "CHEVROLET CAPTIVA SPORT", placa: "ZZN709", modelo: 2015, color: "Marr\u00F3n", cc: "2.3", tr: "AT", matricula: "Bogot\u00E1", km: 106931, soat: "06/09/2026", rtm: "07/09/2026", precio: 32900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Familiar espaciosa, motor 2.3L, caja autom\u00E1tica.", fotos: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "CHEVROLET SPARK", placa: "JRN198", modelo: 2021, color: "Azul", cc: "1.2", tr: "MC", matricula: "Funza", km: 97000, soat: "14/03/2027", rtm: "24/02/2027", precio: 41900000, reporte: "NO", prenda: "SI", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Chevrolet Spark GT, econ\u00F3mico en combustible.", fotos: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1494976388531-d1058494dbb8?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "CHEVROLET TRACKER", placa: "INZ851", modelo: 2017, color: "Gris", cc: "1.8", tr: "MC", matricula: "Yopal", km: 110409, soat: "ESTRENAR", rtm: "ESTRENAR", precio: 39900000, reporte: "NO", prenda: "SI", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Camioneta urbana Tracker LS, motor 1.8L.", fotos: ["https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "FORD FIESTA", placa: "HVO442", modelo: 2014, color: "Rojo", cc: "1.6", tr: "AT", matricula: "Bogot\u00E1", km: 82000, soat: "01/06/2026", rtm: "25/07/2026", precio: 37900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "SEPARADO", especificaciones: "Ford Fiesta SE autom\u00E1tico, motor 1.6L Ti-VCT.", fotos: ["https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "JEEP WRANGLER UNLIMITED 4xe", placa: "PCM866", modelo: 2023, color: "Amarillo", cc: "2.0", tr: "AT", matricula: "Bogot\u00E1", km: 15000, soat: "15/01/2027", rtm: "NO APLICA", precio: 387900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Wrangler H\u00EDbrido Enchufable (PHEV) de alta gama.", fotos: ["https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "KIA SORENTO EX", placa: "BRI140", modelo: 2005, color: "Rojo", cc: "3.5", tr: "AT", matricula: "Bogot\u00E1", km: 127591, soat: "17/10/2026", rtm: "18/10/2026", precio: 29900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "ALISTAMIENTO", especificaciones: "Kia Sorento EX, motor 3.5L V6, tracci\u00F3n 4x4.", fotos: ["https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "MERCEDES BENZ GLC 300 4MATIC", placa: "GRM816", modelo: 2020, color: "Blanco", cc: "2.0", tr: "AT", matricula: "Medell\u00EDn", km: 56033, soat: "23/08/2026", rtm: "23/08/2026", precio: 118900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "SUV de lujo. Tracci\u00F3n integral 4MATIC.", fotos: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"] },
    { vehiculo: "VOLVO XC40", placa: "KZR392", modelo: 2022, color: "Azul", cc: "2.0", tr: "AT", matricula: "Sabaneta", km: 1100, soat: "ESTRENAR", rtm: "NO APLICA", precio: 152900000, reporte: "NO", prenda: "NO", ubicacion: "129", estado: "DISPONIBLE", especificaciones: "Volvo XC40 Mild Hybrid. Kilometraje extremadamente bajo.", fotos: ["https://images.unsplash.com/photo-1494976388531-d1058494dbb8?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80"] }
  ];
}
