import React, { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./src/app/store";
import AppNavigator from "./src/Navigation/AppNavigator";
import { checkVersionRequest } from "./src/features/versionslice";
import { View, Text, ActivityIndicator } from "react-native";

function StartupWrapper() {
  const dispatch = useDispatch();
  const { loading, needsUpdate, currentVersion, remoteVersion } = useSelector(
    (state) => state.version
  );

  useEffect(() => {
    dispatch(checkVersionRequest());
  }, [dispatch]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Checking version...</Text>
      </View>
    );
  }

  if (needsUpdate) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", fontSize: 18, textAlign: "center" }}>
          Update Required!{"\n"}
          Current: {currentVersion} | Latest: {remoteVersion}
        </Text>
      </View>
    );
  }

  return <AppNavigator />; // only render navigator
}

export default function App() {
  // Define deep linking here
  const linking = {
    prefixes: ['myapp://'],
    config: {
      screens: {
        Favourites: 'favourites',
        CountryProfile: 'country/:countryCode', // maps country code param
        CountriesList: 'countries',
      },
    },
  };

  return (
    <Provider store={store}>
      <AppNavigator linking={linking} />
    </Provider>
  );
}