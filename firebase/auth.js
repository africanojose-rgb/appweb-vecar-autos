function login(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function logout() {
  return auth.signOut();
}

function onAuthChange(callback) {
  return auth.onAuthStateChanged(callback);
}

function getCurrentUser() {
  return auth.currentUser;
}

function getAuthErrorMessage(error) {
  var map = {
    "auth/invalid-email": "Credenciales inválidas. Verifica tus datos.",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
    "auth/invalid-credential": "Credenciales inválidas. Verifica tus datos.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet."
  };
  return map[error.code] || "Credenciales inválidas. Verifica tus datos.";
}
