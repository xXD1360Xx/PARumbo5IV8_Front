import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { estilos } from '../estilos/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../servicios/api';

export default function PantallaPrincipal({ navigation }) {
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        if (sesionActiva !== 'true') {
          navigation.navigate('Login');
          return;
        }
        await cargarPerfil();
      } catch (error) {
        console.error('Error verificando sesión:', error);
        navigation.navigate('Login');
      }
    };
    verificarSesion();
  }, []);

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const datos = await apiService.obtenerMiPerfil();
      
      if (datos.exito) {
        setUsuarioInfo(datos.usuario);
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(datos.usuario));
      } else {
        Alert.alert('Error', 'No se pudo cargar tu perfil');
        await AsyncStorage.removeItem('sesionActiva');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const verMisResultados = () => {
    if (!usuarioInfo) return;
    navigation.navigate('Resultados', {  // ✅ CORREGIDO: 'Resultados' no 'PantallaResultados'
      usuarioId: usuarioInfo.id,
      nombreUsuario: usuarioInfo.nombre 
    });
  };

  const buscarOtroUsuario = () => {
    navigation.navigate('BusdarUsuario'); // ✅ CORREGIDO: 'BusdarUsuario' no 'PantallaBuscarUsuario'
  };

  const cerrarSesion = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí', 
          onPress: async () => {
            try {
              await apiService.logout();
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (error) {
              console.error('Error cerrando sesión:', error);
              await AsyncStorage.clear();
              navigation.replace('Login');
            }
          }
        },
      ]
    );
  };

  if (cargando) {
    return (
      <View style={[estilos.fondo, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#fff', marginTop: 20 }}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!usuarioInfo) {
    return null;
  }

  return (
    <ScrollView style={estilos.fondo}>
      <View style={estilos.contenedorPrincipal}>
        {/* Encabezado con perfil */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Image
            source={{
              uri: usuarioInfo.foto_perfil || 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 3,
              borderColor: '#fff',
              marginBottom: 15
            }}
          />
          <Text style={estilos.titulo}>{usuarioInfo.nombre || usuarioInfo.nombre_usuario}</Text>
          <Text style={estilos.subtitulo}>@{usuarioInfo.nombre_usuario}</Text>
          <Text style={[estilos.subtitulo, { fontSize: 14 }]}>{usuarioInfo.email}</Text>
          {usuarioInfo.biografia && (
            <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 }}>
              {usuarioInfo.biografia}
            </Text>
          )}
        </View>

        {/* Botones de acción principal */}
        {/* ❌ ELIMINADO: Botón de "Ver/Editar mi perfil" (ya estamos en el perfil) */}

        <TouchableOpacity 
          style={[estilos.botonGrande, { marginBottom: 15 }]} 
          onPress={verMisResultados}
        >
          <Text style={estilos.textoBotonGrande}>📊 Ver mis resultados</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[estilos.botonGrande, { marginBottom: 15 }]} 
          onPress={buscarOtroUsuario}
        >
          <Text style={estilos.textoBotonGrande}>🔍 Buscar otro usuario</Text>
        </TouchableOpacity>

        {/* Estadísticas rápidas */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: 20,
          marginVertical: 20
        }}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
            📈 Mi actividad
          </Text>
          <TouchableOpacity onPress={() => cargarPerfil()}>
            <Text style={{ color: '#4fc3f7', textAlign: 'center' }}>
              Actualizar datos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón cerrar sesión */}
        <TouchableOpacity 
          style={[estilos.botonChico, { backgroundColor: '#b00020', marginTop: 20 }]} 
          onPress={cerrarSesion}
        >
          <Text style={estilos.textoBotonChico}>🚪 Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}