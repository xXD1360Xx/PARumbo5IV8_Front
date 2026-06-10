import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { servicioAPI } from '../servicios/api';
import { AuthContext } from '../AppNavegacion';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function PantallaCompletarInfo({ navigation }) {
  const { actualizarUsuario, obtenerUsuario } = useContext(AuthContext);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const usuario = obtenerUsuario() || {};

  const roles = [
    {
      id: 'explorando',
      titulo: 'Estudiante explorando',
      descripcion: 'Estudiante de preparatoria o equivalente que explora opciones.',
      icono: '🔍',
      color: '#50E3C2'
    },
    {
      id: 'estudiante',
      titulo: 'Universitario',
      descripcion: 'Estudiante cursando actualmente una carrera universitaria.',
      icono: '🎓',
      color: '#4A90E2'
    },
    {
      id: 'egresado',
      titulo: 'Egresando / Egresado',
      descripcion: 'Estudiante por egresar o que ya concluyó sus estudios universitarios.',
      icono: '👨‍🎓',
      color: '#FF6B6B'
    }
  ];

  const guardarPerfil = async () => {
    if (!rolSeleccionado) {
      Alert.alert('Selección requerida', 'Por favor, selecciona un tipo de perfil para continuar.');
      return;
    }

    setGuardando(true);

    try {
      console.log('📤 Enviando datos de rol:', rolSeleccionado);
      
      const datosActualizacion = {
        full_name: usuario.nombre || usuario.full_name || usuario.nombre_usuario || 'Usuario Rumbo',
        username: usuario.nombre_usuario || usuario.username,
        email: usuario.email,
        role: rolSeleccionado
      };

      const respuesta = await servicioAPI.actualizarPerfil(datosActualizacion);

      if (respuesta.exito) {
        console.log('✅ Rol actualizado con éxito');
        
        // Actualizar localmente en el contexto de la aplicación
        await actualizarUsuario({ rol: rolSeleccionado });
        
        Alert.alert('Perfil completado', '¡Tu perfil ha sido actualizado con éxito!', [
          {
            text: 'Comenzar',
            onPress: () => {
              navigation.replace('MenuPrincipal');
            }
          }
        ]);
      } else {
        Alert.alert('Error', respuesta.error || 'No se pudo completar el perfil');
      }
    } catch (error) {
      console.error('❌ Error guardando rol:', error);
      Alert.alert('Error', 'Error de conexión al servidor. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const cerrarSesionGoogle = async () => {
    try {
      const googleToken = await AsyncStorage.getItem('googleAccessToken');
      if (googleToken) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${googleToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        } catch (e) {
          console.log('No se pudo revocar token Google:', e.message);
        }
      }
    } catch (error) {
      console.error('Error cerrando sesión Google:', error);
    }
  };

  const manejarLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, salir', 
          onPress: async () => {
            setCerrandoSesion(true);
            try {
              await cerrarSesionGoogle();
              await servicioAPI.cerrarSesion();
            } catch (error) {
              console.log('Error en logout backend, continuando...');
            } finally {
              await AsyncStorage.multiRemove([
                'sesionActiva',
                'usuarioInfo', 
                'usuarioId',
                'token',
                'googleAccessToken'
              ]);
              setCerrandoSesion(false);
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  if (cerrandoSesion) {
    return (
      <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
        <SafeAreaView style={styles.centrado}>
          <ActivityIndicator size="large" color="#ff3366" />
          <Text style={styles.textoCargando}>Cerrando sesión...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
      <SafeAreaView style={styles.contenedor}>
        <StatusBar barStyle="light-content" />
        <View style={styles.contenido}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>¡Bienvenido a Rumbo!</Text>
            <Text style={styles.subtitulo}>
              Para ofrecerte una experiencia personalizada, por favor dinos quién eres:
            </Text>
          </View>

          {/* Opciones */}
          <View style={styles.opcionesContainer}>
            {roles.map((item) => {
              const seleccionado = rolSeleccionado === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={[
                    styles.tarjetaRol,
                    seleccionado && { borderColor: item.color, backgroundColor: `${item.color}15` }
                  ]}
                  onPress={() => setRolSeleccionado(item.id)}
                >
                  <View style={[styles.iconoContainer, { backgroundColor: `${item.color}20` }]}>
                    <Text style={styles.icono}>{item.icono}</Text>
                  </View>
                  
                  <View style={styles.textosRol}>
                    <Text style={[styles.tituloRol, seleccionado && { color: item.color }]}>
                      {item.titulo}
                    </Text>
                    <Text style={styles.descripcionRol}>
                      {item.descripcion}
                    </Text>
                  </View>

                  <View style={[
                    styles.radioCircle,
                    seleccionado && { borderColor: item.color, backgroundColor: item.color }
                  ]}>
                    {seleccionado && <Text style={styles.check}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botones de acción */}
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[
                styles.botonGuardar,
                !rolSeleccionado && styles.botonDeshabilitado
              ]}
              onPress={guardarPerfil}
              disabled={guardando || !rolSeleccionado}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.textoBotonGuardar}>Guardar Perfil</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonSalir} onPress={manejarLogout}>
              <Text style={styles.textoBotonSalir}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1
  },
  contenedor: {
    flex: 1
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textoCargando: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16
  },
  contenido: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 30
  },
  header: {
    alignItems: 'center',
    marginTop: 20
  },
  titulo: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12
  },
  subtitulo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10
  },
  opcionesContainer: {
    marginVertical: 30,
    gap: 16
  },
  tarjetaRol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 90
  },
  iconoContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  icono: {
    fontSize: 24
  },
  textosRol: {
    flex: 1,
    marginRight: 8
  },
  tituloRol: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  descripcionRol: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    lineHeight: 16
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  check: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  botonesContainer: {
    gap: 12,
    marginBottom: 20
  },
  botonGuardar: {
    backgroundColor: '#6a002a',
    borderRadius: 14,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#cc3a6d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6
  },
  botonDeshabilitado: {
    backgroundColor: 'rgba(80, 80, 80, 0.4)',
    elevation: 0,
    shadowOpacity: 0
  },
  textoBotonGuardar: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  botonSalir: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textoBotonSalir: {
    color: '#ff3366',
    fontSize: 15,
    fontWeight: '600'
  }
});
