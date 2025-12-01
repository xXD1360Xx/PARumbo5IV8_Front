import React, { useState, useEffect } from 'react';
import { TextInput, Image, Alert, Text, View, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { estilos } from '../estilos/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../servicios/api';

WebBrowser.maybeCompleteAuthSession();

export default function PantallaLogin({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const [solicitudGoogle, respuestaGoogle, iniciarGoogle] = Google.useAuthRequest({
    androidClientId: '875101074375-kttkiehldj4dbup7ta66vrgd3evpl4v9.apps.googleusercontent.com',
    webClientId: '875101074375-s6bp5dbcrf6s3cooi2i0bdou721b3n37.apps.googleusercontent.com',
  });

  const manejarLoginManual = async () => {
    if (!usuario || !contrasena) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setCargando(true);

    try {
      // ✅ USAR apiService
      const datos = await apiService.login(usuario, contrasena);

      if (datos.exito) {
        // Guardar información de sesión
        const usuarioInfo = datos.usuario;
        
        await AsyncStorage.setItem('sesionActiva', 'true');
        await AsyncStorage.setItem('usuarioId', usuarioInfo.id.toString());
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(usuarioInfo));
        await AsyncStorage.setItem('token', datos.token || 'token_guardado'); // Guardar token si viene en la respuesta
        
        if (Platform.OS === 'web') {
          alert('Inicio de sesión exitoso');
        } else {
          Alert.alert('Éxito', 'Inicio de sesión exitoso', [
            { 
              text: 'Continuar', 
              onPress: () => navigation.navigate('MenuPrincipal', { usuario: usuarioInfo }) 
            },
          ]);
        }
        
        navigation.navigate('MenuPrincipal', { usuario: usuarioInfo });
      } else {
        const mensajeError = datos.error || 'Credenciales incorrectas';
        if (Platform.OS === 'web') {
          alert(mensajeError);
        } else {
          Alert.alert('Error', mensajeError);
        }
        setContrasena('');
      }
    } catch (error) {
      console.error('Error en login:', error);
      const mensaje = Platform.OS === 'web' 
        ? 'Error de conexión con el servidor' 
        : 'Error de conexión';
      
      if (Platform.OS === 'web') {
        alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
    } finally {
      setCargando(false);
    }
  };

  const manejarLoginGoogle = async () => {
    try {
      const resultado = await iniciarGoogle();
      if (resultado?.type === 'success') {
        setCargando(true);
        
        try {
          // ✅ USAR apiService para Google
          const datos = await apiService.loginGoogle(resultado.authentication.accessToken);

          if (datos.exito) {
            // Guardar en AsyncStorage
            await AsyncStorage.setItem('sesionActiva', 'true');
            await AsyncStorage.setItem('usuarioInfo', JSON.stringify(datos.usuario));
            await AsyncStorage.setItem('usuarioId', datos.usuario.id.toString());
            await AsyncStorage.setItem('token', datos.token || 'token_google');
            
            console.log('Usuario autenticado con Google:', datos.usuario);
            navigation.navigate('MenuPrincipal', { usuario: datos.usuario });
          } else {
            Alert.alert('Error', datos.error || 'Error al iniciar sesión con Google');
          }
        } catch (error) {
          console.error('Error en login Google:', error);
          Alert.alert('Error', 'Error al conectar con el servidor');
        } finally {
          setCargando(false);
        }
      }
    } catch (error) {
      console.error('Error iniciando sesión con Google:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google.');
    }
  };

  const manejarRecuperarContrasena = () => {
    navigation.navigate('MandarCorreo', { modo: 'recuperar' });
  };

  const manejarCrearCuenta = () => {
    navigation.navigate('MandarCorreo', { modo: 'crear' });
  };

  // Verificar si ya hay una sesión activa al cargar
  useEffect(() => {
    const verificarSesionActiva = async () => {
      try {
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        const usuarioInfo = await AsyncStorage.getItem('usuarioInfo');
        
        if (sesionActiva === 'true' && usuarioInfo) {
          // Verificar token si existe
          const token = await AsyncStorage.getItem('token');
          if (token) {
            try {
              const verificado = await apiService.verificarToken();
              if (verificado.exito) {
                // Token válido, navegar directamente
                navigation.navigate('MenuPrincipal', { usuario: JSON.parse(usuarioInfo) });
                return;
              }
            } catch (error) {
              console.log('Token inválido o expirado, requiere nuevo login');
              // Limpiar datos de sesión
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

        {cargando && (
          <View style={estilos.contenedorCargando}>
            <Text style={estilos.textoCargando}>Conectando con el servidor...</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}