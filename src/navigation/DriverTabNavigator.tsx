import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Import screens
import NGODashboard from '../screens/NGODashboard';
import SurplusScreen from '../screens/SurplusScreen';
import ChatListScreen from '../screens/ChatListScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import MapScreen from '../screens/MapScreen';

const Tab = createBottomTabNavigator();

// Driver Tab Navigator (similar to NGO but with driver-specific context)
const DriverTabNavigator = () => {
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
        name="Deliveries" 
        component={require('../screens/DriverDeliveriesScreen').default}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🚚</Text>,
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
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default DriverTabNavigator;