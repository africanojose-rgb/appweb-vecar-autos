import '../env.js';

if (typeof window.supabase === 'undefined') {
  throw new Error('Supabase SDK no cargado. Verifica que supabase.umd.js se cargue antes que config.js');
}

var SUPABASE_URL = window.env.SUPABASE_URL;
var SUPABASE_ANON_KEY = window.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || SUPABASE_URL.indexOf('xxxxx') !== -1) {
  console.error('SUPABASE_URL no configurada. Edita env.js con los valores de tu proyecto Supabase.');
}

export var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});