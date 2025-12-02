const API_BASE_URL = 'https://site--parumbo5iv8--p9qqmcg2z56m.code.run/api';

console.log('🔗 [API] URL base configurada:', API_BASE_URL);

export const apiService = {
  // 🔐 AUTENTICACIÓN
  login: async (identificador, contrasena) => {
    console.log('🔍 [API login] Enviando a:', `${API_BASE_URL}/autenticacion/login`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/autenticacion/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ identificador, contrasena }),
      });
      
      console.log('📡 [API login] Status:', response.status);
      const data = await response.json();
      console.log('✅ [API login] Respuesta:', { exito: data.exito, error: data.error });
      return data;
      
    } catch (error) {
      console.error('❌ [API login] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  registro: async (datosUsuario) => {
    console.log('🔍 [API registro] Enviando a:', `${API_BASE_URL}/autenticacion/registro`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/autenticacion/registro`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosUsuario),
      });
      
      console.log('📡 [API registro] Status:', response.status);
      const data = await response.json();
      console.log('✅ [API registro] Respuesta:', { exito: data.exito, error: data.error });
      return data;
      
    } catch (error) {
      console.error('❌ [API registro] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  // 🔴 ¡¡¡CRÍTICO!!! Tu backend espera "access_token", NO "tokenGoogle"
  loginGoogle: async (accessToken) => {
    console.log('🔍 [API Google] === INICIANDO ===');
    console.log('🔗 URL:', `${API_BASE_URL}/autenticacion/google`);
    console.log('🔑 Token (primeros 30):', accessToken?.substring(0, 30) + '...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/autenticacion/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          access_token: accessToken  // ← ¡IMPORTANTE! Backend espera access_token
        }),
      });
      
      console.log('📡 [API Google] Status:', response.status);
      console.log('📡 [API Google] Status text:', response.statusText);
      
      // Leer respuesta como texto primero para debug
      const responseText = await response.text();
      console.log('📥 [API Google] Respuesta cruda:', responseText.substring(0, 200));
      
      try {
        const data = JSON.parse(responseText);
        console.log('✅ [API Google] Respuesta parseada:', {
          exito: data.exito,
          error: data.error,
          tieneUsuario: !!data.usuario,
          tieneToken: !!data.token
        });
        return data;
      } catch (parseError) {
        console.error('❌ [API Google] Error parseando JSON:', parseError);
        console.error('📄 Respuesta recibida:', responseText);
        return { 
          exito: false, 
          error: `Respuesta inválida del servidor: ${responseText.substring(0, 100)}...`
        };
      }
      
    } catch (fetchError) {
      console.error('❌ [API Google] Error de fetch:', fetchError.message);
      return { 
        exito: false, 
        error: `Error de conexión: ${fetchError.message}` 
      };
    }
  },

  logout: async () => {
    console.log('🔍 [API logout] Enviando a:', `${API_BASE_URL}/autenticacion/logout`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/autenticacion/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API logout] Status:', response.status);
      const data = await response.json();
      console.log('✅ [API logout] Respuesta:', data);
      return data;
      
    } catch (error) {
      console.error('❌ [API logout] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  verificarToken: async () => {
    console.log('🔍 [API verificar] Enviando a:', `${API_BASE_URL}/autenticacion/verificar`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/autenticacion/verificar`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API verificar] Status:', response.status);
      const data = await response.json();
      console.log('✅ [API verificar] Respuesta:', { exito: data.exito });
      return data;
      
    } catch (error) {
      console.error('❌ [API verificar] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  cambiarContrasena: async (contrasenaActual, nuevaContrasena) => {
    console.log('🔍 [API cambiarContrasena] Enviando a:', `${API_BASE_URL}/autenticacion/cambiar-contrasena`);
    
    try {
      // Obtener token directamente
      let token = '';
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        token = await AsyncStorage.default.getItem('token') || '';
      } catch (storageError) {
        console.warn('⚠️ No se pudo obtener token de AsyncStorage');
      }
      
      const response = await fetch(`${API_BASE_URL}/autenticacion/cambiar-contrasena`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ contrasenaActual, nuevaContrasena }),
      });
      
      console.log('📡 [API cambiarContrasena] Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [API cambiarContrasena] Respuesta:', data);
      return data;
      
    } catch (error) {
      console.error('❌ [API cambiarContrasena] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión con el servidor' 
      };
    }
  },

  // 📧 ENVÍO DE CÓDIGOS
  enviarCodigo: async (correo, codigo) => {
    console.log('🔍 [API enviarCodigo] Enviando a:', `${API_BASE_URL}/enviarCorreo`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/enviarCorreo`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ correo, codigo }),
      });
      
      console.log('📡 [API enviarCodigo] Status:', response.status);
      const data = await response.json();
      console.log('✅ [API enviarCodigo] Respuesta:', data);
      return data;
      
    } catch (error) {
      console.error('❌ [API enviarCodigo] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  // 🧠 TESTS
  obtenerHistorialTests: async (usuarioId) => {
    console.log('🔍 [API historialTests] Enviando a:', `${API_BASE_URL}/tests/historial/${usuarioId}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tests/historial/${usuarioId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API historialTests] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API historialTests] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  obtenerMisResultados: async () => {
    console.log('🔍 [API misResultados] Enviando a:', `${API_BASE_URL}/tests/mis-resultados`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tests/mis-resultados`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API misResultados] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API misResultados] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  obtenerEstadisticasTests: async () => {
    console.log('🔍 [API estadisticasTests] Enviando a:', `${API_BASE_URL}/tests/estadisticas/generales`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tests/estadisticas/generales`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API estadisticasTests] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API estadisticasTests] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  // 🎯 TESTS VOCACIONALES
  obtenerResultadosVocacionales: async (usuarioId) => {
    console.log('🔍 [API vocacionalHistorial] Enviando a:', `${API_BASE_URL}/vocacional/historial/${usuarioId}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/vocacional/historial/${usuarioId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API vocacionalHistorial] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API vocacionalHistorial] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  obtenerUltimoVocacional: async (usuarioId) => {
    console.log('🔍 [API ultimoVocacional] Enviando a:', `${API_BASE_URL}/vocacional/ultimo/${usuarioId}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/vocacional/ultimo/${usuarioId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API ultimoVocacional] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API ultimoVocacional] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  obtenerEstadisticasVocacionales: async (usuarioId) => {
    console.log('🔍 [API estadisticasVocacional] Enviando a:', `${API_BASE_URL}/vocacional/estadisticas/${usuarioId}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/vocacional/estadisticas/${usuarioId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API estadisticasVocacional] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API estadisticasVocacional] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  // 👤 PERFIL DE USUARIO
  obtenerMiPerfil: async () => {
    console.log('🔍 [API miPerfil] Enviando a:', `${API_BASE_URL}/usuario/perfil`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/perfil`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API miPerfil] Status:', response.status);
      const data = await response.json();
      console.log('✅ [API miPerfil] Respuesta:', { exito: data.exito });
      return data;
      
    } catch (error) {
      console.error('❌ [API miPerfil] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  obtenerPerfilPublico: async (usuarioId) => {
    console.log('🔍 [API perfilPublico] Enviando a:', `${API_BASE_URL}/usuario/perfil/${usuarioId}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/perfil/${usuarioId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API perfilPublico] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API perfilPublico] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  actualizarPerfil: async (datosPerfil) => {
    console.log('🔍 [API actualizarPerfil] Enviando a:', `${API_BASE_URL}/usuario/perfil`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/perfil`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosPerfil),
      });
      
      console.log('📡 [API actualizarPerfil] Status:', response.status);
      const data = await response.json();
      console.log('✅ [API actualizarPerfil] Respuesta:', data);
      return data;
      
    } catch (error) {
      console.error('❌ [API actualizarPerfil] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  },

  obtenerDashboard: async () => {
    console.log('🔍 [API dashboard] Enviando a:', `${API_BASE_URL}/usuario/dashboard`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/dashboard`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('📡 [API dashboard] Status:', response.status);
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ [API dashboard] Error:', error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  }
};