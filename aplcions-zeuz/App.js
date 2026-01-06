import React, { useContext } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NovelDetailScreen from './src/screens/NovelDetailScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import SearchScreen from './src/screens/SearchScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// Admin Screens
import AdminMainScreen from './src/screens/AdminMainScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import ManagementScreen from './src/screens/ManagementScreen';
import UsersManagementScreen from './src/screens/UsersManagementScreen';
import BulkUploadScreen from './src/screens/BulkUploadScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161616',
          borderTopColor: '#333',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          position: Platform.OS === 'web' ? 'fixed' : 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: '#4a7cc7',
        tabBarInactiveTintColor: '#666',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Library') iconName = focused ? 'library' : 'library-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'الرئيسية' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'المكتبة' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'حسابي' }} />
    </Tab.Navigator>
  );
}

function AppNavigation() {
  const { userToken, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#4a7cc7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'slide_from_right', // Native-like transition for both Web and Mobile
        }}
      >
        {userToken ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="NovelDetail" 
              component={NovelDetailScreen} 
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen 
              name="Reader" 
              component={ReaderScreen} 
              options={{ animation: 'fade' }} 
            />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen} 
              options={{ animation: 'fade_from_bottom' }}
            />
            <Stack.Screen 
              name="Category" 
              component={CategoryScreen} 
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={ProfileScreen} 
              options={{ animation: 'slide_from_right' }}
            />
            
            {/* Admin/Contributor Routes */}
            <Stack.Screen name="AdminMain" component={AdminMainScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="Management" component={ManagementScreen} />
            <Stack.Screen name="UsersManagement" component={UsersManagementScreen} />
            <Stack.Screen name="BulkUpload" component={BulkUploadScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          {/* Translucent status bar makes the app feel immersive and native */}
          <StatusBar style="light" translucent backgroundColor="transparent" />
          <AppNavigation />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}