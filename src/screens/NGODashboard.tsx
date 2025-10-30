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
  StatusBar,
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

  // Helper function to format hours until expiry
  const formatHoursUntil = (expiryTime: Date) => {
    const now = new Date();
    const diffMs = expiryTime.getTime() - now.getTime();
    const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
    return diffHours;
  };

  // Helper function to format time ago
  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min ago`;
    }
    return `${diffHours} hours ago`;
  };

  // Enhanced Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerRotation = useRef(new Animated.Value(0)).current;
  const statsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const actionsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const urgentAnimations = useRef(new Animated.Value(0)).current;
  const activityAnimations = useRef(new Animated.Value(0)).current;

  // Floating animation for urgent items
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    startAnimations();
    startFloatingAnimation();
  }, []);

  useEffect(() => {
    loadTodayStats();
  }, [user]);

  const startFloatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startAnimations = () => {
    // Enhanced entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(headerRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Enhanced staggered animations for stats cards
    const statsStagger = statsAnimations.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        delay: index * 200,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    );

    // Enhanced staggered animations for action cards
    const actionsStagger = actionsAnimations.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        delay: 600 + index * 150,
        tension: 45,
        friction: 6,
        useNativeDriver: true,
      })
    );

    // Enhanced animations for other sections
    const urgentAnimation = Animated.spring(urgentAnimations, {
      toValue: 1,
      delay: 1200,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    });

    const activityAnimation = Animated.spring(activityAnimations, {
      toValue: 1,
      delay: 1400,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    });

    Animated.parallel([
      ...statsStagger,
      ...actionsStagger,
      urgentAnimation,
      activityAnimation,
    ]).start();
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
    navigation.navigate('PickupRequestsScreen' as never);
  };

  const navigateToClaimedFood = () => {
    navigation.navigate('ClaimedFoodScreen' as never);
  };

  const navigateToAnalytics = () => {
    navigation.navigate('AnalyticsScreen' as never, { mode: 'ar' } as never);
  };

  const navigateToProfile = () => {
    navigation.navigate('ProfileScreen' as never);
  };

  const navigateToMessages = () => {
    navigation.navigate('ChatListScreen' as never);
  };

  const animateCardPress = (callback: () => void) => {
    const scaleValue = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const getStatIcon = (index: number) => {
    const icons = ['restaurant', 'checkmark-circle', 'people', 'trophy'];
    return icons[index];
  };

  const getStatColor = (index: number) => {
    const colors = [
      ['#667eea', '#764ba2'], // Purple to blue
      ['#f093fb', '#f5576c'], // Pink to red
      ['#4facfe', '#00f2fe'], // Blue to cyan
      ['#43e97b', '#38f9d7'], // Green to teal
    ];
    return colors[index];
  };

  const getActionIcon = (index: number) => {
    const icons = ['search', 'checkmark-done', 'analytics', 'chatbubbles'];
    return icons[index];
  };

  const getActionColor = (index: number) => {
    const colors = [
      ['#ff9a9e', '#fecfef'], // Pink gradient
      ['#a8edea', '#fed6e3'], // Teal to pink
      ['#ffecd2', '#fcb69f'], // Orange gradient
      ['#d299c2', '#fef9d7'], // Purple to yellow
    ];
    return colors[index];
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
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
          {/* Enhanced Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  {
                    rotateX: headerRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['15deg', '0deg'],
                    }),
                  },
                ]
              }
            ]}
          >
            <View style={styles.headerContent}>
              <Animated.Text 
                style={[
                  styles.welcomeText,
                  {
                    transform: [{
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    }],
                  }
                ]}
              >
                Welcome back,
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.organizationName,
                  {
                    transform: [{
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    }],
                  }
                ]}
              >
                {user?.organizationName || user?.name}
              </Animated.Text>
              <Animated.View 
                style={[
                  styles.impactScoreContainer,
                  {
                    transform: [{
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-25, 0],
                      }),
                    }],
                  }
                ]}
              >
                <View style={styles.impactBadge}>
                  <LinearGradient
                    colors={['rgba(255,215,0,0.9)', 'rgba(255,165,0,0.9)']}
                    style={styles.impactBadgeGradient}
                  >
                    <Ionicons name="trophy" size={14} color="#fff" />
                    <Text style={styles.impactScore}>Impact: {user?.impactScore || 0}%</Text>
                  </LinearGradient>
                </View>
              </Animated.View>
            </View>
            <Animated.View
              style={[
                styles.profileButton,
                {
                  transform: [
                    { scale: scaleAnim },
                    {
                      rotateY: headerRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['45deg', '0deg'],
                      }),
                    },
                  ],
                }
              ]}
            >
              <TouchableOpacity 
                onPress={() => animateCardPress(navigateToProfile)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.profileButtonGradient}
                >
                  <Ionicons name="person" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Enhanced Stats Container */}
          <Animated.View 
            style={[
              styles.statsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Today's Impact</Text>
            <View style={styles.statsGrid}>
              {[
                { value: todayStats.availableSurplus, label: 'Available Items', suffix: '' },
                { value: todayStats.claimed, label: 'Claimed Today', suffix: '' },
                { value: todayStats.peopleFed, label: 'People Fed', suffix: '' },
                { value: todayStats.impactScore, label: 'Impact Score', suffix: '%' },
              ].map((stat, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.statCardContainer,
                    {
                      opacity: statsAnimations[index],
                      transform: [
                        {
                          translateY: statsAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          }),
                        },
                        {
                          scale: statsAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                        {
                          rotateX: statsAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['45deg', '0deg'],
                          }),
                        },
                      ],
                    }
                  ]}
                >
                  <TouchableOpacity activeOpacity={0.9}>
                    <LinearGradient
                      colors={getStatColor(index)}
                      style={styles.statCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.statIconContainer}>
                        <View style={styles.statIconBg}>
                          <Ionicons 
                            name={getStatIcon(index) as any} 
                            size={26} 
                            color="#fff" 
                          />
                        </View>
                      </View>
                      <Text style={styles.statNumber}>{stat.value}{stat.suffix}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <View style={styles.statGlow} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Enhanced Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              {[
                { 
                  title: 'Find Food', 
                  subtitle: 'Discover available pickups', 
                  onPress: navigateToNearbyFood,
                  emoji: '🔍'
                },
                { 
                  title: 'My Claims', 
                  subtitle: 'Track claimed items', 
                  onPress: navigateToClaimedFood,
                  emoji: '✅'
                },
                { 
                  title: 'AR Analytics', 
                  subtitle: 'View impact reports', 
                  onPress: navigateToAnalytics,
                  emoji: '📊'
                },
                { 
                  title: 'Messages', 
                  subtitle: 'Chat with canteens', 
                  onPress: navigateToMessages,
                  emoji: '💬'
                },
              ].map((action, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.actionCardContainer,
                    {
                      opacity: actionsAnimations[index],
                      transform: [
                        {
                          translateY: actionsAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          }),
                        },
                        {
                          scale: actionsAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
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
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconContainer}>
                        <View style={styles.actionIconBg}>
                          <Ionicons 
                            name={getActionIcon(index) as any} 
                            size={28} 
                            color="#fff" 
                          />
                        </View>
                        <Text style={styles.actionEmoji}>{action.emoji}</Text>
                      </View>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                      <View style={styles.actionGlow} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Enhanced Urgent Pickups */}
          <Animated.View 
            style={[
              styles.urgentFood,
              {
                opacity: urgentAnimations,
                transform: [{
                  translateY: urgentAnimations.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Urgent Pickups</Text>
              <Animated.View
                style={{
                  transform: [{
                    translateY: floatingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  }],
                }}
              >
                <Ionicons name="flame" size={24} color="#FF6B35" />
              </Animated.View>
            </View>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.urgentList}
            >
              {urgentFood.length === 0 ? (
                <View style={styles.urgentItem}>
                  <View style={styles.urgentIconContainer}>
                    <LinearGradient
                      colors={['#e0e0e0', '#f5f5f5']}
                      style={styles.urgentIconBg}
                    >
                      <Ionicons name="time" size={22} color="#999" />
                    </LinearGradient>
                  </View>
                  <View style={styles.urgentInfo}>
                    <Text style={styles.urgentTitle}>No urgent pickups</Text>
                    <Text style={styles.urgentSubtitle}>Check back later for available food</Text>
                  </View>
                </View>
              ) : (
                urgentFood.map((item, index) => (
                  <View key={item.id} style={styles.urgentItem}>
                    <View style={styles.urgentIconContainer}>
                      <LinearGradient
                        colors={['#FF6B35', '#FF8E53']}
                        style={styles.urgentIconBg}
                      >
                        <Ionicons name="restaurant" size={22} color="#fff" />
                      </LinearGradient>
                    </View>
                    <View style={styles.urgentInfo}>
                      <Text style={styles.urgentTitle}>{item.foodName}</Text>
                      <Text style={styles.urgentCanteen}>{item.canteenName}</Text>
                      <Text style={styles.urgentTime}>
                        ⏰ Expires in {formatHoursUntil(item.expiryTime)} hours
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.claimButton}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#4CAF50', '#45A049']}
                        style={styles.claimButtonGradient}
                      >
                        <Text style={styles.claimButtonText}>Claim</Text>
                        <Ionicons name="arrow-forward" size={14} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </LinearGradient>
          </Animated.View>

          {/* Enhanced Recent Activity */}
          <Animated.View 
            style={[
              styles.recentActivity,
              {
                opacity: activityAnimations,
                transform: [{
                  translateY: activityAnimations.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.activityList}
            >
              {recentActivity.length === 0 ? (
                <View style={styles.activityItem}>
                  <View style={styles.activityIconContainer}>
                    <LinearGradient
                      colors={['#e0e0e0', '#f5f5f5']}
                      style={styles.activityIconBg}
                    >
                      <Ionicons name="time" size={20} color="#999" />
                    </LinearGradient>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>No recent activity</Text>
                    <Text style={styles.activityTime}>Start by claiming food items</Text>
                  </View>
                </View>
              ) : (
                recentActivity.map((item, index) => (
                  <View key={item.id} style={styles.activityItem}>
                    <View style={styles.activityIconContainer}>
                      <LinearGradient
                        colors={item.status === 'collected' ? ['#4CAF50', '#45A049'] : ['#FF9800', '#F57C00']}
                        style={styles.activityIconBg}
                      >
                        <Ionicons 
                          name={item.status === 'collected' ? 'checkmark-circle' : 'hand-left'} 
                          size={20} 
                          color="#fff"
                        />
                      </LinearGradient>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {item.foodName} {item.status === 'collected' ? 'collected' : 'claimed'} from {item.canteenName}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatTimeAgo(item.claimedAt || item.updatedAt || item.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.activityArrow}>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    </View>
                  </View>
                ))
              )}
            </LinearGradient>
          </Animated.View>

          {/* Enhanced Logout Button */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.logoutButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="log-out" size={20} color="#fff" style={styles.logoutIcon} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(8),
    paddingBottom: hp(3),
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: rf(16),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: hp(0.5),
    fontWeight: '400',
  },
  organizationName: {
    fontSize: rf(28),
    fontWeight: '800',
    color: '#fff',
    marginBottom: hp(1),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  impactScoreContainer: {
    marginTop: hp(0.5),
  },
  impactBadge: {
    alignSelf: 'flex-start',
    borderRadius: rs(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  impactBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
  },
  impactScore: {
    fontSize: rf(12),
    color: '#fff',
    marginLeft: wp(1.5),
    fontWeight: '700',
  },
  profileButton: {
    borderRadius: rs(30),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileButtonGradient: {
    width: rs(60),
    height: rs(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: wp(5),
    marginBottom: hp(4),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCardContainer: {
    width: '48%',
    marginBottom: hp(2.5),
  },
  statCard: {
    borderRadius: rs(20),
    padding: wp(5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  statIconContainer: {
    marginBottom: hp(1.5),
  },
  statIconBg: {
    width: rs(50),
    height: rs(50),
    borderRadius: rs(25),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statNumber: {
    fontSize: rf(28),
    fontWeight: '900',
    color: '#fff',
    marginBottom: hp(0.5),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: rf(13),
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    fontWeight: '600',
  },
  statGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: rs(20),
  },
  quickActions: {
    paddingHorizontal: wp(5),
    marginBottom: hp(4),
  },
  sectionTitle: {
    fontSize: rf(22),
    fontWeight: '800',
    color: '#fff',
    marginBottom: hp(2.5),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2.5),
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCardContainer: {
    width: '48%',
    marginBottom: hp(2.5),
  },
  actionCard: {
    borderRadius: rs(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  actionCardGradient: {
    padding: wp(5),
    alignItems: 'center',
    minHeight: hp(14),
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  actionIconContainer: {
    alignItems: 'center',
    marginBottom: hp(1.5),
    position: 'relative',
  },
  actionIconBg: {
    width: rs(55),
    height: rs(55),
    borderRadius: rs(27.5),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  actionEmoji: {
    fontSize: rf(20),
    position: 'absolute',
    top: -5,
    right: -5,
  },
  actionTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: hp(0.5),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionSubtitle: {
    fontSize: rf(12),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: rs(20),
  },
  urgentFood: {
    paddingHorizontal: wp(5),
    marginBottom: hp(4),
  },
  urgentList: {
    borderRadius: rs(20),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  urgentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  urgentIconContainer: {
    marginRight: wp(4),
  },
  urgentIconBg: {
    width: rs(45),
    height: rs(45),
    borderRadius: rs(22.5),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  urgentInfo: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp(0.3),
  },
  urgentCanteen: {
    fontSize: rf(13),
    color: '#666',
    marginBottom: hp(0.3),
    fontWeight: '500',
  },
  urgentTime: {
    fontSize: rf(12),
    color: '#FF6B35',
    fontWeight: '700',
  },
  urgentSubtitle: {
    fontSize: rf(14),
    color: '#666',
    fontStyle: 'italic',
  },
  claimButton: {
    borderRadius: rs(25),
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
  },
  claimButtonText: {
    color: '#fff',
    fontSize: rf(13),
    fontWeight: '700',
    marginRight: wp(1),
  },
  recentActivity: {
    paddingHorizontal: wp(5),
    marginBottom: hp(3),
  },
  activityList: {
    borderRadius: rs(20),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  activityIconContainer: {
    marginRight: wp(4),
  },
  activityIconBg: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: rf(14),
    color: '#333',
    fontWeight: '600',
    marginBottom: hp(0.3),
    lineHeight: rf(18),
  },
  activityTime: {
    fontSize: rf(12),
    color: '#888',
    fontWeight: '500',
  },
  activityArrow: {
    marginLeft: wp(2),
  },
  logoutContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  logoutButton: {
    borderRadius: rs(15),
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  logoutIcon: {
    marginRight: wp(2),
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: '700',
  },
});

export default NGODashboard;
