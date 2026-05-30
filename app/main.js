/* ── STATE ─────────────────────────────────── */
var inventory = [];
var activeFilterTab = "all";
var activeEditId = null;
var unsubscribe = null;

/* ── AUTH WIRING ───────────────────────────── */
onAuthChange(function (user) {
  if (user) {
    showDashboard();
    startListening();
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
    function () {
      showAlert("Error de conexi\u00F3n con Firestore. Verifica tu conexi\u00F3n a internet.", "error");
    }
  );
}

function stopListening() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

/* ── LOGIN FORM ────────────────────────────── */
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  document.getElementById("loginSpinner").classList.remove("hidden");
  document.getElementById("loginErrorMessage").classList.add("hidden");

  try {
    await login(
      document.getElementById("loginEmail").value.trim(),
      document.getElementById("loginPassword").value
    );
  } catch (err) {
    document.getElementById("loginSpinner").classList.add("hidden");
    document.getElementById("loginErrorText").textContent = getAuthErrorMessage(err);
    document.getElementById("loginErrorMessage").classList.remove("hidden");
    document.getElementById("loginErrorMessage").classList.add("flex");
  }
  document.getElementById("loginSpinner").classList.add("hidden");
});

/* ── LOGOUT ────────────────────────────────── */
document.getElementById("logoutBtn").addEventListener("click", async function () {
  try { await logout(); } catch (e) {}
});

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
/* Import handlers are set up in app/import.js */

/* ── DELETE DIALOG ─────────────────────────── */
document.getElementById("deleteCancelBtn").addEventListener("click", closeDeleteDialog);
document.getElementById("confirmDeleteBtn").addEventListener("click", async function () {
  var target = getDeleteTarget();
  if (!target.id) return;
  try {
    await deleteVehicle(target.id);
    closeDeleteDialog();
    showAlert("Veh\u00EDculo " + target.placa + " eliminado.", "success");
  } catch (err) {
    showAlert(getFirestoreErrorMessage(err), "error");
    closeDeleteDialog();
  }
});

/* ── CARD EVENT DELEGATION ─────────────────── */
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

/* ── ESC KEY (global) ──────────────────────── */
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
  document.getElementById("modalTitle").textContent = "Nuevo Veh\u00EDculo";
  openModal("vehicleModal");
}

function openEditModal(vehicle) {
  activeEditId = vehicle.id;
  resetFormFields();
  fillFormFields(vehicle);
  setPhotoItems(vehicle.fotos || []);
  document.getElementById("modalTitle").textContent = "Editar Veh\u00EDculo";
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
    /* Compress new photos to base64 */
    var finalFotos = [];
    for (var pi = 0; pi < photoItems.length; pi++) {
      var item = photoItems[pi];
      if (item.isExisting) {
        finalFotos.push(item.src);
      } else if (item.file) {
        try {
          var b64 = await compressImage(item.file);
          finalFotos.push(b64);
        } catch (e) {
          showAlert("Error comprimiendo foto: " + e.message, "error");
        }
      }
    }
    data.fotos = finalFotos.filter(function (url) { return url && url.trim() !== ""; });

    /* Track who modified */
    var user = getCurrentUser();
    if (user && user.email) {
      if (activeEditId) data.lastModifiedBy = user.email;
      else data.createdByEmail = user.email;
    }

    if (activeEditId) {
      await updateVehicle(activeEditId, data);
      showAlert("Veh\u00EDculo actualizado correctamente.", "success");
    } else {
      await addVehicle(data);
      showAlert("Veh\u00EDculo agregado correctamente.", "success");
    }

    closeModal("vehicleModal");
    resetPhotoState();
  } catch (err) {
    showAlert(getFirestoreErrorMessage(err), "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = "Guardar";
  }
}


