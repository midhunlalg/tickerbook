import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AddTradeScreen from './screens/TradeScreen';
import TradeHistoryScreen from './screens/TradeHistory';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';

const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any data or assets here
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} onLayout={onLayoutRootView}>
      {/* <TradeHistoryScreen></TradeHistoryScreen> */}
      <NavigationContainer>
        <Stack.Navigator initialRouteName="TradeHistory">
          <Stack.Screen
            name="TradeHistory"
            component={TradeHistoryScreen}
            options={{ title: 'Tickr Book' }}
          />
          <Stack.Screen
            name="AddTrade"
            component={AddTradeScreen}
            options={{ title: 'Add Trade' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>

  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
});
