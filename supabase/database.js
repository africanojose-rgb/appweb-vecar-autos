import { supabaseClient } from './config.js';
import { getCurrentUser } from './auth.js';

var VEHICLES_TABLE = 'vehiculos';

let _fetchVehiclesCallback = null;
let _fetchVehiclesOnError = null;

/* ── camelCase / snake_case mapping ─────────── */
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, function (c) { return '_' + c.toLowerCase(); });
}

function mapKeys(obj, mapper) {
  var result = {};
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[mapper(key)] = obj[key];
    }
  }
  return result;
}

function snakeToCamel(record) {
  return mapKeys(record, toCamelCase);
}

function camelToSnake(record) {
  return mapKeys(record, toSnakeCase);
}

/* ── Realtime listener ──────────────────────── */
export function listenVehicles(callback, onError) {
  _fetchVehiclesCallback = callback;
  _fetchVehiclesOnError = onError;
  var channel = supabaseClient.channel('vehiculos-realtime');

  channel.on('postgres_changes',
    { event: '*', schema: 'public', table: VEHICLES_TABLE },
    function () {
      fetchVehicles();
    }
  );

  channel.subscribe(function (status) {
    if (status === 'SUBSCRIBED') {
      fetchVehicles();
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Realtime channel error');
      fetchVehicles();
    }
  });

  return channel;
}

export function removeRealtimeChannel(channel) {
  if (channel) {
    supabaseClient.removeChannel(channel);
  }
}

async function fetchVehicles() {
  try {
    var result = await supabaseClient
      .from(VEHICLES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;

    var vehicles = (result.data || []).map(snakeToCamel);
    if (typeof _fetchVehiclesCallback === 'function') {
      _fetchVehiclesCallback(vehicles);
    }
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    if (typeof _fetchVehiclesOnError === 'function') {
      _fetchVehiclesOnError(error);
    }
  }
}

/* ── CRUD ───────────────────────────────────── */
export async function addVehicle(vehicleData) {
  var user = getCurrentUser();
  if (!user) throw new Error('No hay sesion activa.');

  var dbData = camelToSnake(vehicleData);
  dbData.created_at = new Date().toISOString();
  dbData.updated_at = new Date().toISOString();
  dbData.created_by = user.id;
  dbData.created_by_email = user.email;

  var result = await supabaseClient
    .from(VEHICLES_TABLE)
    .insert(dbData)
    .select();

  if (result.error) throw result.error;

  if (result.data && result.data[0] && result.data[0].id) {
    return result.data[0].id;
  }
  return user.id;
}

export async function updateVehicle(id, vehicleData) {
  var user = getCurrentUser();
  if (!user) throw new Error('No hay sesion activa.');

  var dbData = camelToSnake(vehicleData);
  dbData.updated_at = new Date().toISOString();
  dbData.last_modified_by = user.id;

  var result = await supabaseClient
    .from(VEHICLES_TABLE)
    .update(dbData)
    .eq('id', id);

  if (result.error) throw result.error;
}

export async function deleteVehicle(id) {
  var user = getCurrentUser();
  if (!user) throw new Error('No hay sesion activa.');

  var result = await supabaseClient
    .from(VEHICLES_TABLE)
    .delete()
    .eq('id', id)
    .select('id');

  if (result.error) throw result.error;

  if (!result.data || result.data.length === 0) {
    throw new Error('No se pudo eliminar el vehiculo: la fila no fue encontrada o las politicas RLS lo impiden.');
  }

  fetchVehicles();
}

export function getDatabaseErrorMessage(error) {
  var msg = String(error.message || error.code || '');
  var code = String(error.code || '');
  console.error('[DB Error]', error);
  if (msg.indexOf('permission') !== -1 || msg.indexOf('violates row-level security') !== -1) {
    return 'No tienes permisos para realizar esta operacion.';
  }
  if (msg.indexOf('connect') !== -1 || msg.indexOf('network') !== -1 || msg.indexOf('fetch') !== -1) {
    return 'Error de conexion con la base de datos.';
  }
  if (msg.indexOf('unique') !== -1 || msg.indexOf('duplicate') !== -1) {
    return 'Ya existe un registro con esos datos.';
  }
  if (code === '42501') {
    return 'No tienes permisos para realizar esta operacion. Revisa las politicas RLS en Supabase.';
  }
  return error.message || 'Error al conectar con la base de datos.';
}