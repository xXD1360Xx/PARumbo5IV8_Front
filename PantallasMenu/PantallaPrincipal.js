import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { servicioAPI } from '../servicios/api';
import { AuthContext } from '../AppNavegacion';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PantallaPrincipal({ navigation, route }) {
  const { cerrarSesion, obtenerUsuario } = useContext(AuthContext);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    Conocimiento: 0,
    Vocacionales: 0,
    seguidores: 0,
    seguidos: 0
  });
  const [modalFotoVisible, setModalFotoVisible] = useState(false);
  const [modalPortadaVisible, setModalPortadaVisible] = useState(false);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [cargandoPortada, setCargandoPortada] = useState(false);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0); // <-- NUEVO ESTADO

  // Cargar datos del perfil
  const cargarPerfil = useCallback(async () => {
    try {
      const datos = await servicioAPI.obtenerMiPerfil();
      
      if (datos.exito) {
        setUsuarioInfo(datos.usuario);
        console.log('✅ Perfil cargado:', {
          nombre: datos.usuario.nombre,
          biografia: datos.usuario.biografia,
          foto_perfil: datos.usuario.foto_perfil,
          portada: datos.usuario.portada
        });
      } else {
        console.warn('⚠️ No se pudo cargar perfil desde API:', datos.error);
        const usuarioContexto = obtenerUsuario();
        if (usuarioContexto) {
          setUsuarioInfo(usuarioContexto);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      const usuarioContexto = obtenerUsuario();
      if (usuarioContexto) {
        setUsuarioInfo(usuarioContexto);
      }
    }
  }, [obtenerUsuario]);

  // Cargar contador de notificaciones no leídas
  const cargarContadorNotificaciones = useCallback(async () => {
    try {
      // TODO: Reemplazar con un endpoint específico que devuelva solo el conteo de no leídas
      const respuesta = await servicioAPI.obtenerNotificaciones(1, 1);
      if (respuesta && respuesta.total !== undefined) {
        // Si el backend devuelve el total de notificaciones (incluyendo leídas), aquí obtenemos ese número
        // Idealmente debería ser solo no leídas, pero mientras tanto usamos el total
        setNotificacionesNoLeidas(respuesta.total);
      }
    } catch (error) {
      console.error('❌ Error cargando contador de notificaciones:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Recargar datos cuando regreses a la pantalla
      if (route.params?.perfilActualizado) {
        setUsuarioInfo(route.params.perfilActualizado);
        navigation.setParams({ perfilActualizado: undefined });
      }
      // Recargar contador de notificaciones
      cargarContadorNotificaciones();
    }, [route.params, cargarContadorNotificaciones])
  );

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const stats = await servicioAPI.obtenerEstadisticasUsuario();
      if (stats.exito) {
        setEstadisticas({
          conocimiento: stats.data?.resultadosTests || 0,
          vocacionales: stats.data?.resultadosVocacionales || 0,
          seguidores: stats.data?.seguidores || 0,
          seguidos: stats.data?.seguidos || 0
        });
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    }
  }, []);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    try {
      await Promise.all([
        cargarPerfil(),
        cargarEstadisticas(),
        cargarContadorNotificaciones()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, [cargarPerfil, cargarEstadisticas, cargarContadorNotificaciones]);

  // Cargar datos al montar
  useEffect(() => {
    const inicializar = async () => {
      try {
        const usuarioContexto = obtenerUsuario();
        if (usuarioContexto) {
          setUsuarioInfo(usuarioContexto);
        }
        
        await cargarDatos();
      } catch (error) {
        console.error('Error inicializando:', error);
      } finally {
        setCargando(false);
      }
    };

    inicializar();
  }, [cargarDatos, obtenerUsuario]);

  // Refrescar
  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    try {
      await cargarDatos();
    } catch (error) {
      console.error('Error refrescando:', error);
    } finally {
      setRefrescando(false);
    }
  }, [cargarDatos]);

  // Ver mis resultados
  const verMisResultados = () => {
    if (!usuarioInfo) return;
    navigation.navigate('Resultados', { 
      usuarioId: usuarioInfo.id,
      nombreUsuario: usuarioInfo.nombre || usuarioInfo.nombre_usuario 
    });
  };

  // Buscar otro usuario
  const buscarOtroUsuario = () => {
    navigation.navigate('BuscarUsuario');
  };

  // Editar perfil
  const editarPerfil = () => {
    navigation.navigate('EditarPerfil', {
      usuario: usuarioInfo,
    });
  };

  // Ir a notificaciones
  const irANotificaciones = () => {
    navigation.navigate('Notificaciones');
  };

  // Abrir modal para foto de perfil
  const abrirOpcionesFotoPerfil = () => {
    setModalFotoVisible(true);
  };

  // Abrir modal para foto de portada
  const abrirOpcionesFotoPortada = () => {
    setModalPortadaVisible(true);
  };

  // Función genérica para tomar foto
  const tomarFoto = async (tipo) => {
    if (tipo === 'perfil') setModalFotoVisible(false);
    if (tipo === 'portada') setModalPortadaVisible(false);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar una foto.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: tipo === 'perfil' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await subirFoto(result.assets[0].uri, tipo);
      }
    } catch (error) {
      console.error(`Error tomando foto de ${tipo}:`, error);
      Alert.alert('Error', `No se pudo tomar la foto de ${tipo}`);
    }
  };

  // Función genérica para elegir foto de galería
  const elegirFotoGaleria = async (tipo) => {
    if (tipo === 'perfil') setModalFotoVisible(false);
    if (tipo === 'portada') setModalPortadaVisible(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para elegir una foto.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: tipo === 'perfil' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await subirFoto(result.assets[0].uri, tipo);
      }
    } catch (error) {
      console.error(`Error eligiendo foto de ${tipo}:`, error);
      Alert.alert('Error', `No se pudo seleccionar la foto de ${tipo}`);
    }
  };

  // Eliminar foto
  const eliminarFoto = async (tipo) => {
    if (tipo === 'perfil') setModalFotoVisible(false);
    if (tipo === 'portada') setModalPortadaVisible(false);
    
    Alert.alert(
      `Eliminar foto de ${tipo}`,
      `¿Estás seguro de que quieres eliminar tu foto de ${tipo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (tipo === 'perfil') setCargandoFoto(true);
              if (tipo === 'portada') setCargandoPortada(true);
              
              let resultado;
              if (tipo === 'perfil') {
                resultado = await servicioAPI.eliminarFotoPerfil();
              } else {
                resultado = await servicioAPI.eliminarFotoPortada();
              }
              
              if (resultado.exito) {
                const urlPorDefecto = tipo === 'perfil' 
                  ? 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
                  : null;
                
                setUsuarioInfo(prev => ({ 
                  ...prev, 
                  [tipo === 'perfil' ? 'foto_perfil' : 'portada']: urlPorDefecto 
                }));
                
                Alert.alert('✅ Éxito', `Foto de ${tipo} eliminada`);
                await cargarPerfil();
              } else {
                Alert.alert('❌ Error', resultado.error || `No se pudo eliminar la foto de ${tipo}`);
              }
            } catch (error) {
              console.error(`Error eliminando foto de ${tipo}:`, error);
              Alert.alert('Error', `No se pudo eliminar la foto: ${error.message || 'Error de conexión'}`);
            } finally {
              if (tipo === 'perfil') setCargandoFoto(false);
              if (tipo === 'portada') setCargandoPortada(false);
            }
          }
        }
      ]
    );
  };

  // Subir foto
  const subirFoto = async (uri, tipo) => {
    try {
      if (tipo === 'perfil') setCargandoFoto(true);
      if (tipo === 'portada') setCargandoPortada(true);
      
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'foto.jpg';
      formData.append('imagen', {
        uri: uri,
        type: 'image/jpeg',
        name: filename,
      });
      
      let apiCall;
      if (tipo === 'perfil') {
        apiCall = servicioAPI.subirFotoPerfil(formData);
      } else {
        apiCall = servicioAPI.subirFotoPortada(formData);
      }
      
      const resultado = await apiCall;
      
      if (resultado.exito) {
        if (tipo === 'perfil') {
          setUsuarioInfo(prev => ({ 
            ...prev, 
            foto_perfil: resultado.url || resultado.usuario?.foto_perfil
          }));
        } else {
          setUsuarioInfo(prev => ({ 
            ...prev, 
            portada: resultado.url || resultado.usuario?.portada
          }));
        }
        Alert.alert('✅ Éxito', `Foto de ${tipo} subida correctamente`);
        await cargarPerfil();
      } else {
        Alert.alert('❌ Error', resultado.error || `No se pudo subir la foto de ${tipo}`);
      }
    } catch (error) {
      console.error(`Error subiendo foto de ${tipo}:`, error);
      Alert.alert('Error', `No se pudo subir la foto: ${error.message || 'Error de conexión'}`);
    } finally {
      if (tipo === 'perfil') setCargandoFoto(false);
      if (tipo === 'portada') setCargandoPortada(false);
    }
  };

  const cerrarSesionGoogle = async () => {
    try {
      console.log('🔐 Cerrando sesión de Google...');
      const googleToken = await AsyncStorage.getItem('googleAccessToken');
      if (googleToken) {
        console.log('🔄 Revocando token Google...');
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${googleToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          console.log('✅ Token de Google revocado');
        } catch (revokeError) {
          console.log('⚠️ No se pudo revocar token Google:', revokeError.message);
        }
      }
      console.log('✅ Sesión de Google cerrada');
    } catch (error) {
      console.error('❌ Error cerrando sesión de Google:', error);
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
            try {
              await cerrarSesionGoogle();
              await servicioAPI.cerrarSesion();
            } catch (error) {
              console.log('⚠️ Error en logout backend, continuando...');
            } finally {
              await AsyncStorage.multiRemove([
                'sesionActiva',
                'usuarioInfo', 
                'usuarioId',
                'token',
                'googleAccessToken'
              ]);
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  if (cargando) {
    return (
      <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
        <SafeAreaView style={styles.centrado}>
          <ActivityIndicator size="large" color="#ffcc00" />
          <Text style={styles.textoCargando}>Cargando perfil...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const datosUsuario = usuarioInfo || obtenerUsuario();

  if (!datosUsuario) {
    return (
      <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
        <SafeAreaView style={styles.centrado}>
          <Text style={styles.textoError}>Error cargando perfil</Text>
          <TouchableOpacity style={styles.botonReintentar} onPress={cargarDatos}>
            <Text style={styles.textoBoton}>Reintentar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
      <SafeAreaView style={styles.contenedor}>
        <ScrollView 
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefresh}
              colors={['#ff3366']}
              tintColor="#ff3366"
            />
          }
          contentContainerStyle={styles.contenedorScroll}
        >
          {/* Foto de portada */}
          <TouchableOpacity onPress={abrirOpcionesFotoPortada} style={styles.contenedorPortada}>
            <Image
              source={{
                uri: datosUsuario.portada || datosUsuario.banner_url || 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
              }}
              style={styles.portada}
            />
            {cargandoPortada && (
              <View style={styles.cargandoPortadaOverlay}>
                <ActivityIndicator size="small" color="#ffcc00" />
              </View>
            )}
            <View style={styles.portadaOverlay}>
              <Text style={styles.portadaOverlayTexto}>📸</Text>
            </View>
          </TouchableOpacity>

          {/* Ícono de notificaciones con badge */}
          <TouchableOpacity style={styles.notificacionesBoton} onPress={irANotificaciones}>
            <Text style={styles.notificacionesIcono}>🔔</Text>
            {notificacionesNoLeidas > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>
                  {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Encabezado con perfil */}
          <View style={styles.encabezado}>
            {/* Contenedor del avatar con dos overlays */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={abrirOpcionesFotoPerfil}>
                <Image
                  source={{
                    uri: datosUsuario.foto_perfil || datosUsuario.avatar_url || 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
                  }}
                  style={styles.avatar}
                />
                {cargandoFoto && (
                  <View style={styles.cargandoFotoOverlay}>
                    <ActivityIndicator size="small" color="#ffcc00" />
                  </View>
                )}
              </TouchableOpacity>
              {/* Overlay para editar perfil (izquierda) */}
              <TouchableOpacity style={styles.avatarOverlayIzquierdo} onPress={editarPerfil}>
                <Text style={styles.avatarOverlayTexto}>✏️</Text>
              </TouchableOpacity>
              {/* Overlay para cambiar foto (derecha) */}
              <TouchableOpacity style={styles.avatarOverlayDerecho} onPress={abrirOpcionesFotoPerfil}>
                <Text style={styles.avatarOverlayTexto}>📸</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.nombre}>{datosUsuario.nombre || datosUsuario.full_name || datosUsuario.nombre_usuario}</Text>
            <Text style={styles.usuario}>@{datosUsuario.nombre_usuario || datosUsuario.username}</Text>
            <Text style={styles.email}>{datosUsuario.email}</Text>

            {datosUsuario.biografia && (
              <Text style={styles.biografia}>{datosUsuario.biografia}</Text>
            )}
          </View>

          {/* Estadísticas */}
          <View style={styles.contenedorEstadisticas}>
            <View style={styles.itemEstadistica}>
              <Text style={styles.numeroEstadistica}>{estadisticas.vocacionales}</Text>
              <Text style={styles.textoEstadistica}>Vocacional</Text>
            </View>
            <View style={styles.separadorVertical} />
            <View style={styles.itemEstadistica}>
              <Text style={styles.numeroEstadistica}>{estadisticas.conocimiento}</Text>
              <Text style={styles.textoEstadistica}>Tests</Text>
            </View>
            <View style={styles.separadorVertical} />
            <View style={styles.itemEstadistica}>
              <Text style={styles.numeroEstadistica}>{estadisticas.seguidores}</Text>
              <Text style={styles.textoEstadistica}>Seguidores</Text>
            </View>
            <View style={styles.separadorVertical} />
            <View style={styles.itemEstadistica}>
              <Text style={styles.numeroEstadistica}>{estadisticas.seguidos}</Text>
              <Text style={styles.textoEstadistica}>Siguiendo</Text>
            </View>
          </View>

          {/* Acciones principales */}
          <View style={styles.contenedorAcciones}>
            <TouchableOpacity style={styles.botonAccion} onPress={verMisResultados}>
              <Text style={styles.textoBotonAccion}>📊 Ver mis resultados</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonAccion} onPress={buscarOtroUsuario}>
              <Text style={styles.textoBotonAccion}>🔍 Buscar otro usuario</Text>
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <View style={styles.contenedorInfo}>
            <Text style={styles.tituloInfo}>Información de la cuenta</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.labelInfo}>Rol:</Text>
              <Text style={styles.valorInfo}>
                {datosUsuario.rol === 'admin' ? '👑 Administrador' : 
                 datosUsuario.rol === 'explorando' || datosUsuario.rol === null || datosUsuario.rol === 'user' ? '🔍 Estudiante explorando' :
                 datosUsuario.rol === 'estudiante' ? '🎓 Estudiante universitario' :
                 datosUsuario.rol === 'egresado' ? '🎉 Egresado' :
                 datosUsuario.rol === 'docente' || datosUsuario.rol === 'profesor' ? '👩‍🏫 Docente' : '🔍 Estudiante explorando'}
              </Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.labelInfo}>Miembro desde:</Text>
              <Text style={styles.valorInfo}>
                {datosUsuario.fecha_creacion || datosUsuario.created_at ? 
                  new Date(datosUsuario.fecha_creacion || datosUsuario.created_at).toLocaleDateString('es-MX') : 
                  'Fecha no disponible'}
              </Text>
            </View>
          </View>

          {/* Botón cerrar sesión */}
          <TouchableOpacity style={styles.botonLogout} onPress={manejarLogout}>
            <Text style={styles.textoBotonLogout}>🚪 Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Modal para opciones de foto de perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalFotoVisible}
        onRequestClose={() => setModalFotoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Foto de perfil</Text>
            <TouchableOpacity style={styles.modalOpcion} onPress={() => tomarFoto('perfil')}>
              <Text style={styles.modalOpcionIcono}>📸</Text>
              <Text style={styles.modalOpcionTexto}>Tomar foto con cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOpcion} onPress={() => elegirFotoGaleria('perfil')}>
              <Text style={styles.modalOpcionIcono}>🖼️</Text>
              <Text style={styles.modalOpcionTexto}>Elegir de galería</Text>
            </TouchableOpacity>
            {datosUsuario.foto_perfil && datosUsuario.foto_perfil !== 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png' && (
              <TouchableOpacity style={[styles.modalOpcion, styles.modalOpcionEliminar]} onPress={() => eliminarFoto('perfil')}>
                <Text style={styles.modalOpcionIcono}>🗑️</Text>
                <Text style={styles.modalOpcionTextoEliminar}>Eliminar foto actual</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalBotonCerrar} onPress={() => setModalFotoVisible(false)}>
              <Text style={styles.modalBotonCerrarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal para opciones de foto de portada */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalPortadaVisible}
        onRequestClose={() => setModalPortadaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Foto de portada</Text>
            <TouchableOpacity style={styles.modalOpcion} onPress={() => tomarFoto('portada')}>
              <Text style={styles.modalOpcionIcono}>📸</Text>
              <Text style={styles.modalOpcionTexto}>Tomar foto con cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOpcion} onPress={() => elegirFotoGaleria('portada')}>
              <Text style={styles.modalOpcionIcono}>🖼️</Text>
              <Text style={styles.modalOpcionTexto}>Elegir de galería</Text>
            </TouchableOpacity>
            {datosUsuario.portada && (
              <TouchableOpacity style={[styles.modalOpcion, styles.modalOpcionEliminar]} onPress={() => eliminarFoto('portada')}>
                <Text style={styles.modalOpcionIcono}>🗑️</Text>
                <Text style={styles.modalOpcionTextoEliminar}>Eliminar portada actual</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalBotonCerrar} onPress={() => setModalPortadaVisible(false)}>
              <Text style={styles.modalBotonCerrarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1 },
  contenedor: { flex: 1 },
  contenedorScroll: { flexGrow: 1, paddingBottom: 30 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoCargando: { color: '#ffffff', marginTop: 20, fontSize: 16 },
  textoError: { color: '#ff6b6b', fontSize: 16, marginBottom: 20 },
  botonReintentar: { backgroundColor: '#ff3366', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  textoBoton: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  // Portada
  contenedorPortada: { position: 'relative', width: '100%', height: 200 },
  portada: { width: '100%', height: 200, backgroundColor: 'rgba(255,255,255,0.05)' },
  cargandoPortadaOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  portadaOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,51,102,0.8)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  portadaOverlayTexto: { color: '#ffffff', fontSize: 20 },

  // Notificaciones
  notificacionesBoton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  notificacionesIcono: { fontSize: 30, color: '#ffffff' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ff3366', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1, borderColor: '#ffffff' },
  badgeTexto: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  // Encabezado
  encabezado: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, marginTop: -50, position: 'relative' },

  // Avatar
  avatarContainer: { position: 'relative', marginBottom: 15, width: 120, height: 120 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#ffcc00', backgroundColor: 'rgba(255,255,255,0.1)' },
  cargandoFotoOverlay: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  avatarOverlayIzquierdo: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(255,51,102,0.8)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  avatarOverlayDerecho: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(255,51,102,0.8)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  avatarOverlayTexto: { color: '#ffffff', fontSize: 18 },

  // Textos
  nombre: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  usuario: { color: '#ffcc00', fontSize: 16, marginBottom: 5, fontWeight: '500' },
  email: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 15 },
  biografia: { color: '#ffffff', textAlign: 'center', marginTop: 15, paddingHorizontal: 20, fontSize: 14, lineHeight: 22, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Estadísticas
  contenedorEstadisticas: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 25, marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  itemEstadistica: { alignItems: 'center', flex: 1 },
  numeroEstadistica: { color: '#ffcc00', fontSize: 26, fontWeight: 'bold' },
  textoEstadistica: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  separadorVertical: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Acciones
  contenedorAcciones: { paddingHorizontal: 20, marginBottom: 25 },
  botonAccion: { backgroundColor: 'rgba(255,51,102,0.2)', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,51,102,0.5)' },
  textoBotonAccion: { color: '#ff3366', fontSize: 16, fontWeight: 'bold' },

  // Información adicional
  contenedorInfo: { marginHorizontal: 20, marginBottom: 25, padding: 25, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tituloInfo: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  labelInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  valorInfo: { color: '#ffcc00', fontSize: 14, fontWeight: '500' },

  // Botón cerrar sesión
  botonLogout: { marginHorizontal: 20, padding: 18, backgroundColor: 'rgba(255,51,102,0.2)', borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,51,102,0.5)' },
  textoBotonLogout: { color: '#ff3366', fontSize: 16, fontWeight: 'bold' },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  modalTitulo: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
  modalOpcion: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalOpcionIcono: { fontSize: 24, marginRight: 15, color: '#ffffff' },
  modalOpcionTexto: { color: '#ffffff', fontSize: 16, fontWeight: '500', flex: 1 },
  modalOpcionEliminar: { borderColor: 'rgba(255,82,82,0.5)', backgroundColor: 'rgba(255,82,82,0.1)' },
  modalOpcionTextoEliminar: { color: '#FF5252', fontSize: 16, fontWeight: '500', flex: 1 },
  modalBotonCerrar: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 18, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modalBotonCerrarTexto: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});