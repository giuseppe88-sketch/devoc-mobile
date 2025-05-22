import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import AuthNavigator from "./src/navigation/auth-navigator";
import MainNavigator from "./src/navigation/main-navigator";
import { useAuthStore } from "./src/stores/auth-store";
import { supabase } from "./src/lib/supabase";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components/native";
import { useColors, spacing } from "./src/theme";
import RNToast from 'react-native-toast-message';
import type { ComponentType } from 'react';

// Cast to ComponentType<any> to bypass type checking issues with React 19
// This is a common workaround when library types are not fully compatible
// with new React versions (like React 19 RC).
const Toast = RNToast as ComponentType<any>;

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
        console.log(
          "Session Token (onAuthStateChange):",
          session?.access_token
        );
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setSession]);

  const currentColors = useColors('dark');
  const currentTheme = {
    colors: currentColors,
    spacing: spacing,
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={currentTheme}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={50} />
            </View>
          ) : (
            <NavigationContainer>
              {session && session.user ? <MainNavigator /> : <AuthNavigator />}
            </NavigationContainer>
          )}
          <Toast />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
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
