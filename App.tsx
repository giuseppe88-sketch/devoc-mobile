import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AuthNavigator from "./src/navigation/auth-navigator";
import MainNavigator from "./src/navigation/main-navigator";
import { useAuthStore } from "./src/stores/auth-store";
import { supabase } from "./src/lib/supabase";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components/native";
import { useColors, spacing } from './src/theme';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

function App(): ReactNode {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = (isLoading: boolean) =>
    useAuthStore.setState({ loading: isLoading });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        console.log("Session Token (onAuthStateChange):", session?.access_token);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setSession]);

  const currentColors = useColors();
  const currentTheme = {
    colors: currentColors,
    spacing: spacing,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider theme={currentTheme}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!session ? (
                <Stack.Screen name="Auth" component={AuthNavigator} />
              ) : (
                <Stack.Screen name="Main" component={MainNavigator} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;
