// api.js - Servicio de API para Rumbo - VERSIÓN CORREGIDA
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 URL base
const obtenerURLBase = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return 'https://site--rumboapp--hlm7fxqrj6wz.code.run/api';
};









const URL_BASE_API = obtenerURLBase();
console.log('🔗 [API] URL base:', URL_BASE_API);

// Función auxiliar para obtener token
const obtenerToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
    return null;
  }
};

// Función auxiliar para obtener headers - VERSIÓN MEJORADA
const obtenerHeaders = async (contenidoJSON = true) => {
  try {
    const token = await obtenerToken();
    console.log('🔑 Token obtenido:', token ? `${token.substring(0,20)}...` : 'null');
    const headers = contenidoJSON 
      ? {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      : {};
    
    // ⚠️ IMPORTANTE: Verificar que el token sea válido antes de añadirlo
    if (token && 
        token.trim() !== '' && 
        token !== 'null' && 
        token !== 'undefined' &&
        token !== 'Bearer null' && 
        token !== 'Bearer undefined') {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token añadido a headers:', token.substring(0, 20) + '...');
    } else {
      console.log('🔑 Sin token - headers públicos');
    }
    
    return headers;
  } catch (error) {
    console.error('❌ Error obteniendo headers:', error);
    return contenidoJSON 
      ? { 'Content-Type': 'application/json' }
      : {};
  }
};

// Servicio de API
export const servicioAPI = {
  // 🔐 AUTENTICACIÓN

enviarCorreo: async (correo, codigo, modo) => {
  console.log('🔍 [API] enviarCorreo →', `${URL_BASE_API}/auth/enviarCorreo`);
  console.log('📝 Datos a enviar:', { correo, codigo, modo });
  
  try {
    const respuesta = await fetch(`${URL_BASE_API}/auth/enviarCorreo`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        correo, 
        codigo, 
        modo: modo || 'crear' 
      }),
    });
    
    console.log('📡 [API] enviarCorreo Status:', respuesta.status);
    console.log('📡 [API] enviarCorreo Headers:', respuesta.headers);
    
    // Verificar si la respuesta es JSON válido
    const textoRespuesta = await respuesta.text();
    console.log('📡 [API] enviarCorreo Respuesta RAW:', textoRespuesta);
    
    let datos;
    try {
      datos = JSON.parse(textoRespuesta);
      console.log('📡 [API] enviarCorreo Respuesta JSON:', datos);
    } catch (jsonError) {
      console.error('❌ Error parseando JSON:', jsonError.message);
      console.error('❌ Respuesta del servidor (texto):', textoRespuesta);
      return { 
        exito: false, 
        error: 'Error en la respuesta del servidor'
      };
    }
    
    return datos;
  } catch (error) {
    console.error('❌ [API] enviarCorreo Error de red:', error.message);
    console.error('🔧 Stack:', error.stack);
    
    // Detectar tipo de error
    if (error.message.includes('Network request failed')) {
      return { 
        exito: false, 
        error: 'Error de conexión. Verifica tu internet.',
        codigo: 'NETWORK_ERROR'
      };
    }
    
    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      return { 
        exito: false, 
        error: 'Tiempo de espera agotado',
        codigo: 'TIMEOUT'
      };
    }
    
    return { 
      exito: false, 
      error: 'Error de conexión al servidor: ' + error.message,
      codigo: 'CONNECTION_ERROR'
    };
  }
},

verificarCodigo: async (correo, codigo) => {
  console.log('🔍 [API] verificarCodigo →', `${URL_BASE_API}/auth/verificar-codigo`);
  
  try {
    const respuesta = await fetch(`${URL_BASE_API}/auth/verificar-codigo`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ correo, codigo }),
    });
    
    console.log('📡 [API] verificarCodigo Status:', respuesta.status);
    const datos = await respuesta.json();
    return datos;
  } catch (error) {
    console.error('❌ [API] verificarCodigo Error:', error.message);
    return { 
      exito: false, 
      error: 'Error de conexión al servidor'
    };
  }
},

restablecerContrasena: async (correo, nuevaContrasena) => {
  console.log('🔍 [API] restablecerContrasena →', `${URL_BASE_API}/auth/restablecer-contrasena`);
  console.log('📝 Datos:', { correo, nuevaContrasena: '***' });
  
  try {
    const respuesta = await fetch(`${URL_BASE_API}/auth/restablecer-contrasena`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ correo, nuevaContrasena }),
    });
    
    console.log('📡 [API] restablecerContrasena Status:', respuesta.status);
    const datos = await respuesta.json();
    return datos;
  } catch (error) {
    console.error('❌ [API] restablecerContrasena Error:', error.message);
    return { 
      exito: false, 
      error: 'Error de conexión al servidor'
    };
  }
},

obtenerTestsDisponibles: async () => {
  const url = `${URL_BASE_API}/tests/`;
  console.log('🔍 [API] obtenerTestsDisponibles →', url);
  try {
    const headers = await obtenerHeaders();  // <- esto añade el token
    console.log('📤 Headers enviados:', JSON.stringify(headers, null, 2));
    const respuesta = await fetch(url, { method: 'GET', headers });
    const datos = await respuesta.json();
    console.log('📡 Respuesta:', datos);
    return datos;
  } catch (error) {
    console.error('❌ Error:', error);
    return { exito: false, data: [] };
  }
},

  iniciarSesion: async (identificador, contrasena) => {
    const url = `${URL_BASE_API}/auth/login`;
    console.log('🔍 [API] iniciarSesion →', url);
    
    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ identificador, contrasena }),
      });
      
      console.log('📡 [API] iniciarSesion Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] iniciarSesion Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión al servidor'
      };
    }
  },

  registrarUsuario: async (datosUsuario) => {
    const url = `${URL_BASE_API}/auth/registro`;
    console.log('🔍 [API] registrarUsuario →', url);
    
    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosUsuario),
      });
      
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] registrarUsuario Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión de red'
      };
    }
  },

  cerrarSesion: async () => {
    console.log('🔍 [API] cerrarSesion →', `${URL_BASE_API}/auth/logout`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/auth/logout`, {
        method: 'POST',
        headers,
      });
      
      console.log('📡 [API] cerrarSesion Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] cerrarSesion Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  verificarToken: async () => {
    console.log('🔍 [API] verificarToken →', `${URL_BASE_API}/auth/verificar`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/auth/verificar`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] verificarToken Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] verificarToken Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  loginConGoogle: async (datosGoogle) => {
    try {
      console.log('📤 Enviando a /auth/google:', datosGoogle);
      
      const respuesta = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosGoogle),
      });
      
      const resultado = await respuesta.json();
      console.log('📥 Respuesta de /auth/google:', resultado);
      
      return resultado;
    } catch (error) {
      console.error('❌ Error en loginConGoogle:', error);
      return { 
        exito: false, 
        error: 'Error de conexión al servidor',
        codigo: 'NETWORK_ERROR'
      };
    }
  },

  // 👤 PERFIL DE USUARIO
  obtenerEstadisticasUsuario: async () => {
    console.log('🔍 [API] obtenerEstadisticasUsuario →', `${URL_BASE_API}/usuario/estadisticas`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/estadisticas`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerEstadisticasUsuario Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerEstadisticasUsuario Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  obtenerMiPerfil: async () => {
    console.log('🔍 [API] obtenerMiPerfil →', `${URL_BASE_API}/usuario/perfil`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/perfil`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerMiPerfil Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerMiPerfil Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión',
        usuario: null
      };
    }
  },

  // 🔧 ACTUALIZAR PERFIL CORREGIDO
  actualizarPerfil: async (datosPerfil) => {
    console.log('🔍 [API] actualizarPerfil →', `${URL_BASE_API}/usuario/perfil`);
    console.log('📝 Datos a enviar:', datosPerfil);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/perfil`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(datosPerfil),
      });
      
      console.log('📡 [API] actualizarPerfil Status:', respuesta.status);
      const datos = await respuesta.json();
      
      if (!datos.exito && respuesta.status === 401) {
        return {
          exito: false,
          error: 'No autorizado. Por favor, inicia sesión nuevamente.',
          requiereReautenticacion: true
        };
      }
      
      return datos;
    } catch (error) {
      console.error('❌ [API] actualizarPerfil Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión al servidor'
      };
    }
  },

  // 🖼️ FOTOS DE PERFIL Y PORTADA
  subirFotoPerfil: async (formData) => {
    console.log('🔍 [API] subirFotoPerfil →', `${URL_BASE_API}/usuario/foto-perfil`);
    
    try {
      const token = await obtenerToken();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/foto-perfil`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('📡 [API] subirFotoPerfil Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] subirFotoPerfil Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  subirFotoPortada: async (formData) => {
    console.log('🔍 [API] subirFotoPortada →', `${URL_BASE_API}/usuario/foto-portada`);
    
    try {
      const token = await obtenerToken();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/foto-portada`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('📡 [API] subirFotoPortada Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] subirFotoPortada Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  eliminarFotoPerfil: async () => {
    console.log('🔍 [API] eliminarFotoPerfil →', `${URL_BASE_API}/usuario/foto-perfil`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/foto-perfil`, {
        method: 'DELETE',
        headers,
      });
      
      console.log('📡 [API] eliminarFotoPerfil Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] eliminarFotoPerfil Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  eliminarFotoPortada: async () => {
    console.log('🔍 [API] eliminarFotoPortada →', `${URL_BASE_API}/usuario/foto-portada`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/foto-portada`, {
        method: 'DELETE',
        headers,
      });
      
      console.log('📡 [API] eliminarFotoPortada Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] eliminarFotoPortada Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  // 🔍 BÚSQUEDA DE USUARIOS
  buscarUsuarios: async (terminoBusqueda) => {
    console.log('🔍 [API] buscarUsuarios →', `${URL_BASE_API}/usuario/buscar?q=${encodeURIComponent(terminoBusqueda)}`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/buscar?q=${encodeURIComponent(terminoBusqueda)}`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] buscarUsuarios Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] buscarUsuarios Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  obtenerPerfilPublico: async (usuarioId) => {
    console.log('🔍 [API] obtenerPerfilPublico →', `${URL_BASE_API}/usuario/perfil/${usuarioId}`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/perfil/${usuarioId}`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerPerfilPublico Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerPerfilPublico Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  // 📊 RESULTADOS DE TESTS
  obtenerMisResultados: async () => {
    console.log('🔍 [API] obtenerMisResultados →', `${URL_BASE_API}/tests/mis-resultados`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/tests/mis-resultados`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerMisResultados Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerMisResultados Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  obtenerResultadosVocacionales: async () => {
    console.log('🔍 [API] obtenerResultadosVocacionales →', `${URL_BASE_API}/vocacional/resultados`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/vocacional/resultados`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerResultadosVocacionales Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerResultadosVocacionales Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión',
        datos: []
      };
    }
  },

  // 🎓 VOCACIONAL ESPECÍFICO
  obtenerUltimoResultadoVocacional: async () => {
    console.log('🔍 [API] obtenerUltimoResultadoVocacional →', `${URL_BASE_API}/vocacional/ultimo`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/vocacional/ultimo`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerUltimoResultadoVocacional Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerUltimoResultadoVocacional Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  // 👥 SEGUIMIENTO DE USUARIOS
  seguirUsuario: async (usuarioId) => {
    console.log('🔍 [API] seguirUsuario →', `${URL_BASE_API}/usuario/seguir/${usuarioId}`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/seguir/${usuarioId}`, {
        method: 'POST',
        headers,
      });
      
      console.log('📡 [API] seguirUsuario Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] seguirUsuario Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  dejarDeSeguirUsuario: async (usuarioId) => {
    console.log('🔍 [API] dejarDeSeguirUsuario →', `${URL_BASE_API}/usuario/seguir/${usuarioId}`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/seguir/${usuarioId}`, {
        method: 'DELETE',
        headers,
      });
      
      console.log('📡 [API] dejarDeSeguirUsuario Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] dejarDeSeguirUsuario Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  obtenerSeguidores: async (usuarioId) => {
    console.log('🔍 [API] obtenerSeguidores →', `${URL_BASE_API}/usuario/seguidores/${usuarioId}`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/seguidores/${usuarioId}`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerSeguidores Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerSeguidores Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  obtenerSeguidos: async (usuarioId) => {
    console.log('🔍 [API] obtenerSeguidos →', `${URL_BASE_API}/usuario/seguidos/${usuarioId}`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/seguidos/${usuarioId}`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerSeguidos Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerSeguidos Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  // 🎯 BUSCAR POR ROL
  buscarUsuariosPorRol: async (rol) => {
    console.log('🔍 [API] buscarUsuariosPorRol →', `${URL_BASE_API}/usuario/buscar-por-rol/${rol}`);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(`${URL_BASE_API}/usuario/buscar-por-rol/${rol}`, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] buscarUsuariosPorRol Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] buscarUsuariosPorRol Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

buscarUsuariosConFiltros: async (filtros) => {
  console.log('🔍 [API] buscarUsuariosConFiltros →', `${URL_BASE_API}/usuario/buscar-con-filtros`);
  console.log('📝 Filtros a enviar:', filtros);
  
  try {
    const headers = await obtenerHeaders();
    
    const respuesta = await fetch(`${URL_BASE_API}/usuario/buscar-con-filtros`, {
      method: 'POST',
      headers,
      body: JSON.stringify(filtros),
    });
    
    console.log('📡 [API] buscarUsuariosConFiltros Status:', respuesta.status);
    
    // Para debug, mostrar la respuesta completa
    const textoRespuesta = await respuesta.text();
    console.log('📡 [API] buscarUsuariosConFiltros Respuesta RAW:', textoRespuesta);
    
    let datos;
    try {
      datos = JSON.parse(textoRespuesta);
      console.log('📡 [API] buscarUsuariosConFiltros Respuesta JSON:', datos);
    } catch (jsonError) {
      console.error('❌ Error parseando JSON de buscarUsuariosConFiltros:', jsonError.message);
      return { 
        exito: false, 
        usuarios: [],
        error: 'Error en la respuesta del servidor'
      };
    }
    
    return datos;
  } catch (error) {
    console.error('❌ [API] buscarUsuariosConFiltros Error:', error.message);
    return { 
      exito: false, 
      usuarios: [],
      error: 'Error de conexión al servidor'
    };
  }
},

  verificarUsername: async (username) => {
    const url = `${URL_BASE_API}/auth/verificar-username/${encodeURIComponent(username)}`;
    console.log('🔍 [API] verificarUsername →', url);
    
    try {
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      const datos = await respuesta.json();
      console.log('📡 [API] verificarUsername Respuesta:', datos);
      return datos;
    } catch (error) {
      console.error('❌ [API] verificarUsername Error:', error.message);
      return { exito: false, disponible: false, error: 'Error de conexión' };
    }
  },


    // ==================== NOTIFICACIONES ====================

  obtenerNotificaciones: async (pagina = 1, limite = 20) => {
    const url = `${URL_BASE_API}/notificaciones?pagina=${pagina}&limite=${limite}`;
    console.log('🔍 [API] obtenerNotificaciones →', url);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerNotificaciones Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerNotificaciones Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión',
        notificaciones: [],
        total: 0
      };
    }
  },

  marcarNotificacionLeida: async (notificacionId) => {
    const url = `${URL_BASE_API}/notificaciones/${notificacionId}/leer`;
    console.log('🔍 [API] marcarNotificacionLeida →', url);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(url, {
        method: 'PUT',
        headers,
      });
      
      console.log('📡 [API] marcarNotificacionLeida Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] marcarNotificacionLeida Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  marcarTodasLeidas: async () => {
    const url = `${URL_BASE_API}/notificaciones/leer-todas`;
    console.log('🔍 [API] marcarTodasLeidas →', url);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(url, {
        method: 'PUT',
        headers,
      });
      
      console.log('📡 [API] marcarTodasLeidas Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] marcarTodasLeidas Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  eliminarNotificacion: async (notificacionId) => {
    const url = `${URL_BASE_API}/notificaciones/${notificacionId}`;
    console.log('🔍 [API] eliminarNotificacion →', url);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      
      console.log('📡 [API] eliminarNotificacion Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] eliminarNotificacion Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  // ==================== CONFIGURACIÓN DE NOTIFICACIONES ====================

  obtenerConfigNotificaciones: async () => {
    const url = `${URL_BASE_API}/usuario/configuracion-notificaciones`;
    console.log('🔍 [API] obtenerConfigNotificaciones →', url);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      console.log('📡 [API] obtenerConfigNotificaciones Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] obtenerConfigNotificaciones Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  actualizarConfigNotificaciones: async (config) => {
    const url = `${URL_BASE_API}/usuario/configuracion-notificaciones`;
    console.log('🔍 [API] actualizarConfigNotificaciones →', url);
    console.log('📝 Datos a enviar:', config);
    
    try {
      const headers = await obtenerHeaders();
      const respuesta = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(config),
      });
      
      console.log('📡 [API] actualizarConfigNotificaciones Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] actualizarConfigNotificaciones Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  // 🔄 FUNCIÓN AUXILIAR PÚBLICA para obtener ID de usuario actual
  obtenerUsuarioActualId: async () => {
    try {
      const token = await obtenerToken();
      if (!token) return null;
      
      try {
        // Decodificar token JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || null;
      } catch (e) {
        console.log('⚠️ No se pudo decodificar token:', e.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Error en obtenerUsuarioActualId:', error);
      return null;
    }
  },

  // 📞 PRUEBA DE CONEXIÓN
  probarConexion: async () => {
    console.log('🔍 [API] probarConexion →', `${URL_BASE_API}/test`);
    
    try {
      const respuesta = await fetch(`${URL_BASE_API}/test`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API] probarConexion Status:', respuesta.status);
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('❌ [API] probarConexion Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión'
      };
    }
  },

  // 🔧 FUNCIÓN ESPECIAL: Validar contraseña de administrador
  validarContraseñaAdmin: async (contraseña) => {
    // Esto es una validación local en el frontend
    return contraseña === 'jimmyponme6xfi';
  }
};