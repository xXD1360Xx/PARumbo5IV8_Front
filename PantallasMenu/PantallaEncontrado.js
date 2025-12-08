 import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { servicioAPI } from '../servicios/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function PantallaEncontrado({ navigation, route }) {
  const { usuarioId, nombreUsuario } = route.params || {};
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [loSigo, setLoSigo] = useState(false);
  const [esPrivado, setEsPrivado] = useState(false);
  const [esYo, setEsYo] = useState(false);

  useEffect(() => {
    cargarUsuario();
  }, [usuarioId]);

  const cargarUsuario = async () => {
    if (!usuarioId) {
      Alert.alert('Error', 'No se especificó un usuario');
      navigation.goBack();
      return;
    }

    setCargando(true);
    
    try {
      // Obtener ID del usuario actual
      const token = await AsyncStorage.getItem('token');
      let usuarioActualId = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          usuarioActualId = payload?.id;
        } catch (e) {
          console.log('Error decodificando token:', e);
        }
      }

      // Cargar perfil del usuario encontrado
      const respuesta = await servicioAPI.obtenerPerfilUsuario(usuarioId);
      
      if (respuesta.exito) {
        const datosUsuario = respuesta.usuario;
        setUsuario(datosUsuario);
        setLoSigo(datosUsuario.lo_sigo || false);
        setEsPrivado(datosUsuario.es_privado || false);
        setEsYo(datosUsuario.es_yo || false);
      } else {
        Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    } finally {
      setCargando(false);
    }
  };

  const onRefresh = async () => {
    setRefrescando(true);
    await cargarUsuario();
    setRefrescando(false);
  };

  const seguirUsuario = async () => {
    try {
      const respuesta = await servicioAPI.seguirUsuario(usuarioId);
      if (respuesta.exito) {
        setLoSigo(true);
        Alert.alert('✅ Éxito', respuesta.mensaje);
        cargarUsuario(); // Recargar para actualizar contadores
      } else {
        Alert.alert('❌ Error', respuesta.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seguir al usuario');
    }
  };

  const dejarDeSeguir = async () => {
    try {
      const respuesta = await servicioAPI.dejarDeSeguir(usuarioId);
      if (respuesta.exito) {
        setLoSigo(false);
        Alert.alert('✅ Éxito', respuesta.mensaje);
        cargarUsuario(); // Recargar para actualizar contadores
      } else {
        Alert.alert('❌ Error', respuesta.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo dejar de seguir al usuario');
    }
  };

  const verResultados = () => {
    if (esPrivado && !loSigo && !esYo) {
      Alert.alert('Perfil privado', 'Debes seguir a este usuario para ver sus resultados');
      return;
    }
    navigation.navigate('Resultados', {
      usuarioId: usuarioId,
      nombreUsuario: usuario?.nombre_usuario || nombreUsuario
    });
  };

  const verSeguidores = () => {
    navigation.navigate('Seguidores', {
      usuarioId: usuarioId,
      nombreUsuario: usuario?.nombre_usuario || nombreUsuario
    });
  };

  const verSeguidos = () => {
    navigation.navigate('Seguidos', {
      usuarioId: usuarioId,
      nombreUsuario: usuario?.nombre_usuario || nombreUsuario
    });
  };

  if (cargando) {
    return (
      <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
        <SafeAreaView style={styles.centrado}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.textoCargando}>Cargando perfil...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!usuario) {
    return (
      <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
        <SafeAreaView style={styles.centrado}>
          <Text style={styles.errorTexto}>No se encontró el usuario</Text>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
            <Text style={styles.botonVolverTexto}>Volver</Text>
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
            <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor="#ffffff" />
          }
        >
          {/* Encabezado con foto de portada y perfil */}
          <View style={styles.encabezado}>
            {/* Portada */}
            {usuario.portada && !esPrivado ? (
              <Image source={{ uri: usuario.portada }} style={styles.portada} />
            ) : (
              <View style={[styles.portada, styles.portadaDefault]} />
            )}
            
            {/* Foto de perfil */}
            <View style={styles.contenedorFotoPerfil}>
              {usuario.foto_perfil && !esPrivado ? (
                <Image source={{ uri: usuario.foto_perfil }} style={styles.fotoPerfil} />
              ) : (
                <View style={[styles.fotoPerfil, styles.fotoPerfilDefault]}>
                  <Text style={styles.fotoPerfilDefaultTexto}>
                    {usuario.nombre_usuario ? usuario.nombre_usuario.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Información del usuario */}
          <View style={styles.contenido}>
            <View style={styles.infoHeader}>
              <Text style={styles.nombre}>
                {esPrivado ? 'Usuario privado' : usuario.nombre || 'Sin nombre'}
              </Text>
              <Text style={styles.username}>@{usuario.nombre_usuario}</Text>
              
              {usuario.rol && !esPrivado && (
                <View style={styles.badgeRol}>
                  <Text style={styles.textoBadgeRol}>
                    {usuario.rol === 'estudiante' ? '🎓 Estudiante' :
                     usuario.rol === 'egresado' ? '👨‍🎓 Egresado' :
                     usuario.rol === 'maestro' ? '👨‍🏫 Maestro' :
                     usuario.rol === 'admin' ? '👑 Administrador' : usuario.rol}
                  </Text>
                </View>
              )}
            </View>

            {/* Biografía */}
            {usuario.biografia && !esPrivado && (
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>📝 Biografía</Text>
                <Text style={styles.biografia}>{usuario.biografia}</Text>
              </View>
            )}

            {/* Estadísticas */}
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>📊 Estadísticas</Text>
              <View style={styles.estadisticasGrid}>
                <TouchableOpacity style={styles.estadisticaItem} onPress={verSeguidores}>
                  <Text style={styles.estadisticaNumero}>{usuario.seguidores || 0}</Text>
                  <Text style={styles.estadisticaLabel}>Seguidores</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.estadisticaItem} onPress={verSeguidos}>
                  <Text style={styles.estadisticaNumero}>{usuario.seguidos || 0}</Text>
                  <Text style={styles.estadisticaLabel}>Seguidos</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.estadisticaItem}>
                  <Text style={styles.estadisticaNumero}>{esPrivado ? '?' : (usuario.tests_completados || 0)}</Text>
                  <Text style={styles.estadisticaLabel}>Tests</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.contenedorBotones}>
              {!esYo && (
                <TouchableOpacity
                  style={[styles.botonAccion, loSigo ? styles.botonDejarSeguir : styles.botonSeguir]}
                  onPress={loSigo ? dejarDeSeguir : seguirUsuario}
                >
                  <Text style={[styles.textoBotonAccion, loSigo ? styles.textoDejarSeguir : styles.textoSeguir]}>
                    {loSigo ? '✓ Siguiendo' : '+ Seguir'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.botonAccionSecundario} onPress={verResultados}>
                <Text style={styles.textoBotonSecundario}>📊 Ver resultados</Text>
              </TouchableOpacity>

              {esYo && (
                <TouchableOpacity 
                  style={styles.botonAccionTercer}
                  onPress={() => navigation.navigate('EditarPerfil')}
                >
                  <Text style={styles.textoBotonTercer}>✏️ Editar perfil</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Mensaje de privacidad */}
            {esPrivado && !esYo && !loSigo && (
              <View style={styles.privacidadCard}>
                <Text style={styles.privacidadIcono}>🔒</Text>
                <Text style={styles.privacidadTitulo}>Perfil privado</Text>
                <Text style={styles.privacidadTexto}>
                  Sigue a este usuario para ver su información completa y resultados
                </Text>
              </View>
            )}

            {/* Información adicional (solo si no es privado) */}
            {!esPrivado && usuario.email && (
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>📧 Contacto</Text>
                <Text style={styles.email}>{usuario.email}</Text>
              </View>
            )}

            {!esPrivado && usuario.fecha_creacion && (
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>📅 Miembro desde</Text>
                <Text style={styles.fecha}>
                  {new Date(usuario.fecha_creacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1 },
  contenedor: { flex: 1 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoCargando: { color: '#ffffff', marginTop: 20, fontSize: 16 },
  errorTexto: { color: '#ffffff', fontSize: 18, marginBottom: 20 },
  botonVolver: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 10 },
  botonVolverTexto: { color: '#ffffff', fontSize: 16 },
  
  encabezado: { position: 'relative', height: 200 },
  portada: { width: '100%', height: '100%' },
  portadaDefault: { backgroundColor: 'rgba(255,255,255,0.05)' },
  contenedorFotoPerfil: { position: 'absolute', bottom: -50, left: 20 },
  fotoPerfil: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#000000' },
  fotoPerfilDefault: { 
    backgroundColor: '#ff3366', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  fotoPerfilDefaultTexto: { color: '#ffffff', fontSize: 40, fontWeight: 'bold' },
  
  contenido: { padding: 20, paddingTop: 60 },
  infoHeader: { marginBottom: 25 },
  nombre: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  username: { color: '#ffcc00', fontSize: 18, marginBottom: 15 },
  badgeRol: { backgroundColor: 'rgba(255,51,102,0.2)', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  textoBadgeRol: { color: '#ff3366', fontSize: 14, fontWeight: '600' },
  
  seccion: { marginBottom: 25 },
  seccionTitulo: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  biografia: { color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 24 },
  email: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  fecha: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  
  estadisticasGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  estadisticaItem: { alignItems: 'center' },
  estadisticaNumero: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  estadisticaLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  
  contenedorBotones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  botonAccion: { flex: 1, minWidth: '45%', padding: 15, borderRadius: 12, alignItems: 'center' },
  botonSeguir: { backgroundColor: '#ff3366' },
  botonDejarSeguir: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: '#ff3366' },
  textoBotonAccion: { fontSize: 16, fontWeight: '600' },
  textoSeguir: { color: '#ffffff' },
  textoDejarSeguir: { color: '#ff3366' },
  
  botonAccionSecundario: { 
    flex: 1, 
    minWidth: '45%', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  textoBotonSecundario: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  botonAccionTercer: { 
    width: '100%',
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  textoBotonTercer: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  privacidadCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  privacidadIcono: { fontSize: 40, marginBottom: 10 },
  privacidadTitulo: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  privacidadTexto: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 14, lineHeight: 20 }
});