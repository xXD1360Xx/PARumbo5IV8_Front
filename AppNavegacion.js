import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Pantallas de autenticación
import PantallaLogin from './PantallasLogin/PantallaLogin';
import PantallaRegistrarse from './PantallasLogin/PantallaRegistrarse';
import PantallaReset from './PantallasLogin/PantallaReset';
import PantallaVerificarID from './PantallasLogin/PantallaVerificarID';
import PantallaMandarCorreo from './PantallasLogin/PantallaMandarCorreo';


// Pantallas principales (protegidas)
import PantallaPrincipal from './PantallasMenu/PantallaPrincipal';
import PantallaResultados from './PantallasMenu/PantallaResultados';
import PantallaBuscarUsuario from './PantallasMenu/PantallaBuscarUsuario';
import PantallaEditar from './PantallasMenu/PantallaEditar';
import PantallaEncontrado from './PantallasMenu/PantallaEncontrado';



const Stack = createNativeStackNavigator();

// Pantalla de carga
const PantallaCarga = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
    <ActivityIndicator size="large" color="#ff3366" />
  </View>
);

// Contexto de autenticación
export const AuthContext = React.createContext();

export default function AppNavegacion() {
  const [estaCargando, setEstaCargando] = useState(true);
  const [usuarioToken, setUsuarioToken] = useState(null);
  const [usuarioInfo, setUsuarioInfo] = useState(null);

  // Función para cargar sesión al iniciar
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        console.log('🔍 AppNavegacion: Cargando sesión...');
        
        // Intentar obtener token y usuario
        const token = await AsyncStorage.getItem('token');
        const usuarioString = await AsyncStorage.getItem('usuarioInfo');
        
        console.log('📱 Token encontrado:', token ? `Sí (${token.substring(0, 20)}...)` : 'No');
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

  // Configuración de autenticación para el contexto
  const contextoAuth = {
    iniciarSesion: async (token, usuario) => {
      try {
        console.log('🔐 Guardando sesión...');
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(usuario));
        
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
        await AsyncStorage.multiRemove(['token', 'usuarioInfo', 'usuarioId', 'sesionActiva']);
        
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
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(usuarioActualizado));
        setUsuarioInfo(usuarioActualizado);
        console.log('🔄 Usuario actualizado');
      } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
      }
    },
    
    obtenerUsuario: () => usuarioInfo,
    token: usuarioToken,
    usuario: usuarioInfo,
    estaAutenticado: !!usuarioToken
  };

  // Si está cargando, mostrar pantalla de carga
  if (estaCargando) {
    return <PantallaCarga />;
  }

  console.log('🚀 AppNavegacion renderizando. Usuario autenticado:', contextoAuth.estaAutenticado);

  return (
    <AuthContext.Provider value={contextoAuth}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={usuarioToken ? "MenuPrincipal" : "Login"}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          {/* RUTAS PÚBLICAS - Siempre accesibles */}
          <Stack.Screen 
            name="Login" 
            component={PantallaLogin}
          />

          <Stack.Screen 
            name="Registrar" 
            component={PantallaRegistrarse}
          />

          <Stack.Screen
            name="Reset"
            component={PantallaReset}
          />

          <Stack.Screen
            name="VerificarID"
            component={PantallaVerificarID}
          />

          <Stack.Screen
            name="MandarCorreo"
            component={PantallaMandarCorreo}
          />

          {/* RUTAS PROTEGIDAS - Solo visibles si hay token */}
          <Stack.Screen
            name="MenuPrincipal"
            component={PantallaPrincipal}
          />

          <Stack.Screen
            name="Resultados"
            component={PantallaResultados}
          />

          <Stack.Screen
            name="BuscarUsuario"
            component={PantallaBuscarUsuario}
          />

          <Stack.Screen
            name="EditarPerfil"
            component={PantallaEditar}
          />

          <Stack.Screen
            name="UsuarioEncontrado"
            component={PantallaEncontrado}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}