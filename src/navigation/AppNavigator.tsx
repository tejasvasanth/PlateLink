import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
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
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
// --- NEW IMPORT ---
import MenuPlannerScreen from '../screens/MenuPlannerScreen'; 

// Import navigators
import DriverTabNavigator from './DriverTabNavigator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder component for screens not yet implemented
const PlaceholderScreen = ({ route }: any) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, textAlign: 'center' }}>
                {route.name} Screen
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }}>
                This screen will be implemented soon
            </Text>
        </View>
    );
};


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
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text>,
        }}
      />
      {/* Retaining the original tab structure per user request */}
      <Tab.Screen 
        name="Messages" 
        component={ChatListScreen}
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

// NGO Tab Navigator (Kept as Placeholder in the file)
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
        component={ChatListScreen}
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

// Main App Navigator
const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state updates so navigation tree updates after login/logout
    const unsubscribe = AuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
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
            
            {/* Global Stack Screens that can be pushed onto the stack */}
            <Stack.Screen 
              name="ProfileScreen" 
              component={PlaceholderScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="AddSurplusScreen" 
              component={SurplusScreen} 
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="SurplusListScreen" 
              component={PlaceholderScreen}
            />
            {/* --- CRITICAL: Register the MenuPlannerScreen in the Stack --- */}
            <Stack.Screen 
              name="MenuPlannerScreen" 
              component={MenuPlannerScreen}
            />
            {/* ----------------------------------------------------------- */}
            <Stack.Screen 
              name="AnalyticsScreen" 
              component={PlaceholderScreen}
            />
            <Stack.Screen 
              name="ChatListScreen" 
              component={ChatListScreen}
            />
            <Stack.Screen 
              name="ChatScreen" 
              component={ChatScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;