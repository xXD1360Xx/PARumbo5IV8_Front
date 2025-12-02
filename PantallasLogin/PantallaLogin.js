import React, { useState, useEffect } from 'react';
import { TextInput, Image, Alert, Text, View, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { estilos } from '../estilos/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../servicios/api';

WebBrowser.maybeCompleteAuthSession();

export default function PantallaLogin({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // 🔧 CONFIGURACIÓN CORRECTA DE GOOGLE
  const [solicitudGoogle, respuestaGoogle, iniciarGoogle] = Google.useAuthRequest({
    androidClientId: '875101074375-kttkiehldj4dbup7ta66vrgd3evpl4v9.apps.googleusercontent.com',
    webClientId: '875101074375-s6bp5dbcrf6s3cooi2i0bdou721b3n37.apps.googleusercontent.com',
    expoClientId: '875101074375-s6bp5dbcrf6s3cooi2i0bdou721b3n37.apps.googleusercontent.com',
    redirectUri: Platform.select({
      web: typeof window !== 'undefined' 
        ? `${window.location.origin}/` 
        : 'http://localhost:8081/',
      android: 'com.anonymous.rumbo5IV8:/oauth2redirect',
      ios: 'com.anonymous.rumbo5IV8:/oauth2redirect',
    }),
  });

  // 🔍 DEBUG: Verificar configuración
  useEffect(() => {
    console.log('🔍 [DEBUG] Google config loaded');
    console.log('🔍 [DEBUG] Platform:', Platform.OS);
    console.log('🔍 [DEBUG] Redirect URI:', solicitudGoogle?.redirectUri);
  }, [solicitudGoogle]);

  // 🔥 MANEJAR RESPUESTA DE GOOGLE
  useEffect(() => {
    console.log('🔍 [DEBUG] Google response:', respuestaGoogle?.type || 'none');
    
    if (!respuestaGoogle) return;
    
    if (respuestaGoogle.type === 'success') {
      console.log('✅ [DEBUG] Google auth success!');
      console.log('🔑 Token recibido:', respuestaGoogle.authentication?.accessToken?.substring(0, 30) + '...');
      
      setDebugInfo('Google auth success, processing token...');
      manejarTokenGoogle(respuestaGoogle.authentication.accessToken);
    }
    
    if (respuestaGoogle.type === 'error') {
      console.error('❌ [DEBUG] Google error:', respuestaGoogle.error);
      Alert.alert('Error Google', respuestaGoogle.error?.message || 'Error desconocido');
      setDebugInfo('Google error: ' + respuestaGoogle.error?.message);
    }
    
    if (respuestaGoogle.type === 'locked') {
      console.log('🔒 [DEBUG] Google locked - user cancelled');
      setDebugInfo('Google auth cancelled by user');
    }
  }, [respuestaGoogle]);

  // 🔑 FUNCIÓN PARA MANEJAR TOKEN DE GOOGLE
  const manejarTokenGoogle = async (accessToken) => {
    console.log('══════════════════════════════════════════════════');
    console.log('🔍 [DEBUG] Iniciando manejarTokenGoogle');
    console.log('📱 Plataforma:', Platform.OS);
    console.log('🔑 Token length:', accessToken?.length);
    console.log('🔑 Token (primeros 30):', accessToken?.substring(0, 30) + '...');
    console.log('══════════════════════════════════════════════════');
    
    setCargando(true);
    setDebugInfo('Procesando token Google...');

    try {
      // 1. LLAMAR A LA API
      console.log('📡 Llamando a apiService.loginGoogle()...');
      const datos = await apiService.loginGoogle(accessToken);
      
      console.log('📥 Respuesta API:', {
        exito: datos.exito,
        error: datos.error,
        tieneUsuario: !!datos.usuario,
        tieneToken: !!datos.token
      });
      
      if (datos.exito && datos.usuario) {
        console.log('🎉 Login Google exitoso!');
        console.log('👤 Usuario:', datos.usuario.nombre || datos.usuario.email);
        
        // 2. GUARDAR EN ASYNCSTORAGE
        await AsyncStorage.setItem('sesionActiva', 'true');
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(datos.usuario));
        await AsyncStorage.setItem('usuarioId', datos.usuario.id.toString());
        await AsyncStorage.setItem('token', datos.token || 'google_token');
        
        console.log('💾 Datos guardados en AsyncStorage');
        setDebugInfo('Login exitoso, navegando...');
        
        // 3. NAVEGAR
        setTimeout(() => {
          navigation.navigate('MenuPrincipal', { usuario: datos.usuario });
        }, 500);
        
      } else {
        console.error('❌ Error en login Google:', datos.error);
        Alert.alert('Error', datos.error || 'Error al iniciar sesión con Google');
        setDebugInfo('Error: ' + datos.error);
      }
      
    } catch (error) {
      console.error('💥 Error completo en manejarTokenGoogle:', error);
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor');
      setDebugInfo('Error de conexión: ' + error.message);
      
    } finally {
      console.log('🏁 Finalizando proceso Google');
      setCargando(false);
    }
  };

  // 👤 LOGIN MANUAL
  const manejarLoginManual = async () => {
    if (!usuario || !contrasena) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setCargando(true);
    setDebugInfo('Iniciando login manual...');

    try {
      const datos = await apiService.login(usuario, contrasena);

      if (datos.exito) {
        const usuarioInfo = datos.usuario;
        
        await AsyncStorage.setItem('sesionActiva', 'true');
        await AsyncStorage.setItem('usuarioId', usuarioInfo.id.toString());
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(usuarioInfo));
        await AsyncStorage.setItem('token', datos.token || 'token_guardado');
        
        setDebugInfo('Login manual exitoso');
        
        navigation.navigate('MenuPrincipal', { usuario: usuarioInfo });
      } else {
        const mensajeError = datos.error || 'Credenciales incorrectas';
        Alert.alert('Error', mensajeError);
        setContrasena('');
        setDebugInfo('Error: ' + mensajeError);
      }
    } catch (error) {
      console.error('Error en login manual:', error);
      Alert.alert('Error', 'Error de conexión con el servidor');
      setDebugInfo('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  // 🚀 INICIAR GOOGLE
  const manejarLoginGoogle = async () => {
    console.log('🔍 [DEBUG] Botón Google clickeado');
    setDebugInfo('Iniciando Google auth...');
    
    if (!solicitudGoogle) {
      Alert.alert('Error', 'Google auth no está configurado');
      return;
    }
    
    try {
      console.log('🔍 [DEBUG] Iniciando Google auth...');
      await iniciarGoogle();
      console.log('✅ [DEBUG] iniciarGoogle() llamado');
    } catch (error) {
      console.error('❌ Error iniciando Google:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
      setDebugInfo('Error iniciando Google');
    }
  };

  const manejarRecuperarContrasena = () => {
    navigation.navigate('MandarCorreo', { modo: 'recuperar' });
  };

  const manejarCrearCuenta = () => {
    navigation.navigate('MandarCorreo', { modo: 'crear' });
  };

  // 🔄 VERIFICAR SESIÓN AL CARGAR
  useEffect(() => {
    const verificarSesionActiva = async () => {
      try {
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        const usuarioInfo = await AsyncStorage.getItem('usuarioInfo');
        
        if (sesionActiva === 'true' && usuarioInfo) {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            try {
              const verificado = await apiService.verificarToken();
              if (verificado.exito) {
                console.log('✅ Auto-navigating from saved session');
                navigation.navigate('MenuPrincipal', { usuario: JSON.parse(usuarioInfo) });
                return;
              }
            } catch (error) {
              console.log('Token inválido o expirado');
              await AsyncStorage.removeItem('sesionActiva');
              await AsyncStorage.removeItem('usuarioInfo');
              await AsyncStorage.removeItem('token');
            }
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      }
    };

    verificarSesionActiva();
  }, [navigation]);

  // 🌐 CONFIGURAR TÍTULO PARA WEB
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Inicio de sesión - Rumbo';
    }
  }, []);

  return (
    <LinearGradient colors={['#000000ff', '#ffffffff', '#000000ff']} style={{ flex: 1 }}>
      <SafeAreaView style={estilos.contenedorPrincipal}>
        <Text style={[estilos.titulo, { fontSize: 40 }]}>Iniciar sesión</Text>
        <Text style={estilos.subtitulo}>
          Inicia sesión para acceder a todo nuestro contenido
        </Text>

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Ingresa tu nombre de usuario o email"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Ingresa tu contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <TouchableOpacity 
          onPress={manejarLoginManual} 
          style={[
            estilos.botonGrande, 
            cargando && estilos.botonDeshabilitado
          ]}
          disabled={cargando}
        >
          <Text style={estilos.textoBotonGrande}>
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={manejarRecuperarContrasena}
            disabled={cargando}
          >
            <Text style={estilos.enlace}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={manejarCrearCuenta}
            disabled={cargando}
          >
            <Text style={estilos.enlace}>Crear nueva cuenta</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.separador} />

        <Text style={estilos.subtituloInferior}>Puedes iniciar sesión con tus redes</Text>

        <View style={estilos.contenedorRedes}>
          <TouchableOpacity 
            style={[
              estilos.botonRed,
              cargando && estilos.botonDeshabilitado
            ]} 
            onPress={manejarLoginGoogle}
            disabled={cargando}
          >
            <Image source={require('../recursos/img/google.png')} style={estilos.iconoRed} />
            <Text style={estilos.textoBotonRed}>Continuar con Google</Text>
          </TouchableOpacity>
        </View>

        {/* 🔍 DEBUG PANEL (solo en desarrollo) */}
        {__DEV__ && (
          <View style={{ 
            marginTop: 20, 
            padding: 10, 
            backgroundColor: '#000', 
            borderRadius: 5,
            maxHeight: 150,
            opacity: 0.8
          }}>
            <Text style={{ fontSize: 10, color: '#0f0', fontFamily: 'monospace' }}>
              🔍 DEBUG:{'\n'}
              Estado: {cargando ? 'CARGANDO' : 'LISTO'}{'\n'}
              Google: {respuestaGoogle?.type || 'NO RESPONSE'}{'\n'}
              Platform: {Platform.OS}{'\n'}
              {'='.repeat(40)}{'\n'}
              {debugInfo}
            </Text>
          </View>
        )}

        {cargando && (
          <View style={estilos.contenedorCargando}>
            <Text style={estilos.textoCargando}>Conectando con el servidor...</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}