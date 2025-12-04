import React, { useContext, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  StyleSheet 
} from 'react-native';
import { estilos } from '../estilos/styles';
import { AuthContext } from '../PantallasLogin/AppNavigator';
import { apiService } from '../servicios/api';

export default function PantallaPrincipal({ navigation }) {
  const { cerrarSesion: cerrarSesionContext, usuario } = useContext(AuthContext);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    resultados: 0,
    seguidores: 0,
    seguidos: 0
  });

  // Cargar datos del perfil
  const cargarPerfil = useCallback(async () => {
    try {
      const datos = await apiService.obtenerMiPerfil();
      
      if (datos.exito) {
        setUsuarioInfo(datos.usuario);
        // Actualizar contexto si hay datos nuevos
        if (datos.usuario && !usuario) {
          // Aquí podrías actualizar el contexto si es necesario
        }
      } else {
        Alert.alert('Error', datos.error || 'No se pudo cargar tu perfil');
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      // No mostrar alerta aquí para evitar spam
    }
  }, []);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const stats = await apiService.obtenerEstadisticas();
      if (stats.exito) {
        setEstadisticas(stats.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    try {
      await Promise.all([
        cargarPerfil(),
        cargarEstadisticas()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, [cargarPerfil, cargarEstadisticas]);

  // Cargar datos al montar
  useEffect(() => {
    const inicializar = async () => {
      try {
        await cargarDatos();
      } catch (error) {
        console.error('Error inicializando:', error);
      } finally {
        setCargando(false);
      }
    };

    inicializar();
  }, [cargarDatos]);

  // Función para refrescar
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
    if (!usuario) return;
    navigation.navigate('Resultados', { 
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombre || usuario.nombre_usuario 
    });
  };

  // Buscar otro usuario
  const buscarOtroUsuario = () => {
    navigation.navigate('BusdarUsuario');
  };

  // Editar perfil
  const editarPerfil = () => {
    if (usuarioInfo) {
      navigation.navigate('EditarPerfil', { 
        usuario: usuarioInfo,
        onPerfilActualizado: async (nuevosDatos) => {
          setUsuarioInfo({ ...usuarioInfo, ...nuevosDatos });
        }
      });
    }
  };

  // Cerrar sesión
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
              // Llamar al logout del backend si existe
              await apiService.logout().catch(() => {});
            } finally {
              // Siempre limpiar el contexto
              await cerrarSesionContext();
            }
          }
        }
      ]
    );
  };

  // Mostrar pantalla de carga
  if (cargando) {
    return (
      <View style={[styles.fondo, styles.centrado]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.textoCargando}>Cargando perfil...</Text>
      </View>
    );
  }

  // Usar datos del contexto si no hay usuarioInfo
  const datosUsuario = usuarioInfo || usuario;

  if (!datosUsuario) {
    return (
      <View style={[styles.fondo, styles.centrado]}>
        <Text style={styles.textoError}>Error cargando perfil</Text>
        <TouchableOpacity style={styles.botonReintentar} onPress={cargarDatos}>
          <Text style={styles.textoBoton}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.fondo}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={onRefresh}
          colors={['#007AFF']}
          tintColor="#007AFF"
        />
      }
      contentContainerStyle={styles.contenedorScroll}
    >
      {/* Encabezado con perfil */}
      <View style={styles.encabezado}>
        <Image
          source={{
            uri: datosUsuario.foto_perfil || 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
          }}
          style={styles.avatar}
        />
        <Text style={styles.nombre}>{datosUsuario.nombre || datosUsuario.nombre_usuario}</Text>
        <Text style={styles.usuario}>@{datosUsuario.nombre_usuario}</Text>
        <Text style={styles.email}>{datosUsuario.email}</Text>
        
        {datosUsuario.biografia && (
          <Text style={styles.biografia}>
            {datosUsuario.biografia}
          </Text>
        )}

        {/* Botón editar perfil */}
        <TouchableOpacity 
          style={styles.botonEditar}
          onPress={editarPerfil}
        >
          <Text style={styles.textoBotonEditar}>✏️ Editar perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.contenedorEstadisticas}>
        <View style={styles.itemEstadistica}>
          <Text style={styles.numeroEstadistica}>{estadisticas.resultados}</Text>
          <Text style={styles.textoEstadistica}>Resultados</Text>
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
        <TouchableOpacity 
          style={styles.botonAccion} 
          onPress={verMisResultados}
        >
          <Text style={styles.textoBotonAccion}>📊 Ver mis resultados</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.botonAccion} 
          onPress={buscarOtroUsuario}
        >
          <Text style={styles.textoBotonAccion}>🔍 Buscar otro usuario</Text>
        </TouchableOpacity>
      </View>

      {/* Información adicional */}
      <View style={styles.contenedorInfo}>
        <Text style={styles.tituloInfo}>Información de la cuenta</Text>
        
        <View style={styles.itemInfo}>
          <Text style={styles.labelInfo}>Rol:</Text>
          <Text style={styles.valorInfo}>
            {datosUsuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
          </Text>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.labelInfo}>Miembro desde:</Text>
          <Text style={styles.valorInfo}>
            {datosUsuario.fecha_creacion ? 
              new Date(datosUsuario.fecha_creacion).toLocaleDateString('es-MX') : 
              'Fecha no disponible'}
          </Text>
        </View>
      </View>

      {/* Botón cerrar sesión */}
      <TouchableOpacity 
        style={styles.botonLogout} 
        onPress={manejarLogout}
      >
        <Text style={styles.textoBotonLogout}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#000',
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  textoError: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
  },
  botonReintentar: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 14,
  },
  contenedorScroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  encabezado: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
    marginBottom: 15,
  },
  nombre: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  usuario: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 5,
  },
  email: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  biografia: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  botonEditar: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textoBotonEditar: {
    color: '#fff',
    fontSize: 14,
  },
  contenedorEstadisticas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
  },
  itemEstadistica: {
    alignItems: 'center',
    flex: 1,
  },
  numeroEstadistica: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  textoEstadistica: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 5,
  },
  separadorVertical: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  contenedorAcciones: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  botonAccion: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  textoBotonAccion: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contenedorInfo: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
  },
  tituloInfo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  labelInfo: {
    color: '#aaa',
    fontSize: 14,
  },
  valorInfo: {
    color: '#fff',
    fontSize: 14,
  },
  botonLogout: {
    marginHorizontal: 20,
    marginTop: 30,
    padding: 16,
    backgroundColor: 'rgba(176, 0, 32, 0.8)',
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonLogout: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});