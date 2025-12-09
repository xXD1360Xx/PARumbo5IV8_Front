import React, { useState, useEffect } from 'react';
import { 
  TextInput, 
  Image, 
  Alert, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { servicioAPI } from '../servicios/api';
import * as Linking from 'expo-linking';


// Configurar para web
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}


export default function PantallaLogin({ navigation }) {
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errorIdentificador, setErrorIdentificador] = useState('');
  const [errorContrasena, setErrorContrasena] = useState('');
  const [cargandoGoogle, setCargandoGoogle] = useState(false);

  const validarCampos = () => {
    let valido = true;
    
    if (!identificador.trim()) {
      setErrorIdentificador('Por favor ingresa tu usuario o correo');
      valido = false;
    } else {
      setErrorIdentificador('');
    }
    
    if (!contrasena.trim()) {
      setErrorContrasena('Por favor ingresa tu contraseña');
      valido = false;
    } else {
      setErrorContrasena('');
    }
    
    return valido;
  };

  const manejarLoginManual = async () => {
    if (!validarCampos()) {
      return;
    }

    setCargando(true);

    try {
      console.log('Iniciando sesión...');
      const respuesta = await servicioAPI.iniciarSesion(identificador, contrasena);
      
      if (respuesta.exito && respuesta.token && respuesta.usuario) {
        console.log('Login exitoso');
        
        await AsyncStorage.setItem('sesionActiva', 'true');
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(respuesta.usuario));
        await AsyncStorage.setItem('usuarioId', respuesta.usuario.id.toString());
        await AsyncStorage.setItem('token', respuesta.token);
        
        navigation.replace('MenuPrincipal');
      } else {
        Alert.alert('Error', respuesta.error || 'Credenciales incorrectas');
        setContrasena('');
        setErrorContrasena('Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const manejarRecuperarContrasena = () => {
    navigation.navigate('MandarCorreo', { modo: 'recuperar' });
  };

  const manejarCrearCuenta = () => {
    navigation.navigate('MandarCorreo', { modo: 'crear' });
  };

const manejarLoginGoogle = async () => {
  setCargandoGoogle(true);
  
  try {
    const TUNNEL_URL = 'https://veifibi-divinablasfemia-8081.exp.direct';
    const REDIRECT_URI = `${TUNNEL_URL}/--/auth/callback`;
    const CLIENT_ID = '875101074375-t8ghd22q0e7dler6qt1h31dbn5ltvutp.apps.googleusercontent.com';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=token&` +
      `scope=email%20profile&` +
      `prompt=consent`; // Cambia a 'consent'
    
    console.log('🔗 URL:', authUrl.substring(0, 100) + '...');
    
    // Abrir directamente
    await WebBrowser.openBrowserAsync(authUrl);
    
    // Esperar 2 segundos y verificar si ya llegó el token
    setTimeout(async () => {
      const urlInicial = await Linking.getInitialURL();
      if (urlInicial && urlInicial.includes('access_token=')) {
        console.log('✅ ¡Ya llegó el token!');
        procesarTokenDeDeepLink(urlInicial);
      } else {
        console.log('⏳ Esperando token...');
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setCargandoGoogle(false);
  }
};



// Función para procesar el token del deep link
const procesarTokenDeDeepLink = async (accessToken) => {
  try {
    console.log('🔐 Procesando token desde deep link...');
    setCargandoGoogle(true);
    
    const respuesta = await servicioAPI.loginConGoogle({
      access_token: accessToken
    });
    
    if (respuesta.exito && respuesta.token && respuesta.usuario) {
      console.log('🎉 ¡Login exitoso desde deep link!');
      
      await AsyncStorage.setItem('sesionActiva', 'true');
      await AsyncStorage.setItem('usuarioInfo', JSON.stringify(respuesta.usuario));
      await AsyncStorage.setItem('usuarioId', respuesta.usuario.id.toString());
      await AsyncStorage.setItem('token', respuesta.token);
      
      // Navegar a MenuPrincipal
      navigation.replace('MenuPrincipal');
    } else {
      Alert.alert('Error', respuesta.error || 'Error del servidor');
    }
    
  } catch (error) {
    console.error('Error procesando token:', error);
    Alert.alert('Error', 'No se pudo procesar el token');
  } finally {
    setCargandoGoogle(false);
  }
};

  useEffect(() => {
    const verificarSesionActiva = async () => {
      try {
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        const usuarioInfo = await AsyncStorage.getItem('usuarioInfo');
        
        if (sesionActiva === 'true' && usuarioInfo) {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            try {
              const verificado = await servicioAPI.verificarToken();
              if (verificado.exito) {
                navigation.replace('MenuPrincipal');
                return;
              }
            } catch (error) {
              await AsyncStorage.multiRemove(['sesionActiva', 'usuarioInfo', 'token']);
            }
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      }
    };

    verificarSesionActiva();
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Rumbo | Login';
    }
  }, []);

  return (
    <LinearGradient 
      colors={['#000000', '#8a003a', '#000000']}
      style={styles.fondo}
    >
      <SafeAreaView style={styles.contenedorPrincipal}>
        <KeyboardAvoidingView 
          behavior="padding"
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Encabezado */}
            <View style={styles.encabezado}>
              <Text style={styles.titulo}>RUMBO</Text>
              
              <Text style={styles.subtitulo}>
                Ingresa tus datos para iniciar sesión
              </Text>
            </View>

            {/* Campo de usuario/email */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>USUARIO O CORREO</Text>
              
              <TextInput
                style={[
                  styles.input,
                  errorIdentificador && styles.inputError
                ]}
                placeholder="ejemplo@dominio.com o usuario"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={identificador}
                onChangeText={(text) => {
                  setIdentificador(text);
                  setErrorIdentificador('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
                returnKeyType="next"
              />
              
              {errorIdentificador ? (
                <Text style={styles.textoError}>❌ {errorIdentificador}</Text>
              ) : (
                <Text style={styles.textoAyuda}>
                  📧 Puedes usar tu correo o nombre de usuario
                </Text>
              )}
            </View>

            {/* Campo de contraseña */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>CONTRASEÑA</Text>
              
              <View style={styles.inputPasswordContainer}>
                <TextInput
                  style={[
                    styles.inputPassword,
                    errorContrasena && styles.inputError
                  ]}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={contrasena}
                  onChangeText={(text) => {
                    setContrasena(text);
                    setErrorContrasena('');
                  }}
                  secureTextEntry={!mostrarContrasena}
                  editable={!cargando}
                  autoCapitalize="none"
                  onSubmitEditing={manejarLoginManual}
                />
                <TouchableOpacity
                  style={styles.botonOjo}
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  disabled={cargando}
                >
                  <Text style={styles.textoOjo}>
                    {mostrarContrasena ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {errorContrasena ? (
                <Text style={styles.textoError}>❌ {errorContrasena}</Text>
              ) : (
                <Text style={styles.textoAyuda}>
                  🔒 Tu contraseña es segura y privada
                </Text>
              )}
            </View>

            {/* Botón principal SOLO Iniciar sesión */}
            <TouchableOpacity 
              onPress={manejarLoginManual} 
              style={[
                styles.botonPrincipal,
                cargando && styles.botonDeshabilitado
              ]}
              disabled={cargando || !identificador.trim() || !contrasena.trim()}
            >
              {cargando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.textoBotonPrincipal}>
                  Iniciar sesión
                </Text>
              )}
            </TouchableOpacity>

            {/* Enlaces uno debajo del otro */}
            <View style={styles.contenedorEnlaces}>
              <TouchableOpacity 
                onPress={manejarCrearCuenta}
                disabled={cargando}
              >
                <Text style={styles.enlace}>Crear nueva cuenta</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={manejarRecuperarContrasena}
                disabled={cargando}
              >
                <Text style={styles.enlace}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Separador */}
            <View style={styles.separadorContainer}>
              <View style={styles.separadorLinea} />
              <Text style={styles.separadorTexto}>O continúa con</Text>
              <View style={styles.separadorLinea} />
            </View>

            {/* Botón Google */}
            <TouchableOpacity
              style={[
                styles.botonGoogle,
                (cargando || cargandoGoogle) && styles.botonDeshabilitado
              ]}
              onPress={manejarLoginGoogle}
              disabled={cargando || cargandoGoogle}
            >
              {cargandoGoogle ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Image 
                    source={require('../recursos/img/google.png')} 
                    style={styles.iconoGoogle}
                  />
                  <Text style={styles.textoBotonGoogle}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Footer con más espacio arriba igual que el separador */}
            <View style={styles.footer}>
              <Text style={styles.textoFooter}>© 2025 Rumbo</Text>
            </View>

            {/* Debug en desarrollo - menos margen superior para que quede oculto */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitulo}>🐛 MODO DESARROLLO</Text>
                <Text style={styles.debugTexto}>
                  Para pruebas rápidas, puedes usar credenciales de prueba
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  contenedorPrincipal: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 25,
    justifyContent: 'center',
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 35,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
  },
  campoContainer: {
    marginBottom: 25,
    position: 'relative',
  },
  campoLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 15, // Aumentado de 8 a 10 para más espacio arriba de "CONTRASEÑA"
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  inputPassword: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  botonOjo: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoOjo: {
    fontSize: 20,
  },
  textoError: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 5,
  },
  textoAyuda: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 5,
  },
  botonPrincipal: {
    backgroundColor: 'rgba(255,51,102,0.2)',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.5)',
    marginBottom: 25,
    alignSelf: 'center',
  },
  botonDeshabilitado: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderColor: 'rgba(255,51,102,0.3)',
  },
  textoBotonPrincipal: {
    color: '#ff3366',
    fontSize: 17,
    fontWeight: 'bold',
  },
  contenedorEnlaces: {
    alignItems: 'center',
    marginBottom: 25,
  },
  enlace: {
    color: '#ff3366',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  separadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  separadorLinea: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  separadorTexto: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  botonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8, // Aumentado de 25 a 22 para igualar con el separador
  },
  iconoGoogle: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  textoBotonGoogle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 25, // Aumentado de 15 a 22 para igualar con el separador
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  textoFooter: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  debugContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.3)',
    marginTop: 10,
  },
  debugTitulo: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  debugTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 3,
  },
});

export { styles };