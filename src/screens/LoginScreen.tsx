import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../services/AuthService';
import { wp, hp, rf, rs } from '../utils/responsive';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'canteen' | 'ngo' | 'volunteer' | 'driver'>('canteen');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.login({ email, password, userType });
      
      // Navigate based on user type
      if (user.userType === 'canteen') {
        navigation.navigate('CanteenTabs' as never);
      } else if (user.userType === 'driver') {
        navigation.navigate('DriverTabs' as never);
      } else {
        navigation.navigate('NGOTabs' as never);
      }
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('RegisterScreen' as never);
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPasswordScreen' as never);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>PlateLink</Text>
          <Text style={styles.subtitle}>Connecting surplus food with those in need</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Login to your account</Text>
          
          {/* User Type Selection */}
          <View style={styles.userTypeContainer}>
            <Text style={styles.label}>I am a:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'canteen' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('canteen')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'canteen' && styles.userTypeButtonTextActive
                ]}>
                  Canteen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'ngo' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('ngo')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'ngo' && styles.userTypeButtonTextActive
                ]}>
                  NGO
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'volunteer' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('volunteer')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'volunteer' && styles.userTypeButtonTextActive
                ]}>
                  Volunteer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'driver' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('driver')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'driver' && styles.userTypeButtonTextActive
                ]}>
                  Driver
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity onPress={navigateToForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: wp(5),
    paddingVertical: Platform.OS === 'web' ? rs(40) : rs(20), // More padding on web
  },
  header: {
    alignItems: 'center',
    marginBottom: rs(40),
  },
  title: {
    fontSize: rf(32),
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rf(16),
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: rs(12),
    padding: wp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: rs(24),
    textAlign: 'center',
  },
  userTypeContainer: {
    marginBottom: rs(20),
  },
  label: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: rs(8),
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: rs(8),
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    borderRadius: rs(8),
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  userTypeButtonText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: '#666',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: rs(16),
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: rs(8),
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    fontSize: rf(16),
    backgroundColor: '#f8f9fa',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: rs(8),
    paddingVertical: rs(16),
    alignItems: 'center',
    marginTop: rs(8),
    marginBottom: rs(16),
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: '600',
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: rf(14),
    textAlign: 'center',
    marginBottom: rs(20),
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: rf(14),
    color: '#666',
  },
  registerLink: {
    fontSize: rf(14),
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default LoginScreen;