import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SectionList } from 'react-native';
import { estilos } from '../estilos/styles';
import { apiService } from '../servicios/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PantallaResultados({ navigation, route }) {
  const { usuarioId, nombreUsuario } = route.params || {};
  const [resultadosTests, setResultadosTests] = useState([]);
  const [resultadosVocacionales, setResultadosVocacionales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarTests, setMostrarTests] = useState(true);
  const [mostrarVocacional, setMostrarVocacional] = useState(false);

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      setCargando(true);
      
      // Cargar resultados de tests normales
      const testsData = await apiService.obtenerHistorialTests(usuarioId);
      if (testsData.exito) {
        setResultadosTests(testsData.datos || testsData.historial || []);
      }

      // Cargar resultados vocacionales
      const vocacionalData = await apiService.obtenerResultadosVocacionales(usuarioId);
      if (vocacionalData.exito) {
        setResultadosVocacionales(vocacionalData.datos || vocacionalData.resultados || []);
      }

    } catch (error) {
      console.error('Error cargando resultados:', error);
      Alert.alert('Error', 'No se pudieron cargar los resultados');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fechaString) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaString;
    }
  };

  const obtenerNombreTest = (testId) => {
    const nombresTests = {
      1: 'Test de Inteligencia Emocional',
      2: 'Test de Habilidades Cognitivas',
      3: 'Test de Orientación Vocacional',
      4: 'Test de Personalidad',
      5: 'Test de Liderazgo',
      6: 'Test de Comunicación'
    };
    return nombresTests[testId] || `Test ${testId}`;
  };

  const renderResultadoTest = (item) => (
    <View key={item.id} style={{
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#4fc3f7'
    }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
        {obtenerNombreTest(item.test_id)}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
        <Text style={{ color: '#ccc' }}>Puntuación: <Text style={{ color: '#4fc3f7' }}>{item.puntuacion}%</Text></Text>
        <Text style={{ color: '#aaa', fontSize: 12 }}>{formatearFecha(item.fecha)}</Text>
      </View>
    </View>
  );

  const renderResultadoVocacional = (item) => (
    <View key={item.id} style={{
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#81c784'
    }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
        🔮 Resultado Vocacional
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
        <Text style={{ color: '#ccc' }}>Promedio: <Text style={{ color: '#81c784' }}>{item.promedio_general}%</Text></Text>
        <Text style={{ color: '#aaa', fontSize: 12 }}>{formatearFecha(item.fecha)}</Text>
      </View>
      <Text style={{ color: '#ccc', marginTop: 5 }}>
        Zona Ikigai: <Text style={{ color: '#ffb74d' }}>{item.zona_ikigai}</Text>
      </Text>
      
      {item.carreras && item.carreras.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>Top 3 carreras:</Text>
          {item.carreras.slice(0, 3).map((carrera, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <Text style={{ color: '#4fc3f7', marginRight: 5 }}>•</Text>
              <Text style={{ color: '#ccc', fontSize: 12 }}>{carrera.nombre || `Carrera ${idx+1}`}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (cargando) {
    return (
      <View style={[estilos.fondo, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#fff', marginTop: 20 }}>Cargando resultados...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.fondo}>
      <View style={estilos.contenedorPrincipal}>
        <Text style={estilos.titulo}>📊 Resultados de {nombreUsuario}</Text>
        
        {/* Tabs para switchear entre tipos de resultados */}
        <View style={{ 
          flexDirection: 'row', 
          marginVertical: 20,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: 5
        }}>
          <TouchableOpacity 
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: mostrarTests ? '#4fc3f7' : 'transparent',
              alignItems: 'center'
            }}
            onPress={() => {
              setMostrarTests(true);
              setMostrarVocacional(false);
            }}
          >
            <Text style={{ color: mostrarTests ? '#000' : '#fff' }}>
              Tests Normales ({resultadosTests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: mostrarVocacional ? '#81c784' : 'transparent',
              alignItems: 'center'
            }}
            onPress={() => {
              setMostrarVocacional(true);
              setMostrarTests(false);
            }}
          >
            <Text style={{ color: mostrarVocacional ? '#000' : '#fff' }}>
              Vocacional ({resultadosVocacionales.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mostrar resultados según tab seleccionado */}
        {mostrarTests && (
          <>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 15 }}>
              Tests Completados: {resultadosTests.length}
            </Text>
            {resultadosTests.length > 0 ? (
              resultadosTests.map(renderResultadoTest)
            ) : (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: '#aaa', fontSize: 16 }}>No hay resultados de tests aún</Text>
              </View>
            )}
          </>
        )}

        {mostrarVocacional && (
          <>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 15 }}>
              Resultados Vocacionales: {resultadosVocacionales.length}
            </Text>
            {resultadosVocacionales.length > 0 ? (
              resultadosVocacionales.map(renderResultadoVocacional)
            ) : (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: '#aaa', fontSize: 16 }}>No hay resultados vocacionales aún</Text>
              </View>
            )}
          </>
        )}

        {/* Botón para actualizar */}
        <TouchableOpacity 
          style={[estilos.botonChico, { marginTop: 20, alignSelf: 'center' }]}
          onPress={cargarResultados}
        >
          <Text style={estilos.textoBotonChico}>🔄 Actualizar resultados</Text>
        </TouchableOpacity>

        {/* Botón para regresar */}
        <TouchableOpacity 
          style={[estilos.botonChico, { 
            backgroundColor: '#454545ff', 
            marginTop: 10,
            alignSelf: 'center' 
          }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={estilos.textoBotonChico}>← Regresar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}