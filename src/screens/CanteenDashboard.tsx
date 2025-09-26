import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../services/AuthService';
import { User } from '../models/User';
import FoodSurplusService from '../services/FoodSurplusService'; // Ensure this is imported correctly
import { FoodSurplus } from '../models/FoodSurplus';
import { Ionicons } from '@expo/vector-icons';


// --- TYPES for Menu Recommendation (Kept for reference) ---
interface MenuItem {
  dish_name: string;
  food_id: string;
  veg_nonveg: 'Veg' | 'Non-Veg';
  cuisine: string;
  waste_score_pct: number;
  estimated_prep_time_hours: number;
}
// Note: OPTIMIZED_MENU_RESULT data removed from this file to keep it clean.


const CanteenDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [todayStats, setTodayStats] = useState({
    totalSurplus: 0,
    redistributed: 0,
    peopleFed: 0,
    carbonSaved: 0,
  });
  const [recentActivity, setRecentActivity] = useState<FoodSurplus[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
        loadTodayStats();
    }
  }, [user]);

  const loadUserData = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);
  };

  const loadTodayStats = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return;
      
      // --- FIX 1: Correctly calling the Singleton Service (Fixes TypeError) ---
      const items = await FoodSurplusService.getInstance().getFoodSurplusByCanteen(currentUser.id);
      // --------------------------------------------------------

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const createdToday = items.filter(i => i.createdAt >= startOfDay && i.createdAt < endOfDay);
      const collectedToday = items.filter(i => i.status === 'collected' && (i.updatedAt || i.createdAt) >= startOfDay && (i.updatedAt || i.createdAt) < endOfDay);

      const totalSurplus = createdToday.length;
      const redistributed = collectedToday.length;
      const peopleFed = collectedToday.reduce((sum, i) => sum + (i.quantity || 0), 0);
      const carbonSaved = Math.round(peopleFed * 2.5); 

      setTodayStats({ totalSurplus, redistributed, peopleFed, carbonSaved });
      setRecentActivity(items.slice(0, 5));
    } catch (error) {
      console.error('Failed to load canteen stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadTodayStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            navigation.navigate('LoginScreen' as never);
          },
        },
      ]
    );
  };

  const navigateToAddSurplus = () => {
    navigation.navigate('AddSurplusScreen' as never); 
  };

  const navigateToSurplusList = () => {
    navigation.navigate('SurplusListScreen' as never);
  };

  // --- NAVIGATION: Pushes MenuPlannerScreen onto the stack ---
  const navigateToMenuPlanner = () => {
    // This requires MenuPlannerScreen to be registered in the main stack (AppNavigator)
    navigation.navigate('MenuPlannerScreen' as never);
  };
  // --------------------------

  const navigateToProfile = () => {
    navigation.navigate('ProfileScreen' as never);
  };

  const navigateToMessages = () => {
    navigation.navigate('Messages' as never);
  };


  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.canteenName}>{user?.canteenName || user?.name}</Text>
          <Text style={styles.greenScore}>Green Score: {user?.greenScore || 0}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Impact</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.totalSurplus}</Text>
            <Text style={styles.statLabel}>Surplus Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.redistributed}</Text>
            <Text style={styles.statLabel}>Redistributed</Text>
          </View>
          {/* --- FIX 2: Corrected JSX closing tag (View) --- */}
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.peopleFed}</Text>
            <Text style={styles.statLabel}>People Fed (kg)</Text>
          </View>
          {/* ------------------------------------------------ */}
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.carbonSaved}kg</Text>
            <Text style={styles.statLabel}>CO₂ Saved</Text>
          </View>
        </View>
      </View>


      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={navigateToAddSurplus}>
            <Text style={styles.actionIcon}>📱</Text>
            <Text style={styles.actionTitle}>Log Surplus</Text>
            <Text style={styles.actionSubtitle}>ML-optimized waste entry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToSurplusList}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>View Surplus</Text>
            <Text style={styles.actionSubtitle}>Manage listed items</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToMenuPlanner}> {/* --- NEW ROUTE: MenuPlannerScreen --- */}
            <Text style={styles.actionIcon}>🍲</Text>
            <Text style={styles.actionTitle}>Menu Planner</Text>
            <Text style={styles.actionSubtitle}>ML-optimized weekly menu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToMessages}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionSubtitle}>Chat with NGOs</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.length === 0 ? (
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>No recent activity</Text>
              <Text style={styles.activityTime}></Text>
            </View>
          ) : (
            recentActivity.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <Text style={styles.activityText}>
                  {item.foodName} {item.status === 'claimed' ? `claimed by ${item.claimerName || 'NGO'}` : item.status === 'collected' ? `collected by ${item.claimerName || 'NGO'}` : item.status === 'expired' ? 'expired' : 'added'}
                </Text>
                <Text style={styles.activityTime}>{formatTimeAgo(item.updatedAt || item.createdAt)}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  canteenName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  greenScore: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentActivity: {
    padding: 20,
    paddingTop: 0,
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CanteenDashboard;

// Helper to format time ago
const formatTimeAgo = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} min ago`;
  }
  return `${diffHours} hours ago`;
};
