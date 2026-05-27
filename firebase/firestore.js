var VEHICLES_COLL = "vehiculos";
var FieldValue = firebase.firestore.FieldValue;

function listenVehicles(callback, onError) {
  return db.collection(VEHICLES_COLL).orderBy("createdAt", "desc").onSnapshot(
    function (snapshot) {
      var vehicles = [];
      snapshot.forEach(function (docSnap) {
        var data = docSnap.data();
        data.id = docSnap.id;
        vehicles.push(data);
      });
      callback(vehicles);
    },
    function (error) {
      console.error("Firestore listen error:", error);
      if (onError) onError(error);
      else callback([]);
    }
  );
}

async function addVehicle(vehicleData) {
  var user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  var data = Object.assign({}, vehicleData, {
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: user.uid
  });

  var docRef = await db.collection(VEHICLES_COLL).add(data);
  return docRef.id;
}

async function updateVehicle(id, vehicleData) {
  var user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  var data = Object.assign({}, vehicleData, {
    updatedAt: FieldValue.serverTimestamp()
  });

  await db.collection(VEHICLES_COLL).doc(id).update(data);
}

async function deleteVehicle(id) {
  var user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await db.collection(VEHICLES_COLL).doc(id).delete();
}

function getFirestoreErrorMessage(error) {
  if (error.code === "permission-denied") {
    return "No tienes permisos para realizar esta operación.";
  }
  if (error.code === "unavailable") {
    return "Servicio temporalmente no disponible. Intenta más tarde.";
  }
  return error.message || "Error al conectar con la base de datos.";
}
