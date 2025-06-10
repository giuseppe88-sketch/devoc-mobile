import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/auth-store";
import { useColors, ColorTheme } from "../../theme";

function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading } = useAuthStore();
  const colors = useColors('light'); // Use light theme
  const styles = getStyles(colors);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const handleMagicLink = async () => {
    // Implement magic link functionality
    Alert.alert("Magic Link", "This feature is coming soon!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Devoc</Text>
          <Text style={styles.subtitle}>Connect with top developers</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={handleMagicLink}>
              <Text style={styles.linkText}>Login with Magic Link</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingContainer: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      padding: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 18,
      color: colors.text,
      opacity: 0.8,
      marginBottom: 40,
      textAlign: "center",
    },
    form: {
      width: "100%",
      maxWidth: 400,
    },
    input: {
      height: 55,
      borderWidth: 1.5,
      borderColor: colors.subtle,
      borderRadius: 10,
      marginBottom: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: colors.background,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      height: 55,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 15,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
    },
    linkButton: {
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 15,
    },
    linkText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "500",
    },
    signupContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 30,
    },
    signupText: {
      color: colors.text,
      fontSize: 16,
      opacity: 0.8,
    },
    signupLink: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: 16,
      marginLeft: 5,
    },
  });

export default LoginScreen;
