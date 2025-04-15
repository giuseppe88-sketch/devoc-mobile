import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/auth-store';
import { useNavigation } from '@react-navigation/native';

// Define the possible roles
type Role = 'client' | 'developer';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('client'); // State for selected role, default 'client'
  const { signUp, loading } = useAuthStore();
  const navigation = useNavigation<any>();

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

    // Pass email, password, AND role to the store's signUp function
    const { error } = await signUp(email, password, role); // Pass role here

    if (error) {
      // Use a more specific error message if possible, or fallback
      const message = error.message || 'An error occurred during sign up. Please try again.';
      Alert.alert('Sign Up Failed', message);
    } else {
        Alert.alert('Success', 'Account created successfully! Check your email for verification.'); // Changed success message
        navigation.navigate('Login'); // Navigate to Login after successful signup
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 characters)" // Added hint
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Role Selection */}
      <View style={styles.roleContainer}>
        <Text style={styles.roleLabel}>I am a:</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[styles.roleButton, styles.roleButtonClient, role === 'client' && styles.roleButtonActive]} // Added specific style
            onPress={() => setRole('client')}
            disabled={loading}
          >
            <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, styles.roleButtonDeveloper, role === 'developer' && styles.roleButtonActive]} // Added specific style
            onPress={() => setRole('developer')}
            disabled={loading}
          >
            <Text style={[styles.roleButtonText, role === 'developer' && styles.roleButtonTextActive]}>Developer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Button title={loading ? 'Creating Account...' : 'Create Account'} onPress={handleSignUp} disabled={loading} />
      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa', // Light background
  },
  title: {
    fontSize: 28, // Larger title
    fontWeight: 'bold',
    marginBottom: 30, // More space below title
    textAlign: 'center',
    color: '#343a40', // Darker title color
  },
  input: {
    height: 50, // Taller input fields
    backgroundColor: '#fff', // White background for inputs
    borderColor: '#ced4da', // Lighter border color
    borderWidth: 1,
    marginBottom: 15, // More space between inputs
    paddingHorizontal: 15,
    borderRadius: 8, // Rounded corners
    fontSize: 16, // Slightly larger font size
  },
  roleContainer: {
    marginBottom: 20, // Space below role selection
    alignItems: 'center', // Center items horizontally
  },
  roleLabel: {
    fontSize: 16,
    color: '#495057', // Medium gray text
    marginBottom: 10, // Space below label
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'center', // Center buttons horizontally
    width: '80%', // Limit width
  },
  // Base style for role buttons
  roleButton: {
    flex: 1, // Make buttons take equal space
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#007bff', // Blue border
    alignItems: 'center', // Center text inside button
    backgroundColor: '#fff', // Default white background
  },
  // Style for the 'Client' button (left side)
  roleButtonClient: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginRight: -1, // Overlap borders slightly for connected look
  },
  // Style for the 'Developer' button (right side)
  roleButtonDeveloper: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  // Style for the ACTIVE role button
  roleButtonActive: {
    backgroundColor: '#007bff', // Blue background when active
  },
  // Base text style for role buttons
  roleButtonText: {
    color: '#007bff', // Blue text
    fontSize: 16,
    fontWeight: '500',
  },
  // Text style for the ACTIVE role button
  roleButtonTextActive: {
    color: '#fff', // White text when active
  },
  linkButton: {
    marginTop: 25, // More space above link
    alignItems: 'center',
  },
  linkText: {
    color: '#007bff', // Consistent blue link color
    fontSize: 16,
  },
  // Note: Default RN Button styling might need separate handling if custom look is desired
});

export default SignUpScreen;
