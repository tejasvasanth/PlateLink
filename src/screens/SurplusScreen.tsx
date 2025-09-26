import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { storage, auth } from '../config/firebase';
import AuthService from '../services/AuthService';
import FoodSurplusService from '../services/FoodSurplusService';
import app from '../config/firebase';

const SurplusScreen: React.FC = () => {
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState(''); // string for controlled input
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library to select an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 ?? null);
      }
    } catch (e: any) {
      console.error('Image pick error:', e);
      Alert.alert('Error', e.message || 'Failed to pick image.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your camera to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 ?? null);
      }
    } catch (e: any) {
      console.error('Camera error:', e);
      Alert.alert('Error', e.message || 'Failed to take photo.');
    }
  };

  const uploadImageAsync = async (uri: string, canteenId: string, base64Data?: string | null): Promise<string> => {
    setUploading(true);
    try {
      const extMatch = uri?.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      const ext = (extMatch ? extMatch[1] : 'jpg').toLowerCase();
      const path = `surplus/${canteenId}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
  
      // Map to a safe contentType
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  
      // Log bucket and path for diagnostics
      const bucket = (app.options as any)?.storageBucket;
      const authUid = auth?.currentUser?.uid || null;
      console.log('Storage diagnostics:', { bucket, path, platform: Platform.OS, authUid });
      if (!authUid) {
        throw new Error('You are not authenticated. Please log in again before uploading images.');
      }
      if (authUid !== canteenId) {
        console.warn('Auth UID does not match canteenId used in storage path', { authUid, canteenId });
        throw new Error('Authentication mismatch detected. Please re-login to continue.');
      }
  
      if (Platform.OS === 'web') {
        if (base64Data) {
          const dataUrl = `data:${contentType};base64,${base64Data}`;
          console.log('Uploading via data_url to Firebase Storage (web)');
          await uploadString(storageRef, dataUrl, 'data_url');
        } else {
          console.log('Web upload fallback: fetching blob from uri', uri);
          const response = await fetch(uri);
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('Blob fetch failed', { status: response.status, statusText: response.statusText, body: text?.slice(0, 200) });
            throw new Error(`Failed to read image data: ${response.status} ${response.statusText}`);
          }
          const blob = await response.blob();
          console.log('Blob fetched, type:', blob.type);
          await uploadBytes(storageRef, blob, { contentType: blob.type || contentType });
        }
      } else {
        // Prefer base64 on native to avoid blob-related issues on some devices
        let nativeBase64 = base64Data || null;
        if (!nativeBase64) {
          // Attempt to read the local file URI as base64
          try {
            console.log('Native: base64 not provided by ImagePicker, reading file as base64');
            nativeBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            console.log('Native: base64 read from file successfully');
          } catch (fsErr: any) {
            console.warn('Native: failed to read base64 from file, will fallback to blob', fsErr?.message);
          }
        }
  
        if (nativeBase64) {
          const dataUrl = `data:${contentType};base64,${nativeBase64}`;
          console.log('Native upload: using base64 data_url');
          await uploadString(storageRef, dataUrl, 'data_url');
        } else {
          console.log('Native upload: using blob');
          const response = await fetch(uri);
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('Blob fetch failed (native)', { status: response.status, statusText: response.statusText, body: text?.slice(0, 200) });
            throw new Error(`Failed to read image data: ${response.status} ${response.statusText}`);
          }
          const blob = await response.blob();
          console.log('Blob fetched (native), type:', blob.type);
          await uploadBytes(storageRef, blob, { contentType: blob.type || contentType });
        }
      }
  
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Upload complete, downloadURL:', downloadURL);
      return downloadURL;
    } catch (e: any) {
      const serverResponse = e?.customData?.serverResponse;
      console.error('Storage upload error:', {
        platform: Platform.OS,
        code: e?.code,
        message: e?.message,
        serverResponse,
      });
      throw new Error(e?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!foodName.trim()) {
      Alert.alert('Validation', 'Please enter a food name/description.');
      return;
    }
    const qtyNum = Number(quantity);
    if (!quantity || Number.isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Validation', 'Please enter a valid approximate weight.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('You are not logged in.');
      }
      if (user.userType !== 'canteen') {
        throw new Error('Only canteen users can add surplus items.');
      }

      // Upload image if provided
      let imageUrl: string | undefined = undefined;
      if (imageUri) {
        imageUrl = await uploadImageAsync(imageUri, user.id, imageBase64);
      }

      // Build data with sensible defaults for required fields
      const now = Date.now();
      const data: any = {
        canteenId: user.id,
        canteenName: user.canteenName || user.name,
        foodName: foodName.trim(),
        category: 'vegetarian' as const, // default category
        quantity: qtyNum,
        unit: 'kg',
        expiryTime: new Date(now + 6 * 60 * 60 * 1000), // default 6h from now
        pickupLocation: user.address || 'At canteen',
      };

      if (imageUrl) data.imageUrl = imageUrl;

      await FoodSurplusService.createFoodSurplus(data);

      Alert.alert('Success', 'Surplus item added successfully.');
      // Reset form
      setFoodName('');
      setQuantity('');
      setImageUri(null);
      setImageBase64(null);
    } catch (e: any) {
      console.error('Submit surplus error:', e);
      Alert.alert('Error', e.message || 'Failed to save surplus item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Log Surplus Food</Text>
      <Text style={styles.subtitle}>Enter details and add a photo so NGOs can find it quickly.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Food description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Veg biryani trays"
          value={foodName}
          onChangeText={setFoodName}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1 }]}> 
          <Text style={styles.label}>Approx weight</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12"
            value={quantity}
            onChangeText={(t) => setQuantity(t.replace(/[^0-9.]/g, ''))}
            keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric', default: 'numeric' })}
          />
        </View>
        <View style={[styles.fieldGroup, { width: 90, marginLeft: 12 }]}> 
          <Text style={styles.label}>Unit</Text>
          <View style={[styles.input, styles.unitBox]}>
            <Text style={styles.unitText}>kg</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Photo</Text>
        {imageUri ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={styles.imageActionsRow}>
              <TouchableOpacity style={[styles.button, styles.secondary]} onPress={pickImage}>
                <Text style={styles.buttonText}>Choose another</Text>
              </TouchableOpacity>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={[styles.button, styles.secondary]} onPress={takePhoto}>
                  <Text style={styles.buttonText}>Retake</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.button, styles.link]} onPress={() => setImageUri(null)}>
                <Text style={[styles.buttonText, { color: '#d32f2f' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageActionsRow}>
            <TouchableOpacity style={[styles.button, styles.secondary]} onPress={pickImage}>
              <Text style={styles.buttonText}>Choose from gallery</Text>
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={[styles.button, styles.secondary]} onPress={takePhoto}>
                <Text style={styles.buttonText}>Take a photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.button, styles.primary]} onPress={onSubmit} disabled={submitting || uploading}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, styles.primaryText]}>Save Surplus</Text>}
      </TouchableOpacity>

      {(uploading || submitting) && (
        <View style={styles.overlay}> 
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>{uploading ? 'Uploading image...' : 'Saving...'}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  unitBox: {
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 16,
    color: '#333',
  },
  imagePreviewWrapper: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 8,
    backgroundColor: '#fafafa',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#eaeaea',
  },
  imageActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: '#2196F3',
  },
  primaryText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: '#f1f5f9',
  },
  link: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#111827',
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  overlayText: {
    color: '#fff',
    marginLeft: 10,
  },
});

export default SurplusScreen;