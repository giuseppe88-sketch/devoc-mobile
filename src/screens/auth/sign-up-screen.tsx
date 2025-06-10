import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuthStore } from '../../stores/auth-store';
import { useNavigation } from '@react-navigation/native';
import { useColors, ColorTheme } from '../../theme';

// Define the possible roles
type Role = 'client' | 'developer';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('client');
  const { signUp, loading } = useAuthStore();
  const navigation = useNavigation<any>();
  const colors = useColors('light'); // Use light theme
  const styles = getStyles(colors);

  const handleSignUp = async () => {
    console.log('*** handleSignUp triggered with role:', role);

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
    }

    const { error } = await signUp(email, password, role);

    if (error) {
      const message = error.message || 'An error occurred during sign up. Please try again.';
      Alert.alert('Sign Up Failed', message);
    } else {
        Alert.alert('Success', 'Account created successfully! Check your email for verification.');
        navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>

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
              placeholder="Password (min. 6 characters)"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="password-new"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="password-new"
            />

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
                  onPress={() => setRole('client')}
                  disabled={loading}
                >
                  <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>Client</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'developer' && styles.roleButtonActive]}
                  onPress={() => setRole('developer')}
                  disabled={loading}
                >
                  <Text style={[styles.roleButtonText, role === 'developer' && styles.roleButtonTextActive]}>Developer</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ColorTheme) => StyleSheet.create({
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
    marginBottom: 30,
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
    marginTop: 20,
  },
  linkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  roleContainer: {
    marginBottom: 25,
    alignItems: 'stretch',
    width: '100%',
  },
  roleLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
