const API_BASE_URL = 'https://site--parumbo5iv8--p9qqmcg2z56m.code.run/api';
console.log('🔗 [API] URL base configurada:', API_BASE_URL);

// Cliente API con manejo de token
class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Obtener token de AsyncStorage
  async getToken() {
    if (this.token) return this.token;
    
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const storedToken = await AsyncStorage.default.getItem('token');
      this.token = storedToken;
      return this.token;
    } catch (error) {
      console.warn('⚠️ No se pudo obtener token de AsyncStorage');
      return null;
    }
  }

  // Headers comunes
  async getHeaders(contentType = 'application/json') {
    const token = await this.getToken();
    const headers = {
      'Accept': 'application/json',
    };
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Request genérico
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(options.contentType);
    
    console.log(`🔍 [API] ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
      
      console.log(`📡 [API] ${endpoint} - Status:`, response.status);
      
      // Si es 401 (Unauthorized), limpiar token
      if (response.status === 401) {
        this.clearToken();
      }
      
      const responseText = await response.text();
      
      // Intentar parsear como JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error(`❌ [API] Error parseando JSON de ${endpoint}:`, parseError);
        console.error(`📄 Respuesta:`, responseText.substring(0, 200));
        data = { exito: false, error: 'Respuesta inválida del servidor' };
      }
      
      return data;
      
    } catch (error) {
      console.error(`❌ [API] Error en ${endpoint}:`, error.message);
      return { 
        exito: false, 
        error: 'Error de conexión: ' + error.message 
      };
    }
  }

  // Limpiar token
  clearToken() {
    this.token = null;
  }

  // 🔐 AUTENTICACIÓN
  async login(identificador, contrasena) {
    return this.request('/autenticacion/login', {
      method: 'POST',
      body: JSON.stringify({ identificador, contrasena }),
    });
  }

  async registro(datosUsuario) {
    return this.request('/autenticacion/registro', {
      method: 'POST',
      body: JSON.stringify(datosUsuario),
    });
  }

  async loginGoogle(accessToken) {
    console.log('🔑 [API Google] Token recibido:', accessToken?.substring(0, 30) + '...');
    
    return this.request('/autenticacion/google', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    });
  }

  async logout() {
    const result = await this.request('/autenticacion/logout', {
      method: 'POST',
    });
    
    // Limpiar token localmente
    this.clearToken();
    
    return result;
  }

  async verificarToken() {
    return this.request('/autenticacion/verificar');
  }

  async cambiarContrasena(contrasenaActual, nuevaContrasena) {
    return this.request('/autenticacion/cambiar-contrasena', {
      method: 'POST',
      body: JSON.stringify({ contrasenaActual, nuevaContrasena }),
    });
  }

  // 📧 ENVÍO DE CÓDIGOS
  async enviarCodigo(correo, codigo) {
    return this.request('/enviarCorreo', {
      method: 'POST',
      body: JSON.stringify({ correo, codigo }),
    });
  }

  // 👤 PERFIL DE USUARIO (FUNCIONES NUEVAS)
  async obtenerMiPerfil() {
    return this.request('/usuario/perfil');
  }

  async obtenerPerfilPublico(usuarioId) {
    return this.request(`/usuario/perfil/${usuarioId}`);
  }

  async actualizarPerfil(datosPerfil) {
    return this.request('/usuario/perfil', {
      method: 'PUT',
      body: JSON.stringify(datosPerfil),
    });
  }

  // 📊 ESTADÍSTICAS (FUNCIONES NUEVAS)
  async obtenerEstadisticas() {
    return this.request('/usuario/estadisticas');
  }

  async obtenerDashboard() {
    return this.request('/usuario/dashboard');
  }

  // 🧠 TESTS
  async obtenerHistorialTests(usuarioId) {
    return this.request(`/tests/historial/${usuarioId}`);
  }

  async obtenerMisResultados() {
    return this.request('/tests/mis-resultados');
  }

  async obtenerEstadisticasTests() {
    return this.request('/tests/estadisticas/generales');
  }

  // 🎯 TESTS VOCACIONALES
  async obtenerResultadosVocacionales(usuarioId) {
    return this.request(`/vocacional/historial/${usuarioId}`);
  }

  async obtenerUltimoVocacional(usuarioId) {
    return this.request(`/vocacional/ultimo/${usuarioId}`);
  }

  async obtenerEstadisticasVocacionales(usuarioId) {
    return this.request(`/vocacional/estadisticas/${usuarioId}`);
  }

  // 🔍 BÚSQUEDA DE USUARIOS (FUNCIONES NUEVAS)
  async buscarUsuarios(termino) {
    return this.request(`/usuarios/buscar?q=${encodeURIComponent(termino)}`);
  }

  async obtenerUsuariosPopulares() {
    return this.request('/usuarios/populares');
  }

  // 📝 TESTS (FUNCIONES NUEVAS)
  async crearTest(datosTest) {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(datosTest),
    });
  }

  async obtenerTest(testId) {
    return this.request(`/tests/${testId}`);
  }

  async obtenerMisTests() {
    return this.request('/tests/mios');
  }

  // 📸 SUBIDA DE ARCHIVOS (FUNCIONES NUEVAS)
  async subirImagen(formData) {
    return this.request('/upload/imagen', {
      method: 'POST',
      contentType: null, // Para FormData
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  // 🔔 NOTIFICACIONES (FUNCIONES NUEVAS)
  async obtenerNotificaciones() {
    return this.request('/notificaciones');
  }

  async marcarNotificacionLeida(notificacionId) {
    return this.request(`/notificaciones/${notificacionId}/leer`, {
      method: 'PUT',
    });
  }

  // Métodos de conveniencia
  async obtenerUsuarioActual() {
    const perfil = await this.obtenerMiPerfil();
    if (perfil.exito) {
      return perfil.usuario;
    }
    return null;
  }

  async estaAutenticado() {
    try {
      const resultado = await this.verificarToken();
      return resultado.exito === true;
    } catch (error) {
      return false;
    }
  }
}

// Exportar instancia única
export const apiService = new APIClient();

// También exportar funciones individuales para compatibilidad
export const funcionesAPI = {
  // 🔐 AUTENTICACIÓN
  login: (identificador, contrasena) => apiService.login(identificador, contrasena),
  registro: (datosUsuario) => apiService.registro(datosUsuario),
  loginGoogle: (accessToken) => apiService.loginGoogle(accessToken),
  logout: () => apiService.logout(),
  verificarToken: () => apiService.verificarToken(),
  cambiarContrasena: (contrasenaActual, nuevaContrasena) => 
    apiService.cambiarContrasena(contrasenaActual, nuevaContrasena),

  // 👤 PERFIL
  obtenerMiPerfil: () => apiService.obtenerMiPerfil(),
  obtenerPerfilPublico: (usuarioId) => apiService.obtenerPerfilPublico(usuarioId),
  actualizarPerfil: (datosPerfil) => apiService.actualizarPerfil(datosPerfil),

  // 📊 ESTADÍSTICAS
  obtenerEstadisticas: () => apiService.obtenerEstadisticas(),
  obtenerDashboard: () => apiService.obtenerDashboard(),

  // 🧠 TESTS
  obtenerHistorialTests: (usuarioId) => apiService.obtenerHistorialTests(usuarioId),
  obtenerMisResultados: () => apiService.obtenerMisResultados(),
  obtenerEstadisticasTests: () => apiService.obtenerEstadisticasTests(),

  // 🎯 VOCACIONAL
  obtenerResultadosVocacionales: (usuarioId) => apiService.obtenerResultadosVocacionales(usuarioId),
  obtenerUltimoVocacional: (usuarioId) => apiService.obtenerUltimoVocacional(usuarioId),
  obtenerEstadisticasVocacionales: (usuarioId) => apiService.obtenerEstadisticasVocacionales(usuarioId),

  // 🔍 BÚSQUEDA
  buscarUsuarios: (termino) => apiService.buscarUsuarios(termino),
  obtenerUsuariosPopulares: () => apiService.obtenerUsuariosPopulares(),

  // 📧 CORREO
  enviarCodigo: (correo, codigo) => apiService.enviarCodigo(correo, codigo),

  // MÉTODOS DE CONVENIENCIA
  obtenerUsuarioActual: () => apiService.obtenerUsuarioActual(),
  estaAutenticado: () => apiService.estaAutenticado(),
};