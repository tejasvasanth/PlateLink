import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import AuthService from '../services/AuthService';
import { User } from '../models/User';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CanteenDashboard from '../screens/CanteenDashboard';
import NGODashboard from '../screens/NGODashboard';
import SurplusScreen from '../screens/SurplusScreen';
import MessagesScreen from '../screens/MessagesScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import MapScreen from '../screens/MapScreen';

// Import navigators
import DriverTabNavigator from './DriverTabNavigator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Canteen Tab Navigator
const CanteenTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={CanteenDashboard}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Surplus" 
        component={SurplusScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📱</Text>,
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text>,
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// NGO Tab Navigator
const NGOTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={NGODashboard}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Find Food" 
        component={SurplusScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🍽️</Text>,
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text>,
        }}
      />
      <Tab.Screen 
        name="Impact" 
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🌱</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// Placeholder component for screens not yet implemented
const PlaceholderScreen = ({ route }: any) => {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20 
    }}>
      <Text style={{ fontSize: 18, textAlign: 'center' }}>
        {route.name} Screen
      </Text>
      <Text style={{ fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }}>
        This screen will be implemented soon
      </Text>
    </View>
  );
};

const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Subscribe to auth state updates so navigation tree updates after login/logout
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return unsubscribe;
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth screens
          <>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          </>
        ) : (
          // Main app screens based on user type
          <>
            {user.userType === 'canteen' ? (
              <Stack.Screen name="CanteenTabs" component={CanteenTabNavigator} />
            ) : user.userType === 'driver' ? (
              <Stack.Screen name="DriverTabs" component={DriverTabNavigator} />
            ) : (
              <Stack.Screen name="NGOTabs" component={NGOTabNavigator} />
            )}
            
            {/* Modal screens that can be accessed from any tab */}
            <Stack.Screen 
              name="ProfileScreen" 
              component={PlaceholderScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="AddSurplusScreen" 
              component={PlaceholderScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="SurplusListScreen" 
              component={PlaceholderScreen}
            />
            <Stack.Screen 
              name="NearbyFoodScreen" 
              component={PlaceholderScreen}
            />
            <Stack.Screen 
              name="ClaimedFoodScreen" 
              component={PlaceholderScreen}
            />
            <Stack.Screen 
              name="AnalyticsScreen" 
              component={PlaceholderScreen}
            />
            <Stack.Screen 
              name="ChatListScreen" 
              component={PlaceholderScreen}
            />
            <Stack.Screen 
              name="ChatScreen" 
              component={PlaceholderScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;