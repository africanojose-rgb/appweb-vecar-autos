import {
  login,
  logout,
  onAuthChange,
  getCurrentUser,
  getAuthErrorMessage,
  getCurrentSession
} from '../supabase/auth.js';
import {
  listenVehicles,
  removeRealtimeChannel,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getDatabaseErrorMessage
} from '../supabase/database.js';
import { uploadPhoto, deletePhoto, getPhotoUrl, pathFromPublicUrl } from '../supabase/storage.js';
import { showAlert } from './utils.js';
import {
  showLogin,
  showDashboard,
  updateMetrics,
  checkGlobalAlerts,
  applyFilters,
  showNotifications,
  toggleFilterDrawer,
  clearFilters,
  filterExpiringOnly,
  switchDashboardTab,
  openModal,
  closeModal,
  resetPhotoState,
  setPhotoItems,
  fillFormFields,
  resetFormFields,
  collectFormData,
  validateForm,
  setupCardDelegation,
  cycleCardPhoto,
  triggerFileInput,
  handleFileSelect,
  showDeleteConfirm,
  closeDeleteDialog,
  getDeleteTarget,
  clearDashboard,
  photoItems,
  removedExistingUrls
} from './ui.js';
import { initImport } from './import.js';

let inventory = [];
let activeFilterTab = "all";
let activeEditId = null;
let unsubscribe = null;

/* ── AUTH ──────────────────────────────────── */
function initApp() {
  try {
    onAuthChange(function (user) {
  if (user) {
    handleAuthenticatedUser();
  } else {
    stopListening();
    inventory = [];
    showLogin();
  }
});

function startListening() {
  stopListening();
  unsubscribe = listenVehicles(
    function (vehicles) {
      inventory = vehicles;
      updateMetrics(inventory);
      checkGlobalAlerts(inventory);
      applyFilters(inventory, activeFilterTab);
    },
    function (err) {
      showAlert(getDatabaseErrorMessage(err), "error");
    }
  );
}

function stopListening() {
  if (unsubscribe) {
    removeRealtimeChannel(unsubscribe);
    unsubscribe = null;
  }
}

function handleAuthenticatedUser() {
  showDashboard();
  diagnosticAuth();
  startListening();
}

/* ── DIAGNOSTICO ────────────────────────────── */
async function diagnosticAuth() {
  try {
    var session = await getCurrentSession();
    console.log('[Auth] Session:', session ? 'activa' : 'none');
    if (session) {
      console.log('[Auth] User:', session.user.email);
      console.log('[Auth] Expires:', new Date(session.expires_at * 1000));
    }
    return session;
  } catch (e) {
    console.error('[Auth] Error getting session:', e);
    return null;
  }
}

/* ── LOGIN ─────────────────────────────────── */
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var spinner = document.getElementById("loginSpinner");
  var errorBox = document.getElementById("loginErrorMessage");
  var errorText = document.getElementById("loginErrorText");

  spinner.classList.remove("hidden");
  errorBox.classList.add("hidden");
  errorBox.classList.remove("flex");

  try {
    var result = await login(
      document.getElementById("loginEmail").value.trim(),
      document.getElementById("loginPassword").value
    );
    if (result.error) throw result.error;
    console.log('[Login] Exitoso');
    handleAuthenticatedUser();
  } catch (err) {
    errorText.textContent = getAuthErrorMessage(err);
    errorBox.classList.remove("hidden");
    errorBox.classList.add("flex");
  } finally {
    spinner.classList.add("hidden");
  }
});

/* ── LOGOUT ────────────────────────────────── */
document.getElementById("logoutBtn").addEventListener("click", async function () {
  setLogoutLoading(true);
  stopListening();
  try {
    await logout();
  } catch (err) {
    console.error('[Logout] Error:', err);
    showAlert(getAuthErrorMessage(err), "error");
  } finally {
    inventory = [];
    cleanupDashboard();
    setLogoutLoading(false);
    showLogin();
  }
});

function setLogoutLoading(on) {
  var btn = document.getElementById("logoutBtn");
  var spinner = document.getElementById("logoutSpinner");
  if (!btn) return;
  btn.disabled = on;
  if (spinner) spinner.classList.toggle("hidden", !on);
}

function cleanupDashboard() {
  clearDashboard();
  closeModal("vehicleModal");
  closeModal("configModal");
  closeDeleteDialog();
  resetPhotoState();
  resetFormFields();
  clearFilters();
  var errorBox = document.getElementById("loginErrorMessage");
  if (errorBox) {
    errorBox.classList.add("hidden");
    errorBox.classList.remove("flex");
  }
}

/* ── NOTIFICATIONS ─────────────────────────── */
document.getElementById("notifBtn").addEventListener("click", function () {
  showNotifications(inventory);
});

/* ── FILTER EVENTS ─────────────────────────── */
document.getElementById("searchInput").addEventListener("input", function () {
  applyFilters(inventory, activeFilterTab);
});
document.getElementById("filterTr").addEventListener("change", function () {
  applyFilters(inventory, activeFilterTab);
});
document.getElementById("filterEstado").addEventListener("change", function () {
  applyFilters(inventory, activeFilterTab);
});
document.getElementById("filterAlerts").addEventListener("change", function () {
  applyFilters(inventory, activeFilterTab);
});
document.getElementById("filterBtn").addEventListener("click", toggleFilterDrawer);
document.getElementById("clearFilterBtn").addEventListener("click", function () {
  clearFilters();
  applyFilters(inventory, activeFilterTab);
});
document.getElementById("filterExpiringBtn").addEventListener("click", function () {
  filterExpiringOnly();
  applyFilters(inventory, activeFilterTab);
});

/* ── TABS ──────────────────────────────────── */
document.querySelectorAll("[data-tab]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    activeFilterTab = switchDashboardTab(btn.dataset.tab);
    applyFilters(inventory, activeFilterTab);
  });
});

/* ── VEHICLE MODAL ─────────────────────────── */
document.getElementById("addVehicleBtn").addEventListener("click", openAddModal);
document.getElementById("fabAddBtn").addEventListener("click", openAddModal);
document.getElementById("modalCloseBtn").addEventListener("click", function () {
  closeModal("vehicleModal");
  resetPhotoState();
});
document.getElementById("modalPublishBtn").addEventListener("click", saveVehicle);
document.getElementById("saveVehicleBtn").addEventListener("click", saveVehicle);
document.getElementById("vehicleFileInput").addEventListener("change", handleFileSelect);
document.getElementById("addPhotoBtn").addEventListener("click", triggerFileInput);

/* ── CONFIG MODAL ──────────────────────────── */
document.getElementById("configBtn").addEventListener("click", function () {
  openModal("configModal");
});
document.getElementById("configCloseBtn").addEventListener("click", function () {
  closeModal("configModal");
});

/* ── DELETE DIALOG ─────────────────────────── */
document.getElementById("deleteCancelBtn").addEventListener("click", closeDeleteDialog);
document.getElementById("confirmDeleteBtn").addEventListener("click", async function () {
  var target = getDeleteTarget();
  if (!target.id) return;
  try {
    await deleteVehicle(target.id);
    closeDeleteDialog();
    showAlert("Vehiculo " + target.placa + " eliminado.", "success");
  } catch (err) {
    showAlert(getDatabaseErrorMessage(err), "error");
  }
});

/* ── CARD DELEGATION ───────────────────────── */
setupCardDelegation({
  onEdit: function (id) {
    for (var vi = 0; vi < inventory.length; vi++) {
      if (inventory[vi].id === id) { openEditModal(inventory[vi]); return; }
    }
  },
  onDelete: function (id, placa) {
    showDeleteConfirm(id, placa);
  },
  onCyclePhoto: function (placa) {
    cycleCardPhoto(placa, inventory);
  }
});

/* ── ESC ───────────────────────────────────── */
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeModal("vehicleModal");
    closeModal("configModal");
    closeDeleteDialog();
  }
});

/* ── EMPTY STATE RESET ─────────────────────── */
document.getElementById("emptyResetBtn").addEventListener("click", function () {
  clearFilters();
  applyFilters(inventory, activeFilterTab);
});

/* ── MODAL FUNCTIONS ───────────────────────── */
function openAddModal() {
  activeEditId = null;
  resetFormFields();
  resetPhotoState();
  document.getElementById("modalTitle").textContent = "Nuevo Vehiculo";
  openModal("vehicleModal");
}

function openEditModal(vehicle) {
  activeEditId = vehicle.id;
  resetFormFields();
  fillFormFields(vehicle);
  setPhotoItems(vehicle.fotos || []);
  document.getElementById("modalTitle").textContent = "Editar Vehiculo";
  openModal("vehicleModal");
}

async function saveVehicle() {
  var data = collectFormData();
  var errors = validateForm(data);

  if (errors.length > 0) {
    showAlert(errors.join(" "), "error");
    return;
  }

  var saveBtn = document.getElementById("modalPublishBtn");
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>';

  try {
    var user = getCurrentUser();
    var vehicleId = activeEditId || (crypto.randomUUID ? crypto.randomUUID() : generateUUID());

    var finalFotos = [];
    var photosToDelete = removedExistingUrls.slice();

    for (var pi = 0; pi < photoItems.length; pi++) {
      var item = photoItems[pi];
      if (item.isExisting) {
        finalFotos.push(item.src);
      } else if (item.file) {
        var uploadResult = await uploadPhoto(item.file, vehicleId, finalFotos.length);
        var publicUrl = uploadResult.url || getPhotoUrl(uploadResult.path);
        finalFotos.push(publicUrl);
      }
    }

    if (photosToDelete.length > 0) {
      for (var di = 0; di < photosToDelete.length; di++) {
        var path = pathFromPublicUrl(photosToDelete[di]) || photosToDelete[di];
        if (path && path.indexOf('data:') !== 0 && path.indexOf('blob:') !== 0) {
          try { await deletePhoto(path); } catch (e) {}
        }
      }
    }

    if (!activeEditId && user && user.email) {
      data.createdByEmail = user.email;
    }

    data.fotos = finalFotos;

    if (activeEditId) {
      await updateVehicle(activeEditId, data);
      showAlert("Vehiculo actualizado correctamente.", "success");
    } else {
      data.id = vehicleId;
      await addVehicle(data);
      showAlert("Vehiculo agregado correctamente.", "success");
    }

    closeModal("vehicleModal");
    resetPhotoState();
  } catch (err) {
    showAlert(getDatabaseErrorMessage(err), "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = "Guardar";
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* ── IMPORT MODULE (backup/template/import) ─── */
    initImport(function () {
      return inventory;
    });
  } catch (err) {
    console.error('[Init] Error:', err);
  } finally {
    var spinner = document.getElementById("loginSpinner");
    if (spinner) spinner.classList.add("hidden");
  }
}

initApp();