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
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { estilos } from '../estilos/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { servicioAPI } from '../servicios/api';

export default function PantallaRegistrarse({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [rol, setRol] = useState('');
  const [cargando, setCargando] = useState(false);

  const roles = [
    { id: 'estudiante', label: 'Estudiante explorando opciones' },
    { id: 'egresado', label: 'Estudiante egresado' },
    { id: 'maestro', label: 'Maestro/Docente' },
    { id: 'admin', label: 'Administrador' }
  ];

  const manejarRegistro = async () => {
    try {
      console.log('📝 Iniciando registro...');
      
      // Validaciones básicas
      if (!nombre.trim() || !email.trim() || !usuario.trim() || !contrasena.trim() || !confirmarContrasena.trim()) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }

      // Validar que se seleccionó un rol
      if (!rol) {
        Alert.alert('Error', 'Por favor selecciona tu perfil (rol)');
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Por favor ingresa un email válido');
        return;
      }

      // Validar usuario (mínimo 3 caracteres)
      if (usuario.length < 3) {
        Alert.alert('Error', 'El usuario debe tener al menos 3 caracteres');
        return;
      }

      // Validar contraseña (mínimo 6 caracteres)
      if (contrasena.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (contrasena !== confirmarContrasena) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }

      console.log('✅ Validaciones pasadas, enviando registro...');
      console.log('📤 Rol seleccionado:', rol);


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
        
        // Guardar datos en AsyncStorage
        await AsyncStorage.multiSet([
          ['sesionActiva', 'true'],
          ['usuarioInfo', JSON.stringify(respuesta.usuario)],
          ['usuarioId', respuesta.usuario.id.toString()],
          ['token', respuesta.token]
        ]);
        
      navigation.navigate('MenuPrincipal');

      } else {
        Alert.alert('Error', respuesta.error || 'Error en el registro');
        // Limpiar contraseñas en caso de error
        setContrasena('');
        setConfirmarContrasena('');
      }
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      Alert.alert('Error', 'Error conectando con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const manejarLogin = () => {
    navigation.navigate('Login');
  };

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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Título */}
            <Text style={estilos.titulo}>RUMBO</Text>
            <Text style={estilos.subtitulo}>
              Crea tu cuenta para comenzar
            </Text>

            {/* Formulario de Registro */}
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

            <TextInput
              style={[estilos.contenedorInput, { marginBottom: 12 }]}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!cargando}
              autoCorrect={false}
            />

            <TextInput
              style={[estilos.contenedorInput, { marginBottom: 12 }]}
              placeholder="Nombre de usuario (mínimo 3 caracteres)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="none"
              editable={!cargando}
              autoCorrect={false}
            />

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
              onSubmitEditing={manejarRegistro}
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
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {rol === item.id && (
                      <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                    )}
                  </View>
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    flex: 1
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Información adicional */}
            <View style={{ 
              marginBottom: 20, 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: 12, 
              borderRadius: 10,
              borderLeftWidth: 3,
              borderLeftColor: '#4CAF50'
            }}>
              <Text style={{
                color: 'white',
                fontSize: 13,
                lineHeight: 18
              }}>
                <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>Importante:</Text> Esta selección ayudará a personalizar tu experiencia en Rumbo. Puedes cambiar esta configuración más tarde en tu perfil.
              </Text>
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
              onPress={manejarLogin}
              disabled={cargando}
              style={{ alignItems: 'center', marginBottom: 24 }}
            >
              <Text style={[estilos.enlace, { fontSize: 16 }]}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </TouchableOpacity>

            {/* Separador */}
            <View style={estilos.separador} />

            {/* Google Login (opcional en registro) */}
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

            {/* Loading Overlay */}
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