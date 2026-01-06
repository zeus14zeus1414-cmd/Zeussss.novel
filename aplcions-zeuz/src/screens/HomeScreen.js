
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Dimensions,
  AppState,
  Modal,
  TouchableWithoutFeedback,
  Easing,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useApp } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// تحديد ما إذا كانت الشاشة كبيرة (تابلت) أم صغيرة (جوال)
const isLargeScreen = width > 600;

// دالة مساعدة لحساب الوقت المنقضي
const getTimeAgo = (date) => {
  if (!date) return 'قريباً';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `منذ ${Math.floor(interval)} سنة`;
  interval = seconds / 2592000;
  if (interval > 1) return `منذ ${Math.floor(interval)} شهر`;
  interval = seconds / 86400;
  if (interval > 1) return `منذ ${Math.floor(interval)} يوم`;
  interval = seconds / 3600;
  if (interval > 1) return `منذ ${Math.floor(interval)} ساعة`;
  interval = seconds / 60;
  if (interval > 1) return `منذ ${Math.floor(interval)} دقيقة`;
  return 'الآن';
};

// دالة مساعدة للحصول على لون الحالة واسمها
const getStatusConfig = (status) => {
    switch (status) {
        case 'مكتملة':
            return { color: '#27ae60', label: 'مكتملة' };
        case 'متوقفة':
            return { color: '#c0392b', label: 'متوقفة' };
        default:
            return { color: '#8e44ad', label: 'مستمرة' };
    }
};

// --- Component: Auto-Scrolling Carousel ---
const AutoScrollCarousel = ({ data, renderItem, itemWidth, interval = 4500, inverted = true }) => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const userTouched = useRef(false);
  const startTimeRef = useRef(Date.now());

  useFocusEffect(
    useCallback(() => {
        startTimeRef.current = Date.now();
        const timer = setInterval(() => {
            if (!userTouched.current && data.length > 0) {
                let nextIndex = currentIndex + 1;
                if (nextIndex >= data.length) nextIndex = 0;
                if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({
                        index: nextIndex,
                        animated: true,
                    });
                    setCurrentIndex(nextIndex);
                }
            }
        }, interval);
        return () => clearInterval(timer);
    }, [currentIndex, data.length, interval])
  );

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      horizontal
      inverted={inverted}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      snapToInterval={itemWidth + 15}
      decelerationRate="fast"
      onTouchStart={() => { userTouched.current = true; }}
      onTouchEnd={() => { setTimeout(() => { userTouched.current = false; }, 3000); }}
      onMomentumScrollEnd={(ev) => {
        const index = Math.round(ev.nativeEvent.contentOffset.x / (itemWidth + 15));
        setCurrentIndex(index);
      }}
      onScrollToIndexFailed={(info) => {
        flatListRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: true,
        });
      }}
    />
  );
};

// --- Component: Hero Carousel ---
const HeroCarousel = ({ data, navigation, scrollY }) => {
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const userTouched = useRef(false);
    const startTimeRef = useRef(Date.now());

    useFocusEffect(
        useCallback(() => {
            startTimeRef.current = Date.now();
            const timer = setInterval(() => {
                if (data.length > 1 && !userTouched.current) {
                    let nextIndex = currentIndex + 1;
                    if (nextIndex >= data.length) nextIndex = 0;
                    if (flatListRef.current) {
                        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
                        setCurrentIndex(nextIndex);
                    }
                }
            }, 5500);
            return () => clearInterval(timer);
        }, [currentIndex, data.length])
    );

    const imageScale = scrollY.interpolate({
        inputRange: [-150, 0],
        outputRange: [1.5, 1],
        extrapolate: 'clamp',
    });

    const renderItem = ({ item }) => {
        const statusConfig = getStatusConfig(item.status);
        return (
            <View style={{ width: width, height: 400 }}>
                <Image 
                    source={item.cover} 
                    style={StyleSheet.absoluteFillObject} 
                    contentFit="cover"
                    blurRadius={15}
                    transition={200}
                />
                <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']} 
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.heroContent}>
                    <View style={styles.heroInfoContainer}>
                         <View style={[styles.tagContainer, { backgroundColor: statusConfig.color, alignSelf: 'flex-end' }]}>
                            <Text style={styles.tagText}>{statusConfig.label}</Text>
                        </View>
                        <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.heroAuthor}>{item.author}</Text>
                        <View style={styles.heroStats}>
                             <View style={styles.heroStatItem}>
                                <Text style={styles.heroStatText}>{item.chaptersCount || 0} فصل</Text>
                                <Ionicons name="book" size={14} color="#4a7cc7" style={{marginLeft: 5}} />
                             </View>
                             <View style={styles.heroStatDivider} />
                             <View style={styles.heroStatItem}>
                                <Text style={[styles.heroStatText, {color: '#ccc'}]}>{item.views || 0}</Text>
                                <Ionicons name="eye" size={14} color="#888" style={{marginLeft: 5}} />
                             </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.heroReadButton}
                            onPress={() => navigation.navigate('NovelDetail', { novel: item })}
                        >
                            <Text style={styles.heroReadButtonText}>اقرأ الآن</Text>
                            <Ionicons name="arrow-back" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('NovelDetail', { novel: item })}
                        style={styles.heroPosterWrapper}
                    >
                        <Image 
                            source={item.cover} 
                            style={styles.heroPoster} 
                            contentFit="cover"
                            transition={500}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (data.length === 0) return null;

    return (
        <Animated.View style={{ transform: [{ scale: imageScale }], height: 400, overflow: 'hidden' }}>
            <FlatList
                ref={flatListRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                horizontal
                pagingEnabled
                inverted={true}
                showsHorizontalScrollIndicator={false}
                onTouchStart={() => { userTouched.current = true; }}
                onTouchEnd={() => { setTimeout(() => { userTouched.current = false; }, 4000); }}
                onMomentumScrollEnd={(ev) => {
                    const index = Math.round(ev.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />
        </Animated.View>
    );
};

const NovelCard = ({ item, onPress, size = 'normal' }) => {
  const cardWidth = size === 'large' ? 160 : 130;
  const cardHeight = size === 'large' ? 240 : 190;
  return (
    <TouchableOpacity 
      style={[styles.cardContainer, { width: cardWidth, marginLeft: 15 }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.imageContainer, { width: cardWidth, height: cardHeight }]}>
        <Image 
          source={item.cover} 
          style={[styles.cardImage, { width: cardWidth, height: cardHeight }]}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
        <View style={styles.chapterCountOverlay}>
          <Text style={styles.chapterCountText}>{item.chaptersCount || 0} فصل</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );
};

// --- PWA Install Banner ---
const PWAInstallBanner = () => {
    if (Platform.OS !== 'web') return null;

    // Check if standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return null;

    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(true);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowBanner(false);
            }
        } else {
            // iOS Instructions
            alert('لتثبيت التطبيق على الآيفون:\n1. اضغط على زر المشاركة في المتصفح\n2. اختر "إضافة إلى الشاشة الرئيسية"');
        }
    };

    if (!showBanner) return null;

    return (
        <View style={styles.pwaBanner}>
            <View style={styles.pwaContent}>
                <Image source={{uri: '/assets/logo.png'}} style={styles.pwaIcon} />
                <View style={{flex: 1}}>
                    <Text style={styles.pwaTitle}>تطبيق ZEUS</Text>
                    <Text style={styles.pwaDesc}>تجربة أفضل بملء الشاشة وبدون متصفح</Text>
                </View>
                <TouchableOpacity style={styles.pwaBtn} onPress={handleInstallClick}>
                    <Text style={styles.pwaBtnText}>تثبيت</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowBanner(false)} style={{marginLeft: 10}}>
                     <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function HomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastReadItem, setLastReadItem] = useState(null);
  
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifAnim = useRef(new Animated.Value(0)).current;

  const [trendingFilter, setTrendingFilter] = useState('day'); 
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      fetchLastRead();
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
        const res = await api.get('/api/notifications');
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.totalUnread || 0); 
    } catch (e) { console.log("Failed notifications"); }
  };

  const fetchLastRead = async () => {
    try {
        const lastReadRes = await api.get('/api/novel/library?type=history');
        if (lastReadRes.data && lastReadRes.data.length > 0) {
            setLastReadItem(lastReadRes.data[0]);
        }
    } catch (e) { console.log("Failed to fetch last read"); }
  };

  const fetchData = async () => {
    try {
      const featuredRes = await api.get('/api/novels?filter=featured&limit=5');
      setFeatured(featuredRes.data.novels || featuredRes.data || []);
      await fetchTrending(trendingFilter);
      const updatesRes = await api.get('/api/novels?filter=latest_updates&limit=24');
      setLatestUpdates(updatesRes.data.novels || updatesRes.data || []);
      const newRes = await api.get('/api/novels?filter=latest_added');
      setNewArrivals(newRes.data.novels || newRes.data || []);
      await fetchLastRead();
      await fetchNotifications();
    } catch (error) { console.error("Home fetch error:", error);
    } finally { setLoading(false); }
  };

  const fetchTrending = async (range) => {
    try {
      const res = await api.get(`/api/novels?filter=trending&timeRange=${range}`);
      setTrending(res.data.novels || res.data || []);
    } catch (error) { console.log(error); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchTrending(trendingFilter); }, [trendingFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleNotifications = () => {
      if (showNotifications) {
          Animated.timing(notifAnim, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start(() => setShowNotifications(false));
      } else {
          setShowNotifications(true);
          Animated.spring(notifAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
      }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderNotificationItem = ({ item }) => (
      <TouchableOpacity 
        style={styles.notifItem}
        onPress={() => { toggleNotifications(); navigation.navigate('NovelDetail', { novel: item }); }}
      >
          <View style={styles.notifContent}>
              <View style={{flex: 1}}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.notifTime}>{getTimeAgo(item.updatedAt)}</Text>
                  <View style={styles.notifBadgeRow}>
                      <View style={styles.notifChapterBadge}>
                          <Text style={styles.notifChapterText}>فصل {item.lastChapterNumber}</Text>
                      </View>
                  </View>
              </View>
          </View>
          <Image source={item.cover} style={styles.notifImage} contentFit="cover" />
      </TouchableOpacity>
  );

  const renderNotificationsDropdown = () => {
      if (!showNotifications) return null;
      const scaleY = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
      const translateY = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
      return (
          <View style={styles.dropdownOverlay} pointerEvents="box-none">
              <TouchableWithoutFeedback onPress={toggleNotifications}>
                  <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
              <Animated.View style={[styles.dropdownContainer, { opacity: notifAnim, transform: [{ scaleY }, { translateY }] }]}>
                  <View style={styles.dropdownArrow} />
                  <View style={styles.dropdownHeader}>
                      <Text style={styles.dropdownTitle}>تحديثات المفضلة</Text>
                      {unreadCount > 0 && <View style={styles.dropdownCountBadge}><Text style={styles.dropdownCountText}>{unreadCount} جديد</Text></View>}
                  </View>
                  {notifications.length === 0 ? (
                      <View style={styles.emptyNotif}>
                          <Ionicons name="notifications-off-outline" size={30} color="#555" />
                          <Text style={styles.emptyNotifText}>لا توجد تحديثات جديدة</Text>
                      </View>
                  ) : (
                      <FlatList data={notifications} renderItem={renderNotificationItem} keyExtractor={item => item._id} style={{maxHeight: 300}} />
                  )}
              </Animated.View>
          </View>
      );
  };

  const renderUpdateGridItem = ({ item }) => {
    const lastChapter = item.chapters && item.chapters.length > 0 ? item.chapters[item.chapters.length - 1] : null;
    return (
      <TouchableOpacity style={styles.gridCard} activeOpacity={0.8} onPress={() => navigation.navigate('NovelDetail', { novel: item })}>
        <Image source={item.cover} style={styles.gridImage} contentFit="cover" transition={300} cachePolicy="memory-disk" />
        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.gridChapterRow}>
            <Text style={styles.gridChapterText} numberOfLines={1}>{lastChapter ? `فصل ${lastChapter.number}: ${lastChapter.title || ''}` : 'قريباً'}</Text>
          </View>
          <View style={styles.gridTimeRow}>
            <Ionicons name="time-outline" size={14} color="#888" style={{ marginLeft: 6 }} />
            <Text style={styles.gridTimeText}>{getTimeAgo(item.lastChapterUpdate)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4a7cc7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {renderNotificationsDropdown()}

      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
             <TouchableOpacity onPress={() => navigation.navigate('Search')}><Ionicons name="search" size={24} color="#fff" /></TouchableOpacity>
             <Text style={styles.headerTitleSticky}>الرئيسية</Text>
             <TouchableOpacity style={styles.iconBtn} onPress={toggleNotifications}>
                <Ionicons name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={24} color="#fff" />
                {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" progressViewOffset={40} />}
      >
        <SafeAreaView style={styles.initialHeader}>
             <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerBtnInitial}><Ionicons name="search" size={24} color="#fff" /></TouchableOpacity>
             <TouchableOpacity style={styles.headerBtnInitial} onPress={toggleNotifications}>
                <Ionicons name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={24} color="#fff" />
                {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
             </TouchableOpacity>
        </SafeAreaView>

        <HeroCarousel data={featured} navigation={navigation} scrollY={scrollY} />

        <PWAInstallBanner />

        {lastReadItem && (
          <View style={styles.continueSection}>
            <Text style={styles.sectionTitleSimple}>استئناف القراءة</Text>
            <TouchableOpacity 
              style={styles.continueCard}
              onPress={() => navigation.navigate('Reader', { 
                novel: { ...lastReadItem, _id: lastReadItem.novelId }, 
                chapterId: lastReadItem.lastChapterId 
              })}
            >
              <Image source={lastReadItem.cover} style={styles.continueCover} contentFit="cover" cachePolicy="memory-disk" />
              <View style={styles.continueInfo}>
                <Text style={styles.continueTitle}>{lastReadItem.title}</Text>
                <Text style={styles.continueChapter}>{lastReadItem.lastChapterTitle || `الفصل ${lastReadItem.lastChapterId}`}</Text>
                <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${lastReadItem.progress || 0}%` }]} /></View>
                <Text style={styles.progressText}>{lastReadItem.progress || 0}% مكتمل</Text>
              </View>
              <View style={styles.playIconContainer}><Ionicons name="play" size={20} color="#000" /></View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.filterTabs}>
                {['month', 'week', 'day'].map(t => (
                    <TouchableOpacity key={t} style={[styles.filterTab, trendingFilter === t && styles.filterTabActive]} onPress={() => setTrendingFilter(t)}>
                        <Text style={[styles.filterText, trendingFilter === t && styles.filterTextActive]}>{t === 'month' ? 'شهر' : t === 'week' ? 'أسبوع' : 'يوم'}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.sectionTitle}>الأكثر قراءة</Text>
          </View>
          <AutoScrollCarousel data={trending} renderItem={({item}) => (<NovelCard item={item} onPress={() => navigation.navigate('NovelDetail', { novel: item })} />)} itemWidth={130} />
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.seeAll}>المزيد</Text></TouchableOpacity>
                <Text style={styles.sectionTitle}>آخر الفصول</Text>
            </View>
            <View style={styles.gridContainer}>
                {latestUpdates.map(item => (
                    <View key={item._id} style={[styles.gridWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>{renderUpdateGridItem({item})}</View>
                ))}
            </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.seeAll}>المزيد</Text></TouchableOpacity>
             <Text style={styles.sectionTitle}>أضيف حديثاً</Text>
          </View>
          <FlatList
            data={newArrivals}
            horizontal
            inverted={true}
            renderItem={({item}) => (<NovelCard item={item} onPress={() => navigation.navigate('NovelDetail', { novel: item })} size="large" />)}
            keyExtractor={item => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 15}}
          />
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 100, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 40 },
  headerTitleSticky: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  initialHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 90, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15, height: 100 },
  headerBtnInitial: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 35 },
  iconBtn: { position: 'relative', padding: 5 },
  badge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#ff4444', borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, borderWidth: 1.5, borderColor: '#000' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  dropdownOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 },
  dropdownContainer: { position: 'absolute', top: 90, right: 20, width: 300, backgroundColor: '#161616', borderRadius: 12, borderWidth: 1, borderColor: '#333', shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 20 },
  dropdownArrow: { position: 'absolute', top: -10, right: 15, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#333' },
  dropdownHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  dropdownTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  dropdownCountBadge: { backgroundColor: '#4a7cc7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dropdownCountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  notifItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' },
  notifImage: { width: 40, height: 55, borderRadius: 4, marginLeft: 10, backgroundColor: '#333' },
  notifContent: { flex: 1, alignItems: 'flex-end' },
  notifTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 2, textAlign: 'right' },
  notifTime: { color: '#666', fontSize: 10, marginBottom: 5 },
  notifBadgeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  notifChapterBadge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#444' },
  notifChapterText: { color: '#ccc', fontSize: 10 },
  emptyNotif: { padding: 30, alignItems: 'center', gap: 10 },
  emptyNotifText: { color: '#666', fontSize: 14 },
  heroContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 40 },
  heroPosterWrapper: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 12 },
  heroPoster: { width: 140, height: 210, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroInfoContainer: { flex: 1, marginRight: 20, alignItems: 'flex-end', justifyContent: 'flex-end', height: 210, paddingBottom: 5 },
  tagContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  tagText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginBottom: 6, lineHeight: 30 },
  heroAuthor: { color: '#ccc', fontSize: 14, textAlign: 'right', marginBottom: 10 },
  heroStats: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15, justifyContent: 'flex-start' },
  heroStatItem: { flexDirection: 'row', alignItems: 'center' },
  heroStatText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  heroStatDivider: { width: 1, height: 14, backgroundColor: '#444', marginHorizontal: 12 },
  heroReadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4a7cc7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, gap: 5 },
  heroReadButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  section: { marginTop: 35, paddingBottom: 5 },
  continueSection: { marginTop: 20, paddingBottom: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sectionTitleSimple: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginRight: 20, marginBottom: 15 },
  seeAll: { color: '#666', fontSize: 14 },
  filterTabs: { flexDirection: 'row', gap: 10 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  filterTabActive: { backgroundColor: '#4a7cc7', borderColor: '#4a7cc7' },
  filterText: { color: '#666', fontSize: 12 },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  cardContainer: { borderRadius: 8, overflow: 'hidden' },
  imageContainer: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#1A1A1A', marginBottom: 8, position: 'relative' },
  cardImage: { borderRadius: 8 },
  chapterCountOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 4, alignItems: 'center' },
  chapterCountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: 4 },
  continueCard: { marginHorizontal: 20, backgroundColor: '#111', borderRadius: 12, padding: 15, flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  continueCover: { width: 60, height: 90, borderRadius: 6, marginLeft: 15 },
  continueInfo: { flex: 1, alignItems: 'flex-end' },
  continueTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  continueChapter: { color: '#888', fontSize: 13, marginBottom: 10 },
  progressBarBg: { width: '100%', height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  progressText: { color: '#666', fontSize: 10 },
  playIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  gridContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', paddingHorizontal: 20, justifyContent: 'space-between' },
  gridWrapper: { marginBottom: 15 },
  gridCard: { flexDirection: 'row-reverse', backgroundColor: '#161616', borderRadius: 12, padding: 10, height: 110, alignItems: 'center', borderWidth: 1, borderColor: '#333', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  gridImage: { width: 70, height: '100%', borderRadius: 8, marginLeft: 15 },
  gridContent: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', height: '100%', paddingVertical: 5 },
  gridTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  gridChapterRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  gridChapterText: { color: '#4a7cc7', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  gridTimeRow: { flexDirection: 'row-reverse', alignItems: 'center', opacity: 0.8 },
  gridTimeText: { color: '#888', fontSize: 12, marginRight: 0 },
  // PWA Banner Styles
  pwaBanner: { marginHorizontal: 20, marginBottom: 20, marginTop: 10 },
  pwaContent: { backgroundColor: '#161616', borderRadius: 12, flexDirection: 'row-reverse', padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  pwaIcon: { width: 40, height: 40, borderRadius: 8, marginLeft: 12 },
  pwaTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'right' },
  pwaDesc: { color: '#888', fontSize: 11, textAlign: 'right' },
  pwaBtn: { backgroundColor: '#4a7cc7', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  pwaBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
