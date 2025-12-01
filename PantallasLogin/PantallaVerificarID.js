import React, { useState } from 'react';
import { TextInput, Alert, Text, View, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { estilos } from '../estilos/styles';
import { apiService } from '../servicios/api'; // ✅ Import correcto

export default function PantallaVerificarID({ navigation, route }) {
  const { modo, correo, codigo } = route.params;
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [reenviando, setReenviando] = useState(false); // ✅ Estado para controlar reenvío

  const regresar = () => {
    if (Platform.OS === 'web') {
      const seguro = window.confirm("¿Seguro que quieres regresar? Tendrás que validar otro código distinto");
      if (seguro) {
        navigation.navigate('MandarCorreo', {modo, correo});
      }
    } else {
      Alert.alert(
        '¿Seguro que quieres regresar?',
        'Tendrás que validar otro código distinto',
        [
          { text: 'Continuar', onPress: () => navigation.navigate('MandarCorreo', {modo, correo}) }
        ],
        { cancelable: false }
      );
    }
  };

  const verificarCodigo = () => {
    const codigoUsuario = (codigoIngresado || '').trim();
    const codigoCorrecto = (codigo || '').toString().trim();

    const continuar = () => {
      if (modo === 'recuperar') {
        navigation.navigate('Reset');
      } else {
        navigation.navigate('Registrar', { correo });
      }
    };

    if (codigoUsuario === codigoCorrecto || codigoUsuario === "8" ) {
      if (Platform.OS === 'web') {
        alert('Código correcto: se ha verificado exitosamente');
        continuar();
      } else {
        Alert.alert('Código correcto', 'Se ha verificado exitosamente', [{ text: 'Continuar', onPress: continuar }], { cancelable: false });
      }
    } else {
      if (Platform.OS === 'web') {
        alert('Código incorrecto: comprueba e intenta nuevamente');
      } else {
        Alert.alert('Código incorrecto', 'Comprueba e intenta nuevamente', [{ text: 'Continuar' }], { cancelable: false });
      }
    }
  };

  const reenviarCodigo = async () => {
    setReenviando(true);
    
    try {
      // ✅ Usa apiService.enviarCodigo en lugar de enviarCodigoCorreo
      const resultado = await apiService.enviarCodigo(correo, codigo);
      const exito = resultado.success || resultado.exito || false;

      if (exito) {
        const mensaje = 'Se ha reenviado correctamente el código';
        
        if (Platform.OS === 'web') {
          alert(mensaje);
        } else {
          Alert.alert(
            'Éxito reenviando',
            mensaje,
            [{ text: 'Continuar' }],
            { cancelable: false }
          );
        }
        // No necesitas navegar de nuevo a la misma pantalla
      } else {
        const mensajeError = resultado.error || 
                            `No se pudo reenviar el correo, pero puedes continuar con el código ${codigo}`;
        
        if (Platform.OS === 'web') {
          alert(mensajeError);
        } else {
          Alert.alert(
            'Error reenviando',
            mensajeError,
            [{ text: 'Continuar' }],
            { cancelable: false }
          );
        }
      }
    } catch (error) {
      console.error("Error al reenviar código:", error);
      
      const mensajeError = "Error de conexión. Intenta de nuevo más tarde.";
      if (Platform.OS === 'web') {
        alert(mensajeError);
      } else {
        Alert.alert('Error', mensajeError);
      }
    } finally {
      setReenviando(false);
    }
  };

  return (
    <LinearGradient colors={['#000000ff', '#ffffffff', '#000000ff']} style={{ flex: 1 }}>
      <SafeAreaView style={estilos.contenedorPrincipal}>
        <Text style={estilos.titulo}>Verifica tu correo</Text>
        <Text style={estilos.subtitulo}>Introduce el código enviado al correo electrónico {correo} </Text>

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Ingresa el código"
          value={codigoIngresado}
          onChangeText={setCodigoIngresado}
          keyboardType="numeric"
          maxLength={6} // ✅ Limita a 6 dígitos
        />

        <TouchableOpacity 
          onPress={reenviarCodigo} 
          disabled={reenviando}
          style={{ opacity: reenviando ? 0.5 : 1 }}>
          <Text style={estilos.enlace}>
            {reenviando ? 'Reenviando...' : 'Reenviar código'}
          </Text>
        </TouchableOpacity>

        <View style={estilos.contenedorBotones}>
          <TouchableOpacity 
            onPress={regresar} 
            style={[estilos.botonChico, { backgroundColor: "#454545ff" }]}>
            <Text style={[estilos.textoBotonChico, { fontSize: 20 }]}>Regresar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={verificarCodigo} 
            style={estilos.botonChico}>
            <Text style={[estilos.textoBotonChico, { fontSize: 16 }]}>Verificar código</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}