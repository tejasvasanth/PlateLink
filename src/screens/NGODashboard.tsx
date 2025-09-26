import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../services/AuthService';
import { User } from '../models/User';
import FoodSurplusService from '../services/FoodSurplusService';
import { FoodSurplus } from '../models/FoodSurplus';

const NGODashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    availableSurplus: 0,
    claimed: 0,
    peopleFed: 0,
    impactScore: 0,
  });
  const [urgentFood, setUrgentFood] = useState<FoodSurplus[]>([]);
  const [recentActivity, setRecentActivity] = useState<FoodSurplus[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    loadTodayStats();
  }, [user]);

  const loadUserData = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);
  };

  const loadTodayStats = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      if (!currentUser) return;
      const available = await FoodSurplusService.getAvailableFoodSurplus();
      const claimedByMe = await FoodSurplusService.getClaimedFoodSurplus(currentUser.id);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const claimedToday = claimedByMe.filter(i => i.claimedAt && i.claimedAt >= startOfDay && i.claimedAt < endOfDay);
      const peopleFed = claimedToday
        .filter(i => i.status === 'collected')
        .reduce((sum, i) => sum + (i.quantity || 0), 0);

      setTodayStats({
        availableSurplus: available.length,
        claimed: claimedToday.length,
        peopleFed,
        impactScore: currentUser.impactScore || 0,
      });

      setUrgentFood(available.slice(0, 3));
      setRecentActivity(claimedByMe.slice(0, 3));
    } catch (error) {
      console.error('Failed to load NGO stats:', error);
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

  const navigateToNearbyFood = () => {
    navigation.navigate('NearbyFoodScreen' as never);
  };

  const navigateToClaimedFood = () => {
    navigation.navigate('ClaimedFoodScreen' as never);
  };

  const navigateToAnalytics = () => {
    navigation.navigate('AnalyticsScreen' as never);
  };

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
          <Text style={styles.organizationName}>{user?.organizationName || user?.name}</Text>
          <Text style={styles.impactScore}>Impact Score: {user?.impactScore || 0}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.availableSurplus}</Text>
            <Text style={styles.statLabel}>Available Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.claimed}</Text>
            <Text style={styles.statLabel}>Claimed Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.peopleFed}</Text>
            <Text style={styles.statLabel}>People Fed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayStats.impactScore}%</Text>
            <Text style={styles.statLabel}>Impact Score</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={navigateToNearbyFood}>
            <Text style={styles.actionIcon}>🍽️</Text>
            <Text style={styles.actionTitle}>Find Food</Text>
            <Text style={styles.actionSubtitle}>Browse nearby surplus</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToClaimedFood}>
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionTitle}>My Claims</Text>
            <Text style={styles.actionSubtitle}>View claimed items</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToAnalytics}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Analytics</Text>
            <Text style={styles.actionSubtitle}>View impact reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToMessages}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionSubtitle}>Chat with canteens</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.urgentFood}>
        <Text style={styles.sectionTitle}>Urgent Pickups</Text>
        <View style={styles.urgentList}>
          {urgentFood.length === 0 ? (
            <View style={styles.urgentItem}>
              <View style={styles.urgentInfo}>
                <Text style={styles.urgentTitle}>No urgent pickups</Text>
              </View>
            </View>
          ) : (
            urgentFood.map(item => (
              <View key={item.id} style={styles.urgentItem}>
                <View style={styles.urgentInfo}>
                  <Text style={styles.urgentTitle}>{item.foodName}</Text>
                  <Text style={styles.urgentCanteen}>{item.canteenName}</Text>
                  <Text style={styles.urgentTime}>Expires in {formatHoursUntil(item.expiryTime)} hours</Text>
                </View>
                <TouchableOpacity style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>Claim</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
            recentActivity.map(item => (
              <View key={item.id} style={styles.activityItem}>
                <Text style={styles.activityText}>
                  {item.foodName} {item.status === 'collected' ? 'collected' : 'claimed'} from {item.canteenName}
                </Text>
                <Text style={styles.activityTime}>{formatTimeAgo(item.claimedAt || item.updatedAt || item.createdAt)}</Text>
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
    backgroundColor: '#2196F3',
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
  organizationName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  impactScore: {
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
    color: '#2196F3',
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
  urgentFood: {
    padding: 20,
    paddingTop: 0,
  },
  urgentList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  urgentInfo: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  urgentCanteen: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  urgentTime: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: '500',
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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

export default NGODashboard;

const formatTimeAgo = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} min ago`;
  }
  return `${diffHours} hours ago`;
};

const formatHoursUntil = (date: Date) => {
  const diffMs = date.getTime() - Date.now();
  const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
  return diffHours;
};