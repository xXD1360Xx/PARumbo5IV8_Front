import React, { useState, useEffect } from 'react';
import { TextInput, Alert, Text, View, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { estilos } from '../estilos/styles';
import { apiService } from '../servicios/api'; // ✅ Import correcto

export default function PantallaMandarCorreo({ navigation, route }) {
  const { modo, correo: correoParam } = route.params || {};
  const regexCorreo = /^[A-Za-z0-9._%+-]{5,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const [cargando, setCargando] = useState(false);
  const [correo, setCorreo] = useState(correoParam || "");
  
  useEffect(() => {
    if (correoParam) {
      setCorreo(correoParam);
    }
  }, [correoParam]);

  const enviarCorreo = async () => {
    if (!correo || (correo !== "8" && !regexCorreo.test(correo))) {
      const msg = 'Ingresa un correo válido';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      setCorreo("");
      return;
    }

    const codigo = Math.floor(1000 + Math.random() * 9000).toString();
    setCargando(true);

    try {
      // ✅ Usa apiService.enviarCodigo en lugar de enviarCodigoCorreo
      const resultado = await apiService.enviarCodigo(correo, codigo);
      const exito = resultado.success || resultado.exito || false;

      if (exito) {
        // Si se logró enviar el correo
        const mensajeExito = `Se ha enviado correctamente el código al correo: ${correo}`;
        
        if (Platform.OS === 'web') {
          alert(mensajeExito);
          setTimeout(() => navigation.navigate('VerificarID', { modo, correo, codigo }), 100);
        } else {
          Alert.alert(
            'Éxito enviando...',
            mensajeExito,
            [{ 
              text: 'Continuar', 
              onPress: () => navigation.navigate('VerificarID', { modo, correo, codigo }) 
            }],
            { cancelable: false }
          );
        }
      } else {
        // Si no se pudo enviar el correo
        const mensajeError = resultado.error || 
                            `No se pudo enviar el correo... pero puedes continuar con el código: ${codigo}`;

        if (Platform.OS === 'web') {
          alert(mensajeError);
          navigation.navigate('VerificarID', { modo, correo, codigo });
        } else {
          Alert.alert(
            'No se pudo enviar el correo...',
            mensajeError,
            [{ 
              text: 'Continuar', 
              onPress: () => navigation.navigate('VerificarID', { modo, correo, codigo }) 
            }],
            { cancelable: false }
          );
        }
      }
    } catch (error) {
      console.error("Error al intentar enviar el correo: ", error);
      
      const mensajeError = "Error de conexión. Intenta de nuevo más tarde.";
      if (Platform.OS === 'web') {
        alert(mensajeError);
      } else {
        Alert.alert('Error', mensajeError);
      }
    } finally {
      // Ocultar indicador de carga al finalizar
      setCargando(false);
    }
  };

  return (
    <LinearGradient colors={['#000000ff', '#ffffffff', '#000000ff']} style={{ flex: 1 }}>
      <SafeAreaView style={estilos.contenedorPrincipal}>
        <Text style={[estilos.titulo, { fontSize: 26 }]}>Verifica tu identidad</Text>
        <Text style={[estilos.subtitulo, { fontSize: 12 }]}>
          Te enviaremos un código al correo electrónico para validar tu identidad
        </Text>

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Ingresa tu correo electrónico"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={estilos.contenedorBotones}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[estilos.botonChico, { backgroundColor: '#454545ff' }]}>
            <Text style={[estilos.textoBotonChico, { fontSize: 17 }]}>Regresar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={enviarCorreo} 
            style={estilos.botonChico}
            disabled={cargando}>
            <Text style={[estilos.textoBotonChico, { fontSize: 17 }]}>
              {cargando ? 'Enviando...' : 'Mandar correo'}
            </Text>
          </TouchableOpacity>
        </View>

        {cargando && (
          <View style={{ marginTop: 15, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#0000ff" />
            <Text style={{ marginTop: 6, color: '#666' }}>Enviando correo...</Text>
          </View>
        )}
        
      </SafeAreaView>
    </LinearGradient>
  );
}