const API_BASE_URL = 'https://site--parumbo5iv8--p9qqmcg2z56m.code.run/api';

export const apiService = {
  // 🔐 AUTENTICACIÓN
  login: async (identificador, contrasena) => {
    const response = await fetch(`${API_BASE_URL}/autenticacion/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, contrasena }),
    });
    return response.json();
  },

  registro: async (datosUsuario) => {
    const response = await fetch(`${API_BASE_URL}/autenticacion/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosUsuario),
    });
    return response.json();
  },

  loginGoogle: async (tokenGoogle) => {
    const response = await fetch(`${API_BASE_URL}/autenticacion/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenGoogle }),
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/autenticacion/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  verificarToken: async () => {
    const response = await fetch(`${API_BASE_URL}/autenticacion/verificar`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

    cambiarContrasena: async (contrasenaActual, nuevaContrasena) => {
    try {
        // Importamos AsyncStorage aquí para no tener problemas de ciclo
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const token = await AsyncStorage.default.getItem('token') || '';
        
        const response = await fetch(`${API_BASE_URL}/autenticacion/cambiar-contrasena`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ contrasenaActual, nuevaContrasena }),
        });
        
        if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en cambiarContrasena:', error);
        return { 
        exito: false, 
        error: 'Error de conexión con el servidor' 
        };
    }
    },

  // 📧 ENVÍO DE CÓDIGOS (para recuperación de contraseña si lo necesitas)
  enviarCodigo: async (correo, codigo) => {
    const response = await fetch(`${API_BASE_URL}/enviarCorreo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, codigo }),
    });
    return response.json();
  },

  // 🧠 TESTS - SOLO LECTURA (no subirás nuevos tests desde la app)
  obtenerHistorialTests: async (usuarioId) => {
    const response = await fetch(`${API_BASE_URL}/tests/historial/${usuarioId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  obtenerMisResultados: async () => {
    const response = await fetch(`${API_BASE_URL}/tests/mis-resultados`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  obtenerEstadisticasTests: async () => {
    const response = await fetch(`${API_BASE_URL}/tests/estadisticas/generales`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  // 🎯 TESTS VOCACIONALES - SOLO LECTURA
  obtenerResultadosVocacionales: async (usuarioId) => {
    const response = await fetch(`${API_BASE_URL}/vocacional/historial/${usuarioId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  obtenerUltimoVocacional: async (usuarioId) => {
    const response = await fetch(`${API_BASE_URL}/vocacional/ultimo/${usuarioId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  obtenerEstadisticasVocacionales: async (usuarioId) => {
    const response = await fetch(`${API_BASE_URL}/vocacional/estadisticas/${usuarioId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  // 👤 PERFIL DE USUARIO - CON EDICIÓN
  obtenerMiPerfil: async () => {
    const response = await fetch(`${API_BASE_URL}/usuario/perfil`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  obtenerPerfilPublico: async (usuarioId) => {
    const response = await fetch(`${API_BASE_URL}/usuario/perfil/${usuarioId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  // ✅ MANTENEMOS ESTE MÉTODO PARA EDITAR PERFIL
  actualizarPerfil: async (datosPerfil) => {
    const response = await fetch(`${API_BASE_URL}/usuario/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosPerfil),
    });
    return response.json();
  },

  obtenerDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/usuario/dashboard`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  }
};