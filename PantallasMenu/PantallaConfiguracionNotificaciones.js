import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicioAPI } from '../servicios/api';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PantallaConfiguracionNotificaciones({ navigation }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState({
    email_nuevo_post: true,
    email_nuevo_comentario: true,
    email_nuevo_seguidor: true,
    push_nuevo_post: true,
    push_nuevo_comentario: true,
    push_nuevo_seguidor: true,
  });

  // Cargar configuración
  const cargarConfig = async () => {
    try {
      setCargando(true);
      const respuesta = await servicioAPI.obtenerConfigNotificaciones();
      if (respuesta && typeof respuesta === 'object') {
        setConfig(prev => ({ ...prev, ...respuesta }));
      } else {
        console.log('⚠️ No se pudo cargar configuración, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      cargarConfig();
    }, [])
  );

  // Alternar un checkbox
  const toggle = (campo) => {
    setConfig(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  // Guardar cambios
  const guardarCambios = async () => {
    try {
      setGuardando(true);
      const respuesta = await servicioAPI.actualizarConfigNotificaciones(config);
      if (respuesta && typeof respuesta === 'object') {
        Alert.alert('Éxito', 'Configuración guardada correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudo guardar la configuración');
      }
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      Alert.alert('Error', 'Error de conexión al servidor');
    } finally {
      setGuardando(false);
    }
  };

  // Renderizar un checkbox personalizado
  const renderCheckbox = (label, campo, tipo) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={() => toggle(campo)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, config[campo] && styles.checkboxActivo]}>
        {config[campo] && <Ionicons name="checkmark" size={18} color="#ffffff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (cargando) {
    return (
      <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
        <SafeAreaView style={styles.centrado}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.textoCargando}>Cargando configuración...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
      <SafeAreaView style={styles.contenedor}>
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botonAtras}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Notificaciones</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.descripcion}>
            Elige qué notificaciones deseas recibir y por qué medio.
          </Text>

          {/* Sección Correo Electrónico */}
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="mail-outline" size={22} color="#ff3366" />
              <Text style={styles.seccionTitulo}>Correo Electrónico</Text>
            </View>
            <View style={styles.seccionContenido}>
              {renderCheckbox('Nuevo post de amigos', 'email_nuevo_post', 'email')}
              {renderCheckbox('Nuevo comentario de amigos', 'email_nuevo_comentario', 'email')}
              {renderCheckbox('Nuevo seguidor', 'email_nuevo_seguidor', 'email')}
            </View>
          </View>

          {/* Sección Notificaciones Push (In-App) */}
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="notifications-outline" size={22} color="#ff3366" />
              <Text style={styles.seccionTitulo}>Notificaciones en la App</Text>
            </View>
            <View style={styles.seccionContenido}>
              {renderCheckbox('Nuevo post de amigos', 'push_nuevo_post', 'push')}
              {renderCheckbox('Nuevo comentario de amigos', 'push_nuevo_comentario', 'push')}
              {renderCheckbox('Nuevo seguidor', 'push_nuevo_seguidor', 'push')}
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonCancelar]}
              onPress={() => navigation.goBack()}
              disabled={guardando}
            >
              <Text style={styles.botonTextoCancelar}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonGuardar]}
              onPress={guardarCambios}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.botonTextoGuardar}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  descripcion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  seccion: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  seccionTitulo: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  seccionContenido: {
    padding: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActivo: {
    backgroundColor: '#ff3366',
    borderColor: '#ff3366',
  },
  checkboxLabel: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  boton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCancelar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
  },
  botonGuardar: {
    backgroundColor: '#ff3366',
    marginLeft: 10,
  },
  botonTextoCancelar: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  botonTextoGuardar: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});