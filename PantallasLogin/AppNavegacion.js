import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Pantallas de autenticación
import PantallaLogin from './PantallaLogin';
import PantallaRegistrarr from './PantallaRegistrarse';
import PantallaReset from './PantallaReset';
import PantallaVerificarID from './PantallaVerificarID';
import PantallaMandarCorreo from './PantallaMandarCorreo';

// Pantallas principales (protegidas)
import PantallaPrincipal from '../PantallasMenu/PantallaPrincipal';
import PantallaResultados from '../PantallasMenu/PantallaResultados';
import PantallaBuscarUsuario from '../PantallasMenu/PantallaBuscarUsuario';

const Stack = createNativeStackNavigator();

// Pantalla de carga
const PantallaCarga = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

// Contexto de autenticación (opcional, pero recomendado)
export const AuthContext = React.createContext();

export default function AppNavigator() {
  const [estaCargando, setEstaCargando] = useState(true);
  const [usuarioToken, setUsuarioToken] = useState(null);
  const [usuarioInfo, setUsuarioInfo] = useState(null);

  // Función para cargar sesión al iniciar
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        console.log('🔍 Cargando sesión desde AsyncStorage...');
        
        // Intentar obtener token y usuario
        const token = await AsyncStorage.getItem('token');
        const usuarioString = await AsyncStorage.getItem('usuario');
        
        console.log('📱 Token encontrado:', token ? 'Sí' : 'No');
        console.log('👤 Usuario encontrado:', usuarioString ? 'Sí' : 'No');
        
        if (token && usuarioString) {
          const usuario = JSON.parse(usuarioString);
          setUsuarioToken(token);
          setUsuarioInfo(usuario);
          console.log('✅ Sesión cargada para:', usuario.email);
        } else {
          console.log('ℹ️ No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ Error cargando sesión:', error);
      } finally {
        setEstaCargando(false);
      }
    };

    cargarSesion();
  }, []);

  // Configuración de autenticación
  const contextoAuth = {
    iniciarSesion: async (token, usuario) => {
      try {
        console.log('🔐 Guardando sesión...');
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
        
        setUsuarioToken(token);
        setUsuarioInfo(usuario);
        console.log('✅ Sesión guardada para:', usuario.email);
      } catch (error) {
        console.error('❌ Error guardando sesión:', error);
        throw error;
      }
    },
    
    cerrarSesion: async () => {
      try {
        console.log('🚪 Cerrando sesión...');
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('usuario');
        
        setUsuarioToken(null);
        setUsuarioInfo(null);
        console.log('✅ Sesión cerrada');
      } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
      }
    },
    
    actualizarUsuario: async (nuevosDatos) => {
      try {
        const usuarioActualizado = { ...usuarioInfo, ...nuevosDatos };
        await AsyncStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        setUsuarioInfo(usuarioActualizado);
        console.log('🔄 Usuario actualizado');
      } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
      }
    },
    
    token: usuarioToken,
    usuario: usuarioInfo,
    estaAutenticado: !!usuarioToken
  };

  // Si está cargando, mostrar pantalla de carga
  if (estaCargando) {
    return <PantallaCarga />;
  }

  return (
    <AuthContext.Provider value={contextoAuth}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={usuarioToken ? "MenuPrincipal" : "Login"}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {/* RUTAS PÚBLICAS (sin autenticación) */}
          {!usuarioToken ? (
            <>
              <Stack.Screen 
                name="Login" 
                component={PantallaLogin}
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />

              <Stack.Screen 
                name="Registrar" 
                component={PantallaRegistrarr} 
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />

              <Stack.Screen
                name="Reset"
                component={PantallaReset}
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />

              <Stack.Screen
                name="VerificarID"
                component={PantallaVerificarID}
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />

              <Stack.Screen
                name="MandarCorreo"
                component={PantallaMandarCorreo}
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />
            </>
          ) : (
            /* RUTAS PROTEGIDAS (con autenticación) */
            <>
              <Stack.Screen
                name="MenuPrincipal"
                component={PantallaPrincipal}
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />

              <Stack.Screen
                name="Resultados"
                component={PantallaResultados}
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />

              <Stack.Screen
                name="BusdarUsuario"
                component={PantallaBuscarUsuario}
                options={{ headerShown: false, animation: 'slide_from_right' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}