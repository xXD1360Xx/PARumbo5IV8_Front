import React, { useState } from 'react';
import { TextInput, Alert, Text, View, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { estilos } from '../estilos/styles';  
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../servicios/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PantallaRegistrarse({ navigation, route }) {
  const { correo } = route.params || {};
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState(''); 
  const [nombre, setNombre] = useState(''); // Campo nuevo
  const [cargando, setCargando] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);

  const roles = [
    'Estudiante universitario',
    'Egresado/a de una carrera',
    'Docente/orientador',
    'Estudiante explorando opciones de carreras'
  ];

  // Mapear roles a valores que entienda la base de datos
  const mapearRolABaseDeDatos = (rolIndex) => {
    const mapaRoles = {
      0: 'estudiante',
      1: 'egresado',
      2: 'docente',
      3: 'explorando'
    };
    return mapaRoles[rolIndex] || 'usuario';
  };

  const registrar = async () => {
    let mensajeError = null;

    // Validaciones
    if (!nombre.trim()) {
      mensajeError = "Por favor, ingresa tu nombre completo";
    } else if (!usuario.trim()) {
      mensajeError = "Por favor, crea un nombre de usuario";
    } else if (!contrasena.trim()) {
      mensajeError = "Por favor, crea una contraseña";
    } else if (!correo?.trim()) {
      mensajeError = "Correo electrónico requerido";
    } else if (!/^.{6,}$/.test(usuario)) {
      mensajeError = "El usuario debe tener al menos 6 caracteres";
    } else if (!/^(?=.*\d).{6,}$/.test(contrasena)) {
      mensajeError = "La contraseña debe tener al menos 6 caracteres y contener un número";
    } else if (rolSeleccionado === null) {
      mensajeError = "Por favor, selecciona un rol";
    } else if (!/\S+@\S+\.\S+/.test(correo)) {
      mensajeError = "Por favor, ingresa un correo electrónico válido";
    }

    if (mensajeError) {
      if (Platform.OS === 'web') {
        alert(mensajeError);
      } else {
        Alert.alert("Error", mensajeError);
      }
      return;
    }

    setCargando(true);

    try {
      // ✅ USAR apiService para registrar
      const datosRegistro = {
        nombre: nombre.trim(),
        email: correo.trim(),
        contrasena: contrasena,
        nombreUsuario: usuario.trim(),
        rol: mapearRolABaseDeDatos(rolSeleccionado)
      };

      const respuesta = await apiService.registro(datosRegistro);

      if (respuesta.exito) {
        // Guardar información de sesión automáticamente
        const usuarioInfo = respuesta.usuario;
        
        await AsyncStorage.setItem('sesionActiva', 'true');
        await AsyncStorage.setItem('usuarioId', usuarioInfo.id.toString());
        await AsyncStorage.setItem('usuarioInfo', JSON.stringify(usuarioInfo));
        
        const mensajeExito = 'Cuenta creada correctamente. ¡Bienvenido/a!';
        const rolTexto = roles[rolSeleccionado];

        if (Platform.OS === 'web') {
          alert(mensajeExito);
          navigation.navigate('MenuPrincipal', { usuario: usuarioInfo });
        } else {
          Alert.alert(
            '¡Éxito!',
            mensajeExito,
            [
              { 
                text: 'Continuar', 
                onPress: () => navigation.navigate('MenuPrincipal', { usuario: usuarioInfo }) 
              }
            ],
            { cancelable: false }
          );
        }
      } else {
        // Manejar errores específicos del servidor
        let mensajeErrorServidor = respuesta.error || "No se pudo crear la cuenta";
        
        // Traducir errores comunes
        if (respuesta.error.includes('ya existe')) {
          if (respuesta.error.includes('email')) {
            mensajeErrorServidor = "Este correo electrónico ya está registrado";
          } else if (respuesta.error.includes('nombre_usuario')) {
            mensajeErrorServidor = "Este nombre de usuario ya está en uso";
          }
        }
        
        Alert.alert("Error", mensajeErrorServidor);
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      
      let mensajeErrorConexion = "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
      
      if (Platform.OS === 'web') {
        alert(mensajeErrorConexion);
      } else {
        Alert.alert("Error de conexión", mensajeErrorConexion);
      }
    } finally {
      setCargando(false);
    }
  };

  const regresar = () => {
    navigation.navigate('MandarCorreo');
  };

  return (
    <LinearGradient
      colors={['#000000ff', '#fff', '#000000ff']}
      style={{ flex: 1 }}
    > 
      <SafeAreaView style={estilos.contenedorPrincipal}>
        <Text style={estilos.titulo}>Crea tu cuenta</Text>
        <Text style={estilos.subtitulo}>
          Ingresa tus datos para crear una cuenta
        </Text>

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Tu nombre completo"
          value={nombre}
          onChangeText={setNombre}
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Correo electrónico"
          value={correo || ''}
          editable={false} // No editable porque viene de la pantalla anterior
          placeholderTextColor="#666"
        />

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Crea tu usuario (mínimo 6 caracteres)"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <TextInput
          style={estilos.contenedorInput}
          placeholder="Crea tu contraseña (mínimo 6 caracteres con un número)"
          value={contrasena}
          secureTextEntry={true}
          onChangeText={setContrasena}
          editable={!cargando}
          placeholderTextColor="#666"
        />

        <View style={estilos.contenedorRoles}>
          <Text style={estilos.subtitulo}>Selecciona el rol que mejor te represente</Text>
          {roles.map((rol, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                estilos.rolOpcion,
                cargando && estilos.botonDeshabilitado
              ]} 
              onPress={() => !cargando && setRolSeleccionado(index)}
              disabled={cargando}
            >
              <View style={estilos.rolCirculo}>
                {rolSeleccionado === index && <View style={estilos.rolCirculoSeleccionado}/>}
              </View>
              <Text style={[
                estilos.textoRol,
                cargando && { opacity: 0.5 }
              ]}>{rol}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
              { fontSize: 20 },
              cargando && { opacity: 0.5 }
            ]}> Regresar </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={registrar} 
            style={[
              estilos.botonChico,
              cargando && estilos.botonDeshabilitado
            ]}
            disabled={cargando}
          >
            <Text style={[
              estilos.textoBotonChico, 
              { fontSize: 20 },
              cargando && { opacity: 0.5 }
            ]}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>
        </View>

        {cargando && (
          <View style={estilos.contenedorCargando}>
            <Text style={estilos.textoCargando}>Registrando en el servidor...</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}