import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { servicioAPI } from '../servicios/api';
import { useFocusEffect } from '@react-navigation/native';

export default function PantallaEditar({ navigation }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [errores, setErrores] = useState({});
  
  // Campos del formulario
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [rol, setRol] = useState('');
  const [cambioContrasena, setCambioContrasena] = useState(false);
  
  // Estados para validación
  const [usernameDisponible, setUsernameDisponible] = useState(true);
  const [verificandoUsername, setVerificandoUsername] = useState(false);
  const [modalAdminVisible, setModalAdminVisible] = useState(false);
  const [contrasenaAdmin, setContrasenaAdmin] = useState('');

  // Roles disponibles
  const rolesDisponibles = [
    { id: 'estudiante', nombre: 'Estudiante', descripcion: 'Actualmente estudiando' },
    { id: 'egresado', nombre: 'Egresado', descripcion: 'Ya terminó sus estudios' },
    { id: 'maestro', nombre: 'Maestro', descripcion: 'Profesor o instructor' },
    { id: 'admin', nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
  ];

  // Cargar datos del usuario
  const cargarDatosUsuario = useCallback(async () => {
    try {
      setCargando(true);
      console.log('🔍 Cargando datos del usuario...');
      
      const respuesta = await servicioAPI.obtenerMiPerfil();
      
      if (respuesta.exito && respuesta.usuario) {
        console.log('✅ Datos del usuario cargados:', respuesta.usuario);
        
        setUsuario(respuesta.usuario);
        setNombreCompleto(respuesta.usuario.nombre || '');
        setNombreUsuario(respuesta.usuario.nombre_usuario || '');
        setEmail(respuesta.usuario.email || '');
        setRol(respuesta.usuario.rol || 'estudiante');
        
        // Limpiar errores
        setErrores({});
      } else {
        console.log('⚠️ No se pudieron cargar los datos del usuario');
        Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      Alert.alert('Error', 'Error al cargar los datos del usuario');
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarDatosUsuario();
      return () => {
        // Limpiar al salir
        setContrasena('');
        setConfirmarContrasena('');
        setContrasenaAdmin('');
        setErrores({});
      };
    }, [cargarDatosUsuario])
  );

  // Validar email
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validar contraseña
  const validarContrasena = (password) => {
    if (!password) return { valido: false, mensaje: 'La contraseña es requerida' };
    if (password.length < 6) return { valido: false, mensaje: 'Mínimo 6 caracteres' };
    if (!/[a-z]/.test(password)) return { valido: false, mensaje: 'Debe tener al menos una minúscula' };
    return { valido: true, mensaje: '' };
  };

  // Verificar disponibilidad de username
  const verificarUsername = useCallback(async (username) => {
    if (!username || username.trim().length < 3) {
      setUsernameDisponible(false);
      return;
    }

    if (username === usuario?.nombre_usuario) {
      setUsernameDisponible(true);
      return;
    }

    try {
      setVerificandoUsername(true);
      const respuesta = await servicioAPI.verificarUsername(username);
      
      if (respuesta.exito) {
        setUsernameDisponible(respuesta.disponible || false);
        if (!respuesta.disponible && respuesta.sugerencias) {
          Alert.alert(
            'Usuario no disponible',
            `El nombre de usuario "${username}" no está disponible. Sugerencias: ${respuesta.sugerencias.join(', ')}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ Error verificando username:', error);
      setUsernameDisponible(false);
    } finally {
      setVerificandoUsername(false);
    }
  }, [usuario]);

  // Validar todos los campos
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Nombre completo
    if (!nombreCompleto.trim()) {
      nuevosErrores.nombreCompleto = 'El nombre completo es requerido';
    }

    // Nombre de usuario
    if (!nombreUsuario.trim()) {
      nuevosErrores.nombreUsuario = 'El nombre de usuario es requerido';
    } else if (nombreUsuario.trim().length < 3) {
      nuevosErrores.nombreUsuario = 'Mínimo 3 caracteres';
    } else if (!usernameDisponible) {
      nuevosErrores.nombreUsuario = 'Este nombre de usuario no está disponible';
    }

    // Email
    if (!email.trim()) {
      nuevosErrores.email = 'El correo electrónico es requerido';
    } else if (!validarEmail(email)) {
      nuevosErrores.email = 'Correo electrónico inválido';
    }

    // Contraseña (solo si se quiere cambiar)
    if (cambioContrasena) {
      const validacionContrasena = validarContrasena(contrasena);
      if (!validacionContrasena.valido) {
        nuevosErrores.contrasena = validacionContrasena.mensaje;
      }

      if (contrasena !== confirmarContrasena) {
        nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden';
      }
    }

    // Rol
    if (!rol) {
      nuevosErrores.rol = 'Debes seleccionar un rol';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Mostrar modal para contraseña de administrador
  const solicitarContrasenaAdmin = () => {
    if (rol === 'admin') {
      setModalAdminVisible(true);
      return false; // Indica que se necesita validación adicional
    }
    return true; // No se necesita validación
  };

  // Validar contraseña de administrador
  const validarContrasenaAdmin = async () => {
    const esValida = await servicioAPI.validarContraseñaAdmin(contrasenaAdmin);
    if (!esValida) {
      Alert.alert('Error', 'Contraseña de administrador incorrecta');
      return false;
    }
    return true;
  };

  // Guardar cambios
  const guardarCambios = async () => {
    try {
      // Validar formulario básico
      if (!validarFormulario()) {
        Alert.alert('Error', 'Por favor corrige los errores en el formulario');
        return;
      }

      // Si elige rol admin, pedir contraseña
      const necesitaValidacionAdmin = solicitarContrasenaAdmin();
      if (!necesitaValidacionAdmin) {
        return; // Esperar validación del modal
      }

      setGuardando(true);

      // Preparar datos para enviar
      const datosActualizacion = {
        full_name: nombreCompleto.trim(),
        username: nombreUsuario.trim(),
        email: email.trim(),
        role: rol
      };

      // Solo incluir contraseña si se quiere cambiar
      if (cambioContrasena && contrasena) {
        datosActualizacion.password = contrasena;
      }

      console.log('📤 Enviando datos de actualización:', datosActualizacion);

      // Enviar al backend
      const respuesta = await servicioAPI.actualizarPerfil(datosActualizacion);

      if (respuesta.exito) {
        console.log('✅ Perfil actualizado exitosamente');
        
        // Actualizar token si cambió email o contraseña
        if (cambioContrasena || email !== usuario?.email) {
          Alert.alert(
            'Éxito', 
            'Perfil actualizado. Por seguridad, se cerrará tu sesión. Por favor, inicia sesión nuevamente.',
            [
              {
                text: 'Entendido',
                onPress: async () => {
                  await AsyncStorage.removeItem('token');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'InicioSesion' }],
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert('Éxito', 'Perfil actualizado exitosamente', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      } else {
        console.error('❌ Error del servidor:', respuesta.error);
        
        if (respuesta.requiereReautenticacion) {
          Alert.alert(
            'Sesión expirada',
            'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            [
              {
                text: 'Entendido',
                onPress: async () => {
                  await AsyncStorage.removeItem('token');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'InicioSesion' }],
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', respuesta.error || 'Error al actualizar el perfil');
        }
      }
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
      Alert.alert('Error', 'Error de conexión al servidor');
    } finally {
      setGuardando(false);
    }
  };

  // Función para manejar la validación del modal de administrador
  const manejarValidacionAdmin = async () => {
    const esValida = await validarContrasenaAdmin();
    if (esValida) {
      setModalAdminVisible(false);
      // Proceder con el guardado después de validar
      setGuardando(true);
      try {
        const datosActualizacion = {
          full_name: nombreCompleto.trim(),
          username: nombreUsuario.trim(),
          email: email.trim(),
          role: rol
        };

        if (cambioContrasena && contrasena) {
          datosActualizacion.password = contrasena;
        }

        const respuesta = await servicioAPI.actualizarPerfil(datosActualizacion);

        if (respuesta.exito) {
          Alert.alert(
            'Éxito',
            'Perfil actualizado con privilegios de administrador.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Error', respuesta.error || 'Error al actualizar el perfil');
        }
      } catch (error) {
        Alert.alert('Error', 'Error de conexión al servidor');
      } finally {
        setGuardando(false);
        setContrasenaAdmin('');
      }
    }
  };

  // Renderizar input con validación
  const renderInput = (label, value, onChangeText, error, placeholder, secureTextEntry = false, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={label.includes('Email') ? 'none' : 'words'}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  // Renderizar selector de rol
  const renderSelectorRol = () => (
    <View style={styles.rolContainer}>
      <Text style={styles.rolLabel}>Rol</Text>
      <View style={styles.rolesGrid}>
        {rolesDisponibles.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.rolOption,
              rol === item.id && styles.rolOptionSeleccionado,
            ]}
            onPress={() => setRol(item.id)}
          >
            <Text style={[
              styles.rolOptionTexto,
              rol === item.id && styles.rolOptionTextoSeleccionado,
            ]}>
              {item.nombre}
            </Text>
            <Text style={styles.rolOptionDescripcion}>
              {item.descripcion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errores.rol ? <Text style={styles.errorText}>{errores.rol}</Text> : null}
    </View>
  );

  // Renderizar switch para cambiar contraseña
  const renderSwitchContrasena = () => (
    <TouchableOpacity
      style={styles.switchContainer}
      onPress={() => setCambioContrasena(!cambioContrasena)}
    >
      <View style={styles.switchRow}>
        <View style={[styles.switchTrack, cambioContrasena && styles.switchTrackActivo]}>
          <View style={[styles.switchThumb, cambioContrasena && styles.switchThumbActivo]} />
        </View>
        <Text style={styles.switchLabel}>Cambiar contraseña</Text>
      </View>
      <Text style={styles.switchDescripcion}>
        Activa esta opción si deseas actualizar tu contraseña
      </Text>
    </TouchableOpacity>
  );

  // Modal para contraseña de administrador
  const renderModalAdmin = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalAdminVisible}
      onRequestClose={() => setModalAdminVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitulo}>🔐 Verificación de Administrador</Text>
          <Text style={styles.modalDescripcion}>
            Estás a punto de cambiar tu rol a Administrador. 
            Por seguridad, necesitamos que ingreses la contraseña de administrador.
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Contraseña de administrador"
            secureTextEntry={true}
            value={contrasenaAdmin}
            onChangeText={setContrasenaAdmin}
            autoFocus={true}
          />
          
          <View style={styles.modalBotones}>
            <TouchableOpacity
              style={[styles.modalBoton, styles.modalBotonCancelar]}
              onPress={() => {
                setModalAdminVisible(false);
                setRol(usuario?.rol || 'estudiante');
                setContrasenaAdmin('');
              }}
            >
              <Text style={styles.modalBotonTextoCancelar}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalBoton, styles.modalBotonConfirmar]}
              onPress={manejarValidacionAdmin}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.modalBotonTextoConfirmar}>Verificar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (cargando) {
    return (
      <LinearGradient 
        colors={['#000000', '#8a003a', '#000000']}
        style={styles.fondo}
      >
        <SafeAreaView style={styles.centrado}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.textoCargando}>Cargando perfil...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#000000', '#8a003a', '#000000']}
      style={styles.fondo}
    >
      <SafeAreaView style={styles.contenedor}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Encabezado */}
            <View style={styles.encabezado}>
              <Text style={styles.tituloPrincipal}>Editar Perfil</Text>
              <Text style={styles.subtitulo}>
                Actualiza tu información personal
              </Text>
            </View>

            {/* Formulario */}
            <View style={styles.formulario}>
              {renderInput(
                'Nombre completo',
                nombreCompleto,
                setNombreCompleto,
                errores.nombreCompleto,
                'Ej: Juan Pérez'
              )}

              {renderInput(
                'Nombre de usuario',
                nombreUsuario,
                (text) => {
                  setNombreUsuario(text);
                  if (text.length >= 3) {
                    verificarUsername(text);
                  }
                },
                errores.nombreUsuario,
                'Ej: juanperez',
                false,
                'default'
              )}

              {verificandoUsername && (
                <View style={styles.verificandoContainer}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text style={styles.verificandoTexto}>Verificando disponibilidad...</Text>
                </View>
              )}

              {!verificandoUsername && nombreUsuario.length >= 3 && !errores.nombreUsuario && (
                <View style={[
                  styles.disponibilidadContainer,
                  usernameDisponible ? styles.disponible : styles.noDisponible
                ]}>
                  <Text style={styles.disponibilidadTexto}>
                    {usernameDisponible ? '✓ Disponible' : '✗ No disponible'}
                  </Text>
                </View>
              )}

              {renderInput(
                'Correo electrónico',
                email,
                setEmail,
                errores.email,
                'Ej: usuario@ejemplo.com',
                false,
                'email-address'
              )}

              {renderSwitchContrasena()}

              {cambioContrasena && (
                <>
                  {renderInput(
                    'Nueva contraseña',
                    contrasena,
                    setContrasena,
                    errores.contrasena,
                    'Mínimo 6 caracteres con una minúscula',
                    true
                  )}

                  {renderInput(
                    'Confirmar contraseña',
                    confirmarContrasena,
                    setConfirmarContrasena,
                    errores.confirmarContrasena,
                    'Repite la contraseña',
                    true
                  )}

                  <View style={styles.requisitosContainer}>
                    <Text style={styles.requisitosTitulo}>Requisitos de contraseña:</Text>
                    <Text style={[styles.requisito, contrasena.length >= 6 && styles.requisitoCumplido]}>
                      • Mínimo 6 caracteres
                    </Text>
                    <Text style={[styles.requisito, /[a-z]/.test(contrasena) && styles.requisitoCumplido]}>
                      • Al menos una letra minúscula
                    </Text>
                  </View>
                </>
              )}

              {renderSelectorRol()}

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
                    <Text style={styles.botonTextoGuardar}>Guardar Cambios</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {renderModalAdmin()}
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  encabezado: {
    padding: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  tituloPrincipal: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  formulario: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  verificandoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  verificandoTexto: {
    color: '#4A90E2',
    fontSize: 12,
    marginLeft: 8,
  },
  disponibilidadContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  disponible: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  noDisponible: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  disponibilidadTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  disponibleText: {
    color: '#4CAF50',
  },
  noDisponibleText: {
    color: '#F44336',
  },
  switchContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActivo: {
    backgroundColor: '#ff3366',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  switchThumbActivo: {
    alignSelf: 'flex-end',
  },
  switchLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  switchDescripcion: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
  requisitosContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  requisitosTitulo: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requisito: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 4,
  },
  requisitoCumplido: {
    color: '#4CAF50',
  },
  rolContainer: {
    marginBottom: 25,
  },
  rolLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rolOption: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rolOptionSeleccionado: {
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
    borderColor: '#ff3366',
  },
  rolOptionTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rolOptionTextoSeleccionado: {
    color: '#ff3366',
  },
  rolOptionDescripcion: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 25,
    borderWidth: 1,
    borderColor: '#ff3366',
  },
  modalTitulo: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescripcion: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBotonCancelar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
  },
  modalBotonConfirmar: {
    backgroundColor: '#ff3366',
    marginLeft: 10,
  },
  modalBotonTextoCancelar: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBotonTextoConfirmar: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});