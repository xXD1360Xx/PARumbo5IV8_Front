import React, { useState, useEffect } from 'react';
import { 
  TextInput, 
  Image, 
  Alert, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { estilos } from '../estilos/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { servicioAPI } from '../servicios/api';

export default function PantallaRegistrarse({ navigation, route }) {
  const { correo } = route.params;
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(correo);
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [rol, setRol] = useState('');
  const [contrasenaAdmin, setContrasenaAdmin] = useState('');
  const [perfilPrivado, setPerfilPrivado] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estados para mostrar/ocultar contraseña
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  // Estados para verificación de username
  const [usernameDisponible, setUsernameDisponible] = useState(null);
  const [verificandoUsername, setVerificandoUsername] = useState(false);

  const roles = [
    { id: 'explorando', label: 'Estudiante explorando opciones' },
    { id: 'estudiante', label: 'Estudiante universitario' },
    { id: 'egresado', label: 'Estudiante egresado' },
    { id: 'admin', label: 'Administrador' }
  ];

  // --- Funciones de validación de contraseña (igual que en PantallaReset) ---
  const validarFortalezaContrasena = (pass) => {
    const validaciones = [
      { test: pass.length >= 6, texto: 'Mínimo 6 caracteres', esencial: true },
      { test: /\d/.test(pass), texto: 'Al menos un número', esencial: true },
      { test: /[A-Z]/.test(pass), texto: 'Al menos una mayúscula', esencial: false },
      { test: /[a-z]/.test(pass), texto: 'Al menos una minúscula', esencial: false },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(pass), texto: 'Al menos un carácter especial', esencial: false },
    ];
    return validaciones.map(v => ({
      ...v,
      color: v.test ? '#00C853' : '#FF5252',
      icono: v.test ? '✓' : '✗'
    }));
  };

  const obtenerPorcentajeFortaleza = (pass) => {
    const validaciones = validarFortalezaContrasena(pass);
    const cumplidas = validaciones.filter(v => v.test).length;
    return (cumplidas / validaciones.length) * 100;
  };

  const criteriosEsencialesCumplidos = (pass) => {
    const validaciones = validarFortalezaContrasena(pass);
    return validaciones.filter(v => v.esencial && v.test).length === 2; // longitud y número
  };

  // --- Verificar username ---
  const verificarUsername = async () => {
    if (!usuario || usuario.trim().length < 3) {
      setUsernameDisponible(null);
      return;
    }
    setVerificandoUsername(true);
    try {
      const respuesta = await servicioAPI.verificarUsername(usuario);
      setUsernameDisponible(respuesta.exito ? (respuesta.disponible || false) : false);
    } catch (error) {
      console.error('Error verificando username:', error);
      setUsernameDisponible(false);
    } finally {
      setVerificandoUsername(false);
    }
  };

  const handleUsernameBlur = () => {
    if (usuario.length >= 3) verificarUsername();
  };

  // --- Registro ---
  const manejarRegistro = async () => {
    try {
      // Validaciones básicas
      if (!nombre.trim() || !email.trim() || !usuario.trim() || !contrasena.trim() || !confirmarContrasena.trim()) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
      if (!rol) {
        Alert.alert('Error', 'Por favor selecciona tu perfil');
        return;
      }
      if (usuario.length < 3) {
        Alert.alert('Error', 'El usuario debe tener al menos 3 caracteres');
        return;
      }
      // Verificación de username
      if (usernameDisponible === null && usuario.length >= 3) await verificarUsername();
      if (verificandoUsername) {
        Alert.alert('Espera', 'Verificando disponibilidad del usuario...');
        return;
      }
      if (usernameDisponible === false) {
        Alert.alert('Usuario no disponible', 'El nombre de usuario no está disponible. Por favor elige otro.');
        return;
      }

      // Validación de contraseña (criterios esenciales)
      if (!criteriosEsencialesCumplidos(contrasena)) {
        Alert.alert('Contraseña no válida', 'Debe tener al menos 6 caracteres y un número.');
        return;
      }
      if (contrasena !== confirmarContrasena) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }

      // Validación para admin
      if (rol === 'admin') {
        if (!contrasenaAdmin.trim()) {
          Alert.alert('Error', 'Para registrarte como administrador necesitas la contraseña especial');
          return;
        }
        if (contrasenaAdmin !== 'jimmyponme6xfi') {
          Alert.alert('Error', 'Contraseña de administrador incorrecta');
          setContrasenaAdmin('');
          return;
        }
      }

      setCargando(true);
      const respuesta = await servicioAPI.registrarUsuario({
        nombre: nombre.trim(),
        email: email.trim(),
        nombreUsuario: usuario.trim(),
        contrasena: contrasena,
        profileType: rol,
      });

      if (respuesta.exito) {
        await AsyncStorage.multiSet([
          ['sesionActiva', 'true'],
          ['usuarioInfo', JSON.stringify(respuesta.usuario)],
          ['usuarioId', respuesta.usuario.id.toString()],
          ['token', respuesta.token]
        ]);
        navigation.navigate('MenuPrincipal');
      } else {
        Alert.alert('Error', respuesta.error || 'Error en el registro');
        setContrasena('');
        setConfirmarContrasena('');
        setContrasenaAdmin('');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      Alert.alert('Error', 'Error conectando con el servidor');
    } finally {
      setCargando(false);
    }
  };

  // Efectos
  useEffect(() => {
    if (rol !== 'admin') setContrasenaAdmin('');
  }, [rol]);

  // Datos para la validación de contraseña
  const fortaleza = validarFortalezaContrasena(contrasena);
  const porcentaje = obtenerPorcentajeFortaleza(contrasena);
  const coinciden = contrasena && confirmarContrasena && contrasena === confirmarContrasena;

  return (
    <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={estilos.fondo}>
      <SafeAreaView style={estilos.contenedorPrincipal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30, paddingTop: Platform.OS === 'ios' ? 20 : 30 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={estilos.titulo}>RUMBO</Text>
            <Text style={estilos.subtitulo}>Crea tu cuenta para comenzar</Text>

            {/* Nombre completo */}
            <TextInput
              style={[estilos.contenedorInput, { marginBottom: 12 }]}
              placeholder="Nombre completo"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              editable={!cargando}
            />

            {/* Email VERIFICADO (no editable) */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#FF5252', fontSize: 12, fontWeight: '600', marginBottom: 5, marginLeft: 5 }}>EMAIL VERIFICADO</Text>
              <TextInput
                style={[estilos.contenedorInput, { backgroundColor: 'rgba(255,82,82,0.1)', borderColor: '#FF5252', borderWidth: 1 }]}
                value={email}
                editable={false}
              />
            </View>

            {/* Username con verificación */}
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={[
                  estilos.contenedorInput,
                  usuario.length >= 3 && {
                    borderColor: verificandoUsername ? '#FFA500' : (usernameDisponible === true ? '#4CAF50' : (usernameDisponible === false ? '#FF5252' : 'rgba(255,255,255,0.1)'))
                  }
                ]}
                placeholder="Usuario (mínimo 3 caracteres)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={usuario}
                onChangeText={setUsuario}
                onBlur={handleUsernameBlur}
                autoCapitalize="none"
                editable={!cargando}
              />
              {usuario.length >= 3 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginLeft: 5 }}>
                  {verificandoUsername ? (
                    <>
                      <ActivityIndicator size="small" color="#FFA500" />
                      <Text style={{ color: '#FFA500', fontSize: 12, marginLeft: 8 }}>Verificando...</Text>
                    </>
                  ) : usernameDisponible === true ? (
                    <>
                      <Text style={{ color: '#4CAF50', fontSize: 12 }}>✓</Text>
                      <Text style={{ color: '#4CAF50', fontSize: 12, marginLeft: 8 }}>Usuario disponible</Text>
                    </>
                  ) : usernameDisponible === false ? (
                    <Text style={{ color: '#FF5252', fontSize: 12, marginLeft: 8 }}>Usuario no disponible</Text>
                  ) : null}
                </View>
              )}
            </View>

            {/* Campo: Contraseña con mostrar/ocultar */}
            <View style={stylesLocal.campoContainer}>
              <Text style={stylesLocal.campoLabel}>CONTRASEÑA</Text>
              <View style={stylesLocal.inputContainer}>
                <TextInput
                  style={stylesLocal.input}
                  placeholder="Crea una contraseña"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={contrasena}
                  onChangeText={setContrasena}
                  secureTextEntry={!mostrarContrasena}
                  editable={!cargando}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={stylesLocal.botonOjo} onPress={() => setMostrarContrasena(!mostrarContrasena)} disabled={cargando}>
                  <Text style={stylesLocal.textoOjo}>{mostrarContrasena ? 'Ocultar' : 'Mostrar'}</Text>
                </TouchableOpacity>
              </View>
              {contrasena.length > 0 && (
                <View style={stylesLocal.fortalezaContainer}>
                  <View style={stylesLocal.barraFortaleza}>
                    <View style={[stylesLocal.barraFortalezaFill, { width: `${porcentaje}%`, backgroundColor: porcentaje < 40 ? '#FF5252' : (porcentaje < 80 ? '#FFC107' : '#00C853') }]} />
                  </View>
                  <Text style={stylesLocal.textoFortaleza}>
                    {porcentaje < 40 ? 'Débil' : (porcentaje < 80 ? 'Media' : 'Fuerte')}
                  </Text>
                </View>
              )}
            </View>

            {/* Campo: Confirmar contraseña */}
            <View style={stylesLocal.campoContainer}>
              <Text style={stylesLocal.campoLabel}>CONFIRMAR CONTRASEÑA</Text>
              <View style={stylesLocal.inputContainer}>
                <TextInput
                  style={[stylesLocal.input, !coinciden && confirmarContrasena.length > 0 && stylesLocal.inputError]}
                  placeholder="Confirma tu contraseña"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={confirmarContrasena}
                  onChangeText={setConfirmarContrasena}
                  secureTextEntry={!mostrarConfirmar}
                  editable={!cargando}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={stylesLocal.botonOjo} onPress={() => setMostrarConfirmar(!mostrarConfirmar)} disabled={cargando}>
                  <Text style={stylesLocal.textoOjo}>{mostrarConfirmar ? 'Ocultar' : 'Mostrar'}</Text>
                </TouchableOpacity>
              </View>
              {confirmarContrasena.length > 0 && !coinciden && (
                <Text style={stylesLocal.textoError}>Las contraseñas no coinciden</Text>
              )}
            </View>

            {/* Criterios de seguridad (igual que en PantallaReset) */}
            <View style={stylesLocal.criteriosContainer}>
              <Text style={stylesLocal.criteriosTitulo}>CRITERIOS DE SEGURIDAD</Text>
              <View style={stylesLocal.criteriosEsencialesContainer}>
                <Text style={stylesLocal.criteriosSubtitulo}>Criterios esenciales:</Text>
                {fortaleza.filter(c => c.esencial).map((c, idx) => (
                  <Text key={`esencial-${idx}`} style={[stylesLocal.criterioTexto, { color: c.color }]}>
                    {c.icono} {c.texto}
                  </Text>
                ))}
              </View>
              <View style={stylesLocal.criteriosOpcionalesContainer}>
                <Text style={stylesLocal.criteriosSubtitulo}>Criterios opcionales (recomendados):</Text>
                {fortaleza.filter(c => !c.esencial).map((c, idx) => (
                  <Text key={`opcional-${idx}`} style={[stylesLocal.criterioTexto, { color: c.color }]}>
                    {c.icono} {c.texto}
                  </Text>
                ))}
              </View>
            </View>

            {/* Selección de Rol */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[estilos.subtitulo, { fontSize: 16, marginBottom: 12 }]}>Selecciona tu perfil</Text>
              {roles.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    borderWidth: 2,
                    borderColor: rol === item.id ? '#ff3366' : 'transparent'
                  }}
                  onPress={() => setRol(item.id)}
                  disabled={cargando}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                    borderColor: rol === item.id ? '#ff3366' : 'rgba(255,255,255,0.5)',
                    backgroundColor: rol === item.id ? '#ff3366' : 'transparent',
                    marginRight: 12,
                    justifyContent: 'center', alignItems: 'center'
                  }}>
                    {rol === item.id && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                  </View>
                  <Text style={{ color: 'white', fontSize: 16, flex: 1 }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contraseña de admin */}
            {rol === 'admin' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[estilos.subtitulo, { fontSize: 16, marginBottom: 8 }]}>Contraseña de administrador</Text>
                <TextInput
                  style={estilos.contenedorInput}
                  placeholder="Ingresa la contraseña especial"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={contrasenaAdmin}
                  onChangeText={setContrasenaAdmin}
                  secureTextEntry
                  editable={!cargando}
                />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 }}>
                  Se requiere contraseña especial para crear cuenta de administrador
                </Text>
              </View>
            )}

            {/* Perfil privado */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
            }}>
              <Switch
                value={perfilPrivado}
                onValueChange={setPerfilPrivado}
                disabled={cargando}
                trackColor={{ false: '#767577', true: '#ff3366' }}
                thumbColor={perfilPrivado ? '#ffffff' : '#f4f3f4'}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>Perfil Privado</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }}>
                  Tu perfil solo será visible para los usuarios que sigues.
                  {perfilPrivado ? ' (Activado)' : ' (Desactivado por defecto)'}
                </Text>
              </View>
            </View>

            {/* Botón de Registro */}
            <TouchableOpacity 
              style={[estilos.botonGrande, cargando && estilos.botonDeshabilitado, { marginBottom: 16 }]}
              onPress={manejarRegistro}
              disabled={cargando || !criteriosEsencialesCumplidos(contrasena) || !coinciden || usernameDisponible !== true}
            >
              <Text style={estilos.textoBotonGrande}>{cargando ? 'REGISTRANDO...' : 'CREAR CUENTA'}</Text>
            </TouchableOpacity>

            {/* Enlace a Login */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={cargando} style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={[estilos.enlace, { fontSize: 16 }]}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>

            {/* Google Login */}
            <View style={estilos.separador} />
            <Text style={estilos.subtituloInferior}>O regístrate con</Text>
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={[estilos.botonRed, cargando && estilos.botonDeshabilitado]}
                onPress={() => Alert.alert('Próximamente', 'Registro con Google estará disponible pronto')}
                disabled={cargando}
              >
                <Image source={require('../recursos/img/google.png')} style={estilos.iconoRed} />
                <Text style={estilos.textoBotonRed}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={estilos.footer}>
              <Text style={estilos.textoFooter}>© 2025 Rumbo</Text>
            </View>

            {/* Loading overlay */}
            {cargando && (
              <View style={estilos.contenedorCargando}>
                <Text style={estilos.textoCargando}>Registrando...</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Estilos locales (copiados de PantallaReset y adaptados)
const stylesLocal = StyleSheet.create({
  campoContainer: { marginBottom: 20 },
  campoLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  input: { flex: 1, color: '#ffffff', fontSize: 16, paddingHorizontal: 10, paddingVertical: 16 },
  inputError: { borderColor: '#FF5252' },
  botonOjo: { paddingHorizontal: 10, paddingVertical: 16 },
  textoOjo: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  textoError: { color: '#FF5252', fontSize: 12, marginTop: 5, marginLeft: 5 },
  fortalezaContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  barraFortaleza: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  barraFortalezaFill: { height: '100%', borderRadius: 3 },
  textoFortaleza: { color: '#ffffff', fontSize: 12, fontWeight: '600', minWidth: 50 },
  criteriosContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  criteriosTitulo: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  criteriosSubtitulo: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  criterioTexto: { fontSize: 12, marginBottom: 6, lineHeight: 16 },
  criteriosEsencialesContainer: { marginBottom: 15 },
  criteriosOpcionalesContainer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
});