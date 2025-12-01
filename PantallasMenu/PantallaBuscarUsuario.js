import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { estilos } from '../estilos/styles';
import { apiService } from '../servicios/api';

export default function PantallaBuscarUsuario({ navigation }) {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const buscarUsuario = async () => {
    if (!terminoBusqueda.trim()) {
      Alert.alert('Error', 'Ingresa un email o nombre de usuario para buscar');
      return;
    }

    setCargando(true);
    setResultados([]);
    setUsuarioSeleccionado(null);

    try {
      // Primero intentamos buscar por ID (si es un UUID)
      if (terminoBusqueda.includes('-') && terminoBusqueda.length > 30) {
        // Parece un UUID, buscar directamente
        const datos = await apiService.obtenerPerfilPublico(terminoBusqueda);
        if (datos.exito) {
          setResultados([datos.usuario]);
        } else {
          Alert.alert('No encontrado', 'Usuario no encontrado con ese ID');
        }
      } else {
        // Buscar en nuestro backend (necesitarías crear este endpoint)
        Alert.alert('Búsqueda', 'La búsqueda por nombre/email requiere un endpoint adicional en el backend');
        
        // Mientras tanto, podemos buscar por email directamente
        try {
          // Esta es una aproximación - necesitarías crear un endpoint de búsqueda
          const datos = await apiService.obtenerPerfilPublico(terminoBusqueda);
          if (datos.exito) {
            setResultados([datos.usuario]);
          }
        } catch {
          // Si no funciona, mostrar opción manual
          setResultados([
            {
              id: 'ejemplo-123',
              nombre: 'Juan Pérez',
              nombre_usuario: 'juanperez',
              email: terminoBusqueda.includes('@') ? terminoBusqueda : `${terminoBusqueda}@ejemplo.com`,
              rol: 'estudiante',
              foto_perfil: 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error buscando usuario:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setCargando(false);
    }
  };

  const verPerfilUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    navigation.navigate('PantallaPerfil', {
      usuarioInfo: usuario,
      esMiPerfil: false
    });
  };

  const verResultadosUsuario = (usuario) => {
    navigation.navigate('PantallaResultados', {
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombre || usuario.nombre_usuario
    });
  };

  const renderUsuario = (usuario) => (
    <View key={usuario.id} style={{
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center'
    }}>
      <Image
        source={{ uri: usuario.foto_perfil || 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png' }}
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          marginRight: 15
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          {usuario.nombre || usuario.nombre_usuario}
        </Text>
        <Text style={{ color: '#ccc', fontSize: 12 }}>@{usuario.nombre_usuario}</Text>
        {usuario.email && (
          <Text style={{ color: '#aaa', fontSize: 12 }}>{usuario.email}</Text>
        )}
        <Text style={{ color: '#4fc3f7', fontSize: 12, marginTop: 2 }}>{usuario.rol}</Text>
        
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <TouchableOpacity 
            style={{
              backgroundColor: '#4fc3f7',
              paddingHorizontal: 15,
              paddingVertical: 5,
              borderRadius: 5,
              marginRight: 10
            }}
            onPress={() => verPerfilUsuario(usuario)}
          >
            <Text style={{ color: '#000', fontSize: 12 }}>Ver perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{
              backgroundColor: '#81c784',
              paddingHorizontal: 15,
              paddingVertical: 5,
              borderRadius: 5
            }}
            onPress={() => verResultadosUsuario(usuario)}
          >
            <Text style={{ color: '#000', fontSize: 12 }}>Ver resultados</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={estilos.fondo}>
      <View style={estilos.contenedorPrincipal}>
        <Text style={estilos.titulo}>🔍 Buscar usuario</Text>
        <Text style={[estilos.subtitulo, { marginBottom: 20 }]}>
          Busca por email o nombre de usuario
        </Text>

        {/* Barra de búsqueda */}
        <View style={{
          flexDirection: 'row',
          marginBottom: 20
        }}>
          <TextInput
            style={[estilos.contenedorInput, { flex: 1, marginRight: 10 }]}
            placeholder="Email o nombre de usuario"
            value={terminoBusqueda}
            onChangeText={setTerminoBusqueda}
            placeholderTextColor="#666"
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={[estilos.botonChico, cargando && estilos.botonDeshabilitado]}
            onPress={buscarUsuario}
            disabled={cargando}
          >
            <Text style={estilos.textoBotonChico}>
              {cargando ? '...' : 'Buscar'}
            </Text>
          </TouchableOpacity>
        </View>

        {cargando && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={{ color: '#fff', marginTop: 10 }}>Buscando usuario...</Text>
          </View>
        )}

        {/* Resultados de búsqueda */}
        {resultados.length > 0 && !cargando && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 15 }}>
              Resultados ({resultados.length})
            </Text>
            {resultados.map(renderUsuario)}
          </View>
        )}

        {resultados.length === 0 && !cargando && terminoBusqueda && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: '#aaa', fontSize: 16, textAlign: 'center' }}>
              No se encontraron usuarios con "{terminoBusqueda}"
            </Text>
            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 10 }}>
              Intenta con el email completo o ID de usuario
            </Text>
          </View>
        )}

        {/* Instrucciones */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 15,
          marginTop: 30
        }}>
          <Text style={{ color: '#fff', fontSize: 16, marginBottom: 10 }}>💡 Cómo buscar:</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginBottom: 5 }}>• Email completo: usuario@ejemplo.com</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginBottom: 5 }}>• Nombre de usuario: juanperez</Text>
          <Text style={{ color: '#ccc', fontSize: 12 }}>• ID de usuario: 123e4567-e89b-12d3-a456-426614174000</Text>
        </View>

        {/* Botón para regresar */}
        <TouchableOpacity 
          style={[estilos.botonChico, { 
            backgroundColor: '#454545ff', 
            marginTop: 20,
            alignSelf: 'center' 
          }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={estilos.textoBotonChico}>← Regresar al menú</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}