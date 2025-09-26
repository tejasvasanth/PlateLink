import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import AuthService from '../services/AuthService';
import { LocationService } from '../services/LocationService';
import { Ionicons } from '@expo/vector-icons';

type UserType = 'canteen' | 'ngo' | 'driver';

interface UserLocation {
  id: string;
  name: string;
  userType: UserType;
  latitude: number;
  longitude: number;
  address: string;
}

const CHENNAI_REGION: Region = {
  latitude: 13.0827,
  longitude: 80.2707,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<UserType>('ngo');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const user = await AuthService.getCurrentUser();
        const type: UserType =
          user && (user.userType === 'canteen' || user.userType === 'ngo' || user.userType === 'driver')
            ? (user.userType as UserType)
            : 'ngo';
        setCurrentUserType(type);
        const locations = await LocationService.getUserLocations(type);
        setUserLocations(locations);
      } catch (error) {
        console.error('Error initializing map data:', error);
        Alert.alert('Error', 'Failed to load locations. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadUserLocations = async (type: UserType) => {
    try {
      setLoading(true);
      const locations = await LocationService.getUserLocations(type);
      setUserLocations(locations);
    } catch (error) {
      console.error('Error loading user locations:', error);
      Alert.alert('Error', 'Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserLocations(currentUserType);
    setRefreshing(false);
  };

  const getMarkerColor = (userType: string) => {
    switch (userType) {
      case 'canteen':
        return '#FF6B6B'; // Red for canteens
      case 'ngo':
        return '#4ECDC4'; // Teal for NGOs
      case 'driver':
        return '#45B7D1'; // Blue for drivers
      default:
        return '#95A5A6'; // Gray for unknown
    }
  };

  const renderMarker = (location: UserLocation) => (
    <Marker
      key={location.id}
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
      title={location.name}
      description={`${location.userType.toUpperCase()} - ${location.address}`}
      pinColor={getMarkerColor(location.userType)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={CHENNAI_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {userLocations.map(renderMarker)}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>PlateLink Map</Text>
        <Text style={styles.headerSubtitle}>Chennai, India</Text>
      </View>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        disabled={refreshing}
      >
        <Ionicons
          name="refresh"
          size={24}
          color="white"
          style={refreshing ? { opacity: 0.5 } : {}}
        />
      </TouchableOpacity>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>Canteens</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
          <Text style={styles.legendText}>NGOs</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#45B7D1' }]} />
          <Text style={styles.legendText}>Drivers</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 4,
  },
  refreshButton: {
    position: 'absolute',
    top: 140,
    right: 20,
    backgroundColor: '#4ECDC4',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  legend: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
});