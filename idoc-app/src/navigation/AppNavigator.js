import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, Dimensions, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, ROLE_CONFIG } from '../utils/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// General User Screens
import GeneralHomeScreen from '../screens/general/HomeScreen';
import DoctorListScreen from '../screens/general/DoctorListScreen';
import DoctorDetailScreen from '../screens/general/DoctorDetailScreen';
import BookingScreen from '../screens/general/BookingScreen';
import BookingDetailScreen from '../screens/general/BookingDetailScreen';
import PharmacyListScreen from '../screens/general/PharmacyListScreen';
import MedicineListScreen from '../screens/general/MedicineListScreen';
import CartScreen from '../screens/general/CartScreen';
import MyBookingsScreen from '../screens/general/MyBookingsScreen';
import MyOrdersScreen from '../screens/general/MyOrdersScreen';
import OrderDetailScreen from '../screens/general/OrderDetailScreen';
import PrescriptionsScreen from '../screens/general/PrescriptionsScreen';
import PostRequestScreen from '../screens/general/PostRequestScreen';
import AvailabilityBoardScreen from '../screens/general/AvailabilityBoardScreen';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/HomeScreen';
import DoctorAppointmentsScreen from '../screens/doctor/AppointmentsScreen';
import DoctorPatientsScreen from '../screens/doctor/PatientsScreen';
import PrescriptionScreen from '../screens/doctor/PrescriptionScreen';
import PostAvailabilityScreen from '../screens/doctor/PostAvailabilityScreen';

// Pharmacy Screens
import PharmacyHomeScreen from '../screens/pharmacy/HomeScreen';
import PharmacyOrdersScreen from '../screens/pharmacy/OrdersScreen';
import PharmacyInventoryScreen from '../screens/pharmacy/InventoryScreen';

// Admin Screens
import AdminHomeScreen from '../screens/admin/HomeScreen';
import AdminUsersScreen from '../screens/admin/UsersScreen';
import AdminApprovalsScreen from '../screens/admin/ApprovalsScreen';
import AdminDoctorDetailScreen from '../screens/admin/DoctorDetailScreen';

// Shared Screens
import ChatListScreen from '../screens/shared/ChatListScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import VideoCallScreen from '../screens/shared/VideoCallScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.bgCard },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  headerShadowVisible: true,
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: COLORS.bg },
  animation: 'slide_from_right',
};

const getRoleAccent = (role) => ROLE_CONFIG[role]?.color || COLORS.primary;

const createTabScreenOptions = (role) => ({ route }) => ({
  // Compact tab treatment for phone-sized web viewports.
  ...(Platform.OS === 'web' && Dimensions.get('window').width <= 430
    ? {
      tabBarLabelStyle: { ...FONTS.small, marginTop: 0, fontSize: 9 },
      tabBarItemStyle: { paddingVertical: 1 },
    }
    : {}),
  headerShown: false,
  tabBarStyle: {
    backgroundColor: COLORS.bgCard,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === 'web' && Dimensions.get('window').width <= 430 ? 56 : 62,
    paddingBottom: Platform.OS === 'web' && Dimensions.get('window').width <= 430 ? 4 : 6,
    paddingTop: Platform.OS === 'web' && Dimensions.get('window').width <= 430 ? 4 : 6,
    paddingHorizontal: 4,
  },
  tabBarHideOnKeyboard: true,
  tabBarActiveTintColor: getRoleAccent(role),
  tabBarInactiveTintColor: COLORS.textMuted,
  tabBarLabelStyle: { ...FONTS.small, marginTop: 1 },
  tabBarIcon: ({ focused, color }) => {
    const icons = {
      // General
      Home: focused ? 'home' : 'home-outline',
      Doctors: focused ? 'medkit' : 'medkit-outline',
      Pharmacy: focused ? 'medical' : 'medical-outline',
      Bookings: focused ? 'calendar' : 'calendar-outline',
      // Doctor
      Dashboard: focused ? 'grid' : 'grid-outline',
      Appointments: focused ? 'time' : 'time-outline',
      Patients: focused ? 'people' : 'people-outline',
      // Pharmacy tabs
      Orders: focused ? 'cube' : 'cube-outline',
      Inventory: focused ? 'archive' : 'archive-outline',
      // Admin
      Users: focused ? 'people' : 'people-outline',
      Approvals: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
      // Shared
      Chat: focused ? 'chatbubble' : 'chatbubble-outline',
      Profile: focused ? 'person' : 'person-outline',
    };
    return <Ionicons name={icons[route.name] || 'apps-outline'} size={19} color={color} />;
  },
});

// ─── Auth Stack ───
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password', headerShown: true }} />
  </Stack.Navigator>
);

// ─── General User Tabs ───
const GeneralTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions('general')}>
    <Tab.Screen name="Home" component={GeneralHomeScreen} />
    <Tab.Screen name="Doctors" component={DoctorListScreen} />
    <Tab.Screen name="Pharmacy" component={PharmacyListScreen} />
    <Tab.Screen name="Bookings" component={MyBookingsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Doctor Tabs ───
const DoctorTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions('doctor')}>
    <Tab.Screen name="Dashboard" component={DoctorHomeScreen} />
    <Tab.Screen name="Appointments" component={DoctorAppointmentsScreen} />
    <Tab.Screen name="Patients" component={DoctorPatientsScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Pharmacy Tabs ───
const PharmacyTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions('pharmacy')}>
    <Tab.Screen name="Dashboard" component={PharmacyHomeScreen} />
    <Tab.Screen name="Orders" component={PharmacyOrdersScreen} />
    <Tab.Screen name="Inventory" component={PharmacyInventoryScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Admin Tabs ───
const AdminTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions('admin')}>
    <Tab.Screen name="Dashboard" component={AdminHomeScreen} />
    <Tab.Screen name="Users" component={AdminUsersScreen} />
    <Tab.Screen name="Approvals" component={AdminApprovalsScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Role-based Tab selector ───
const getRoleTabs = (role) => {
  switch (role) {
    case 'admin': return AdminTabs;
    case 'doctor': return DoctorTabs;
    case 'pharmacy': return PharmacyTabs;
    default: return GeneralTabs;
  }
};

// ─── Main Navigator ───
export const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const roleAccent = getRoleAccent(user?.role);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="medkit-outline" size={36} color={COLORS.primary} style={{ marginBottom: 14 }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: 16 }}>Loading I Doc...</Text>
      </View>
    );
  }

  const RoleTabs = user ? getRoleTabs(user.role) : null;

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: roleAccent,
          background: COLORS.bg,
          card: COLORS.bgCard,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.danger,
        },
      }}
    >
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={RoleTabs} options={{ headerShown: false }} />
            {/* Shared modal/push screens */}
            <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} options={{ title: 'Doctor Profile' }} />
            <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Appointment' }} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking Details' }} />
            <Stack.Screen name="MedicineList" component={MedicineListScreen} options={{ title: 'Medicines' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
            <Stack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Write Prescription' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Account Security' }} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
            {/* New Screens */}
            <Stack.Screen name="MyPrescriptions" component={PrescriptionsScreen} options={{ title: 'My Prescriptions' }} />
            <Stack.Screen name="PostRequest" component={PostRequestScreen} options={{ title: 'Post a Request' }} />
            <Stack.Screen name="AvailabilityBoard" component={AvailabilityBoardScreen} options={{ title: 'Doctor Availability' }} />
            <Stack.Screen name="PostAvailability" component={PostAvailabilityScreen} options={{ title: 'Post Availability' }} />
            <Stack.Screen name="AdminDoctorDetail" component={AdminDoctorDetailScreen} options={{ title: 'Review Application' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
