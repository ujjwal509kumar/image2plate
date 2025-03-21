import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Toast from 'react-native-toast-message';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'Please fill in all fields.',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Sign in with email and password using Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in:', userCredential.user);
      
      // Redirect to the dashboard on successful login
      router.replace('/(dashboard)');
    } catch (error: any) {
      // Show error with a toast message instead of alerting an error screen
      let message = error.message || 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'User not found.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      }
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: message,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Image to Plate</Text>
            <Text style={styles.subtitle}>Turn your food images into delicious recipes</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.instructionText}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Link href="/forgot" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Loading...</Text>
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  welcomeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    height: 56,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#6A7BFF',
  },
  loginButton: {
    backgroundColor: '#6A7BFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6A7BFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  loginButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontFamily: 'Poppins_500Medium',
    color: '#666',
    paddingHorizontal: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#6A7BFF',
  },
});
