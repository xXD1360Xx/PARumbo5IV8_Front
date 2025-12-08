import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicioAPI } from '../servicios/api';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function PantallaResultados({ route, navigation }) {
  const { usuarioId, nombreUsuario } = route.params || {};
  
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [resultadosVocacional, setResultadosVocacional] = useState(null);
  const [resultadosTests, setResultadosTests] = useState([]);
  const [usuarioActualId, setUsuarioActualId] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState('vocacional');
  const [modalCarreraVisible, setModalCarreraVisible] = useState(false);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(null);

  const asegurarNumero = useCallback((valor, valorPorDefecto = 0) => {
    if (valor === null || valor === undefined) return valorPorDefecto;
    const numero = Number(valor);
    return isNaN(numero) ? valorPorDefecto : numero;
  }, []);

  // Datos de tests disponibles
  const testsDisponibles = [
    {
      id: 1,
      nombre: 'Matemáticas',
      descripcion: 'Pon a prueba tus conocimientos matemáticos resolviendo problemas prácticos.',
      tiempo: '20 min',
      icono: '🧮',
      completado: false
    },
    {
      id: 2,
      nombre: 'Medico-Biológicas',
      descripcion: 'Evalúa tus conocimientos de biología y ciencias médicas con ejercicios prácticos.',
      tiempo: '10 min',
      icono: '🧬',
      completado: false
    },
    {
      id: 3,
      nombre: 'Ingeniería y Tecnología',
      descripcion: 'Comprueba tu comprensión en conceptos de ingeniería y tecnología aplicados.',
      tiempo: '25 min',
      icono: '⚙️',
      completado: false
    },
    {
      id: 4,
      nombre: 'Sociales y Humanísticas',
      descripcion: 'Pon a prueba tus conocimientos en historia, geografía y ciencias sociales.',
      tiempo: '10 min',
      icono: '📚',
      completado: false
    },
    {
      id: 5,
      nombre: 'Artes y Diseño',
      descripcion: 'Evalúa tus conocimientos en artes y diseño mediante preguntas creativas.',
      tiempo: '10 min',
      icono: '🎨',
      completado: false
    },
    {
      id: 6,
      nombre: 'Económicas y Administrativas',
      descripcion: 'Mide tu comprensión en economía, administración y finanzas básicas.',
      tiempo: '10 min',
      icono: '📈',
      completado: false
    }
  ];

  // Obtener ID del usuario actual
  const obtenerUsuarioActual = useCallback(async () => {
    try {
      // 1. Intentar desde parámetros
      if (usuarioId) {
        setUsuarioActualId(usuarioId);
        return usuarioId;
      }
      
      // 2. Intentar desde token
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.id) {
            setUsuarioActualId(payload.id);
            return payload.id;
          }
        } catch (e) {
          console.log('⚠️ No se pudo decodificar token:', e.message);
        }
      }
      
      // 3. Intentar desde perfil
      const perfil = await servicioAPI.obtenerMiPerfil();
      if (perfil.exito && perfil.usuario?.id) {
        setUsuarioActualId(perfil.usuario.id);
        return perfil.usuario.id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return null;
    }
  }, [usuarioId]);

  // Cargar resultados vocacional
  const cargarVocacional = useCallback(async () => {
    try {
      const id = await obtenerUsuarioActual();
      console.log('🎓 Cargando resultados vocacional para ID:', id);
      
      if (!id) {
        console.log('⚠️ No se pudo obtener ID de usuario');
        setResultadosVocacional(null);
        return;
      }
      
      const respuesta = await servicioAPI.obtenerResultadosVocacionales();
      
      if (respuesta.exito && respuesta.data && Array.isArray(respuesta.data)) {
        const resultadosUsuario = respuesta.data.filter(item => 
          item.user_id === id || 
          item.usuario_id === id
        );
        
        if (resultadosUsuario.length > 0) {
          console.log(`✅ ${resultadosUsuario.length} resultados vocacionales encontrados`);
          
          const ultimoResultado = resultadosUsuario.sort((a, b) => 
            new Date(b.test_date || b.created_at || 0) - new Date(a.test_date || a.created_at || 0)
          )[0];
          
          // Parsear datos JSON
          try {
            if (ultimoResultado.resultados_completos && typeof ultimoResultado.resultados_completos === 'string') {
              ultimoResultado.resultados_completos = JSON.parse(ultimoResultado.resultados_completos);
            }
            if (ultimoResultado.top_carreras && typeof ultimoResultado.top_carreras === 'string') {
              ultimoResultado.top_carreras = JSON.parse(ultimoResultado.top_carreras);
            }
          } catch (e) {
            console.log('⚠️ Error parseando datos JSON:', e.message);
          }
          
          setResultadosVocacional(ultimoResultado);
        } else {
          console.log('ℹ️ No hay resultados vocacionales para este usuario');
          setResultadosVocacional(null);
        }
      } else {
        console.log('ℹ️ No hay resultados vocacionales disponibles');
        setResultadosVocacional(null);
      }
    } catch (error) {
      console.error('❌ Error cargando vocacional:', error);
      setResultadosVocacional(null);
    }
  }, [obtenerUsuarioActual]);

  // Cargar resultados de tests de conocimiento
  const cargarTestsConocimiento = useCallback(async () => {
    try {
      const id = await obtenerUsuarioActual();
      console.log('📚 Cargando tests de conocimiento para ID:', id);
      
      if (!id) {
        console.log('⚠️ No se pudo obtener ID de usuario');
        setResultadosTests(testsDisponibles.map(test => ({ ...test, completado: false })));
        return;
      }
      
      const respuesta = await servicioAPI.obtenerMisResultados();
      
      if (respuesta.exito && respuesta.data && Array.isArray(respuesta.data)) {
        const resultadosUsuario = respuesta.data.filter(item => 
          item.user_id === id || 
          item.usuario_id === id
        );
        
        console.log(`✅ ${resultadosUsuario.length} tests encontrados`);
        
        const testsActualizados = testsDisponibles.map(test => {
          const resultado = resultadosUsuario.find(r => 
            r.test_id === test.id || 
            r.nombre?.includes(test.nombre)
          );
          
          return {
            ...test,
            completado: !!resultado,
            puntuacion: resultado?.score || 0,
            fecha: resultado?.completed_at || resultado?.created_at,
            resultadoData: resultado
          };
        });
        
        setResultadosTests(testsActualizados);
      } else {
        console.log('ℹ️ No hay tests de conocimiento');
        setResultadosTests(testsDisponibles.map(test => ({ ...test, completado: false })));
      }
    } catch (error) {
      console.error('❌ Error cargando tests:', error);
      setResultadosTests(testsDisponibles.map(test => ({ ...test, completado: false })));
    }
  }, [obtenerUsuarioActual]);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    
    try {
      console.log('🔍 Cargando resultados...');
      
      const idUsuario = await obtenerUsuarioActual();
      
      if (!idUsuario) {
        Alert.alert('Error', 'No se pudo identificar al usuario');
        setCargando(false);
        return;
      }

      await Promise.all([
        cargarVocacional(),
        cargarTestsConocimiento()
      ]);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los resultados');
    } finally {
      setCargando(false);
    }
  }, [obtenerUsuarioActual, cargarVocacional, cargarTestsConocimiento]);

  // Cargar datos al inicio
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  // Refrescar
  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    await cargarDatos();
    setRefrescando(false);
  }, [cargarDatos]);

  // Ver información sobre tests
  const verInfoTests = () => {
    Alert.alert(
      'Realizar Tests',
      'Los tests están disponibles en la versión web de Rumbo. Visita rumbo.com para realizar tests vocacionales y de conocimiento.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  // Abrir detalles de carrera
  const abrirDetallesCarrera = (carrera) => {
    setCarreraSeleccionada(carrera);
    setModalCarreraVisible(true);
  };

  // Renderizar pestañas
  const renderPestañas = () => {
    return (
      <View style={styles.contenedorPestañas}>
        <TouchableOpacity
          style={[styles.pestaña, pestañaActiva === 'vocacional' && styles.pestañaActiva]}
          onPress={() => setPestañaActiva('vocacional')}
        >
          <Text style={[styles.textoPestaña, pestañaActiva === 'vocacional' && styles.textoPestañaActiva]}>
            🎓 Vocacional
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.pestaña, pestañaActiva === 'conocimiento' && styles.pestañaActiva]}
          onPress={() => setPestañaActiva('conocimiento')}
        >
          <Text style={[styles.textoPestaña, pestañaActiva === 'conocimiento' && styles.textoPestañaActiva]}>
            📚 Conocimiento
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Componente de barra de progreso
  const BarraProgreso = ({ porcentaje, color = '#ff3366' }) => {
    const ancho = Math.min(Math.max(porcentaje, 0), 100);
    
    return (
      <View style={styles.barraExterna}>
        <View 
          style={[
            styles.barraInterna,
            { 
              width: `${ancho}%`,
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    );
  };

  // Renderizar resultados vocacional
  const renderVocacional = () => {
    if (!resultadosVocacional) {
      return (
        <View style={styles.cardVacio}>
          <Text style={styles.textoVacio}>🎓</Text>
          <Text style={styles.tituloVacio}>No hay resultados vocacionales</Text>
          <Text style={styles.descripcionVacio}>
            Completa el test vocacional en la versión web para ver tus resultados
          </Text>
          <TouchableOpacity style={styles.botonAccion} onPress={verInfoTests}>
            <Text style={styles.textoBotonAccion}>Más información</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Perfiles con iconos y colores
    const perfiles = [
      { 
        nombre: 'Tecnológico', 
        valor: asegurarNumero(resultadosVocacional.perfil_tecnologico), 
        icono: '💻',
        color: '#4A90E2'
      },
      { 
        nombre: 'Científico', 
        valor: asegurarNumero(resultadosVocacional.perfil_cientifico), 
        icono: '🔬',
        color: '#50E3C2'
      },
      { 
        nombre: 'Salud', 
        valor: asegurarNumero(resultadosVocacional.perfil_salud), 
        icono: '🏥',
        color: '#FF6B6B'
      },
      { 
        nombre: 'Administrativo', 
        valor: asegurarNumero(resultadosVocacional.perfil_administrativo), 
        icono: '📈',
        color: '#FFCE56'
      },
      { 
        nombre: 'Social', 
        valor: asegurarNumero(resultadosVocacional.perfil_social), 
        icono: '🤝',
        color: '#9B59B6'
      }
    ];

    // Obtener top carreras desde resultados_completos
    let topCarreras = [];
    try {
      if (resultadosVocacional.resultados_completos && Array.isArray(resultadosVocacional.resultados_completos)) {
        topCarreras = resultadosVocacional.resultados_completos
          .sort((a, b) => (b.puntuacion || 0) - (a.puntuacion || 0))
          .slice(0, 5); // Top 5 carreras
      }
    } catch (e) {
      console.log('⚠️ Error obteniendo top carreras:', e);
    }

    return (
      <ScrollView 
        style={styles.contenidoPestaña} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        {/* Encabezado */}
        <View style={styles.seccionVocacional}>
          <Text style={styles.tituloSeccion}>Test Vocacional</Text>
          <Text style={styles.descripcionVocacional}>
            Descubre tu perfil ideal y carreras recomendadas, así como tu Ikigai.
          </Text>
          
          {/* Perfiles vocacionales - VERTICAL */}
          <View style={styles.perfilesContainerVertical}>
            {perfiles.map((perfil, index) => {
              const porcentaje = asegurarNumero(perfil.valor, 0);
              
              return (
                <View key={index} style={styles.perfilCardVertical}>
                  <View style={styles.perfilHeader}>
                    <Text style={styles.perfilIcono}>{perfil.icono}</Text>
                    <View style={styles.perfilInfo}>
                      <Text style={styles.perfilNombre}>{perfil.nombre}</Text>
                      <Text style={[styles.perfilPorcentaje, { color: perfil.color }]}>
                        {porcentaje.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  
                  {/* Barra de progreso */}
                  <View style={styles.barraContainer}>
                    <BarraProgreso 
                      porcentaje={porcentaje} 
                      color={perfil.color}
                    />
                    <View style={styles.escalaContainer}>
                      <Text style={styles.escalaText}>0%</Text>
                      <Text style={styles.escalaText}>100%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Top 5 Carreras Recomendadas */}
          <View style={styles.topCarrerasContainer}>
            <Text style={styles.tituloTopCarreras}>Top 5 Carreras Recomendadas</Text>
            
            {topCarreras.length > 0 ? (
              topCarreras.map((carrera, index) => {
                const puntuacionTotal = carrera.puntuacion || 0;
                const scores = carrera.scores || {};
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.carreraCardTop}
                    onPress={() => abrirDetallesCarrera(carrera)}
                  >
                    <View style={styles.carreraHeaderTop}>
                      <View style={styles.posicionContainer}>
                        <Text style={styles.posicionText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.carreraInfoTop}>
                        <Text style={styles.carreraNombreTop}>
                          {carrera.nombre || `Carrera ${index + 1}`}
                        </Text>
                        <Text style={styles.carreraPuntuacion}>
                          {puntuacionTotal.toFixed(0)} pts
                        </Text>
                      </View>
                    </View>
                    
                    {/* Scores individuales */}
                    <View style={styles.scoresContainer}>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>❤️ Pasión</Text>
                        <Text style={styles.scoreValue}>
                          {scores.pasion ? `${scores.pasion}%` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>🎓 Vocación</Text>
                        <Text style={styles.scoreValue}>
                          {scores.vocacion ? `${scores.vocacion}%` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>💼 Profesión</Text>
                        <Text style={styles.scoreValue}>
                          {scores.profesion ? `${scores.profesion}%` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>🌍 Misión</Text>
                        <Text style={styles.scoreValue}>
                          {scores.mision ? `${scores.mision}%` : 'N/A'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Zona Ikigai */}
                    {carrera.zona_ikigai && (
                      <View style={styles.ikigaiBadge}>
                        <Text style={styles.ikigaiText}>
                          {carrera.zona_ikigai.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.sinCarreras}>
                <Text style={styles.sinCarrerasText}>No hay carreras recomendadas disponibles</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.botonRealizarTest} onPress={verInfoTests}>
              <Text style={styles.textoBotonRealizarTest}>Realizar Nuevo Test Vocacional</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Renderizar gráfica de radar para conocimiento
  const renderGraficaRadar = () => {
    const categorias = [
      'Matemáticas',
      'Medico-Biológicas', 
      'Ingeniería y Tecnología',
      'Sociales y Humanísticas',
      'Artes y Diseño',
      'Económicas y Administrativas'
    ];

    // Obtener valores de los tests
    const valores = testsDisponibles.map(test => {
      const testResultado = resultadosTests.find(t => t.id === test.id);
      return testResultado?.completado ? asegurarNumero(testResultado.puntuacion, 0) : 0;
    });

    // Radio de la gráfica (más grande)
    const radio = 120;
    const centroX = 150;
    const centroY = 150;

    // Colores para los porcentajes
    const coloresPorcentaje = ['#4A90E2', '#50E3C2', '#FFCE56', '#FF6B6B', '#9B59B6'];

    return (
      <View style={styles.graficaContainer}>
        <Text style={styles.tituloGrafica}>Tus resultados de conocimiento</Text>
        <Text style={styles.subtituloGrafica}>
          Cada vértice representa un área de conocimiento. Completa más tests para mejorar tu perfil.
        </Text>
        
        <View style={styles.graficaRadarWrapper}>
          <View style={styles.graficaRadar}>
            {/* Círculos concéntricos con porcentajes */}
            {[0, 20, 40, 60, 80, 100].map((porcentaje, index) => {
              const radioCirculo = (porcentaje / 100) * radio;
              const esExterno = porcentaje === 100;
              
              return (
                <View key={porcentaje}>
                  {/* Círculo */}
                  <View style={[
                    styles.circuloRadar,
                    { 
                      width: radioCirculo * 2,
                      height: radioCirculo * 2,
                      borderColor: esExterno ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                      left: centroX - radioCirculo,
                      top: centroY - radioCirculo,
                    }
                  ]} />
                  
                  {/* Etiqueta de porcentaje (solo en algunos ejes) */}
                  {porcentaje > 0 && porcentaje % 20 === 0 && (
                    <Text style={[
                      styles.porcentajeLabel,
                      {
                        left: centroX - 15,
                        top: centroY - radioCirculo - 20,
                        color: esExterno ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        fontSize: esExterno ? 12 : 10
                      }
                    ]}>
                      {porcentaje}%
                    </Text>
                  )}
                </View>
              );
            })}
            
            {/* Ejes radiales (6 ejes) */}
            {categorias.map((categoria, index) => {
              const angulo = (index * 60) * (Math.PI / 180); // 60 grados cada eje
              const x = radio * Math.cos(angulo) + centroX;
              const y = radio * Math.sin(angulo) + centroY;
              
              return (
                <View key={index} style={styles.ejeContainer}>
                  {/* Línea del eje */}
                  <View style={[
                    styles.ejeLinea,
                    {
                      width: radio,
                      transform: [
                        { translateX: centroX },
                        { translateY: centroY },
                        { rotate: `${index * 60}deg` }
                      ]
                    }
                  ]} />
                  
                  {/* Etiqueta de categoría */}
                  <Text style={[
                    styles.categoriaLabel,
                    {
                      left: x + (Math.cos(angulo) * 25),
                      top: y + (Math.sin(angulo) * 25),
                      transform: [
                        { translateX: -50 },
                        { translateY: -10 }
                      ]
                    }
                  ]}>
                    {categoria.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
            
            {/* Línea que forma el hexágono con los resultados */}
            {valores.some(v => v > 0) && (
              <View style={styles.poligonoContainer}>
                {valores.map((valor, index) => {
                  const angulo = (index * 60) * (Math.PI / 180);
                  const radioValor = (valor / 100) * radio;
                  const x = radioValor * Math.cos(angulo) + centroX;
                  const y = radioValor * Math.sin(angulo) + centroY;
                  
                  return (
                    <View key={index}>
                      {/* Punto del valor */}
                      <View style={[
                        styles.puntoValor,
                        {
                          left: x - 6,
                          top: y - 6,
                          backgroundColor: coloresPorcentaje[index % coloresPorcentaje.length],
                          opacity: valor > 0 ? 1 : 0
                        }
                      ]} />
                      
                      {/* Valor numérico */}
                      {valor > 0 && (
                        <Text style={[
                          styles.valorLabel,
                          {
                            left: x + (Math.cos(angulo) * 15),
                            top: y + (Math.sin(angulo) * 15),
                            color: coloresPorcentaje[index % coloresPorcentaje.length]
                          }
                        ]}>
                          {valor}%
                        </Text>
                      )}
                    </View>
                  );
                })}
                
                {/* Dibujar líneas entre los puntos */}
                <View style={styles.poligonoLineas}>
                  {valores.map((valor, index) => {
                    const anguloActual = (index * 60) * (Math.PI / 180);
                    const anguloSiguiente = ((index + 1) % 6 * 60) * (Math.PI / 180);
                    
                    const radioActual = (valor / 100) * radio;
                    const radioSiguiente = (valores[(index + 1) % 6] / 100) * radio;
                    
                    const x1 = radioActual * Math.cos(anguloActual) + centroX;
                    const y1 = radioActual * Math.sin(anguloActual) + centroY;
                    const x2 = radioSiguiente * Math.cos(anguloSiguiente) + centroX;
                    const y2 = radioSiguiente * Math.sin(anguloSiguiente) + centroY;
                    
                    // Calcular distancia y ángulo de la línea
                    const distancia = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    const anguloLinea = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                    
                    if (distancia > 0) {
                      return (
                        <View
                          key={`linea-${index}`}
                          style={[
                            styles.lineaPoligono,
                            {
                              width: distancia,
                              left: x1,
                              top: y1,
                              transform: [
                                { rotate: `${anguloLinea}deg` }
                              ],
                              opacity: valor > 0 || valores[(index + 1) % 6] > 0 ? 0.7 : 0
                            }
                          ]}
                        />
                      );
                    }
                    return null;
                  })}
                </View>
              </View>
            )}
          </View>
          
          {/* Leyenda de colores */}
          <View style={styles.leyendaContainer}>
            <Text style={styles.leyendaTitulo}>Áreas de Conocimiento:</Text>
            <View style={styles.leyendaItems}>
              {categorias.map((cat, index) => {
                const testResultado = resultadosTests.find(t => t.id === index + 1);
                const completado = testResultado?.completado || false;
                
                return (
                  <View key={index} style={styles.leyendaItem}>
                    <View style={[
                      styles.leyendaColor,
                      { backgroundColor: coloresPorcentaje[index % coloresPorcentaje.length] }
                    ]} />
                    <Text style={[
                      styles.leyendaText,
                      completado ? styles.leyendaTextCompletado : styles.leyendaTextPendiente
                    ]}>
                      {cat.split(' ')[0]}
                      {completado && ` (${testResultado.puntuacion}%)`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Renderizar tests de conocimiento
  const renderConocimiento = () => {
    return (
      <ScrollView 
        style={styles.contenidoPestaña} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        {/* Gráfica de radar */}
        {renderGraficaRadar()}
        
        {/* Lista de tests */}
        <View style={styles.seccionTests}>
          <Text style={styles.tituloSeccion}>Tests de Conocimiento</Text>
          <Text style={styles.descripcionSeccion}>
            Elige un área y mide tus conocimientos de manera rápida y divertida.
          </Text>
          
          {resultadosTests.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testIcono}>{test.icono}</Text>
                <View style={styles.testInfo}>
                  <Text style={styles.testNombre}>{test.nombre}</Text>
                  <Text style={styles.testDescripcion}>{test.descripcion}</Text>
                  <View style={styles.testDetalles}>
                    <Text style={styles.testTiempo}>⏱️ {test.tiempo}</Text>
                    {test.completado && test.fecha && (
                      <Text style={styles.testFecha}>
                        📅 {new Date(test.fecha).toLocaleDateString('es-ES')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              
              <View style={styles.testFooter}>
                {test.completado ? (
                  <>
                    <View style={styles.testCompletadoBadge}>
                      <Text style={styles.testCompletadoTexto}>✅ Completado</Text>
                    </View>
                    {test.puntuacion > 0 && (
                      <View style={styles.puntuacionContainer}>
                        <Text style={styles.puntuacionLabel}>Puntuación:</Text>
                        <Text style={styles.puntuacionValor}>
                          {test.puntuacion}%
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.testPendienteBadge}>
                    <Text style={styles.testPendienteTexto}>⏳ Pendiente</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.botonRealizarTest} onPress={verInfoTests}>
            <Text style={styles.textoBotonRealizarTest}>Ver más información sobre tests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // Modal de detalles de carrera
  const renderModalCarrera = () => {
    if (!carreraSeleccionada) return null;

    const scores = carreraSeleccionada.scores || {};

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCarreraVisible}
        onRequestClose={() => setModalCarreraVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#000000', '#8a003a', '#000000']}
            style={styles.modalContent}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>{carreraSeleccionada.nombre}</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setModalCarreraVisible(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* Puntuación total */}
              <View style={styles.modalScoreTotal}>
                <Text style={styles.modalScoreTotalLabel}>Puntuación Total:</Text>
                <Text style={styles.modalScoreTotalValue}>
                  {carreraSeleccionada.puntuacion ? carreraSeleccionada.puntuacion.toFixed(0) : 0} pts
                </Text>
              </View>
              
              {/* Scores individuales */}
              <View style={styles.modalScoresGrid}>
                {Object.entries(scores).map(([key, value]) => {
                  const iconos = {
                    pasion: '❤️',
                    vocacion: '🎓',
                    profesion: '💼',
                    mision: '🌍'
                  };
                  
                  const labels = {
                    pasion: 'Pasión',
                    vocacion: 'Vocación',
                    profesion: 'Profesión',
                    mision: 'Misión'
                  };
                  
                  return (
                    <View key={key} style={styles.modalScoreItem}>
                      <Text style={styles.modalScoreIcon}>{iconos[key] || '📊'}</Text>
                      <Text style={styles.modalScoreLabel}>{labels[key] || key}</Text>
                      <Text style={styles.modalScoreValue}>{value}%</Text>
                      <BarraProgreso 
                        porcentaje={value} 
                        color="#ff3366"
                      />
                    </View>
                  );
                })}
              </View>
              
              {/* Zona Ikigai */}
              {carreraSeleccionada.zona_ikigai && (
                <View style={styles.modalIkigaiSection}>
                  <Text style={styles.modalSectionTitle}>Zona Ikigai:</Text>
                  <View style={styles.ikigaiZonaBadge}>
                    <Text style={styles.ikigaiZonaText}>
                      {carreraSeleccionada.zona_ikigai.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text style={styles.modalSectionDescription}>
                    Esta carrera se alinea con tu {carreraSeleccionada.zona_ikigai.toLowerCase().replace(/_/g, ' ')}. 
                    Esto significa que combina tus pasiones, talentos, necesidades del mundo y lo que te pueden pagar.
                  </Text>
                </View>
              )}
              
              {/* Información adicional */}
              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>Sobre esta carrera:</Text>
                <Text style={styles.modalInfoText}>
                  • Se recomienda basado en tu perfil vocacional y resultados de tests{'\n'}
                  • Considera investigar más sobre el plan de estudios{'\n'}
                  • Explora las oportunidades laborales en esta área{'\n'}
                  • Visita ferias universitarias para conocer más detalles
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.modalBotonCerrar}
                onPress={() => setModalCarreraVisible(false)}
              >
                <Text style={styles.modalBotonCerrarTexto}>Cerrar detalles</Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  if (cargando) {
    return (
      <LinearGradient 
        colors={['#000000', '#8a003a', '#000000']}
        style={styles.fondo}
      >
        <SafeAreaView style={styles.centrado}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.textoCargando}>Cargando resultados...</Text>
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
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <Text style={styles.tituloPrincipal}>
            {nombreUsuario ? `Resultados de ${nombreUsuario}` : 'Mis Resultados'}
          </Text>
          <Text style={styles.subtitulo}>
            {pestañaActiva === 'vocacional' 
              ? (resultadosVocacional ? 'Test vocacional completado' : 'Test vocacional pendiente')
              : `${resultadosTests.filter(t => t.completado).length} de 6 tests completados`
            }
          </Text>
        </View>

        {/* Pestañas */}
        {renderPestañas()}

        {/* Contenido de la pestaña activa */}
        {pestañaActiva === 'vocacional' ? renderVocacional() : renderConocimiento()}

        {/* Modal de detalles de carrera */}
        {renderModalCarrera()}
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
  // Pestañas
  contenedorPestañas: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  pestaña: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pestañaActiva: {
    borderBottomColor: '#ff3366',
  },
  textoPestaña: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  textoPestañaActiva: {
    color: '#ffffff',
  },
  contenidoPestaña: {
    flex: 1,
  },
  // Vocacional - Perfiles Verticales
  seccionVocacional: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  tituloSeccion: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  descripcionVocacional: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  perfilesContainerVertical: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  perfilCardVertical: {
    marginBottom: 20,
  },
  perfilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  perfilIcono: {
    fontSize: 24,
    marginRight: 12,
  },
  perfilInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfilNombre: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  perfilPorcentaje: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  barraContainer: {
    marginTop: 5,
  },
  barraExterna: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barraInterna: {
    height: '100%',
    borderRadius: 4,
  },
  escalaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  escalaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  // Top Carreras
  topCarrerasContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  tituloTopCarreras: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  carreraCardTop: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  carreraHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  posicionContainer: {
    backgroundColor: '#ff3366',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  posicionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carreraInfoTop: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carreraNombreTop: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  carreraPuntuacion: {
    color: '#ff3366',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  ikigaiBadge: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 1,
    borderColor: '#ff3366',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  ikigaiText: {
    color: '#ff3366',
    fontSize: 11,
    fontWeight: '500',
  },
  sinCarreras: {
    padding: 20,
    alignItems: 'center',
  },
  sinCarrerasText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  // Conocimiento - Gráfica Radar
  graficaContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
  },
  tituloGrafica: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtituloGrafica: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  graficaRadarWrapper: {
    alignItems: 'center',
  },
  graficaRadar: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  circuloRadar: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
  },
  porcentajeLabel: {
    position: 'absolute',
    fontWeight: '500',
  },
  ejeContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  ejeLinea: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  categoriaLabel: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    width: 100,
  },
  poligonoContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  puntoValor: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 10,
  },
  valorLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    zIndex: 10,
  },
  poligonoLineas: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  lineaPoligono: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#ff3366',
    opacity: 0.7,
  },
  leyendaContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    width: '100%',
  },
  leyendaTitulo: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  leyendaItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  leyendaItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  leyendaColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  leyendaText: {
    fontSize: 12,
  },
  leyendaTextCompletado: {
    color: '#ffffff',
    fontWeight: '600',
  },
  leyendaTextPendiente: {
    color: 'rgba(255,255,255,0.5)',
  },
  // Tests de Conocimiento
  seccionTests: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  descripcionSeccion: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  testCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  testIcono: {
    fontSize: 28,
    marginRight: 15,
  },
  testInfo: {
    flex: 1,
  },
  testNombre: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  testDescripcion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  testDetalles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testTiempo: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginRight: 15,
  },
  testFecha: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  testFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testCompletadoBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00C853',
  },
  testCompletadoTexto: {
    color: '#00C853',
    fontSize: 12,
    fontWeight: '500',
  },
  puntuacionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  puntuacionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginRight: 6,
  },
  puntuacionValor: {
    color: '#ff3366',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testPendienteBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  testPendienteTexto: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '500',
  },
  // Cards vacías
  cardVacio: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  textoVacio: {
    fontSize: 60,
    marginBottom: 15,
  },
  tituloVacio: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  descripcionVacio: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 14,
    lineHeight: 20,
  },
  // Botones
  botonAccion: {
    backgroundColor: 'rgba(255,51,102,0.2)',
    borderWidth: 1,
    borderColor: '#ff3366',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  textoBotonAccion: {
    color: '#ff3366',
    fontSize: 14,
    fontWeight: '600',
  },
  botonRealizarTest: {
    backgroundColor: 'rgba(255,51,102,0.2)',
    borderWidth: 1,
    borderColor: '#ff3366',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBotonRealizarTest: {
    color: '#ff3366',
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitulo: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    lineHeight: 30,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScoreTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,51,102,0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalScoreTotalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  modalScoreTotalValue: {
    color: '#ff3366',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalScoreItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalScoreIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modalScoreLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 6,
  },
  modalScoreValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalIkigaiSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    color: '#ff3366',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  ikigaiZonaBadge: {
    backgroundColor: 'rgba(255,51,102,0.2)',
    borderWidth: 1,
    borderColor: '#ff3366',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  ikigaiZonaText: {
    color: '#ff3366',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSectionDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalInfoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 22,
  },
  modalBotonCerrar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalBotonCerrarTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});