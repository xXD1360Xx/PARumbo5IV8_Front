import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
const { width } = Dimensions.get('window');

const escalaWeb = Platform.OS === 'web' ? 0.83 : 1;

export const estilos = StyleSheet.create({
  fondo: { flex: 1 },


  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffffff", 
    marginBottom: 10,
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 11,
    color: "#ffffffff", 
    marginBottom: 30,
    textAlign: "center",
  },

  contenedorPrincipal: {
    flex: 1,
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 20,
    width: Platform.OS === 'web' ? 330 * escalaWeb : width,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
    padding: 12 * escalaWeb,
    marginVertical: Platform.OS === 'web' ? '1%' : 0,
  },

  contenedorInput: {
    width: '100%',
    minHeight: 80 * escalaWeb,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20 * escalaWeb,
    paddingVertical: 5 * escalaWeb,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10 * escalaWeb,
    marginBottom: 30 * escalaWeb,
  },

  contenedorBotones: {
    flexDirection: 'row',      
    justifyContent: 'center',   
    alignItems: 'center',       
    gap: 10,                    
    marginTop: 20,
  },

  botonGrande: {
    width: 295 * escalaWeb,
    height: 60 * escalaWeb,
    justifyContent: 'center',
    alignItems: 'center',    
    backgroundColor: "#8a003a",    
    borderRadius: 30 * escalaWeb,
    boxShadow: '1px 1px 15px rgba(255, 77, 136, 0.5)',
  },

    textoBotonGrande: {
    fontSize: 30 * escalaWeb,
    color: '#ffffffff',
    fontWeight: 'bold',
    },

  botonChico: {
    width: 150 * escalaWeb,
    height: 50 * escalaWeb,
    justifyContent: 'center',
    alignItems: 'center',  
    flexDirection: 'row',      
    backgroundColor: "#8a003a",    
    borderRadius: 30 * escalaWeb,
    boxShadow: '1px 1px 15px rgba(255, 77, 136, 0.5)',
  },

    textoBotonChico: {
    fontSize: 20 * escalaWeb,
    color: '#ffffffff',
    fontWeight: 'bold', 
    textAlign: 'center',  
  },

  enlace: {
    color: '#0055ff',
    textAlign: 'center',
    marginTop: 8 * escalaWeb,
    fontSize: 15 * escalaWeb,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  subtituloInferior: {
    fontSize: 16 * escalaWeb,
    color: "#ffffffff",
    marginBottom: 8 * escalaWeb,
    textAlign: "center",
  },

  subtituloRol: {
    fontSize: 14,
    color: "#000000ff", 
    marginBottom: 15,
    textAlign: "center",
  },

  separador: {
    width: '85%',
    height: 1,
    backgroundColor: '#fff',
    marginVertical: 12 * escalaWeb,
    opacity: 0.6,
  },

  contenedorRedes: {
    width: '100%',
    alignItems: 'center',
    gap: 12 * escalaWeb,
    marginTop: 10 * escalaWeb,
  },

  botonRed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 290 * escalaWeb,
    height: 45 * escalaWeb,
    backgroundColor: '#8a003a',
    borderRadius: 30 * escalaWeb,
    boxShadow: '1px 1px 15px rgba(255, 77, 136, 0.5)',
    paddingHorizontal: 20,
  },

  iconoRed: {
    width: 30 * escalaWeb,
    height: 30 * escalaWeb,
    resizeMode: 'contain',
    marginRight: 12 * escalaWeb,
  },

  textoBotonRed: {
    fontSize: 17 * escalaWeb,
    fontWeight: 'bold',
    color: '#fff',
  },

  contenedorRoles: {
    width: '100%',
    marginBottom: 25 * escalaWeb,
  },
  rolOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8 * escalaWeb,
  },
  rolCirculo: {
    height: 20 * escalaWeb,
    width: 20 * escalaWeb,
    borderRadius: 10 * escalaWeb,
    borderWidth: 2,
    borderColor: '#8a003a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10 * escalaWeb,
  },
  rolCirculoSeleccionado: {
    height: 10 * escalaWeb,
    width: 10 * escalaWeb,
    borderRadius: 5 * escalaWeb,
    backgroundColor: '#8a003a',
  },
  textoRol: {
    color: '#000000ff',
    fontSize: 16 * escalaWeb,
  },

  contenedorLogo: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },

  contenedorFormulario: {
    width: '90%',
    alignSelf: 'center',
  },

  contenedorInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },

  botonGrande: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },

  botonDeshabilitado: {
    backgroundColor: '#666',
    opacity: 0.7,
  },

  textoBotonGrande: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  contenedorEnlaces: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  enlace: {
    color: '#007AFF',
    fontSize: 14,
  },

  contenedorSeparador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
    width: '90%',
    alignSelf: 'center',
  },

  lineaSeparador: {
    flex: 1,
    height: 1,
    backgroundColor: '#444',
  },

  textoSeparador: {
    color: '#888',
    marginHorizontal: 15,
    fontSize: 14,
  },

  contenedorSocial: {
    width: '90%',
    alignSelf: 'center',
  },

  botonGoogle: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  iconoGoogle: {
    width: 24,
    height: 24,
    marginRight: 10,
  },

  textoBotonGoogle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },

  overlayCargando: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  contenedorCargando: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },

  textoCargando: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },

});
