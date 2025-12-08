import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
const { width } = Dimensions.get('window');

const escalaWeb = Platform.OS === 'web' ? 0.83 : 1;

export const estilos = StyleSheet.create({
  // FONDO
  fondo: { 
    flex: 1 
  },

  // CONTENEDOR PRINCIPAL - SIN OSCURIDAD EXTRA
  contenedorPrincipal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight || 30,
    paddingBottom: 20,
    width: Platform.OS === 'web' ? 360 * escalaWeb : width * 0.9,
    maxWidth: 450,
    alignSelf: 'center',
    paddingHorizontal: 20 * escalaWeb,
    paddingVertical: 25 * escalaWeb,
    marginVertical: Platform.OS === 'web' ? '2%' : 0,
  },

  // TÍTULOS SIMPLES
  titulo: {
    fontSize: 36 * escalaWeb,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8 * escalaWeb,
    textAlign: 'center',
  },

  subtitulo: {
    fontSize: 14 * escalaWeb,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30 * escalaWeb,
    textAlign: 'center',
    paddingHorizontal: 10 * escalaWeb,
  },

  // INPUTS - MÁS OSCURO
  contenedorInput: {
    width: '100%',
    height: 55 * escalaWeb,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10 * escalaWeb,
    paddingHorizontal: 18 * escalaWeb,
    marginBottom: 18 * escalaWeb,
    borderWidth: 1,
    borderColor: 'rgba(100, 0, 40, 0.5)',
    color: '#ffffff',
    fontSize: 16 * escalaWeb,
  },

  // BOTÓN PRINCIPAL - MÁS OSCURO
  botonGrande: {
    width: '100%',
    height: 55 * escalaWeb,
    backgroundColor: '#6a002a',
    borderRadius: 10 * escalaWeb,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10 * escalaWeb,
    shadowColor: '#cc3a6d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },

  textoBotonGrande: {
    fontSize: 18 * escalaWeb,
    color: '#ffffff',
    fontWeight: '600',
  },

  // ENLACES - MÁS OSCUROS
  contenedorEnlaces: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20 * escalaWeb,
    gap: 12 * escalaWeb,
  },

  enlace: {
    color: '#cc3a6d',
    fontSize: 15 * escalaWeb,
    fontWeight: '500',
  },

  // SEPARADOR
  separador: {
    width: '85%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 30 * escalaWeb,
    marginBottom: 20 * escalaWeb,
  },

  // GOOGLE
  subtituloInferior: {
    fontSize: 14 * escalaWeb,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15 * escalaWeb,
    textAlign: 'center',
  },

  contenedorRedes: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25 * escalaWeb,
  },

  botonRed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 250 * escalaWeb,
    height: 50 * escalaWeb,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10 * escalaWeb,
    paddingHorizontal: 20 * escalaWeb,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  iconoRed: {
    width: 22 * escalaWeb,
    height: 22 * escalaWeb,
    marginRight: 12 * escalaWeb,
  },

  textoBotonRed: {
    fontSize: 16 * escalaWeb,
    fontWeight: '500',
    color: '#333',
  },

  // LOADING - MÁS OSCURO
  contenedorCargando: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  textoCargando: {
    color: '#cc3a6d',
    fontSize: 16 * escalaWeb,
    fontWeight: '500',
    marginTop: 15 * escalaWeb,
  },

  // FOOTER SIMPLE
  footer: {
    marginTop: 20 * escalaWeb,
    alignItems: 'center',
  },

  textoFooter: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12 * escalaWeb,
  },

  // ESTADO DESHABILITADO
  botonDeshabilitado: {
    backgroundColor: 'rgba(80, 80, 80, 0.7)',
    opacity: 0.7,
  },

  // OTROS (para otras pantallas)
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },

  botonChico: {
    width: 150 * escalaWeb,
    height: 50 * escalaWeb,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#6a002a',
    borderRadius: 10 * escalaWeb,
  },

  textoBotonChico: {
    fontSize: 20 * escalaWeb,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});