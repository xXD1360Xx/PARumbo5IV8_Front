import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicioAPI } from '../servicios/api';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PantallaNotificaciones({ navigation }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);

  // Cargar notificaciones
  const cargarNotificaciones = useCallback(async (paginaActual = 1, refresh = false) => {
    try {
      if (refresh) setRefrescando(true);
      else if (paginaActual === 1) setCargando(true);

      const respuesta = await servicioAPI.obtenerNotificaciones(paginaActual, 20);

      if (respuesta && respuesta.notificaciones) {
        const nuevas = respuesta.notificaciones;
        setNotificaciones(prev => refresh ? nuevas : [...prev, ...nuevas]);
        setTotalPaginas(respuesta.totalPaginas || 1);
      } else {
        console.log('⚠️ No se pudieron cargar notificaciones');
      }
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setCargando(false);
      setRefrescando(false);
      setCargandoMas(false);
    }
  }, []);

  // Cargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      setPagina(1);
      cargarNotificaciones(1, true);
    }, [cargarNotificaciones])
  );

  // Cargar más (paginación)
  const cargarMas = async () => {
    if (pagina < totalPaginas && !cargandoMas) {
      setCargandoMas(true);
      const nextPage = pagina + 1;
      setPagina(nextPage);
      await cargarNotificaciones(nextPage, false);
    }
  };

  // Marcar como leída
  const marcarLeida = async (id) => {
    try {
      const respuesta = await servicioAPI.marcarNotificacionLeida(id);
      if (respuesta && respuesta.id) {
        setNotificaciones(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      } else {
        Alert.alert('Error', 'No se pudo marcar como leída');
      }
    } catch (error) {
      console.error('Error marcando leída:', error);
    }
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    try {
      const respuesta = await servicioAPI.marcarTodasLeidas();
      if (respuesta && respuesta.mensaje) {
        setNotificaciones(prev => prev.map(n => ({ ...n, read: true })));
        Alert.alert('Éxito', respuesta.mensaje);
      } else {
        Alert.alert('Error', 'No se pudieron marcar todas');
      }
    } catch (error) {
      console.error('Error marcando todas:', error);
    }
  };

  // Eliminar notificación
  const eliminar = (id) => {
    Alert.alert(
      'Eliminar notificación',
      '¿Estás seguro de que deseas eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const respuesta = await servicioAPI.eliminarNotificacion(id);
              if (respuesta && respuesta.mensaje) {
                setNotificaciones(prev => prev.filter(n => n.id !== id));
              } else {
                Alert.alert('Error', 'No se pudo eliminar');
              }
            } catch (error) {
              console.error('Error eliminando:', error);
            }
          },
        },
      ]
    );
  };

  // Formatear fecha relativa
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    if (diffDias === 1) return 'Ayer';
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Renderizar cada notificación
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificacionCard, !item.read && styles.noLeida]}
      onPress={() => !item.read && marcarLeida(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificacionHeader}>
        <View style={styles.tituloContainer}>
          <Text style={styles.notificacionTitulo}>{item.title}</Text>
          {!item.read && <View style={styles.puntoNoLeido} />}
        </View>
        <Text style={styles.notificacionFecha}>{formatearFecha(item.createdAt)}</Text>
      </View>
      <Text style={styles.notificacionCuerpo}>{item.body}</Text>
      <View style={styles.acciones}>
        {!item.read && (
          <TouchableOpacity onPress={() => marcarLeida(item.id)} style={styles.botonAccion}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#4CAF50" />
            <Text style={styles.botonAccionTexto}>Marcar leída</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => eliminar(item.id)} style={styles.botonAccion}>
          <Ionicons name="trash-outline" size={22} color="#F44336" />
          <Text style={styles.botonAccionTexto}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Renderizar footer para carga infinita
  const renderFooter = () => {
    if (!cargandoMas) return null;
    return (
      <View style={styles.footerCarga}>
        <ActivityIndicator size="small" color="#ff3366" />
        <Text style={styles.footerTexto}>Cargando más...</Text>
      </View>
    );
  };

  // Renderizar lista vacía
  const renderEmpty = () => (
    <View style={styles.vacioContainer}>
      <Ionicons name="notifications-off-outline" size={60} color="rgba(255,255,255,0.3)" />
      <Text style={styles.vacioTexto}>No tienes notificaciones</Text>
    </View>
  );

  // Contar no leídas
  const noLeidasCount = notificaciones.filter(n => !n.read).length;

  return (
    <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
      <SafeAreaView style={styles.contenedor}>
        {/* Encabezado con botón de configuración */}
        <View style={styles.encabezado}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botonAtras}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Notificaciones</Text>
          <View style={styles.botonesDerecha}>
            {noLeidasCount > 0 && (
              <TouchableOpacity onPress={marcarTodasLeidas} style={styles.botonMarcarTodas}>
                <Text style={styles.botonMarcarTodasTexto}>Marcar todas</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate('ConfiguracionNotificaciones')}
              style={styles.botonConfig}
            >
              <Ionicons name="settings-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista */}
        {cargando && pagina === 1 ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.textoCargando}>Cargando notificaciones...</Text>
          </View>
        ) : (
          <FlatList
            data={notificaciones}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lista}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => {
                  setPagina(1);
                  cargarNotificaciones(1, true);
                }}
                colors={['#ff3366']}
                tintColor="#ffffff"
              />
            }
            onEndReached={cargarMas}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  contenedor: {
    flex: 1,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  botonAtras: {
    padding: 8,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  botonesDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonMarcarTodas: {
    backgroundColor: 'rgba(255,51,102,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff3366',
    marginRight: 8,
  },
  botonMarcarTodasTexto: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '600',
  },
  botonConfig: {
    padding: 8,
  },
  lista: {
    padding: 16,
    paddingBottom: 30,
  },
  notificacionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  noLeida: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderColor: '#ff3366',
  },
  notificacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificacionTitulo: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  puntoNoLeido: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3366',
    marginLeft: 8,
  },
  notificacionFecha: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginLeft: 8,
  },
  notificacionCuerpo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  botonAccionTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
  },
  footerCarga: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 10,
  },
  vacioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  vacioTexto: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 16,
  },
});