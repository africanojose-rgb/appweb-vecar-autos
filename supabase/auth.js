import { supabaseClient } from './config.js';

let _currentUser = null;

var NETWORK_TIMEOUT_MS = 15000;

function withTimeout(promise, ms) {
  var timer;
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      timer = setTimeout(function () {
        reject(new Error('network_timeout'));
      }, ms);
    })
  ]).finally(function () {
    clearTimeout(timer);
  });
}

export function login(email, password) {
  return withTimeout(
    supabaseClient.auth.signInWithPassword({ email: email, password: password }),
    NETWORK_TIMEOUT_MS
  );
}

export async function logout() {
  try {
    return await withTimeout(supabaseClient.auth.signOut(), NETWORK_TIMEOUT_MS);
  } finally {
    _currentUser = null;
  }
}

export function onAuthChange(callback) {
  var called = false;

  function notify() {
    if (typeof callback === 'function') {
      callback(_currentUser);
    }
  }

  var subscription = supabaseClient.auth.onAuthStateChange(function (event, session) {
    _currentUser = session ? session.user : null;
    if (event === 'INITIAL_SESSION') {
      if (!called) {
        called = true;
        notify();
      }
    } else {
      notify();
    }
  });

  supabaseClient.auth.getSession().then(function (result) {
    var session = result.data ? result.data.session : null;
    _currentUser = session ? session.user : null;
    if (!called) {
      called = true;
      notify();
    }
  });

  return subscription.data.subscription;
}

export function getCurrentUser() {
  return _currentUser;
}

export async function getCurrentSession() {
  var result = await supabaseClient.auth.getSession();
  return result.data ? result.data.session : null;
}

export function getAuthErrorMessage(error) {
  var code = error.code || error.status || '';
  var msg = String(error.message || error.error_description || code);
  var map = {
    'invalid_credentials': 'Credenciales invalidas. Verifica tus datos.',
    'Invalid login credentials': 'Credenciales invalidas. Verifica tus datos.',
    'invalid_grant': 'Credenciales invalidas. Verifica tus datos.',
    'Email not confirmed': 'Correo no confirmado. Revisa tu bandeja de entrada.',
    'email_not_confirmed': 'Correo no confirmado. Revisa tu bandeja de entrada.',
    'sign_up_disabled': 'El registro de nuevos usuarios esta deshabilitado.',
    'user_not_found': 'Usuario no encontrado.',
    'too_many_requests': 'Demasiados intentos. Intenta mas tarde.',
    'over_email_send_rate_limit': 'Demasiados intentos. Espera un momento.',
    'over_request_rate_limit': 'Demasiados intentos. Espera un momento.',
    'network_error': 'Error de conexion. Verifica tu internet.',
    'network_timeout': 'Error de conexion. El servidor no respondio a tiempo.',
    'weak_password': 'La contrasena es debil. Usa al menos 6 caracteres.'
  };
  if (msg.indexOf('network') !== -1 || msg.indexOf('fetch') !== -1 || msg === 'network_timeout') {
    return 'Error de conexion. Verifica tu internet.';
  }
  return map[msg] || map[code] || 'Credenciales invalidas. Verifica tus datos.';
}