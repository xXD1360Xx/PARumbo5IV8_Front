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
  ActivityIndicator  
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

  // Estados para verificación de username
  const [usernameDisponible, setUsernameDisponible] = useState(null);
  const [verificandoUsername, setVerificandoUsername] = useState(false);

  const roles = [
    { id: 'explorando', label: 'Estudiante explorando opciones' },
    { id: 'estudiante', label: 'Estudiante universitario' },
    { id: 'egresado', label: 'Estudiante egresado' },
    { id: 'docente', label: 'Maestro/Docente' },
    { id: 'admin', label: 'Administrador' }
  ];

  // VERIFICAR USERNAME - SIMPLE Y FUNCIONAL
  const verificarUsername = async () => {
    if (!usuario || usuario.trim().length < 3) {
      setUsernameDisponible(null);
      return;
    }

    setVerificandoUsername(true);
    
    try {
      const respuesta = await servicioAPI.verificarUsername(usuario);
      
      if (respuesta.exito) {
        setUsernameDisponible(respuesta.disponible || false);
      } else {
        setUsernameDisponible(false);
      }
    } catch (error) {
      console.error('Error verificando username:', error);
      setUsernameDisponible(false);
    } finally {
      setVerificandoUsername(false);
    }
  };

  const manejarRegistro = async () => {
    try {
      console.log('📝 Iniciando registro...');
      
      // Validaciones básicas
      if (!nombre.trim() || !email.trim() || !usuario.trim() || !contrasena.trim() || !confirmarContrasena.trim()) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }

      if (!rol) {
        Alert.alert('Error', 'Por favor selecciona tu perfil (rol)');
        return;
      }

      if (usuario.length < 3) {
        Alert.alert('Error', 'El usuario debe tener al menos 3 caracteres');
        return;
      }

      // Verificar username si no se ha verificado
      if (usernameDisponible === null && usuario.length >= 3) {
        await verificarUsername();
      }

      // Si está verificando o no disponible, mostrar error
      if (verificandoUsername) {
        Alert.alert('Espera', 'Verificando disponibilidad del usuario...');
        return;
      }

      if (usernameDisponible === false) {
        Alert.alert('Usuario no disponible', 'El nombre de usuario no está disponible. Por favor elige otro.');
        return;
      }

      if (contrasena.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (contrasena !== confirmarContrasena) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }

      if (rol === 'admin') {
        if (!contrasenaAdmin.trim()) {
          Alert.alert('Error', 'Para registrarte como administrador necesitas ingresar la contraseña especial');
          return;
        }
        
        if (contrasenaAdmin !== 'jimmyponme6xfi') {
          Alert.alert('Error', 'Contraseña de administrador incorrecta');
          setContrasenaAdmin('');
          return;
        }
      }

      console.log('✅ Validaciones pasadas, enviando registro...');
      setCargando(true);
      
      const respuesta = await servicioAPI.registrarUsuario({
        nombre: nombre.trim(),
        email: email.trim(),
        nombreUsuario: usuario.trim(),
        contrasena: contrasena,
        rol: rol,
      });
      
      console.log('📡 Respuesta del servidor:', respuesta);
      
      if (respuesta.exito) {
        console.log('✅ Registro exitoso');
        
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

  // Verificar username cuando se pierde el foco (más simple)
  const handleUsernameBlur = () => {
    if (usuario.length >= 3) {
      verificarUsername();
    }
  };

  useEffect(() => {
    if (rol !== 'admin') {
      setContrasenaAdmin('');
    }
  }, [rol]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Rumbo | Registro';
    }
  }, []);

  return (
    <LinearGradient 
      colors={['#000000', '#8a003a', '#000000']}
      style={estilos.fondo}
    >
      <SafeAreaView style={estilos.contenedorPrincipal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingBottom: 30,
              paddingTop: Platform.OS === 'ios' ? 20 : 30
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={estilos.titulo}>RUMBO</Text>
            <Text style={estilos.subtitulo}>
              Crea tu cuenta para comenzar
            </Text>

            {/* Nombre completo */}
            <TextInput
              style={[estilos.contenedorInput, { marginBottom: 12 }]}
              placeholder="Nombre completo"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              editable={!cargando}
              autoCorrect={false}
            />

            {/* Email VERIFICADO - NO editable (en rojo) */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{
                color: '#FF5252',
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 5,
                marginLeft: 5
              }}>
                EMAIL VERIFICADO
              </Text>
              <TextInput
                style={[
                  estilos.contenedorInput,
                  { 
                    backgroundColor: 'rgba(255,82,82,0.1)',
                    color: 'rgba(255,255,255,0.9)',
                    borderColor: '#FF5252',
                    borderWidth: 1
                  }
                ]}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={false}
                autoCorrect={false}
              />
            </View>

            {/* Username con verificación */}
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={[
                  estilos.contenedorInput,
                  usuario.length >= 3 && {
                    borderColor: 
                      verificandoUsername ? '#FFA500' : 
                      usernameDisponible === true ? '#4CAF50' : 
                      usernameDisponible === false ? '#FF5252' : 
                      'rgba(255,255,255,0.1)'
                  }
                ]}
                placeholder="Usuario (mínimo 3 caracteres)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={usuario}
                onChangeText={setUsuario}
                onBlur={handleUsernameBlur}
                autoCapitalize="none"
                editable={!cargando}
                autoCorrect={false}
              />
              
              {/* Indicador CLARO de disponibilidad */}
              {usuario.length >= 3 && (
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginTop: 5,
                  marginLeft: 5 
                }}>
                  {verificandoUsername ? (
                    <>
                      <ActivityIndicator size="small" color="#FFA500" />
                      <Text style={{ color: '#FFA500', fontSize: 12, marginLeft: 8 }}>
                        Verificando disponibilidad...
                      </Text>
                    </>
                  ) : usernameDisponible === false ? (
                    <>
                      <Text style={{ color: '#4CAF50', fontSize: 12 }}>✓</Text>
                      <Text style={{ color: '#4CAF50', fontSize: 12, marginLeft: 8 }}>
                        Usuario DISPONIBLE
                      </Text>
                    </>
                  ) : usernameDisponible === true ? (
                    <>
                      <Text style={{ color: '#4CAF50', fontSize: 12 }}>✓</Text>
                      <Text style={{ color: '#4CAF50', fontSize: 12, marginLeft: 8 }}>
                        Usuario DISPONIBLE
                      </Text>
                    </>
                  ) : null}
                </View>
              )}
            </View>

            {/* Contraseñas */}
            <TextInput
              style={[estilos.contenedorInput, { marginBottom: 12 }]}
              placeholder="Contraseña (mínimo 6 caracteres)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
              editable={!cargando}
            />

            <TextInput
              style={[estilos.contenedorInput, { marginBottom: 20 }]}
              placeholder="Confirmar contraseña"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              secureTextEntry
              editable={!cargando}
            />

            {/* Selección de Rol */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[estilos.subtitulo, { fontSize: 16, marginBottom: 12 }]}>
                Selecciona tu perfil
              </Text>
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
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: rol === item.id ? '#ff3366' : 'rgba(255,255,255,0.5)',
                    backgroundColor: rol === item.id ? '#ff3366' : 'transparent',
                    marginRight: 12,
                  }}>
                    {rol === item.id && (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: 'white', fontSize: 16, flex: 1 }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contraseña de admin */}
            {rol === 'admin' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[estilos.subtitulo, { fontSize: 16, marginBottom: 8 }]}>
                  Contraseña de administrador
                </Text>
                <TextInput
                  style={[estilos.contenedorInput]}
                  placeholder="Ingresa la contraseña especial"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={contrasenaAdmin}
                  onChangeText={setContrasenaAdmin}
                  secureTextEntry
                  editable={!cargando}
                />
                <Text style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  marginTop: 6,
                }}>
                  Se requiere contraseña especial para crear cuenta de administrador
                </Text>
              </View>
            )}

            {/* Perfil privado */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)'
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
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                  Perfil Privado
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }}>
                  Tu perfil solo será visible para los usuarios que sigues.
                  {perfilPrivado ? ' (Activado)' : ' (Desactivado por defecto)'}
                </Text>
              </View>
            </View>

            {/* Botón de Registro */}
            <TouchableOpacity 
              style={[
                estilos.botonGrande, 
                cargando && estilos.botonDeshabilitado,
                { marginBottom: 16 }
              ]}
              onPress={manejarRegistro}
              disabled={cargando}
            >
              <Text style={estilos.textoBotonGrande}>
                {cargando ? 'REGISTRANDO...' : 'CREAR CUENTA'}
              </Text>
            </TouchableOpacity>

            {/* Enlace para ir a Login */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={cargando}
              style={{ alignItems: 'center', marginBottom: 24 }}
            >
              <Text style={[estilos.enlace, { fontSize: 16 }]}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </TouchableOpacity>

            {/* Google Login */}
            <View style={estilos.separador} />
            <Text style={estilos.subtituloInferior}>O regístrate con</Text>

            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={[
                  estilos.botonRed,
                  cargando && estilos.botonDeshabilitado
                ]}
                onPress={() => Alert.alert('Próximamente', 'Registro con Google estará disponible pronto')}
                disabled={cargando}
              >
                <Image 
                  source={require('../recursos/img/google.png')} 
                  style={estilos.iconoRed}
                />
                <Text style={estilos.textoBotonRed}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={estilos.footer}>
              <Text style={estilos.textoFooter}>© 2025 Rumbo</Text>
            </View>

            {/* Loading */}
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