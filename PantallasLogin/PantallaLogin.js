import React, { useState, useEffect, useContext } from 'react';
import { 
  TextInput, 
  Image, 
  Alert, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { estilos } from '../estilos/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../servicios/api';
import { AuthContext } from './AppNavigator'; // Ajusta la ruta según tu estructura
import { ActivityIndicator } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function PantallaLogin({ navigation }) {
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useContext(AuthContext);

  // Configuración simplificada de Google
  const [solicitudGoogle, respuestaGoogle, iniciarGoogle] = Google.useAuthRequest({
    androidClientId: '875101074375-s6bp5dbcrf6s3cooi2i0bdou721b3n37',
    iosClientId: '875101074375-s6bp5dbcrf6s3cooi2i0bdou721b3n37',
    webClientId: '875101074375-t8ghd22q0e7dler6qt1h31dbn5ltvutp',
    redirectUri: AuthSession.makeRedirectUri({
      useProxy: true,
    }),
  });

  // Manejar respuesta de Google
  useEffect(() => {
    const manejarRespuestaGoogle = async () => {
      if (respuestaGoogle?.type === 'success') {
        await manejarLoginGoogle(respuestaGoogle.authentication.accessToken);
      } else if (respuestaGoogle?.type === 'error') {
        Alert.alert('Error', 'Error al autenticar con Google');
      }
    };

    if (respuestaGoogle) {
      manejarRespuestaGoogle();
    }
  }, [respuestaGoogle]);

  // Login con Google
  const manejarLoginGoogle = async (accessToken) => {
    setCargando(true);
    
    try {
      console.log('🔐 Procesando login Google...');
      const respuesta = await apiService.loginGoogle(accessToken);
      
      if (respuesta.exito && respuesta.token && respuesta.usuario) {
        // Usar el contexto de autenticación
        await iniciarSesion(respuesta.token, respuesta.usuario);
        Alert.alert('✅ Éxito', 'Inicio de sesión con Google exitoso');
        // La navegación se manejará automáticamente en AppNavigator
      } else {
        Alert.alert('Error', respuesta.error || 'Error en autenticación');
      }
    } catch (error) {
      console.error('Error Google:', error);
      Alert.alert('Error', 'No se pudo completar el login con Google');
    } finally {
      setCargando(false);
    }
  };

  // Login manual
  const manejarLoginManual = async () => {
    if (!identificador.trim() || !contrasena.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu usuario/email y contraseña');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await apiService.login(identificador, contrasena);
      
      if (respuesta.exito && respuesta.token && respuesta.usuario) {
        // Usar el contexto de autenticación
        await iniciarSesion(respuesta.token, respuesta.usuario);
        Alert.alert('✅ Éxito', 'Inicio de sesión exitoso');
        // La navegación se manejará automáticamente en AppNavigator
      } else {
        Alert.alert('Error', respuesta.error || 'Credenciales incorrectas');
        setContrasena('');
      }
    } catch (error) {
      console.error('Error login:', error);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  // Iniciar flujo de Google
  const iniciarGoogleLogin = async () => {
    if (!solicitudGoogle) {
      Alert.alert('Error', 'Google login no disponible');
      return;
    }
    
    try {
      await iniciarGoogle();
    } catch (error) {
      console.error('Error iniciando Google:', error);
    }
  };

  // Navegación
  const irARegistro = () => {
    navigation.navigate('MandarCorreo', { modo: 'crear' });
  };

  const irARecuperarContrasena = () => {
    navigation.navigate('MandarCorreo', { modo: 'recuperar' });
  };

  // Verificar sesión activa
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const usuarioString = await AsyncStorage.getItem('usuario');
        
        if (token && usuarioString) {
          const usuario = JSON.parse(usuarioString);
          // Verificar token con backend
          try {
            const verificado = await apiService.verificarToken();
            if (verificado.exito) {
              // Si hay sesión válida, redirigir automáticamente
              // (AppNavigator ya manejará esto, pero por si acaso)
              navigation.navigate('MenuPrincipal');
            }
          } catch (error) {
            // Token inválido, limpiar
            await AsyncStorage.multiRemove(['token', 'usuario']);
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      }
    };

    verificarSesion();
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient 
          colors={['#000000', '#1a1a1a', '#000000']} 
          style={{ flex: 1 }}
        >
          <SafeAreaView style={estilos.contenedorPrincipal}>
            
            {/* Logo/Título */}
            <View style={estilos.contenedorLogo}>
              <Text style={[estilos.titulo, { fontSize: 36, marginBottom: 10 }]}>
                Rumbo
              </Text>
              <Text style={estilos.subtitulo}>
                Inicia sesión para continuar
              </Text>
            </View>

            {/* Formulario */}
            <View style={estilos.contenedorFormulario}>
              <TextInput
                style={estilos.contenedorInput}
                placeholder="Usuario o email"
                value={identificador}
                onChangeText={setIdentificador}
                autoCapitalize="none"
                editable={!cargando}
                placeholderTextColor="#999"
                autoCorrect={false}
              />

              <TextInput
                style={estilos.contenedorInput}
                placeholder="Contraseña"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                editable={!cargando}
                placeholderTextColor="#999"
                onSubmitEditing={manejarLoginManual}
              />

              <TouchableOpacity 
                style={[
                  estilos.botonGrande,
                  cargando && estilos.botonDeshabilitado
                ]}
                onPress={manejarLoginManual}
                disabled={cargando}
              >
                {cargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={estilos.textoBotonGrande}>
                    Iniciar sesión
                  </Text>
                )}
              </TouchableOpacity>

              <View style={estilos.contenedorEnlaces}>
                <TouchableOpacity onPress={irARecuperarContrasena}>
                  <Text style={estilos.enlace}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={irARegistro}>
                  <Text style={estilos.enlace}>
                    Crear nueva cuenta
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Separador */}
            <View style={estilos.contenedorSeparador}>
              <View style={estilos.lineaSeparador} />
              <Text style={estilos.textoSeparador}>o continuar con</Text>
              <View style={estilos.lineaSeparador} />
            </View>

            {/* Botón Google */}
            <View style={estilos.contenedorSocial}>
              <TouchableOpacity
                style={[
                  estilos.botonGoogle,
                  cargando && estilos.botonDeshabilitado
                ]}
                onPress={iniciarGoogleLogin}
                disabled={cargando}
              >
                <Image 
                  source={require('../recursos/img/google.png')} 
                  style={estilos.iconoGoogle}
                />
                <Text style={estilos.textoBotonGoogle}>
                  Continuar con Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Loading overlay */}
            {cargando && (
              <View style={estilos.overlayCargando}>
                <View style={estilos.contenedorCargando}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={estilos.textoCargando}>
                    Conectando...
                  </Text>
                </View>
              </View>
            )}

          </SafeAreaView>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}