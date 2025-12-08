import React, { useState } from 'react';
import { 
  TextInput, 
  Alert, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicioAPI } from '../servicios/api';

const { width } = Dimensions.get('window');

export default function PantallaReset({ navigation, route }) {
  const { correo } = route.params || {};
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasenaActual, setMostrarContrasenaActual] = useState(false);
  const [mostrarNuevaContrasena, setMostrarNuevaContrasena] = useState(false);
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] = useState(false);

  const limpiarContrasenas = () => { 
    setContrasenaActual('');
    setNuevaContrasena('');
    setConfirmarContrasena('');
  };

  const validarFortalezaContrasena = (contrasena) => {
    const validaciones = [
      { 
        test: contrasena.length >= 6, 
        texto: 'Mínimo 6 caracteres', 
        color: '#00C853',
        esencial: true 
      },
      { 
        test: /\d/.test(contrasena), 
        texto: 'Al menos un número', 
        color: '#00C853',
        esencial: true 
      },
      { 
        test: /[A-Z]/.test(contrasena), 
        texto: 'Al menos una mayúscula', 
        color: '#00C853',
        esencial: false 
      },
      { 
        test: /[a-z]/.test(contrasena), 
        texto: 'Al menos una minúscula', 
        color: '#00C853',
        esencial: false 
      },
      { 
        test: /[!@#$%^&*(),.?":{}|<>]/.test(contrasena), 
        texto: 'Al menos un carácter especial', 
        color: '#00C853',
        esencial: false 
      },
    ];

    // Aplicar colores según cumplimiento
    return validaciones.map(v => ({
      ...v,
      color: v.test ? '#00C853' : '#FF5252',
      icono: v.test ? '✓' : '✗'
    }));
  };

  const cambiarContrasena = async () => {
    // Validaciones
    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
      Alert.alert('Campos incompletos', 'Por favor, completa todos los campos');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      Alert.alert('Contraseñas no coinciden', 'Las nuevas contraseñas no coinciden');
      setNuevaContrasena('');
      setConfirmarContrasena('');
      return;
    }

    if (contrasenaActual === nuevaContrasena) {
      Alert.alert('Misma contraseña', 'La nueva contraseña debe ser diferente a la actual');
      return;
    }

    // Validar criterios esenciales
    const validaciones = validarFortalezaContrasena(nuevaContrasena);
    const esenciales = validaciones.filter(v => v.esencial);
    const esencialesCumplidas = esenciales.filter(v => v.test).length;
    
    if (esencialesCumplidas < esenciales.length) {
      Alert.alert(
        'Contraseña no válida',
        'Debes cumplir con todos los criterios esenciales (mínimo 6 caracteres y al menos un número).',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Validar fortaleza general
    const todasCumplidas = validaciones.filter(v => v.test).length;
    const total = validaciones.length;

    if (todasCumplidas < 3) {
      Alert.alert(
        'Contraseña débil',
        `Tu contraseña cumple ${todasCumplidas} de ${total} criterios de seguridad. Te recomendamos usar una contraseña más segura.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar igual', onPress: () => realizarCambio() }
        ]
      );
      return;
    }

    realizarCambio();
  };

  const realizarCambio = async () => {
    setCargando(true);

    try {
      const datos = await servicioAPI.cambiarContrasena(contrasenaActual, nuevaContrasena);

      if (datos.exito) {
        Alert.alert(
          'Contraseña actualizada',
          'Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión.',
          [
            { 
              text: 'Continuar', 
              onPress: () => {
                limpiarContrasenas();
                navigation.replace('Login');
              }
            }
          ]
        );
      } else {
        let mensaje = datos.error || 'No se pudo cambiar la contraseña';
        
        if (datos.codigo === 'CONTRASENA_ACTUAL_INCORRECTA') {
          mensaje = 'La contraseña actual es incorrecta';
          setContrasenaActual('');
        }
        
        Alert.alert('Error', mensaje);
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
    } finally {
      setCargando(false);
    }
  };

  const regresar = () => {
    if (contrasenaActual || nuevaContrasena || confirmarContrasena) {
      Alert.alert(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar. ¿Seguro que quieres regresar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Regresar', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const fortalezaContrasena = validarFortalezaContrasena(nuevaContrasena);
  const porcentajeFortaleza = fortalezaContrasena.filter(v => v.test).length * 20;

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
              <Text style={styles.titulo}>Cambiar contraseña</Text>
              {correo && (
                <View style={styles.correoContainer}>
                  <Text style={styles.correoTexto}>{correo}</Text>
                </View>
              )}
              <Text style={styles.subtitulo}>
                Por seguridad, actualiza tu contraseña regularmente
              </Text>
            </View>

            {/* Campo: Contraseña actual */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>CONTRASEÑA ACTUAL</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={contrasenaActual}
                  onChangeText={setContrasenaActual}
                  secureTextEntry={!mostrarContrasenaActual}
                  editable={!cargando}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.botonOjo}
                  onPress={() => setMostrarContrasenaActual(!mostrarContrasenaActual)}
                  disabled={cargando}
                >
                  <Text style={styles.textoOjo}>
                    {mostrarContrasenaActual ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Campo: Nueva contraseña */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>NUEVA CONTRASEÑA</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Crea una nueva contraseña segura"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={nuevaContrasena}
                  onChangeText={setNuevaContrasena}
                  secureTextEntry={!mostrarNuevaContrasena}
                  editable={!cargando}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.botonOjo}
                  onPress={() => setMostrarNuevaContrasena(!mostrarNuevaContrasena)}
                  disabled={cargando}
                >
                  <Text style={styles.textoOjo}>
                    {mostrarNuevaContrasena ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Medidor de fortaleza */}
              {nuevaContrasena.length > 0 && (
                <View style={styles.fortalezaContainer}>
                  <View style={styles.barraFortaleza}>
                    <View 
                      style={[
                        styles.barraFortalezaFill,
                        { 
                          width: `${porcentajeFortaleza}%`,
                          backgroundColor: 
                            porcentajeFortaleza < 40 ? '#FF5252' :
                            porcentajeFortaleza < 80 ? '#FFC107' : '#00C853'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.textoFortaleza}>
                    {porcentajeFortaleza < 40 ? 'Débil' :
                     porcentajeFortaleza < 80 ? 'Media' : 'Fuerte'}
                  </Text>
                </View>
              )}
            </View>

            {/* Campo: Confirmar contraseña */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>CONFIRMAR CONTRASEÑA</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    confirmarContrasena && nuevaContrasena !== confirmarContrasena && styles.inputError
                  ]}
                  placeholder="Confirma tu nueva contraseña"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={confirmarContrasena}
                  onChangeText={setConfirmarContrasena}
                  secureTextEntry={!mostrarConfirmarContrasena}
                  editable={!cargando}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.botonOjo}
                  onPress={() => setMostrarConfirmarContrasena(!mostrarConfirmarContrasena)}
                  disabled={cargando}
                >
                  <Text style={styles.textoOjo}>
                    {mostrarConfirmarContrasena ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
              {confirmarContrasena && nuevaContrasena !== confirmarContrasena && (
                <Text style={styles.textoError}>Las contraseñas no coinciden</Text>
              )}
            </View>

            {/* Criterios de seguridad */}
            <View style={styles.criteriosContainer}>
              <Text style={styles.criteriosTitulo}>CRITERIOS DE SEGURIDAD</Text>
              
              <View style={styles.criteriosEsencialesContainer}>
                <Text style={styles.criteriosSubtitulo}>Criterios esenciales:</Text>
                {fortalezaContrasena
                  .filter(criterio => criterio.esencial)
                  .map((criterio, index) => (
                    <Text key={`esencial-${index}`} style={[styles.criterioTexto, { color: criterio.color }]}>
                      {criterio.icono} {criterio.texto}
                    </Text>
                  ))
                }
              </View>
              
              <View style={styles.criteriosOpcionalesContainer}>
                <Text style={styles.criteriosSubtitulo}>Criterios opcionales (recomendados):</Text>
                {fortalezaContrasena
                  .filter(criterio => !criterio.esencial)
                  .map((criterio, index) => (
                    <Text key={`opcional-${index}`} style={[styles.criterioTexto, { color: criterio.color }]}>
                      {criterio.icono} {criterio.texto}
                    </Text>
                  ))
                }
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.contenedorBotones}>
              <TouchableOpacity
                onPress={regresar}
                style={styles.botonSecundario}
                disabled={cargando}
              >
                <Text style={styles.textoBotonSecundario}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={cambiarContrasena}
                style={[
                  styles.botonPrincipal,
                  cargando && styles.botonDeshabilitado
                ]}
                disabled={cargando || !contrasenaActual || !nuevaContrasena || !confirmarContrasena}
              >
                {cargando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.textoBotonPrincipal}>Cambiar contraseña</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Consejos de seguridad */}
            <View style={styles.consejosContainer}>
              <Text style={styles.consejosTitulo}>CONSEJOS DE SEGURIDAD</Text>
              <Text style={styles.consejo}>
                • No uses contraseñas que hayas usado antes{'\n'}
                • Evita información personal como fechas o nombres{'\n'}
                • Usa una contraseña única para esta cuenta{'\n'}
                • Considera usar un gestor de contraseñas
              </Text>
            </View>
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
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  correoContainer: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.3)',
    width: '100%',
  },
  correoTexto: {
    color: '#ff3366',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  campoContainer: {
    marginBottom: 25,
  },
  campoLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  botonOjo: {
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  textoOjo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  textoError: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  fortalezaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  barraFortaleza: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  barraFortalezaFill: {
    height: '100%',
    borderRadius: 3,
  },
  textoFortaleza: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
  criteriosContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  criteriosTitulo: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  criteriosSubtitulo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  criterioTexto: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 16,
  },
  criteriosEsencialesContainer: {
    marginBottom: 15,
  },
  criteriosOpcionalesContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
    marginBottom: 30,
  },
  botonSecundario: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 52,
  },
  textoBotonSecundario: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  botonPrincipal: {
    flex: 1,
    backgroundColor: 'rgba(255, 51, 102, 0.7)',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.3)',
    height: 52,
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
  consejosContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  consejosTitulo: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  consejo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
});

export { styles };