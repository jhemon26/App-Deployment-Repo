import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, ROLE_CONFIG } from '../utils/theme';

const Stack = createNativeStackNavigator();

class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: String(error?.message || error) };
  }

  componentDidCatch(error) {
    console.error('Web screen render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.bg }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
            {this.props.label || 'Screen'} crashed
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' }}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const withScreenBoundary = (label, ScreenComponent) => function SafeScreen(props) {
  return (
    <ScreenErrorBoundary label={label}>
      <ScreenComponent {...props} />
    </ScreenErrorBoundary>
  );
};

const makeLoadErrorScreen = (label, error) => function ScreenLoadError() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.bg }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{label} unavailable on web</Text>
      <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' }}>{String(error?.message || error)}</Text>
    </View>
  );
};

const loadScreen = (label, loader) => {
  try {
    const module = loader();
    const ScreenComponent = module?.default || module;
    return withScreenBoundary(label, ScreenComponent);
  } catch (error) {
    return makeLoadErrorScreen(label, error);
  }
};

// Auth
const LoginScreen = loadScreen('Login', () => require('../screens/auth/LoginScreen'));
const RegisterScreen = loadScreen('Register', () => require('../screens/auth/RegisterScreen'));
const ForgotPasswordScreen = loadScreen('Forgot Password', () => require('../screens/auth/ForgotPasswordScreen'));

// General
const GeneralHomeScreen = loadScreen('General Home', () => require('../screens/general/HomeScreen'));
const DoctorListScreen = loadScreen('Doctor List', () => require('../screens/general/DoctorListScreen'));
const PharmacyListScreen = loadScreen('Pharmacy List', () => require('../screens/general/PharmacyListScreen'));
const MyBookingsScreen = loadScreen('My Bookings', () => require('../screens/general/MyBookingsScreen'));

// Doctor
const DoctorHomeScreen = loadScreen('Doctor Home', () => require('../screens/doctor/HomeScreen'));
const DoctorAppointmentsScreen = loadScreen('Doctor Appointments', () => require('../screens/doctor/AppointmentsScreen'));
const DoctorPatientsScreen = loadScreen('Doctor Patients', () => require('../screens/doctor/PatientsScreen'));

// Pharmacy
const PharmacyHomeScreen = loadScreen('Pharmacy Home', () => require('../screens/pharmacy/HomeScreen'));
const PharmacyOrdersScreen = loadScreen('Pharmacy Orders', () => require('../screens/pharmacy/OrdersScreen'));
const PharmacyInventoryScreen = loadScreen('Pharmacy Inventory', () => require('../screens/pharmacy/InventoryScreen'));

// Admin
const AdminHomeScreen = loadScreen('Admin Home', () => require('../screens/admin/HomeScreen'));
const AdminUsersScreen = loadScreen('Admin Users', () => require('../screens/admin/UsersScreen'));
const AdminApprovalsScreen = loadScreen('Admin Approvals', () => require('../screens/admin/ApprovalsScreen'));

// Shared
const ChatListScreen = loadScreen('Chat List', () => require('../screens/shared/ChatListScreen'));
const ChatScreen = loadScreen('Chat', () => require('../screens/shared/ChatScreen'));
const ProfileScreen = loadScreen('Profile', () => require('../screens/shared/ProfileScreen'));
const NotificationsScreen = loadScreen('Notifications', () => require('../screens/shared/NotificationsScreen'));
const VideoCallScreen = loadScreen('Video Call', () => require('../screens/shared/VideoCallScreen'));

// Shared stack screens
const DoctorDetailScreen = loadScreen('Doctor Detail', () => require('../screens/general/DoctorDetailScreen'));
const BookingScreen = loadScreen('Booking', () => require('../screens/general/BookingScreen'));
const BookingDetailScreen = loadScreen('Booking Detail', () => require('../screens/general/BookingDetailScreen'));
const MedicineListScreen = loadScreen('Medicine List', () => require('../screens/general/MedicineListScreen'));
const CartScreen = loadScreen('Cart', () => require('../screens/general/CartScreen'));
const MyOrdersScreen = loadScreen('My Orders', () => require('../screens/general/MyOrdersScreen'));
const OrderDetailScreen = loadScreen('Order Detail', () => require('../screens/general/OrderDetailScreen'));
const PrescriptionScreen = loadScreen('Prescription', () => require('../screens/doctor/PrescriptionScreen'));

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.bgCard },
  headerTintColor: COLORS.text,
  headerTitleStyle: { ...FONTS.h4, fontWeight: '700' },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: COLORS.bg },
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const getRoleHomeScreen = (role) => {
  switch (role) {
    case 'admin':
      return AdminHomeScreen;
    case 'doctor':
      return DoctorHomeScreen;
    case 'pharmacy':
      return PharmacyHomeScreen;
    default:
      return GeneralHomeScreen;
  }
};

function WebHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const roleAccent = ROLE_CONFIG[user?.role]?.color || COLORS.primary;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Ionicons name="medkit-outline" size={30} color={COLORS.primary} style={{ marginBottom: 10 }} />
      <Text style={{ ...FONTS.h2, color: COLORS.text }}>I Doc Web</Text>
      <Text style={{ ...FONTS.caption, marginTop: 8, color: COLORS.textSecondary, textAlign: 'center' }}>
        Logged in as {user?.email || 'unknown'} ({user?.role || 'user'})
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('RoleHome')}
        style={{ marginTop: 16, backgroundColor: roleAccent, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 }}
      >
        <Text style={{ ...FONTS.bodyBold, color: COLORS.textInverse }}>Open Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={logout}
        style={{ marginTop: 20, backgroundColor: COLORS.bgCard, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border }}
      >
        <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

export const WebNavigator = () => {
  const { user } = useAuth();
  const RoleHomeScreen = user ? getRoleHomeScreen(user.role) : null;
  const roleAccent = ROLE_CONFIG[user?.role]?.color || COLORS.primary;

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
            <Stack.Screen name="RoleHome" component={RoleHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="WebHome" component={WebHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} options={{ title: 'Doctor Profile' }} />
            <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Appointment' }} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking Details' }} />
            <Stack.Screen name="MedicineList" component={MedicineListScreen} options={{ title: 'Medicines' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
            <Stack.Screen name="ChatRoom" component={ChatScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ title: 'Video Call' }} />
            <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Write Prescription' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default WebNavigator;
