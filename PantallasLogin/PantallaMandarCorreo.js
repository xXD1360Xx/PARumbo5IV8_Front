import React, { useState, useEffect } from 'react';
import { 
  TextInput, 
  Alert, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform, 
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicioAPI } from '../servicios/api';

export default function PantallaMandarCorreo({ navigation, route }) {
  const { modo, correo: correoParam } = route.params || {};
  const regexCorreo = /^[A-Za-z0-9._%+-]{5,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const [cargando, setCargando] = useState(false);
  const [correo, setCorreo] = useState(correoParam || "");
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (correoParam) {
      setCorreo(correoParam);
    }
  }, [correoParam]);

  const validarCorreo = (email) => {
    setError('');
    if (!email) return false;
    
    if (!regexCorreo.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return false;
    }
    
    return true;
  };

  const enviarCorreo = async () => {
    if (!validarCorreo(correo)) {
      return;
    }

    const codigo = Math.floor(1000 + Math.random() * 9000).toString();
    setCargando(true);

    try {
      const resultado = await servicioAPI.enviarCodigo(correo, codigo);
      const exito = resultado.success || resultado.exito || false;

      if (exito) {
        Alert.alert(
          '✅ Código enviado',
          `Se ha enviado un código de verificación a:\n\n📧 ${correo}\n\nEl código es: ${codigo}`,
          [{ 
            text: 'Continuar', 
            onPress: () => navigation.navigate('VerificarID', { modo, correo, codigo }) 
          }],
          { cancelable: false }
        );
      } else {
        // Modo fallback: mostrar código directamente
        Alert.alert(
          '⚠️ Correo no enviado',
          `No se pudo enviar el correo, pero puedes usar este código:\n\n🔑 ${codigo}`,
          [{ 
            text: 'Usar este código', 
            onPress: () => navigation.navigate('VerificarID', { modo, correo, codigo }) 
          }],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error("Error al enviar correo:", error);
      
      // En caso de error, generar código de respaldo
      const codigoRespaldo = Math.floor(1000 + Math.random() * 9000).toString();
      Alert.alert(
        '❌ Error de conexión',
        'No se pudo conectar con el servidor. Puedes usar este código para continuar:',
        [{ 
          text: `Usar código: ${codigoRespaldo}`, 
          onPress: () => navigation.navigate('VerificarID', { modo, correo, codigo: codigoRespaldo }) 
        }]
      );
    } finally {
      setCargando(false);
    }
  };

  const regresar = () => {
    if (correo.trim() !== '') {
      Alert.alert(
        '¿Descartar cambios?',
        'Si regresas, perderás el correo ingresado.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Regresar', 
            style: 'destructive',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <LinearGradient 
      colors={['#000000', '#8a003a', '#000000']}
      style={styles.fondo}
    >
      <SafeAreaView style={styles.contenedorPrincipal}>
        <KeyboardAvoidingView 
          behavior="padding"
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Encabezado */}
            <View style={styles.encabezado}>
              <Text style={styles.titulo}>Verifica tu correo </Text>
              
              <Text style={styles.subtitulo}>
                {modo === 'recuperar' 
                  ? 'Ingresa tu correo para recuperar tu contraseña'
                  : 'Ingresa tu correo para crear una nueva cuenta'
                }
              </Text>
              
              <Text style={styles.instruccion}>
                Te enviaremos un código de 4 dígitos para verificar tu identidad
              </Text>
            </View>

            {/* Campo de correo */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>CORREO ELECTRÓNICO</Text>
              
              <TextInput
                style={[
                  styles.input,
                  error && styles.inputError
                ]}
                placeholder="ejemplo@dominio.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={correo}
                onChangeText={(text) => {
                  setCorreo(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
                returnKeyType="send"
                onSubmitEditing={enviarCorreo}
              />
              
              {error ? (
                <Text style={styles.textoError}>❌ {error}</Text>
              ) : (
                <Text style={styles.textoAyuda}>
                  📧 Asegúrate de ingresar un correo válido al que tengas acceso
                </Text>
              )}
            </View>

            {/* Información sobre el modo */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitulo}>
                {modo === 'recuperar' ? '🔐 Recuperación de contraseña' : '🆕 Creación de cuenta'}
              </Text>
              <Text style={styles.infoTexto}>
                {modo === 'recuperar'
                  ? '• Recibirás un código para restablecer tu contraseña\n• El código es válido por 15 minutos\n• Verifica tu bandeja de spam si no lo encuentras'
                  : '• Recibirás un código para verificar tu correo\n• Después podrás completar tu registro\n• Asegúrate de usar un correo que controles'
                }
              </Text>
            </View>

            {/* Botones de acción */}
            <View style={styles.contenedorBotones}>
              <TouchableOpacity
                onPress={regresar}
                style={styles.botonSecundario}
                disabled={cargando}
              >
                <Text style={styles.textoBotonSecundario}>Regresar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={enviarCorreo} 
                style={[
                  styles.botonPrincipal,
                  cargando && styles.botonDeshabilitado
                ]}
                disabled={cargando || !correo.trim()}
              >
                {cargando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.textoBotonPrincipal}>
                    Enviar código
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Indicador de carga */}
            {cargando && (
              <View style={styles.cargandoContainer}>
                <ActivityIndicator size="small" color="#ff3366" />
                <Text style={styles.textoCargando}>
                  Enviando código de verificación...
                </Text>
              </View>
            )}

            {/* Debug en desarrollo */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitulo}>🐛 MODO DESARROLLO</Text>
                <Text style={styles.debugTexto}>
                  Para pruebas rápidas, puedes usar "8" como correo
                </Text>
                <Text style={styles.debugTexto}>
                  Modo: {modo === 'recuperar' ? 'Recuperar contraseña' : 'Crear cuenta'}
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  contenedorPrincipal: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  instruccion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  campoContainer: {
    marginBottom: 30,
  },
  campoLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  textoError: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 5,
  },
  textoAyuda: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 5,
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoTitulo: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 20,
  },
  contenedorBotones: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  botonSecundario: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textoBotonSecundario: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  botonPrincipal: {
    flex: 1,
    backgroundColor: 'rgba(255,51,102,0.2)',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.5)',
  },
  botonDeshabilitado: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderColor: 'rgba(255,51,102,0.3)',
  },
  textoBotonPrincipal: {
    color: '#ff3366',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cargandoContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textoCargando: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 10,
  },
  debugContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.3)',
    marginTop: 20,
  },
  debugTitulo: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 4,
  },
});