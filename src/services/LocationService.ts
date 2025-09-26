import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Location from 'expo-location';

// Geocoding service using Expo Location

interface UserLocation {
  id: string;
  name: string;
  userType: 'canteen' | 'ngo' | 'driver';
  latitude: number;
  longitude: number;
  address: string;
}

interface FirestoreUser {
  id: string;
  name: string;
  userType: 'canteen' | 'ngo' | 'driver';
  address?: string;
  organizationName?: string;
}

// Chennai bounds for filtering locations
const CHENNAI_BOUNDS = {
  north: 13.2544,
  south: 12.8344,
  east: 80.3464,
  west: 80.1464,
};

export class LocationService {
  /**
   * Check if coordinates are within Chennai bounds
   */
  private static isWithinChennai(latitude: number, longitude: number): boolean {
    return (
      latitude >= CHENNAI_BOUNDS.south &&
      latitude <= CHENNAI_BOUNDS.north &&
      longitude >= CHENNAI_BOUNDS.west &&
      longitude <= CHENNAI_BOUNDS.east
    );
  }

  /**
   * Geocode an address to get latitude and longitude using Expo Location
   */
  static async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Add Chennai, India to the address for better accuracy
      const fullAddress = address.includes('Chennai') ? address : `${address}, Chennai, India`;
      
      const geocodedLocation = await Location.geocodeAsync(fullAddress);
      
      if (geocodedLocation && geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];

        // Check if the location is within Chennai bounds
        if (this.isWithinChennai(latitude, longitude)) {
          return { latitude, longitude };
        } else {
          console.warn(`Address "${address}" is outside Chennai bounds`);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get all user locations based on the current user's type
   * NGOs and Drivers can see canteens and each other
   */
  static async getUserLocations(currentUserType: string): Promise<UserLocation[]> {
    try {
      const usersRef = collection(db, 'users');
      let userQuery;

      // Define what user types the current user can see
      if (currentUserType === 'ngo') {
        // NGOs can see canteens and drivers
        userQuery = query(usersRef, where('userType', 'in', ['canteen', 'driver']));
      } else if (currentUserType === 'driver') {
        // Drivers can see canteens and NGOs
        userQuery = query(usersRef, where('userType', 'in', ['canteen', 'ngo']));
      } else {
        // Canteens shouldn't access this (but if they do, show nothing)
        return [];
      }

      const querySnapshot = await getDocs(userQuery);
      const locations: UserLocation[] = [];

      for (const doc of querySnapshot.docs) {
        const userData = doc.data() as FirestoreUser;
        
        if (!userData.address) {
          console.warn(`User ${userData.name} has no address`);
          continue;
        }

        // Geocode the address
        const coordinates = await this.geocodeAddress(userData.address);
        
        if (coordinates) {
          locations.push({
            id: doc.id,
            name: userData.organizationName || userData.name,
            userType: userData.userType,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            address: userData.address,
          });
        }
      }

      return locations;
    } catch (error) {
      console.error('Error fetching user locations:', error);
      throw new Error('Failed to fetch user locations');
    }
  }

  /**
   * Get a specific user's location by ID
   */
  static async getUserLocationById(userId: string): Promise<UserLocation | null> {
    try {
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('__name__', '==', userId));
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const userData = doc.data() as FirestoreUser;

      if (!userData.address) {
        return null;
      }

      const coordinates = await this.geocodeAddress(userData.address);
      
      if (coordinates) {
        return {
          id: doc.id,
          name: userData.organizationName || userData.name,
          userType: userData.userType,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: userData.address,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user location by ID:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}