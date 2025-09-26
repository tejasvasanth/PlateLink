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

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    userType: 'canteen' as 'canteen' | 'ngo' | 'volunteer' | 'driver',
    canteenName: '',
    organizationName: '',
    organizationType: 'ngo' as 'ngo' | 'volunteer' | 'community_group',
    address: '',
    contactNumber: '',
    vehicleType: '',
    licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.userType === 'canteen' && !formData.canteenName) {
      Alert.alert('Error', 'Please enter canteen name');
      return false;
    }

    // Require organization name ONLY for NGO and Volunteer
    if ((formData.userType === 'ngo' || formData.userType === 'volunteer') && !formData.organizationName) {
      Alert.alert('Error', 'Please enter organization name');
      return false;
    }

    // Require driver-specific fields for Driver
    if (formData.userType === 'driver') {
      if (!formData.vehicleType) {
        Alert.alert('Error', 'Please enter vehicle type');
        return false;
      }
      if (!formData.licenseNumber) {
        Alert.alert('Error', 'Please enter license number');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: formData.userType,
        address: formData.address,
        contactNumber: formData.contactNumber,
      };

      if (formData.userType === 'canteen') {
        if (formData.canteenName) payload.canteenName = formData.canteenName;
      } else if (formData.userType === 'driver') {
        // Driver fields
        payload.vehicleType = formData.vehicleType;
        payload.licenseNumber = formData.licenseNumber;
      } else {
        // NGO / Volunteer fields
        if (formData.organizationName) payload.organizationName = formData.organizationName;
        if (formData.organizationType) payload.organizationType = formData.organizationType;
      }

      const user = await AuthService.register(payload);
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (user.userType === 'canteen') {
                navigation.navigate('CanteenTabs' as never);
              } else if (user.userType === 'driver') {
                navigation.navigate('DriverTabs' as never);
              } else {
                navigation.navigate('NGOTabs' as never);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('LoginScreen' as never);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Join PlateLink</Text>
          <Text style={styles.subtitle}>Create your account to start making a difference</Text>
        </View>

        <View style={styles.form}>
          {/* User Type Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>I am a:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'canteen' && styles.userTypeButtonActive
                ]}
                onPress={() => updateFormData('userType', 'canteen')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'canteen' && styles.userTypeButtonTextActive
                ]}>
                  Canteen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'ngo' && styles.userTypeButtonActive
                ]}
                onPress={() => updateFormData('userType', 'ngo')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'ngo' && styles.userTypeButtonTextActive
                ]}>
                  NGO
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'volunteer' && styles.userTypeButtonActive
                ]}
                onPress={() => updateFormData('userType', 'volunteer')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'volunteer' && styles.userTypeButtonTextActive
                ]}>
                  Volunteer
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'driver' && styles.userTypeButtonActive
                ]}
                onPress={() => updateFormData('userType', 'driver')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'driver' && styles.userTypeButtonTextActive
                ]}>
                  Driver
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          {/* Canteen Name (if canteen) */}
          {formData.userType === 'canteen' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Canteen Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.canteenName}
                onChangeText={(value) => updateFormData('canteenName', value)}
                placeholder="Enter canteen name"
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Organization Name (if NGO/Volunteer) */}
          {(formData.userType === 'ngo' || formData.userType === 'volunteer') && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Organization Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.organizationName}
                  onChangeText={(value) => updateFormData('organizationName', value)}
                  placeholder="Enter organization name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Organization Type</Text>
                <View style={styles.organizationTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.orgTypeButton,
                      formData.organizationType === 'ngo' && styles.orgTypeButtonActive
                    ]}
                    onPress={() => updateFormData('organizationType', 'ngo')}
                  >
                    <Text style={[
                      styles.orgTypeButtonText,
                      formData.organizationType === 'ngo' && styles.orgTypeButtonTextActive
                    ]}>
                      NGO
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.orgTypeButton,
                      formData.organizationType === 'volunteer' && styles.orgTypeButtonActive
                    ]}
                    onPress={() => updateFormData('organizationType', 'volunteer')}
                  >
                    <Text style={[
                      styles.orgTypeButtonText,
                      formData.organizationType === 'volunteer' && styles.orgTypeButtonTextActive
                    ]}>
                      Individual
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.orgTypeButton,
                      formData.organizationType === 'community_group' && styles.orgTypeButtonActive
                    ]}
                    onPress={() => updateFormData('organizationType', 'community_group')}
                  >
                    <Text style={[
                      styles.orgTypeButtonText,
                      formData.organizationType === 'community_group' && styles.orgTypeButtonTextActive
                    ]}>
                      Community
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Driver specific fields */}
          {formData.userType === 'driver' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Type *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.vehicleType}
                  onChangeText={(value) => updateFormData('vehicleType', value)}
                  placeholder="e.g., Car, Bike, Van"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>License Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.licenseNumber}
                  onChangeText={(value) => updateFormData('licenseNumber', value)}
                  placeholder="Enter your driving license number"
                  autoCapitalize="characters"
                />
              </View>
            </>
          )}

          {/* Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              placeholder="Enter your address"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={formData.contactNumber}
              onChangeText={(value) => updateFormData('contactNumber', value)}
              placeholder="Enter your contact number"
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    padding: wp(5),
    paddingTop: rs(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: rs(30),
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
  inputContainer: {
    marginBottom: rs(16),
  },
  label: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: rs(8),
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
  organizationTypeButtons: {
    flexDirection: 'row',
    gap: rs(6),
  },
  orgTypeButton: {
    flex: 1,
    paddingVertical: rs(10),
    paddingHorizontal: rs(12),
    borderRadius: rs(6),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  orgTypeButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  orgTypeButtonText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#666',
  },
  orgTypeButtonTextActive: {
    color: '#fff',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: rs(8),
    paddingVertical: rs(16),
    alignItems: 'center',
    marginTop: rs(8),
    marginBottom: rs(16),
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: rf(14),
    color: '#666',
  },
  loginLink: {
    fontSize: rf(14),
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default RegisterScreen;