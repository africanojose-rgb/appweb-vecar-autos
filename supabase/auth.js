import { supabaseClient } from './config.js';

let _currentUser = null;

export function login(email, password) {
  return supabaseClient.auth.signInWithPassword({ email: email, password: password });
}

export async function logout() {
  var result = await supabaseClient.auth.signOut();
  if (!result.error) _currentUser = null;
  return result;
}

export function onAuthChange(callback) {
  var called = false;

  var subscription = supabaseClient.auth.onAuthStateChange(function (event, session) {
    _currentUser = session ? session.user : null;
    if (event !== 'INITIAL_SESSION' && !called) {
      called = true;
      callback(_currentUser);
    }
  });

  supabaseClient.auth.getSession().then(function (result) {
    var session = result.data ? result.data.session : null;
    _currentUser = session ? session.user : null;
    if (!called) {
      called = true;
      callback(_currentUser);
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
    'weak_password': 'La contrasena es debil. Usa al menos 6 caracteres.'
  };
  return map[msg] || map[code] || 'Credenciales invalidas. Verifica tus datos.';
}