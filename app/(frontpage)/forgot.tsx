import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    // Implement your password reset logic here
    try {
      // Mock password reset process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetSent(true);
    } catch (error) {
      alert('Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Image to Plate</Text>
            <Text style={styles.subtitle}>Reset your password</Text>
          </View>

          {!resetSent ? (
            <View style={styles.formContainer}>
              <Text style={styles.instructionText}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

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

              <TouchableOpacity
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.resetButtonText}>Sending...</Text>
                ) : (
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={handleBackToLogin}
              >
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#6A7BFF" />
              </View>
              
              <Text style={styles.successTitle}>Email Sent!</Text>
              
              <Text style={styles.successText}>
                We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
              </Text>
              
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleBackToLogin}
              >
                <Text style={styles.resetButtonText}>Back to Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the email? </Text>
                <TouchableOpacity onPress={handleResetPassword}>
                  <Text style={styles.resendLink}>Resend</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
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
  backButton: {
    marginBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
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
  instructionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    height: 56,
    marginBottom: 24,
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
  resetButton: {
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
    marginBottom: 16,
  },
  resetButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  resetButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  backToLoginButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backToLoginText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#6A7BFF',
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 16,
  },
  successText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#6A7BFF',
  },
});