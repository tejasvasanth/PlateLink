import { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { wp, hp, rf, rs } from '../utils/responsive';
import theme from '../config/theme';
import AuthService from '../services/AuthService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'canteen' | 'ngo' | 'driver'>('canteen');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    animateButton();
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

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'canteen': return '🍽️';
      case 'ngo': return '🤝';
      case 'driver': return '🚚';
      default: return '👤';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'canteen': return theme.colors.gradients.primary;
      case 'ngo': return theme.colors.gradients.primary;
      case 'driver': return theme.colors.gradients.accent;
      default: return theme.colors.gradients.secondary;
    }
  };

  return (
    <LinearGradient
      colors={theme?.colors?.gradients?.background || ['#F0F8FF', '#E0F6FF']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.logoCircle}
              >
                <Text style={styles.logoEmoji}>🍽️</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>PlateLink</Text>
            <Text style={styles.subtitle}>Connecting surplus food with those in need</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={theme?.colors?.gradients?.card || ['#FFFFFF', '#F8F9FA']}
              style={styles.form}
            >
              <Text style={styles.sectionTitle}>Welcome Back</Text>
              
              {/* User Type Selection */}
              <View style={styles.userTypeContainer}>
                <Text style={styles.label}>I am a:</Text>
                <View style={styles.userTypeButtons}>
                  {(['canteen', 'ngo', 'driver'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.userTypeButton,
                        userType === type && styles.userTypeButtonActive
                      ]}
                      onPress={() => setUserType(type)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={userType === type ? getUserTypeColor(type) : ['transparent', 'transparent']}
                        style={styles.userTypeButtonGradient}
                      >
                        <Text style={styles.userTypeIcon}>{getUserTypeIcon(type)}</Text>
                        <Text style={[
                          styles.userTypeButtonText,
                          userType === type && styles.userTypeButtonTextActive
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={theme.colors.gradients.button}
                    style={styles.loginButtonGradient}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <Animated.View style={styles.loadingDot} />
                        <Text style={styles.loginButtonText}>Signing In...</Text>
                      </View>
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPasswordContainer}>
                <Text style={{ color: theme.colors.textSecondary }}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={navigateToRegister}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(4),
    minHeight: SCREEN_HEIGHT,
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  logoContainer: {
    marginBottom: hp(2),
  },
  logoCircle: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  logoEmoji: {
    fontSize: rf(40),
  },
  title: {
    fontSize: rf(36),
    fontWeight: 'bold',
    color: theme.colors.textLight,
    marginBottom: hp(1),
    ...theme.typography.textShadow,
  },
  subtitle: {
    fontSize: rf(16),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: wp(4),
    lineHeight: rf(22),
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    borderRadius: theme.borderRadius.xlarge,
    padding: wp(6),
    ...theme.shadows.large,
  },
  sectionTitle: {
    fontSize: rf(28),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(3),
    textAlign: 'center',
  },
  userTypeContainer: {
    marginBottom: hp(3),
  },
  label: {
    fontSize: rf(16),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  userTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(12),
  },
  userTypeButton: {
    flex: 1,
    minWidth: wp(20),
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  userTypeButtonActive: {
    borderColor: 'transparent',
  },
  userTypeButtonGradient: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTypeIcon: {
    fontSize: rf(20),
    marginBottom: hp(0.5),
  },
  userTypeButtonText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  userTypeButtonTextActive: {
    color: theme.colors.textLight,
  },
  inputContainer: {
    marginBottom: hp(2.5),
  },
  inputLabel: {
    fontSize: rf(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: wp(4),
    height: hp(6.5),
  },
  inputIcon: {
    marginRight: wp(3),
  },
  input: {
    flex: 1,
    fontSize: rf(16),
    color: theme.colors.text,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: hp(3),
  },
  forgotPasswordText: {
    fontSize: rf(14),
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    marginBottom: hp(2),
    ...theme.shadows.button,
  },
  loginButtonGradient: {
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: rf(14),
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: rf(14),
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: wp(1),
  },
});

export default LoginScreen;