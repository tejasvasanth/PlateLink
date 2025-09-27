import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/AuthService';
import { User } from '../models/User';
import FoodSurplusService from '../services/FoodSurplusService';
import { FoodSurplus } from '../models/FoodSurplus';
import { wp, hp, rf, rs } from '../utils/responsive';
import theme from '../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DriverDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    availableDeliveries: 0,
    completedDeliveries: 0,
  });
  const navigation = useNavigation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const statsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const actionsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    loadUserData();
    startAnimations();
  }, []);

  useEffect(() => {
    loadTodayStats();
  }, [user]);

  const startAnimations = () => {
    // Main entrance animations
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

    // Staggered animations for stats cards
    const statsStagger = statsAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      })
    );

    // Staggered animations for action cards
    const actionsStagger = actionsAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 400 + index * 100,
        useNativeDriver: true,
      })
    );

    Animated.parallel([...statsStagger, ...actionsStagger]).start();
  };

  const loadUserData = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);
  };

  const loadTodayStats = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      if (!currentUser) return;

      // Get actual available deliveries that need drivers
      const availableDeliveries = await FoodSurplusService.getClaimedSurplusNeedingDrivers();
      const assignedDeliveries = await FoodSurplusService.getDriverAssignedSurplus(currentUser.id);
      
      // Filter completed deliveries (those with ngoDeliveryVerifiedAt set)
      const completedToday = assignedDeliveries.filter(delivery => 
        delivery.ngoDeliveryVerifiedAt && 
        delivery.ngoDeliveryVerifiedAt.getDate() === new Date().getDate()
      ).length;

      setTodayStats({
        availableDeliveries: availableDeliveries.length,
        completedDeliveries: completedToday,
      });
    } catch (error) {
      console.error('Failed to load driver stats:', error);
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

  const navigateToDeliveries = () => {
    navigation.navigate('Deliveries' as never);
  };

  const navigateToMap = () => {
    navigation.navigate('Map' as never);
  };

  const navigateToProfile = () => {
    navigation.navigate('ProfileScreen' as never);
  };

  const navigateToMessages = () => {
    navigation.navigate('Messages' as never);
  };

  const animateCardPress = (callback: () => void) => {
    const scaleValue = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const getStatIcon = (index: number) => {
    const icons = ['car', 'checkmark-circle'];
    return icons[index];
  };

  const getStatColor = (index: number) => {
    const colors = [
      theme?.colors?.gradients?.accent || ['#B0E0E6', '#87CEEB'],
      theme?.colors?.gradients?.success || ['#20B2AA', '#008B8B'],
    ];
    return colors[index];
  };

  const getActionIcon = (index: number) => {
    const icons = ['car-sport', 'map', 'chatbubbles'];
    return icons[index];
  };

  const getActionColor = (index: number) => {
    const colors = [
      theme?.colors?.gradients?.primary || ['#87CEEB', '#4682B4'],
      theme?.colors?.gradients?.accent || ['#B0E0E6', '#87CEEB'],
      theme?.colors?.gradients?.success || ['#20B2AA', '#008B8B'],
    ];
    return colors[index];
  };

  return (
    <LinearGradient
      colors={theme?.colors?.gradients?.background || ['#F0F8FF', '#E0F6FF']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#fff']}
          />
        }
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.driverName}>{user?.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>Driver Rating: {user?.rating || '4.8'}/5</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => animateCardPress(navigateToProfile)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.profileButtonGradient}
            >
              <Ionicons name="person" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Container */}
        <Animated.View 
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            {[
              { value: todayStats.availableDeliveries, label: 'Available Deliveries' },
              { value: todayStats.completedDeliveries, label: 'Completed Today' },
            ].map((stat, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.statCardContainer,
                  {
                    opacity: statsAnimations[index],
                    transform: [{
                      translateY: statsAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    }],
                  }
                ]}
              >
                <LinearGradient
                  colors={getStatColor(index)}
                  style={styles.statCard}
                >
                  <View style={styles.statIconContainer}>
                    <Ionicons 
                      name={getStatIcon(index) as any} 
                      size={28} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {[
              { title: 'Find Deliveries', subtitle: 'View available rides', onPress: navigateToDeliveries },
              { title: 'Map', subtitle: 'View delivery routes', onPress: navigateToMap },
              { title: 'Messages', subtitle: 'Chat with partners', onPress: navigateToMessages },
            ].map((action, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.actionCardContainer,
                  {
                    opacity: actionsAnimations[index],
                    transform: [{
                      translateY: actionsAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    }],
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => animateCardPress(action.onPress)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={getActionColor(index)}
                    style={styles.actionCardGradient}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons 
                        name={getActionIcon(index) as any} 
                        size={32} 
                        color="#fff" 
                      />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Driver Status Card */}
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Driver Status</Text>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={styles.statusCard}
          >
            <View style={styles.statusHeader}>
              <View style={styles.statusIconContainer}>
                <Ionicons name="car-sport" size={24} color="#FF6B35" />
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>Ready for Deliveries</Text>
                <Text style={styles.statusSubtitle}>You're online and available</Text>
              </View>
              <View style={styles.statusIndicator}>
                <View style={styles.onlineIndicator} />
              </View>
            </View>
            
            <View style={styles.statusStats}>
              <View style={styles.statusStatItem}>
                <Text style={styles.statusStatNumber}>{user?.totalDeliveries || 0}</Text>
                <Text style={styles.statusStatLabel}>Total Deliveries</Text>
              </View>
              <View style={styles.statusStatDivider} />
              <View style={styles.statusStatItem}>
                <Text style={styles.statusStatNumber}>{user?.rating || '4.8'}</Text>
                <Text style={styles.statusStatLabel}>Rating</Text>
              </View>
              <View style={styles.statusStatDivider} />
              <View style={styles.statusStatItem}>
                <Text style={styles.statusStatNumber}>{user?.totalEarnings || '$0'}</Text>
                <Text style={styles.statusStatLabel}>Earnings</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.logoutButtonGradient}
            >
              <Ionicons name="log-out" size={20} color="#fff" style={styles.logoutIcon} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
    paddingBottom: hp(2),
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    ...theme.typography.body,
    color: theme.colors.text.light,
    marginBottom: hp(0.5),
  },
  driverName: {
    ...theme.typography.title,
    color: theme.colors.text.light,
    marginBottom: hp(1),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...theme.typography.caption,
    color: theme.colors.text.light,
    marginLeft: wp(1),
  },
  profileButton: {
    position: 'absolute',
    top: hp(6),
    right: wp(5),
    width: rs(45),
    height: rs(45),
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  profileButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: wp(1),
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  statCardGradient: {
    padding: wp(3),
    alignItems: 'center',
    minHeight: hp(10),
    justifyContent: 'center',
  },
  statIconContainer: {
    marginBottom: hp(0.8),
  },
  statNumber: {
    ...theme.typography.heading,
    color: theme.colors.text.light,
    marginBottom: hp(0.2),
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.light,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  actionsTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text.light,
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    marginHorizontal: wp(1),
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  actionCardGradient: {
    padding: wp(3),
    alignItems: 'center',
    minHeight: hp(12),
    justifyContent: 'center',
  },
  actionIconContainer: {
    marginBottom: hp(0.8),
  },
  actionTitle: {
    ...theme.typography.body,
    color: theme.colors.text.light,
    marginBottom: hp(0.3),
    textAlign: 'center',
  },
  actionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.light,
    textAlign: 'center',
  },
  statusContainer: {
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  statusCard: {
    borderRadius: theme.borderRadius.large,
    padding: wp(4),
    backgroundColor: theme.colors.background.card,
    ...theme.shadows.medium,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  statusIconContainer: {
    width: rs(50),
    height: rs(50),
    borderRadius: rs(25),
    backgroundColor: theme.colors.background.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text.primary,
    marginBottom: hp(0.2),
  },
  statusSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  onlineIndicator: {
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: theme?.colors?.status?.success || '#20B2AA',
    ...theme.shadows.small,
  },
  statusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  statusStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusStatNumber: {
    ...theme.typography.heading,
    color: theme.colors.primary,
    marginBottom: hp(0.2),
  },
  statusStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statusStatDivider: {
    width: 1,
    height: hp(4),
    backgroundColor: theme.colors.border.light,
  },
  logoutContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
  },
  logoutButton: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(1.8),
  },
  logoutIcon: {
    marginRight: wp(2),
  },
  logoutButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.light,
  },
});

export default DriverDashboard;