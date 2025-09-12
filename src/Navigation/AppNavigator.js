import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CountriesListScreen from '../screens/CountriesListScreen';
import CountryProfileScreen from '../screens/CountryProfileScreen';
import FavouriteScreen from '../screens/FavouriteScreen';
import BottomNav from '../component/BottomNav';
import ExploreScreen from '../screens/ExploreScreen';
const Stack = createNativeStackNavigator();

export default function AppNavigator({ linking }) {
  return (
    <NavigationContainer linking={linking} fallback={<></>}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="CountriesList"
      >
        <Stack.Screen name="CountriesList" component={CountriesListScreen} />
        <Stack.Screen name="CountryProfile" component={CountryProfileScreen} />
        <Stack.Screen name="Favourite" component={FavouriteScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
      </Stack.Navigator>
      <BottomNav />
    </NavigationContainer>
  );
}
