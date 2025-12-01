import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PantallaLogin from './PantallaLogin';
import PantallaRegistrarr from './PantallaRegistrarse';
import PantallaReset from './PantallaReset';
import PantallaVerificarID from './PantallaVerificarID';
import PantallaMandarCorreo from './PantallaMandarCorreo';
import PantallaPrincipal from '../PantallasMenu/PantallaPrincipal';
import PantallaResultados from '../PantallasMenu/PantallaResultados';
import PantallaBuscarUsuario from '../PantallasMenu/PantallaBuscarUsuariol';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login"
      
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',  
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={PantallaLogin}
          options={{ headerShown: false, animation: 'slide_from_right' }}/>

        <Stack.Screen 
          name="Registrar" 
          component={PantallaRegistrarr} 
          options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen
          name="Reset"
          component={PantallaReset}
          options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen
          name="VerificarID"
          component={PantallaVerificarID}
          options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen
          name="MandarCorreo"
          component={PantallaMandarCorreo}
          options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen
          name="MenuPrincipal"
          component={PantallaPrincipal}
          options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen
          name="Resultados"
          component={PantallaResultados}
          options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen
          name="BusdarUsuario"
          component={PantallaBuscarUsuario}
          options={{ headerShown: false, animation: 'slide_from_right' }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
