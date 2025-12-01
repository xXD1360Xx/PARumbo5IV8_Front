import React, { useState } from 'react';
import { TextInput, Alert, Text, View, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { estilos } from '../estilos/styles';  
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../servicios/api';

export default function PantallaReset({ navigation }) {
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState(''); 
  const [cargando, setCargando] = useState(false);

  const limpiarContrasenas = () => { 
    setContrasenaActual('');
    setNuevaContrasena('');
    setConfirmarContrasena('');
  }

  const cambiarContrasena = async () => { 
    // Validaciones
    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      Alert.alert('Error', 'Las nuevas contraseñas no coinciden', [
        { text: 'Reintentar', onPress: limpiarContrasenas }
      ]);
      return;
    }

    // Validar formato de contraseña
    const regex = /^(?=.*\d).{6,}$/;
    if (!regex.test(nuevaContrasena)) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres y contener al menos un número', [
        { text: 'Reintentar', onPress: () => {
          setNuevaContrasena('');
          setConfirmarContrasena('');
        }}
      ]);
      return;
    }

    // Evitar que sea la misma contraseña
    if (contrasenaActual === nuevaContrasena) {
      Alert.alert('Error', 'La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setCargando(true);

  try {
    const datos = await apiService.cambiarContrasena(contrasenaActual, nuevaContrasena);

    if (datos.exito) {
      Alert.alert(
        '¡Éxito!',
        'Contraseña actualizada correctamente',
        [
          { 
            text: 'Continuar', 
            onPress: () => {
              limpiarContrasenas();
              navigation.navigate('MenuPrincipal');
            }
          }
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert('Error', datos.error || 'No se pudo cambiar la contraseña', [
        { text: 'Reintentar', onPress: limpiarContrasenas }
      ]);
    }
  } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert('Error', 'Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const regresar = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#000000ff', '#ffffffff', '#000000ff']} style={{ flex: 1 }}>
      <SafeAreaView style={estilos.contenedorPrincipal}>
        <Text style={[estilos.titulo, { fontSize: 22 }]}>Cambiar contraseña</Text>
        <Text style={[estilos.subtitulo, { fontSize: 12, marginBottom: 20 }]}>
          Ingresa tu contraseña actual y la nueva contraseña
        </Text>

        <TextInput
          style={[
            estilos.contenedorInput,
            cargando && { opacity: 0.5 }
          ]}
          placeholder="Contraseña actual"
          value={contrasenaActual}
          secureTextEntry={true}
          onChangeText={setContrasenaActual}
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <TextInput
          style={[
            estilos.contenedorInput,
            cargando && { opacity: 0.5 }
          ]}
          placeholder="Nueva contraseña (mínimo 6 caracteres con número)"
          value={nuevaContrasena}
          secureTextEntry={true}
          onChangeText={setNuevaContrasena}
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <TextInput
          style={[
            estilos.contenedorInput,
            cargando && { opacity: 0.5 }
          ]}
          placeholder="Confirmar nueva contraseña"
          value={confirmarContrasena}
          secureTextEntry={true}
          onChangeText={setConfirmarContrasena}
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <View style={estilos.contenedorBotones}>
          <TouchableOpacity
            onPress={regresar}
            style={[
              estilos.botonChico, 
              { backgroundColor: "#454545ff" },
              cargando && estilos.botonDeshabilitado
            ]}
            disabled={cargando}
          >
            <Text style={[
              estilos.textoBotonChico, 
              { fontSize: 17 },
              cargando && { opacity: 0.5 }
            ]}>
              Regresar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={cambiarContrasena} 
            style={[
              estilos.botonChico,
              cargando && estilos.botonDeshabilitado
            ]}
            disabled={cargando}
          >
            <Text style={[
              estilos.textoBotonChico, 
              { fontSize: 17 },
              cargando && { opacity: 0.5 }
            ]}>
              {cargando ? 'Cambiando...' : 'Cambiar contraseña'}
            </Text>
          </TouchableOpacity>
        </View>

        {cargando && (
          <View style={estilos.contenedorCargando}>
            <Text style={estilos.textoCargando}>Actualizando contraseña...</Text>
          </View>
        )}

        <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
          <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
            🔒 La contraseña debe tener al menos 6 caracteres y contener al menos un número
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}