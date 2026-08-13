import { showAlert, sanitizeHTML } from './utils.js';
import { addVehicle, getDatabaseErrorMessage } from '../supabase/database.js';

/* ── COLUMN DEFINITIONS ────────────────────── */
var SHEET_COLUMNS = [
  { key: "marca", label: "MARCA", required: true },
  { key: "linea", label: "LINEA", required: true },
  { key: "version", label: "VERSION" },
  { key: "placa", label: "PLACA", required: true },
  { key: "anio", label: "ANIO", required: true },
  { key: "cilindraje", label: "CILINDRAJE" },
  { key: "color", label: "COLOR", required: true },
  { key: "transmision", label: "TRANSMISION" },
  { key: "kilometraje", label: "KILOMETRAJE" },
  { key: "matriculaCiudad", label: "MATRICULA_CIUDAD" },
  { key: "precioCompra", label: "PRECIO_COMPRA" },
  { key: "precioVenta", label: "PRECIO_VENTA", required: true },
  { key: "ubicacion", label: "UBICACION" },
  { key: "soatVence", label: "SOAT_VENCE" },
  { key: "rtmVence", label: "RTM_VENCE" },
  { key: "reporte", label: "REPORTE" },
  { key: "prenda", label: "PRENDA" },
  { key: "estado", label: "ESTADO" },
  { key: "visibleWeb", label: "VISIBLE_WEB" },
  { key: "descripcion", label: "DESCRIPCION" }
];

function colLabel(key) {
  for (var ci = 0; ci < SHEET_COLUMNS.length; ci++) {
    if (SHEET_COLUMNS[ci].key === key) return SHEET_COLUMNS[ci].label;
  }
  return key.toUpperCase();
}

/* ── TEMPLATE DOWNLOAD (Excel) ─────────────── */
function downloadImportTemplate() {
  if (typeof XLSX === "undefined") {
    showAlert("La librería SheetJS no está disponible. Revisa tu conexión a internet.", "error");
    return;
  }
  var header = SHEET_COLUMNS.map(function (c) { return c.label; });
  var example = SHEET_COLUMNS.map(function (c) {
    var map = {
      marca: "AUDI", linea: "Q5", version: "Sportback Hybrid", placa: "NIS258",
      anio: 2023, cilindraje: "2.0", color: "Plata", transmision: "AT",
      kilometraje: 24000, matriculaCiudad: "Bogotá", precioCompra: 0,
      precioVenta: 193900000, ubicacion: "129", soatVence: "19/11/2026",
      rtmVence: "NO APLICA", reporte: "NO", prenda: "NO",
      estado: "DISPONIBLE", visibleWeb: "SI", descripcion: "Híbrida autorrecargable"
    };
    return map[c.key] || "";
  });
  var ws = XLSX.utils.aoa_to_sheet([header, example]);
  ws["!cols"] = SHEET_COLUMNS.map(function () { return { wch: 18 }; });
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vehiculos");
  var wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  var blob = new Blob([wbout], { type: "application/octet-stream" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_importacion_vehiculos.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── EXCEL PARSER ──────────────────────────── */
function parseExcelToVehicles(file) {
  return new Promise(function (resolve, reject) {
    if (typeof XLSX === "undefined") {
      reject(new Error("SheetJS no está disponible. Verifica tu conexión."));
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: "array" });
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (rows.length < 2) {
          reject(new Error("El archivo debe tener encabezados y al menos una fila de datos."));
          return;
        }
        var headers = rows[0].map(function (h) { return String(h).trim().toUpperCase(); });
        var colMap = buildColumnMap(headers);
        var vehicles = [];
        var errors = [];
        for (var ri = 1; ri < rows.length; ri++) {
          var row = rows[ri];
          var isEmpty = row.every(function (c) { return String(c).trim() === ""; });
          if (isEmpty) continue;
          var vehicle = mapRowToVehicle(row, colMap);
          var errs = validateImportRow(vehicle, ri + 1);
          if (errs.length > 0) {
            for (var ei = 0; ei < errs.length; ei++) errors.push(errs[ei]);
            continue;
          }
          vehicles.push(vehicle);
        }
        resolve({ vehicles: vehicles, errors: errors });
      } catch (err) {
        reject(new Error("Error al leer el archivo Excel: " + err.message));
      }
    };
    reader.onerror = function () { reject(new Error("Error al leer el archivo.")); };
    reader.readAsArrayBuffer(file);
  });
}

function buildColumnMap(headers) {
  var map = {};
  for (var hi = 0; hi < headers.length; hi++) {
    var h = headers[hi];
    for (var ci = 0; ci < SHEET_COLUMNS.length; ci++) {
      if (SHEET_COLUMNS[ci].label === h) {
        map[SHEET_COLUMNS[ci].key] = hi;
        break;
      }
    }
  }
  return map;
}

function getCell(row, colMap, key) {
  var idx = colMap[key];
  if (idx === undefined) return "";
  return row[idx] !== undefined && row[idx] !== null ? row[idx] : "";
}

function mapRowToVehicle(row, colMap) {
  var raw = {};
  for (var ci = 0; ci < SHEET_COLUMNS.length; ci++) {
    raw[SHEET_COLUMNS[ci].key] = getCell(row, colMap, SHEET_COLUMNS[ci].key);
  }
  return normalizeVehicle(raw);
}

function normalizeVehicle(raw) {
  var v = {
    marca: String(raw.marca || "").trim().toLowerCase(),
    linea: String(raw.linea || "").trim(),
    version: String(raw.version || "").trim(),
    placa: String(raw.placa || "").trim().toUpperCase(),
    anio: parseInt(raw.anio, 10) || 0,
    cilindraje: String(raw.cilindraje || "").trim() || "0",
    color: String(raw.color || "").trim() || "N/A",
    transmision: String(raw.transmision || "").trim().toUpperCase() || "AT",
    kilometraje: parseInt(String(raw.kilometraje).replace(/[.,\s]/g, ""), 10) || 0,
    matriculaCiudad: String(raw.matriculaCiudad || "").trim() || "Bogotá",
    precioCompra: parseInt(String(raw.precioCompra).replace(/[.,\s]/g, ""), 10) || 0,
    precioVenta: parseInt(String(raw.precioVenta).replace(/[.,\s]/g, ""), 10) || 0,
    ubicacion: String(raw.ubicacion || "").trim() || "129",
    soatVence: String(raw.soatVence || "").trim(),
    rtmVence: String(raw.rtmVence || "").trim(),
    reporte: normalizeBool(raw.reporte, false),
    prenda: normalizeBool(raw.prenda, false),
    estado: normalizeEstado(raw.estado),
    visibleWeb: normalizeBool(raw.visibleWeb, true),
    descripcion: String(raw.descripcion || "").trim()
  };
  return v;
}

function normalizeBool(val, defaultVal) {
  if (val === true || val === "true" || val === "SI" || val === "S" || val === 1 || val === "1") return true;
  if (val === false || val === "false" || val === "NO" || val === "N" || val === 0 || val === "0" || val === "") return defaultVal;
  return defaultVal;
}

function normalizeEstado(val) {
  var s = String(val).trim().toUpperCase();
  var valid = ["DISPONIBLE", "VIRTUAL", "SEPARADO", "ALISTAMIENTO", "VENDIDO"];
  for (var ei = 0; ei < valid.length; ei++) {
    if (s === valid[ei]) return s;
  }
  return "DISPONIBLE";
}

function validateImportRow(v, rowNum) {
  var errs = [];
  if (!v.marca) errs.push("Fila " + rowNum + ": MARCA es obligatoria.");
  if (!v.linea) errs.push("Fila " + rowNum + ": LINEA es obligatoria.");
  if (!v.placa) errs.push("Fila " + rowNum + ": PLACA es obligatoria.");
  if (!v.anio || v.anio < 1900 || v.anio > 2100) errs.push("Fila " + rowNum + ": ANIO inválido.");
  if (!v.precioVenta || v.precioVenta <= 0) errs.push("Fila " + rowNum + ": PRECIO_VENTA debe ser > 0.");
  if (!v.color) errs.push("Fila " + rowNum + ": COLOR es obligatorio.");
  return errs;
}

/* ── SQL PARSER ────────────────────────────── */
function parseSqlToVehicles(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var text = e.target.result;
        var vehicles = [];
        var errors = [];
        var statements = extractInsertStatements(text);
        if (statements.length === 0) {
          reject(new Error("No se encontraron sentencias INSERT INTO en el archivo SQL."));
          return;
        }
        for (var si = 0; si < statements.length; si++) {
          var result = parseSingleInsert(statements[si]);
          if (result.error) {
            errors.push("Sentencia " + (si + 1) + ": " + result.error);
            continue;
          }
          for (var ri = 0; ri < result.rows.length; ri++) {
            var v = normalizeVehicle(result.rows[ri]);
            var errs = validateImportRow(v, 0);
            if (errs.length > 0) {
              for (var ei = 0; ei < errs.length; ei++) errors.push(errs[ei]);
              continue;
            }
            vehicles.push(v);
          }
        }
        resolve({ vehicles: vehicles, errors: errors });
      } catch (err) {
        reject(new Error("Error al analizar SQL: " + err.message));
      }
    };
    reader.onerror = function () { reject(new Error("Error al leer el archivo.")); };
    reader.readAsText(file);
  });
}

function extractInsertStatements(text) {
  var cleaned = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
  var statements = [];
  var regex = /INSERT\s+INTO\s+`?vehiculos`?\s*\(([^)]+)\)\s*VALUES\s*((?:\([^)]+\)\s*,?\s*)+)\s*;?/gi;
  var match;
  while ((match = regex.exec(cleaned)) !== null) {
    statements.push(match[0]);
  }
  return statements;
}

function parseSingleInsert(sql) {
  var colsMatch = sql.match(/INSERT\s+INTO\s+`?vehiculos`?\s*\(([^)]+)\)/i);
  if (!colsMatch) return { error: "No se pudieron extraer las columnas." };
  var rawColNames = colsMatch[1].split(",").map(function (c) { return c.trim().replace(/`/g, "").toLowerCase(); });

  var validKeys = {};
  for (var vki = 0; vki < SHEET_COLUMNS.length; vki++) validKeys[SHEET_COLUMNS[vki].key] = true;

  var colNames = [];
  for (var cni = 0; cni < rawColNames.length; cni++) {
    if (validKeys[rawColNames[cni]]) colNames.push(rawColNames[cni]);
  }

  var valuesBlock = sql.substring(sql.indexOf("VALUES") + 6).trim().replace(/;\s*$/, "");
  var rows = extractValueRows(valuesBlock);

  var result = [];
  for (var ri = 0; ri < rows.length; ri++) {
    var vals = rows[ri];
    var raw = {};
    for (var ci = 0; ci < colNames.length && ci < vals.length; ci++) {
      raw[colNames[ci]] = parseSqlValue(vals[ci]);
    }
    result.push(raw);
  }
  return { rows: result, error: null };
}

function extractValueRows(text) {
  text = text.trim();
  var rows = [];
  var depth = 0;
  var start = -1;
  var inStr = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === "'") { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "(") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0 && start >= 0) {
        rows.push(text.substring(start + 1, i));
        start = -1;
      }
    }
  }
  return rows.map(function (r) { return splitSqlValues(r); });
}

function splitSqlValues(text) {
  var values = [];
  var current = "";
  var inStr = false;
  var escape = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }
    if (ch === "'" && inStr) {
      if (i + 1 < text.length && text[i + 1] === "'") {
        current += "'";
        i++;
        continue;
      }
      inStr = false;
      continue;
    }
    if (ch === "'" && !inStr) {
      inStr = true;
      continue;
    }
    if (!inStr && ch === ",") {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim() !== "") values.push(current.trim());
  return values;
}

function parseSqlValue(val) {
  if (!val || val.toUpperCase() === "NULL" || val.toUpperCase() === "''") return "";
  if ((val[0] === "'" && val[val.length - 1] === "'") || (val[0] === '"' && val[val.length - 1] === '"')) {
    var inner = val.slice(1, -1);
    if (val[0] === "'") inner = inner.replace(/''/g, "'");
    else inner = inner.replace(/""/g, '"');
    return inner;
  }
  var num = Number(val);
  if (!isNaN(num) && val.trim() !== "") return num;
  return val;
}

/* ── EXPORT BACKUP ──────────────────────────── */
function downloadBackupExcel(vehicles) {
  if (typeof XLSX === "undefined") {
    showAlert("La librería SheetJS no está disponible.", "error");
    return;
  }
  if (vehicles.length === 0) {
    showAlert("No hay vehículos en el inventario para exportar.", "warning");
    return;
  }

  var header = SHEET_COLUMNS.map(function (c) { return c.label; });
  var rows = [header];

  for (var vi = 0; vi < vehicles.length; vi++) {
    var v = vehicles[vi];
    var row = SHEET_COLUMNS.map(function (c) {
      var val = v[c.key];
      switch (c.key) {
        case "marca": return (val || "").toUpperCase();
        case "reporte":
        case "prenda": return val ? "SI" : "NO";
        case "visibleWeb": return val !== false ? "SI" : "NO";
        case "anio":
        case "kilometraje":
        case "precioCompra":
        case "precioVenta": return val || 0;
        default: return val || "";
      }
    });
    rows.push(row);
  }

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = SHEET_COLUMNS.map(function () { return { wch: 18 }; });
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vehiculos");
  var wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  var blob = new Blob([wbout], { type: "application/octet-stream" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  var now = new Date();
  var dateStr = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");
  a.href = url;
  a.download = "backup_vehiculos_" + dateStr + ".xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAlert("Backup exportado: " + vehicles.length + " vehículos.", "success");
}

/* ── SUPABASE IMPORT ───────────────────────── */
async function importToSupabase(vehicles, onProgress) {
  var results = { success: 0, errors: [] };
  for (var ii = 0; ii < vehicles.length; ii++) {
    try {
      var v = vehicles[ii];
      v.fotos = v.fotos || [];
      await addVehicle(v);
      results.success++;
    } catch (err) {
      results.errors.push({ index: ii, placa: vehicles[ii].placa, error: getDatabaseErrorMessage(err) });
    }
    if (onProgress) onProgress(ii + 1, vehicles.length);
  }
  return results;
}

/* ── ORCHESTRATOR ──────────────────────────── */
function handleImportFileSelected() {
  var input = document.getElementById("importFileInput");
  var file = input.files[0];
  if (!file) return;
  startImport(file);
}

async function startImport(file) {
  var formatRadio = document.querySelector('input[name="importFormat"]:checked');
  var format = formatRadio ? formatRadio.value : "excel";
  var dropZone = document.getElementById("importDropZone");
  var progressContainer = document.getElementById("importProgressContainer");
  var progressBar = document.getElementById("importProgressBar");
  var progressText = document.getElementById("importProgressText");
  var resultContainer = document.getElementById("importResult");

  dropZone.classList.add("hidden");
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "Procesando archivo " + file.name + "...";
  resultContainer.innerHTML = "";
  resultContainer.classList.add("hidden");

  try {
    var parsed = format === "sql" ? await parseSqlToVehicles(file) : await parseExcelToVehicles(file);

    if (parsed.vehicles.length === 0) {
      var msg = "No se encontraron vehículos válidos.";
      if (parsed.errors.length > 0) msg += " Errores:\n" + parsed.errors.join("\n");
      showAlert(msg, "error");
      resetImportUI();
      return;
    }

    progressText.textContent = "Importando " + parsed.vehicles.length + " vehículos...";

    var results = await importToSupabase(parsed.vehicles, function (done, total) {
      var pct = Math.round((done / total) * 100);
      progressBar.style.width = pct + "%";
      progressText.textContent = "Importando " + done + " de " + total + "...";
    });

    progressBar.style.width = "100%";
    var html = "";
    if (results.success > 0) {
      html += '<div class="flex items-center gap-2 text-green-400 font-bold">' +
        '<span class="material-symbols-outlined text-[18px]">check_circle</span>' +
        results.success + ' vehículos importados exitosamente.</div>';
    }
    if (results.errors.length > 0) {
      html += '<div class="mt-2 text-xs text-red-400 space-y-0.5">' +
        '<span class="font-bold">' + results.errors.length + ' errores:</span>';
      for (var ei = 0; ei < results.errors.length; ei++) {
        html += '<div>• ' + sanitizeHTML(results.errors[ei].placa) + ': ' + sanitizeHTML(results.errors[ei].error) + '</div>';
      }
      html += '</div>';
    }
    if (parsed.errors.length > 0) {
      html += '<div class="mt-2 text-xs text-amber-400 space-y-0.5">' +
        '<span class="font-bold">' + parsed.errors.length + ' advertencias de validación:</span>';
      for (var ei = 0; ei < parsed.errors.length; ei++) {
        html += '<div>• ' + sanitizeHTML(parsed.errors[ei]) + '</div>';
      }
      html += '</div>';
    }
    resultContainer.innerHTML = html;
    resultContainer.classList.remove("hidden");
    progressText.textContent = "Importación completada.";
    setTimeout(resetImportUI, 6000);
  } catch (err) {
    showAlert(err.message || "Error al procesar el archivo.", "error");
    resetImportUI();
  }
}

function resetImportUI() {
  var dropZone = document.getElementById("importDropZone");
  var progressContainer = document.getElementById("importProgressContainer");
  var resultContainer = document.getElementById("importResult");
  var fileInput = document.getElementById("importFileInput");
  dropZone.classList.remove("hidden");
  progressContainer.classList.add("hidden");
  fileInput.value = "";
  setTimeout(function () {
    resultContainer.classList.add("hidden");
    resultContainer.innerHTML = "";
  }, 10000);
}

/* ── DRAG & DROP ───────────────────────────── */
function setupImportDropZone() {
  var dropZone = document.getElementById("importDropZone");
  var fileInput = document.getElementById("importFileInput");
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", function () { fileInput.click(); });

  dropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropZone.classList.add("border-electric-blue", "bg-electric-blue/5");
  });

  dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("border-electric-blue", "bg-electric-blue/5");
  });

  dropZone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropZone.classList.remove("border-electric-blue", "bg-electric-blue/5");
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      startImport(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      startImport(fileInput.files[0]);
    }
  });
}

/* ── INIT ──────────────────────────────────── */
export function initImport(getInventory) {
  var dlBtn = document.getElementById("downloadTemplateBtn");
  if (dlBtn) dlBtn.addEventListener("click", downloadImportTemplate);

  var backupBtn = document.getElementById("downloadBackupBtn");
  if (backupBtn) {
    backupBtn.addEventListener("click", function () {
      downloadBackupExcel(getInventory());
    });
  }

  var formatRadios = document.querySelectorAll('input[name="importFormat"]');
  for (var fi = 0; fi < formatRadios.length; fi++) {
    formatRadios[fi].addEventListener("change", function () {
      var isSql = this.value === "sql";
      var accept = document.getElementById("importFileInput");
      accept.accept = isSql ? ".sql" : ".xlsx,.xls";
      var hint = document.getElementById("importFormatHint");
      if (hint) hint.textContent = isSql
        ? "Archivo SQL con sentencias INSERT INTO vehiculos (...)"
        : "Archivo Excel (.xlsx o .xls) con los datos de vehículos";
    });
  }

  setupImportDropZone();
}