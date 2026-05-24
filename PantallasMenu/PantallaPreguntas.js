// PantallaPreguntas.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const FAQ_DATA = [
  {
    id: 'tests',
    titulo: '📋 Tests y Resultados',
    items: [
      {
        pregunta: '¿Puedo repetir el test vocacional?',
        respuesta: 'Sí, puedes reiniciar el test en cualquier momento desde la página del test. Tu resultado anterior se reemplazará con el nuevo.',
      },
      {
        pregunta: '¿Qué significa mi zona Ikigai?',
        respuesta: 'Es la intersección entre lo que amas, lo que haces bien, lo que el mundo necesita y por lo que te pueden pagar. Un propósito fuerte significa alta alineación en los 4 pilares.',
      },
      {
        pregunta: '¿Mis resultados son definitivos?',
        respuesta: 'No, son una orientación basada en tus respuestas actuales. Puedes retomar el test cuando sientas que tus intereses han cambiado. Los resultados evolucionan contigo.',
      },
      {
        pregunta: '¿Por qué me salen carreras que no esperaba?',
        respuesta: 'El algoritmo considera los 4 pilares del Ikigai, no solo tus materias favoritas. Una carrera puede aparecer por su impacto social o empleabilidad aunque no sea tu primera intuición.',
      },
    ],
  },
  {
    id: 'perfil',
    titulo: '🔒 Perfil y privacidad',
    items: [
      {
        pregunta: '¿Qué pasa si pongo mi perfil en privado?',
        respuesta: 'Tu actividad, publicaciones y resultados solo serán visibles para ti. Nadie más podrá ver tu información.',
      },
      {
        pregunta: '¿Puedo cambiar mi nombre de usuario?',
        respuesta: 'Sí puedes cambiar tu nombre cuantas veces quieras.',
      },
      {
        pregunta: '¿Cómo cambio mi foto de perfil?',
        respuesta: 'Ve a Perfil → Editar → Fotos de perfil y haz clic en el ícono de cámara. Desde ahí puedes subir o cambiar tu foto.',
      },
      {
        pregunta: '¿Cómo cambio mi foto de banner?',
        respuesta: 'Ve a Perfil → Editar → Fotos de perfil y haz clic en el ícono de cámara. Desde ahí puedes subir o cambiar tu banner.',
      },
    ],
  },
  {
    id: 'feed',
    titulo: '📰 Feed y publicaciones',
    items: [
      {
        pregunta: '¿Por qué mi publicación no aparece de inmediato?',
        respuesta: 'Las publicaciones pasan por un proceso de moderación automática antes de ser visibles para la comunidad. Esto suele tardar unos minutos.',
      },
      {
        pregunta: '¿Cómo reporto una publicación?',
        respuesta: 'Haz clic en el ícono de la bandera para enviar el reporte. Nuestro equipo revisará el reporte.',
      },
      {
        pregunta: '¿Qué puedo publicar?',
        respuesta: 'Contenido relacionado con orientación vocacional, experiencias académicas, consejos y reflexiones sobre carreras. No se permite contenido fuera de este ámbito.',
      },
    ],
  },
  {
    id: 'carreras',
    titulo: '🎓 Carreras recomendadas',
    items: [
      {
        pregunta: '¿De dónde vienen las carreras recomendadas?',
        respuesta: 'El catálogo está basado en las carreras del Instituto Politécnico Nacional (IPN), una de las instituciones educativas más importantes de México.',
      },
      {
        pregunta: '¿Las recomendaciones son exactas?',
        respuesta: 'Las carreras sugeridas se basan en áreas de afinidad general (tecnológica, científica, social, etc.) más que en una carrera específica. Son un punto de partida para explorar, no una decisión definitiva.',
      },
      {
        pregunta: '¿Habrá más tests?',
        respuesta: 'Sí, estamos trabajando en tests más específicos por área para darte recomendaciones más precisas. Mantente al tanto de las actualizaciones de la plataforma.',
      },
    ],
  },
  {
    id: 'foros',
    titulo: '💬 Foros',
    items: [
      {
        pregunta: '¿Cómo me puedo unir a un Foro?',
        respuesta: 'Ve a Explorar y aparecerá una pestaña donde estarán todos los foros, presiona el botón “unirse”.',
      },
      {
        pregunta: '¿Cómo puedo salir de un Foro?',
        respuesta: 'Ve al foro al cual quieres salir y presiona el botón “unido”, así te saldrás del Foro.',
      },
      {
        pregunta: '¿Cómo puedo crear un foro?',
        respuesta: 'Ve a explorar → solicitar un foro y rellena los espacios con la información solicitada, después presiona en enviar solicitud. El equipo revisará tu solicitud; si el foro cumple con los requerimientos se publicará.',
      },
      {
        pregunta: '¿A cuántos foros puedo unirme?',
        respuesta: 'Puedes unirte a una cantidad ilimitada de foros.',
      },
      {
        pregunta: '¿Cuántos Foros puedo crear?',
        respuesta: 'Puedes solicitar la cantidad de foros ilimitados siempre y cuando cumplan con los requerimientos; serán aprobados.',
      },
    ],
  },
];

export default function PantallaPreguntas({ navigation }) {
  // Estado para controlar qué pregunta está expandida.
  // Usamos un Map con clave "categoriaId-preguntaIndex"
  const [expandedIds, setExpandedIds] = useState(new Set());

  const togglePregunta = (categoriaId, preguntaIndex) => {
    const key = `${categoriaId}-${preguntaIndex}`;
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedIds(newExpanded);
  };

  const renderPregunta = (categoria, item, idx) => {
    const key = `${categoria.id}-${idx}`;
    const isExpanded = expandedIds.has(key);

    return (
      <View key={key} style={styles.preguntaContainer}>
        <TouchableOpacity
          style={styles.preguntaBoton}
          onPress={() => togglePregunta(categoria.id, idx)}
          activeOpacity={0.7}
        >
          <Text style={styles.preguntaTexto}>{item.pregunta}</Text>
          <Text style={styles.icono}>{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.respuestaContainer}>
            <Text style={styles.respuestaTexto}>{item.respuesta}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#8a003a', '#000000']} style={styles.fondo}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preguntas frecuentes</Text>
          <View style={{ width: 40 }} /> {/* Espaciador para centrar el título */}
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {FAQ_DATA.map((categoria) => (
            <View key={categoria.id} style={styles.categoriaContainer}>
              <LinearGradient
                colors={['rgba(255,51,102,0.2)', 'rgba(255,51,102,0.05)']}
                style={styles.categoriaHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.categoriaTitulo}>{categoria.titulo}</Text>
              </LinearGradient>
              <View style={styles.preguntasLista}>
                {categoria.items.map((item, idx) => renderPregunta(categoria, item, idx))}
              </View>
            </View>
          ))}
          {/* Mensaje de contacto al final */}
          <View style={styles.contactoContainer}>
            <Text style={styles.contactoTexto}>
              ¿No encontraste lo que buscabas?{' '}
              <Text style={styles.contactoLink} onPress={() => {/* Aquí puedes abrir un chat o email */}}>
                Contáctanos
              </Text>
            </Text>
            <Text style={styles.disclaimer}>
              * Este asistente responde solo con la información de este documento.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  categoriaContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoriaHeader: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  categoriaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffcc00',
    letterSpacing: 0.5,
  },
  preguntasLista: {
    paddingHorizontal: 4,
  },
  preguntaContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  preguntaBoton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  preguntaTexto: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    paddingRight: 12,
    lineHeight: 20,
  },
  icono: {
    fontSize: 14,
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  respuestaContainer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  respuestaTexto: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  contactoContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    alignItems: 'center',
  },
  contactoTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  contactoLink: {
    color: '#ffcc00',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 10,
    textAlign: 'center',
  },
});