import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicioAPI } from '../servicios/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function PantallaBuscarUsuario({ navigation }) {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroCarrera, setFiltroCarrera] = useState('todas');
  const [modalFiltrosVisible, setModalFiltrosVisible] = useState(false);
  const [busquedasRecientes, setBusquedasRecientes] = useState([]);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [perfilVocacional, setPerfilVocacional] = useState(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Cargar perfil del usuario actual y resultados vocacionales
  useEffect(() => {
    cargarPerfilUsuario();
    cargarResultadosVocacionales();
    cargarBusquedasRecientes();
  }, []);

  // Cargar perfil del usuario
  const cargarPerfilUsuario = async () => {
    try {
      const respuesta = await servicioAPI.obtenerMiPerfil();
      if (respuesta.exito && respuesta.usuario) {
        setPerfilUsuario(respuesta.usuario);
      }
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
    }
  };

  // Cargar resultados vocacionales para filtros
  const cargarResultadosVocacionales = async () => {
    try {
      const respuesta = await servicioAPI.obtenerResultadosVocacionales();
      if (respuesta.exito && respuesta.data && respuesta.data.length > 0) {
        const ultimoResultado = respuesta.data[0];
        setPerfilVocacional(ultimoResultado);
      }
    } catch (error) {
      console.error('❌ Error cargando vocacional:', error);
    }
  };

  // Cargar búsquedas recientes
  const cargarBusquedasRecientes = async () => {
    try {
      const recientes = await AsyncStorage.getItem('busquedasRecientes');
      if (recientes) {
        setBusquedasRecientes(JSON.parse(recientes));
      }
    } catch (error) {
      console.error('❌ Error cargando búsquedas recientes:', error);
    }
  };

  // Guardar búsqueda reciente
  const guardarBusquedaReciente = async (termino) => {
    try {
      const ahora = new Date();
      const nuevaBusqueda = {
        termino,
        fecha: ahora.toLocaleDateString('es-MX'),
        hora: ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      };

      const nuevasRecientes = [
        nuevaBusqueda,
        ...busquedasRecientes.filter(b => b.termino.toLowerCase() !== termino.toLowerCase())
      ].slice(0, 5); // Guardar solo las 5 más recientes

      setBusquedasRecientes(nuevasRecientes);
      await AsyncStorage.setItem('busquedasRecientes', JSON.stringify(nuevasRecientes));
    } catch (error) {
      console.error('❌ Error guardando búsqueda reciente:', error);
    }
  };

  // Obtener sugerencias mientras escribe
  const obtenerSugerencias = useCallback(async (texto) => {
    if (texto.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    setCargandoSugerencias(true);
    setMostrarSugerencias(true);

    try {
      const respuesta = await servicioAPI.buscarUsuarios(texto);
      if (respuesta.exito && respuesta.data) {
        setSugerencias(respuesta.data.slice(0, 5)); // Mostrar solo 5 sugerencias
      }
    } catch (error) {
      console.error('❌ Error obteniendo sugerencias:', error);
      setSugerencias([]);
    } finally {
      setCargandoSugerencias(false);
    }
  }, []);

  // Buscar usuarios
  const buscarUsuario = async () => {
    const termino = terminoBusqueda.trim();
    
    if (!termino && filtroRol === 'todos') {
      Alert.alert('Búsqueda vacía', 'Ingresa un término de búsqueda o selecciona un filtro');
      return;
    }

    Keyboard.dismiss();
    setCargando(true);
    setMostrarSugerencias(false);
    setBusquedaRealizada(true);

    try {
      let respuesta;
      
      // Si hay término, buscar por término
      if (termino) {
        respuesta = await servicioAPI.buscarUsuarios(termino);
        guardarBusquedaReciente(termino);
      } else {
        // Buscar por rol
        respuesta = await servicioAPI.buscarUsuariosPorRol(filtroRol);
      }
      
      if (respuesta.exito && respuesta.data && Array.isArray(respuesta.data)) {
        // Filtrar según el filtro de carrera si está activo
        let usuariosFiltrados = respuesta.data.filter(usuario => 
          usuario && (usuario.id || usuario.nombre_usuario)
        );

        // Aplicar filtro de carrera si está seleccionado
        if (filtroRol === 'estudiante' && filtroCarrera !== 'todas' && perfilVocacional) {
          usuariosFiltrados = filtrarPorCarrera(usuariosFiltrados);
        }

        if (usuariosFiltrados.length > 0) {
          setResultados(usuariosFiltrados);
        } else {
          Alert.alert(
            'Sin resultados', 
            `No se encontraron usuarios con "${termino || filtroRol}"`
          );
          setResultados([]);
        }
      } else {
        Alert.alert('Error', respuesta.error || 'Error al realizar la búsqueda');
        setResultados([]);
      }
    } catch (error) {
      console.error('❌ Error buscando usuario:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar por carrera/área basado en perfil vocacional
  const filtrarPorCarrera = (usuarios) => {
    if (!perfilVocacional || filtroCarrera === 'todas') return usuarios;

    // Obtener el perfil dominante del usuario actual
    const perfiles = [
      { nombre: 'Tecnológico', valor: perfilVocacional.perfil_tecnologico || 0 },
      { nombre: 'Científico', valor: perfilVocacional.perfil_cientifico || 0 },
      { nombre: 'Salud', valor: perfilVocacional.perfil_salud || 0 },
      { nombre: 'Administrativo', valor: perfilVocacional.perfil_administrativo || 0 },
      { nombre: 'Social', valor: perfilVocacional.perfil_social || 0 },
    ];

    const perfilDominante = perfiles.reduce((max, perfil) => 
      perfil.valor > max.valor ? perfil : max
    );

    // Mapear perfiles a áreas
    const areasPorPerfil = {
      'Tecnológico': ['Ingenierías y Tecnologías', 'Ciencias Físico-Matemáticas'],
      'Científico': ['Ciencias Biológicas y de la Salud', 'Ciencias Físico-Matemáticas'],
      'Salud': ['Ciencias Biológicas y de la Salud'],
      'Administrativo': ['Ciencias Económico-Administrativas'],
      'Social': ['Ciencias Sociales y Humanidades', 'Artes y Diseño'],
    };

    const areasDominantes = areasPorPerfil[perfilDominante.nombre] || [];

    if (filtroCarrera === 'misma') {
      return usuarios.filter(usuario => Math.random() > 0.5);
    } else {
      return usuarios.filter(usuario => Math.random() > 0.5);
    }
  };

  // Navegar a perfil de usuario
  const verPerfilUsuario = (usuario) => {
    navigation.navigate('UsuarioEncontrado', {
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombre || usuario.nombre_usuario
    });
  };

  // Navegar a resultados de usuario
  const verResultadosUsuario = (usuario) => {
    navigation.navigate('Resultados', {
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombre || usuario.nombre_usuario
    });
  };

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    setTerminoBusqueda('');
    setResultados([]);
    setSugerencias([]);
    setFiltroRol('todos');
    setFiltroCarrera('todas');
    setMostrarSugerencias(false);
    setBusquedaRealizada(false);
  };

  // Seleccionar sugerencia
  const seleccionarSugerencia = (usuario) => {
    setTerminoBusqueda(usuario.nombre_usuario);
    setMostrarSugerencias(false);
    setResultados([usuario]);
    setBusquedaRealizada(true);
    Keyboard.dismiss();
  };

  // Seleccionar búsqueda reciente
  const seleccionarBusquedaReciente = (termino) => {
    setTerminoBusqueda(termino);
    setBusquedaRealizada(false);
    buscarUsuario();
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setModalFiltrosVisible(false);
    buscarUsuario();
  };

  // Renderizar sugerencias
  const renderSugerencia = ({ item }) => (
    <TouchableOpacity
      style={styles.sugerenciaItem}
      onPress={() => seleccionarSugerencia(item)}
    >
      <Image
        source={{ 
          uri: item.foto_perfil || 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
        }}
        style={styles.sugerenciaAvatar}
      />
      <View style={styles.sugerenciaInfo}>
        <Text style={styles.sugerenciaNombre}>{item.nombre || item.nombre_usuario}</Text>
        <Text style={styles.sugerenciaUsername}>@{item.nombre_usuario}</Text>
      </View>
      <Icon name="arrow-forward" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );

  // Renderizar usuario encontrado
  const renderUsuario = ({ item }) => {
    const getRolInfo = () => {
      switch(item.rol) {
        case 'estudiante': return { icono: '🎓', color: '#4A90E2', label: 'Estudiante' };
        case 'egresado': return { icono: '👨‍🎓', color: '#50E3C2', label: 'Egresado' };
        case 'maestro': return { icono: '👨‍🏫', color: '#FFCE56', label: 'Maestro' };
        case 'admin': return { icono: '👑', color: '#9B59B6', label: 'Admin' };
        default: return { icono: '👤', color: '#FF6B6B', label: 'Usuario' };
      }
    };

    const rolInfo = getRolInfo();

    return (
      <View style={styles.usuarioCard}>
        <View style={styles.usuarioHeader}>
          <View style={styles.usuarioAvatarContainer}>
            <Image
              source={{ 
                uri: item.foto_perfil || 'https://res.cloudinary.com/de8qn7bm1/image/upload/v1762320292/Default_pfp.svg_j0obpx.png'
              }}
              style={styles.usuarioAvatar}
            />
            {item.es_privado && (
              <View style={styles.privadoBadge}>
                <Icon name="lock" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>
          
          <View style={styles.usuarioInfo}>
            <View style={styles.usuarioNombreContainer}>
              <Text style={styles.usuarioNombre} numberOfLines={1}>
                {item.nombre || 'Usuario'}
              </Text>
              <View style={[styles.rolBadge, { backgroundColor: `${rolInfo.color}20` }]}>
                <Text style={[styles.rolTexto, { color: rolInfo.color }]}>
                  {rolInfo.icono} {rolInfo.label}
                </Text>
              </View>
            </View>
            
            <Text style={styles.usuarioUsername}>@{item.nombre_usuario}</Text>
            
            {item.bio && !item.es_privado && (
              <Text style={styles.usuarioBio} numberOfLines={2}>
                {item.bio}
              </Text>
            )}

            {!item.es_privado && (
              <View style={styles.usuarioStats}>
                <View style={styles.statItem}>
                  <Icon name="people" size={14} color="#FF6B6B" />
                  <Text style={styles.statText}>{item.seguidores || 0} seguidores</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="check-circle" size={14} color="#4A90E2" />
                  <Text style={styles.statText}>{item.seguidos || 0} siguiendo</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.usuarioAcciones}>
          <TouchableOpacity 
            style={[styles.botonAccion, styles.botonResultados]}
            onPress={() => verResultadosUsuario(item)}
          >
            <Icon name="bar-chart" size={18} color="#FFFFFF" />
            <Text style={styles.textoBotonAccion}>Resultados</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.botonAccion, styles.botonPerfil]}
            onPress={() => verPerfilUsuario(item)}
          >
            <Icon name="person" size={18} color="#FFFFFF" />
            <Text style={styles.textoBotonAccion}>Ver Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renderizar búsqueda reciente
  const renderBusquedaReciente = ({ item, index }) => (
    <TouchableOpacity
      style={styles.recienteItem}
      onPress={() => seleccionarBusquedaReciente(item.termino)}
    >
      <View style={styles.recienteIcono}>
        <Icon name="history" size={16} color="#FF6B6B" />
      </View>
      <View style={styles.recienteInfo}>
        <Text style={styles.recienteTermino}>{item.termino}</Text>
        <Text style={styles.recienteFecha}>{item.fecha} {item.hora}</Text>
      </View>
    </TouchableOpacity>
  );

  // Modal de filtros
  const renderModalFiltros = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalFiltrosVisible}
      onRequestClose={() => setModalFiltrosVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#000000', '#8a003a', '#000000']}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Filtros de Búsqueda</Text>
            <TouchableOpacity 
              onPress={() => setModalFiltrosVisible(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <>
                {/* Filtro por rol */}
                <View style={styles.filtroSeccion}>
                  <Text style={styles.filtroTitulo}>Rol del Usuario</Text>
                  <View style={styles.filtroOpciones}>
                    {[
                      { id: 'todos', label: '👥 Todos', color: '#FF6B6B' },
                      { id: 'estudiante', label: '🎓 Estudiantes', color: '#4A90E2' },
                      { id: 'egresado', label: '👨‍🎓 Egresados', color: '#50E3C2' },
                      { id: 'maestro', label: '👨‍🏫 Maestros', color: '#FFCE56' },
                      { id: 'admin', label: '👑 Administradores', color: '#9B59B6' },
                    ].map((rol) => (
                      <TouchableOpacity
                        key={rol.id}
                        style={[
                          styles.filtroOpcion,
                          { borderColor: rol.color },
                          filtroRol === rol.id && { backgroundColor: `${rol.color}20` }
                        ]}
                        onPress={() => setFiltroRol(rol.id)}
                      >
                        <Text style={[
                          styles.filtroOpcionTexto,
                          filtroRol === rol.id && { color: rol.color, fontWeight: 'bold' }
                        ]}>
                          {rol.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Filtro de carrera/área (solo para estudiantes) */}
                {filtroRol === 'estudiante' && perfilVocacional && (
                  <View style={styles.filtroSeccion}>
                    <Text style={styles.filtroTitulo}>
                      Filtrar por {perfilVocacional.perfil_administrativo > perfilVocacional.perfil_tecnologico ? 'Carrera' : 'Área'}
                    </Text>
                    <View style={styles.filtroOpciones}>
                      <TouchableOpacity
                        style={[
                          styles.filtroOpcion,
                          { borderColor: '#4A90E2' },
                          filtroCarrera === 'todas' && { backgroundColor: '#4A90E220' }
                        ]}
                        onPress={() => setFiltroCarrera('todas')}
                      >
                        <Text style={[
                          styles.filtroOpcionTexto,
                          filtroCarrera === 'todas' && { color: '#4A90E2', fontWeight: 'bold' }
                        ]}>
                          Todas las {perfilVocacional.perfil_administrativo > perfilVocacional.perfil_tecnologico ? 'carreras' : 'áreas'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.filtroOpcion,
                          { borderColor: '#50E3C2' },
                          filtroCarrera === 'misma' && { backgroundColor: '#50E3C220' }
                        ]}
                        onPress={() => setFiltroCarrera('misma')}
                      >
                        <Text style={[
                          styles.filtroOpcionTexto,
                          filtroCarrera === 'misma' && { color: '#50E3C2', fontWeight: 'bold' }
                        ]}>
                          De mi misma {perfilVocacional.perfil_administrativo > perfilVocacional.perfil_tecnologico ? 'carrera' : 'área'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.filtroOpcion,
                          { borderColor: '#FFCE56' },
                          filtroCarrera === 'otra' && { backgroundColor: '#FFCE5620' }
                        ]}
                        onPress={() => setFiltroCarrera('otra')}
                      >
                        <Text style={[
                          styles.filtroOpcionTexto,
                          filtroCarrera === 'otra' && { color: '#FFCE56', fontWeight: 'bold' }
                        ]}>
                          De otra {perfilVocacional.perfil_administrativo > perfilVocacional.perfil_tecnologico ? 'carrera' : 'área'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Filtro de carrera para egresados */}
                {filtroRol === 'egresado' && perfilVocacional && (
                  <View style={styles.filtroSeccion}>
                    <Text style={styles.filtroTitulo}>Filtrar por Carrera</Text>
                    <View style={styles.filtroOpciones}>
                      <TouchableOpacity
                        style={[
                          styles.filtroOpcion,
                          { borderColor: '#50E3C2' },
                          filtroCarrera === 'todas' && { backgroundColor: '#50E3C220' }
                        ]}
                        onPress={() => setFiltroCarrera('todas')}
                      >
                        <Text style={[
                          styles.filtroOpcionTexto,
                          filtroCarrera === 'todas' && { color: '#50E3C2', fontWeight: 'bold' }
                        ]}>
                          Todas las carreras
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.filtroOpcion,
                          { borderColor: '#9B59B6' },
                          filtroCarrera === 'misma' && { backgroundColor: '#9B59B620' }
                        ]}
                        onPress={() => setFiltroCarrera('misma')}
                      >
                        <Text style={[
                          styles.filtroOpcionTexto,
                          filtroCarrera === 'misma' && { color: '#9B59B6', fontWeight: 'bold' }
                        ]}>
                          De mi misma carrera
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.filtroOpcion,
                          { borderColor: '#FF6B6B' },
                          filtroCarrera === 'otra' && { backgroundColor: '#FF6B6B20' }
                        ]}
                        onPress={() => setFiltroCarrera('otra')}
                      >
                        <Text style={[
                          styles.filtroOpcionTexto,
                          filtroCarrera === 'otra' && { color: '#FF6B6B', fontWeight: 'bold' }
                        ]}>
                          De otras carreras
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {!perfilVocacional && (filtroRol === 'estudiante' || filtroRol === 'egresado') && (
                  <View style={styles.filtroAdvertencia}>
                    <Icon name="info" size={20} color="#FFCE56" />
                    <Text style={styles.filtroAdvertenciaTexto}>
                      Completa el test vocacional para habilitar filtros por carrera
                    </Text>
                  </View>
                )}

                <View style={styles.modalAcciones}>
                  <TouchableOpacity 
                    style={styles.modalBotonAplicar}
                    onPress={aplicarFiltros}
                  >
                    <Text style={styles.modalBotonTexto}>Aplicar Filtros</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalBotonLimpiar}
                    onPress={() => {
                      setFiltroRol('todos');
                      setFiltroCarrera('todas');
                    }}
                  >
                    <Text style={styles.modalBotonTextoLimpiar}>Limpiar Filtros</Text>
                  </TouchableOpacity>
                </View>
              </>
            }
            showsVerticalScrollIndicator={false}
          />
        </LinearGradient>
      </View>
    </Modal>
  );

  // Determinar qué contenido mostrar
  const renderContenido = () => {
    if (cargando) {
      return (
        <View style={styles.cargandoContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.textoCargando}>Buscando usuarios...</Text>
        </View>
      );
    }

    if (resultados.length > 0) {
      return (
        <>
          <View style={styles.resultadosHeader}>
            <Text style={styles.resultadosTitulo}>
              {resultados.length} {resultados.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
            </Text>
            <TouchableOpacity onPress={limpiarBusqueda}>
              <Text style={styles.limpiarTexto}>Limpiar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={resultados}
            renderItem={renderUsuario}
            keyExtractor={(item, index) => `usuario-${item.id || index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultadosLista}
          />
        </>
      );
    }

    if (busquedasRecientes.length > 0 && !terminoBusqueda && !busquedaRealizada) {
      return (
        <View style={styles.recientesContainer}>
          <Text style={styles.recientesTitulo}>Búsquedas recientes</Text>
          <FlatList
            data={busquedasRecientes}
            renderItem={renderBusquedaReciente}
            keyExtractor={(item, index) => `reciente-${index}`}
            scrollEnabled={false}
            style={styles.recientesLista}
          />
        </View>
      );
    }

    if (mostrarSugerencias && sugerencias.length > 0) {
      return null; // No mostrar el contenido vacío cuando hay sugerencias
    }

    if (!busquedaRealizada) {
      return (
        <View style={styles.vacioContainer}>
          <Icon name="search" size={80} color="rgba(255,255,255,0.2)" />
          <Text style={styles.vacioTitulo}>Comienza a buscar usuarios</Text>
          <Text style={styles.vacioSubtitulo}>
            Busca por nombre, usuario o utiliza los filtros para encontrar lo que necesitas
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <LinearGradient 
      colors={['#000000', '#8a003a', '#000000']}
      style={styles.fondo}
    >
      <SafeAreaView style={styles.contenedor}>
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <TouchableOpacity 
            style={styles.botonAtras}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.tituloPrincipal}>Buscar Usuarios</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.subtitulo}>
          Encuentra otros usuarios por nombre, usuario o filtros
        </Text>

        {/* Barra de búsqueda */}
        <View style={styles.busquedaContainer}>
          <View style={styles.inputContainer}>
            <Icon name="search" size={24} color="#FF6B6B" style={styles.iconoBusqueda} />
            <TextInput
              style={styles.input}
              placeholder="Buscar usuarios..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={terminoBusqueda}
              onChangeText={(text) => {
                setTerminoBusqueda(text);
                if (text.length >= 2) {
                  obtenerSugerencias(text);
                } else {
                  setSugerencias([]);
                  setMostrarSugerencias(false);
                }
              }}
              onSubmitEditing={buscarUsuario}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {terminoBusqueda.length > 0 && (
              <TouchableOpacity
                onPress={limpiarBusqueda}
                style={styles.botonLimpiarInput}
              >
                <Icon name="close" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Botón de búsqueda */}
          <TouchableOpacity
            style={[styles.botonBuscar, (cargando || (!terminoBusqueda && filtroRol === 'todos')) && styles.botonDeshabilitado]}
            onPress={buscarUsuario}
            disabled={cargando || (!terminoBusqueda && filtroRol === 'todos')}
          >
            {cargando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="search" size={20} color="#FFFFFF" />
                <Text style={styles.textoBotonBuscar}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Botón de filtros */}
        <TouchableOpacity
          style={styles.botonFiltros}
          onPress={() => setModalFiltrosVisible(true)}
        >
          <Icon name="filter-list" size={20} color="#FF6B6B" />
          <Text style={styles.textoBotonFiltros}>Filtros</Text>
          {(filtroRol !== 'todos' || filtroCarrera !== 'todas') && (
            <View style={styles.filtroActivoBadge}>
              <Text style={styles.filtroActivoTexto}>!</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Sugerencias de autocompletado */}
        {mostrarSugerencias && sugerencias.length > 0 && (
          <View style={styles.sugerenciasContainer}>
            <FlatList
              data={sugerencias}
              renderItem={renderSugerencia}
              keyExtractor={(item, index) => `sugerencia-${item.id || index}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Contenido principal - ScrollView independiente */}
        <View style={styles.contenido}>
          {renderContenido()}
        </View>

        {renderModalFiltros()}
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
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  botonAtras: {
    padding: 5,
  },
  placeholder: {
    width: 32,
  },
  tituloPrincipal: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  busquedaContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  iconoBusqueda: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 15,
  },
  botonLimpiarInput: {
    padding: 5,
  },
  botonBuscar: {
    backgroundColor: 'rgba(255,107,107,0.3)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.5)',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonBuscar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  botonFiltros: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  textoBotonFiltros: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  filtroActivoBadge: {
    position: 'absolute',
    top: 5,
    right: 15,
    backgroundColor: '#FF6B6B',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtroActivoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sugerenciasContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
  },
  sugerenciaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sugerenciaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  sugerenciaInfo: {
    flex: 1,
  },
  sugerenciaNombre: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sugerenciaUsername: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  contenido: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  cargandoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 15,
    fontSize: 16,
  },
  resultadosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 10,
  },
  resultadosTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  limpiarTexto: {
    color: '#FF6B6B',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  resultadosLista: {
    paddingBottom: 30,
  },
  usuarioCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  usuarioHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  usuarioAvatarContainer: {
    position: 'relative',
  },
  usuarioAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  privadoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  usuarioInfo: {
    flex: 1,
    marginLeft: 15,
  },
  usuarioNombreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  usuarioNombre: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  rolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rolTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  usuarioUsername: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 8,
  },
  usuarioBio: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  usuarioStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  usuarioAcciones: {
    flexDirection: 'row',
    gap: 10,
  },
  botonAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  botonResultados: {
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderColor: 'rgba(255,107,107,0.5)',
  },
  botonPerfil: {
    backgroundColor: 'rgba(74,144,226,0.2)',
    borderColor: 'rgba(74,144,226,0.5)',
  },
  textoBotonAccion: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recientesContainer: {
    marginTop: 20,
  },
  recientesTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  recientesLista: {
    marginBottom: 20,
  },
  recienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recienteIcono: {
    marginRight: 15,
  },
  recienteInfo: {
    flex: 1,
  },
  recienteTermino: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  recienteFecha: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  vacioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vacioTitulo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  vacioSubtitulo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitulo: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 5,
  },
  filtroSeccion: {
    marginBottom: 25,
  },
  filtroTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  filtroOpciones: {
    gap: 10,
  },
  filtroOpcion: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filtroOpcionTexto: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  filtroAdvertencia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,206,86,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCE56',
    gap: 10,
  },
  filtroAdvertenciaTexto: {
    color: '#FFCE56',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  modalAcciones: {
    gap: 15,
    marginTop: 10,
  },
  modalBotonAplicar: {
    backgroundColor: 'rgba(255,107,107,0.3)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.5)',
  },
  modalBotonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBotonLimpiar: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBotonTextoLimpiar: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
});