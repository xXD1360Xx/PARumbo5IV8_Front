import React, { useState, useEffect, useRef } from 'react';
import { 
  TextInput, 
  Alert, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicioAPI } from '../servicios/api';

const { width, height } = Dimensions.get('window');

export default function PantallaVerificarID({ navigation, route }) {
  const { modo, correo, codigo } = route.params || {};
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [caracteres, setCaracteres] = useState(['', '', '', '']);
  const [tiempoRestante, setTiempoRestante] = useState(30);
  const [puedeReenviar, setPuedeReenviar] = useState(false);
  
  // Animación para el círculo del timer
  const animacionProgresso = useRef(new Animated.Value(1)).current;
  
  // Ref para los inputs
  const inputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef()
  ]);

  // Validar parámetros
  useEffect(() => {
    if (!correo || !codigo) {
      Alert.alert('Error', 'Faltan datos necesarios');
      navigation.goBack();
    }
  }, [correo, codigo, navigation]);

  // Timer para reenviar código con animación
  useEffect(() => {
    let intervalo;
    
    if (tiempoRestante > 0 && !puedeReenviar) {
      // Animación del círculo
      Animated.timing(animacionProgresso, {
        toValue: tiempoRestante / 30,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      
      intervalo = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            setPuedeReenviar(true);
            Animated.timing(animacionProgresso, {
              toValue: 0,
              duration: 500,
              useNativeDriver: false,
            }).start();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [tiempoRestante, puedeReenviar]);

  const reiniciarTimer = () => {
    setTiempoRestante(30);
    setPuedeReenviar(false);
    animacionProgresso.setValue(1);
  };

  if (!correo || !codigo) {
    return null;
  }

  // Calcular el color del círculo del timer
  const radioAnimado = animacionProgresso.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ['#ff3366', '#ff9933', '#4CAF50']
  });

  // Manejar entrada del código con 4 campos separados
  const handleCodigoChange = (text, index) => {
    // Limitar a números
    const textoLimpio = text.replace(/[^0-9]/g, '');
    
    const newCaracteres = [...caracteres];
    newCaracteres[index] = textoLimpio;
    setCaracteres(newCaracteres);
    
    // Crear string del código ingresado
    const codigoCompleto = newCaracteres.join('');
    setCodigoIngresado(codigoCompleto);
    
    // Auto-avanzar al siguiente campo
    if (textoLimpio && index < 3) {
      setTimeout(() => {
        if (inputRefs.current[index + 1]?.current) {
          inputRefs.current[index + 1].current.focus();
        }
      }, 10);
    }
  };

  // Manejar borrado desde cualquier campo
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !caracteres[index] && index > 0) {
      // Si el campo actual está vacío y presionamos backspace, vamos al anterior
      const newCaracteres = [...caracteres];
      newCaracteres[index - 1] = '';
      setCaracteres(newCaracteres);
      setCodigoIngresado(newCaracteres.join(''));
      
      setTimeout(() => {
        if (inputRefs.current[index - 1]?.current) {
          inputRefs.current[index - 1].current.focus();
        }
      }, 10);
    }
  };

  const regresar = () => {
    Alert.alert(
      '¿Regresar?',
      'Si regresas, deberás solicitar un nuevo código de verificación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Regresar', 
          style: 'destructive',
          onPress: () => navigation.navigate('MandarCorreo', { modo, correo })
        }
      ]
    );
  };

  const verificarCodigo = async () => {
    const codigoUsuario = codigoIngresado.trim();
    const codigoCorrecto = codigo.toString().trim();

    if (codigoUsuario.length !== 4) {
      Alert.alert('Código incompleto', 'Por favor ingresa los 4 dígitos del código');
      return;
    }

    setVerificando(true);

    // Simular delay para mejor UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Permitir el código 8888 para pruebas rápidas
    const codigoEspecialPruebas = '8888';
    const esCodigoValido = codigoUsuario === codigoCorrecto || 
                          (__DEV__ && codigoUsuario === codigoEspecialPruebas);

    if (esCodigoValido) {
      Alert.alert(
        'Verificación exitosa',
        'Tu correo ha sido verificado correctamente',
        [
          { 
            text: 'Continuar', 
            onPress: () => {
              if (modo === 'recuperar') {
                navigation.navigate('Reset', { correo });
              } else {
                navigation.navigate('Registrar', { correo });
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Código incorrecto',
        'El código ingresado no coincide. Por favor verifica e intenta nuevamente.',
        [{ 
          text: 'Reintentar', 
          onPress: () => {
            setCaracteres(['', '', '', '']);
            setCodigoIngresado('');
            if (inputRefs.current[0]?.current) {
              inputRefs.current[0].current.focus();
            }
          }
        }]
      );
    }

    setVerificando(false);
  };

  const reenviarCodigo = async () => {
    if (!puedeReenviar) return;
    
    setReenviando(true);

    try {
      const resultado = await servicioAPI.enviarCodigo(correo, codigo, 'verificacion');
      
      if (resultado.exito) {
        Alert.alert(
          'Código reenviado',
          'Se ha enviado un nuevo código de verificación a tu correo electrónico.',
          [{ text: 'Aceptar' }]
        );
        
        // Reiniciar timer y limpiar campos
        reiniciarTimer();
        setCaracteres(['', '', '', '']);
        setCodigoIngresado('');
        if (inputRefs.current[0]?.current) {
          inputRefs.current[0].current.focus();
        }
      } else {
        Alert.alert(
          'Error',
          resultado.error || 'No se pudo reenviar el código. Intenta nuevamente.',
          [{ text: 'Entendido' }]
        );
      }
    } catch (error) {
      console.error("Error al reenviar código:", error);
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        [{ text: 'Aceptar' }]
      );
    } finally {
      setReenviando(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#000000', '#8a003a', '#000000']}
      style={styles.fondo}
    >
      <SafeAreaView style={styles.contenedorPrincipal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Encabezado */}
            <View style={styles.encabezado}>
              <Text style={styles.titulo}>Verifica tu correo</Text>
              <Text style={styles.subtitulo}>
                Hemos enviado un código de 4 dígitos a:
              </Text>
              
              <View style={styles.correoContainer}>
                <Text style={styles.correoTexto}>{correo}</Text>
              </View>
              
              <Text style={styles.instruccion}>
                Ingresa el código a continuación para continuar
              </Text>
            </View>

            {/* Código de 4 dígitos */}
            <View style={styles.codigoContainer}>
              <Text style={styles.codigoLabel}>CÓDIGO DE VERIFICACIÓN</Text>
              
              <View style={styles.inputsContainer}>
                {[0, 1, 2, 3].map((index) => (
                  <TextInput
                    key={index}
                    ref={inputRefs.current[index]}
                    style={[
                      styles.inputCodigo,
                      caracteres[index] && styles.inputCodigoLleno
                    ]}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={caracteres[index]}
                    onChangeText={(text) => handleCodigoChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    editable={!verificando && !reenviando}
                    selectTextOnFocus
                    contextMenuHidden={true}
                    caretHidden={false}
                  />
                ))}
              </View>
              
              <Text style={styles.codigoAyuda}>
                Ingresa los 4 dígitos que recibiste en tu correo
              </Text>
            </View>

            {/* Contenedor de reenviar con timer animado */}
            <View style={styles.reenviarContainer}>
              <View style={styles.timerCircularContainer}>
                <Animated.View 
                  style={[
                    styles.timerCircularProgress,
                    {
                      borderColor: radioAnimado,
                      transform: [{
                        rotate: animacionProgresso.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}
                />
                <View style={styles.timerCircularCentro}>
                  <Text style={[
                    styles.timerTexto,
                    tiempoRestante === 0 && styles.timerTextoActivo
                  ]}>
                    {tiempoRestante}s
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                onPress={reenviarCodigo} 
                disabled={reenviando || !puedeReenviar}
                style={[
                  styles.botonReenviar,
                  (!puedeReenviar || reenviando) && styles.botonReenviarDeshabilitado
                ]}
              >
                {reenviando ? (
                  <ActivityIndicator size="small" color="#ff3366" />
                ) : (
                  <Text style={[
                    styles.textoReenviar,
                    !puedeReenviar && styles.textoReenviarDeshabilitado
                  ]}>
                    Reenviar código
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Botones de acción */}
            <View style={styles.contenedorBotones}>
              <TouchableOpacity 
                onPress={regresar} 
                style={styles.botonSecundario}
                disabled={verificando || reenviando}
              >
                <Text style={styles.textoBotonSecundario}>
                  Regresar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={verificarCodigo} 
                style={[
                  styles.botonPrincipal,
                  (verificando || reenviando) && styles.botonDeshabilitado
                ]}
                disabled={verificando || reenviando || codigoIngresado.length !== 4}
              >
                {verificando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.textoBotonPrincipal}>
                    Verificar
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitulo}>📱 ¿No recibiste el código?</Text>
              <Text style={styles.infoTexto}>
                • Verifica tu carpeta de spam o correo no deseado{'\n'}
                • Asegúrate de haber ingresado el correo correctamente{'\n'}
                • Espera unos minutos y presiona "Reenviar código"{'\n'}
                • El código expira después de 15 minutos
              </Text>
            </View>

            {/* Debug en desarrollo */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitulo}>MODO DESARROLLO</Text>
                <Text style={styles.debugTexto}>
                  Código correcto: <Text style={styles.debugCodigo}>{codigo}</Text>
                </Text>
                <Text style={styles.debugTexto}>
                  Modo: {modo === 'recuperar' ? 'Recuperar contraseña' : 'Crear cuenta'}
                </Text>
                <Text style={styles.debugAyuda}>
                  Para pruebas rápidas, puedes usar el código 8888
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
    marginBottom: 15,
  },
  correoContainer: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.3)',
    width: '100%',
  },
  correoTexto: {
    color: '#ff3366',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instruccion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  codigoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  codigoLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 15,
  },
  inputCodigo: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    paddingLeft: 0,
    paddingRight: 0,
  },
  inputCodigoLleno: {
    borderColor: '#ff3366',
    backgroundColor: 'rgba(255,51,102,0.1)',
    color: '#ff3366',
  },
  codigoAyuda: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  reenviarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  timerCircularContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerCircularProgress: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timerCircularCentro: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTexto: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  timerTextoActivo: {
    color: '#ff3366',
  },
  botonReenviar: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonReenviarDeshabilitado: {
    opacity: 0.5,
  },
  textoReenviar: {
    color: '#ff3366',
    fontSize: 14,
    fontWeight: '600',
  },
  textoReenviarDeshabilitado: {
    color: 'rgba(255,255,255,0.4)',
  },
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 40,
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
    backgroundColor: 'rgba(255, 51, 102, 0.7)',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.3)',
  },
  botonDeshabilitado: {
    backgroundColor: 'rgba(255, 51, 102, 0.3)',
  },
  textoBotonPrincipal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
    fontSize: 12,
    lineHeight: 18,
  },
  debugContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.3)',
    marginTop: 10,
  },
  debugTitulo: {
    color: 'rgba(255, 51, 102, 0.6)', // Más tenue
    fontSize: 11, // Un poco más pequeño
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugTexto: {
    color: 'rgba(255,255,255,0.5)', // Más tenue
    fontSize: 10, // Un poco más pequeño
    marginBottom: 4,
  },
  debugCodigo: {
    color: 'rgba(255, 51, 102, 0.6)', // Más tenue
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10, // Un poco más pequeño
  },
  debugAyuda: {
    color: 'rgba(255,255,255,0.4)', // Más tenue
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export { styles };