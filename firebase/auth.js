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
<<<<<<< HEAD
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
    "auth/user-not-found": "No existe una cuenta con este correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet."
  };
  return map[error.code] || "Error al iniciar sesión. Intenta nuevamente.";
=======
    "auth/invalid-email": "Credenciales inválidas. Verifica tus datos.",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
    "auth/invalid-credential": "Credenciales inválidas. Verifica tus datos.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet."
  };
  return map[error.code] || "Credenciales inválidas. Verifica tus datos.";
>>>>>>> f1f0a6b (actualizacion con descarga y backup)
}
