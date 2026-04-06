import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import { COLORS, FONTS, ROLE_CONFIG } from "../utils/theme";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

// General User Screens
import GeneralHomeScreen from "../screens/general/HomeScreen";
import DoctorListScreen from "../screens/general/DoctorListScreen";
import DoctorDetailScreen from "../screens/general/DoctorDetailScreen";
import BookingScreen from "../screens/general/BookingScreen";
import BookingDetailScreen from "../screens/general/BookingDetailScreen";
import PharmacyListScreen from "../screens/general/PharmacyListScreen";
import MedicineListScreen from "../screens/general/MedicineListScreen";
import CartScreen from "../screens/general/CartScreen";
import MyBookingsScreen from "../screens/general/MyBookingsScreen";
import MyOrdersScreen from "../screens/general/MyOrdersScreen";
import OrderDetailScreen from "../screens/general/OrderDetailScreen";
import PrescriptionsScreen from "../screens/general/PrescriptionsScreen";
import PostRequestScreen from "../screens/general/PostRequestScreen";

// Doctor Screens
import DoctorHomeScreen from "../screens/doctor/HomeScreen";
import DoctorAppointmentsScreen from "../screens/doctor/AppointmentsScreen";
import DoctorPatientsScreen from "../screens/doctor/PatientsScreen";
import PrescriptionScreen from "../screens/doctor/PrescriptionScreen";
import PostAvailabilityScreen from "../screens/doctor/PostAvailabilityScreen";
import DoctorRatingInsightsScreen from "../screens/doctor/RatingInsightsScreen";

// Pharmacy Screens
import PharmacyHomeScreen from "../screens/pharmacy/HomeScreen";
import PharmacyOrdersScreen from "../screens/pharmacy/OrdersScreen";
import PharmacyInventoryScreen from "../screens/pharmacy/InventoryScreen";

// Admin Screens
import AdminHomeScreen from "../screens/admin/HomeScreen";
import AdminUsersScreen from "../screens/admin/UsersScreen";
import AdminApprovalsScreen from "../screens/admin/ApprovalsScreen";
import AdminDoctorDetailScreen from "../screens/admin/DoctorDetailScreen";

// Shared Screens
import ChatListScreen from "../screens/shared/ChatListScreen";
import ChatScreen from "../screens/shared/ChatScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";
import NotificationsScreen from "../screens/shared/NotificationsScreen";
import VideoCallScreen from "../screens/shared/VideoCallScreen";
import ChangePasswordScreen from "../screens/shared/ChangePasswordScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";
const IS_SMALL_WEB = IS_WEB && SCREEN_WIDTH <= 430;
const IS_MOBILE_WIDTH = SCREEN_WIDTH <= 480;

const NAV_BG = "#06142B";
const NAV_CARD = "#13233F";
const NAV_CARD_SOFT = "#162846";
const NAV_BORDER = "#29415F";
const NAV_TEXT = "#F4F7FB";
const NAV_TEXT_MUTED = "#AEBBD0";

const screenOptions = {
  headerStyle: {
    backgroundColor: NAV_BG,
  },
  headerTintColor: NAV_TEXT,
  headerTitleStyle: {
    fontSize: 17,
    fontWeight: "700",
    color: NAV_TEXT,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: {
    backgroundColor: NAV_BG,
  },
  animation: "slide_from_right",
  headerTitleAlign: "left",
};

const getRoleAccent = (role) => ROLE_CONFIG[role]?.color || COLORS.primary;

const createTabScreenOptions =
  (role) =>
  ({ route }) => ({
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: getRoleAccent(role),
    tabBarInactiveTintColor: NAV_TEXT_MUTED,
    tabBarShowLabel: true,
    tabBarStyle: {
      position: "absolute",
      left: IS_MOBILE_WIDTH ? 12 : 16,
      right: IS_MOBILE_WIDTH ? 12 : 16,
      bottom: IS_WEB ? 12 : 10,
      height: IS_SMALL_WEB ? 64 : 70,
      backgroundColor: NAV_CARD,
      borderTopWidth: 1,
      borderTopColor: NAV_BORDER,
      borderRadius: 22,
      paddingTop: 8,
      paddingBottom: IS_SMALL_WEB ? 8 : 10,
      paddingHorizontal: 8,
      elevation: 0,
    },
    tabBarItemStyle: {
      borderRadius: 16,
      marginHorizontal: 2,
      paddingVertical: 2,
    },
    tabBarLabelStyle: {
      ...FONTS.small,
      fontSize: IS_SMALL_WEB ? 10 : 11,
      marginTop: 2,
      fontWeight: "600",
    },
    tabBarIconStyle: {
      marginTop: 2,
    },
    tabBarIcon: ({ focused, color }) => {
      const icons = {
        Home: focused ? "home" : "home-outline",
        Doctors: focused ? "medkit" : "medkit-outline",
        Pharmacy: focused ? "medical" : "medical-outline",
        Bookings: focused ? "calendar" : "calendar-outline",
        Dashboard: focused ? "grid" : "grid-outline",
        Appointments: focused ? "time" : "time-outline",
        Patients: focused ? "people" : "people-outline",
        Orders: focused ? "cube" : "cube-outline",
        Inventory: focused ? "archive" : "archive-outline",
        Users: focused ? "people" : "people-outline",
        Approvals: focused ? "checkmark-circle" : "checkmark-circle-outline",
        Chat: focused ? "chatbubble" : "chatbubble-outline",
        Profile: focused ? "person" : "person-outline",
      };

      return (
        <Ionicons
          name={icons[route.name] || "apps-outline"}
          size={20}
          color={color}
        />
      );
    },
  });

// ─── Auth Stack ───
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen
      name="ResetPassword"
      component={ResetPasswordScreen}
      options={{ title: "Reset Password", headerShown: true }}
    />
  </Stack.Navigator>
);

// ─── General User Tabs ───
const GeneralTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions("general")}>
    <Tab.Screen name="Home" component={GeneralHomeScreen} />
    <Tab.Screen name="Doctors" component={DoctorListScreen} />
    <Tab.Screen name="Pharmacy" component={PharmacyListScreen} />
    <Tab.Screen name="Bookings" component={MyBookingsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Doctor Tabs ───
const DoctorTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions("doctor")}>
    <Tab.Screen name="Dashboard" component={DoctorHomeScreen} />
    <Tab.Screen name="Appointments" component={DoctorAppointmentsScreen} />
    <Tab.Screen name="Patients" component={DoctorPatientsScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Pharmacy Tabs ───
const PharmacyTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions("pharmacy")}>
    <Tab.Screen name="Dashboard" component={PharmacyHomeScreen} />
    <Tab.Screen name="Orders" component={PharmacyOrdersScreen} />
    <Tab.Screen name="Inventory" component={PharmacyInventoryScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Admin Tabs ───
const AdminTabs = () => (
  <Tab.Navigator screenOptions={createTabScreenOptions("admin")}>
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
    case "admin":
      return AdminTabs;
    case "doctor":
      return DoctorTabs;
    case "pharmacy":
      return PharmacyTabs;
    default:
      return GeneralTabs;
  }
};

// ─── Main Navigator ───
export const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const roleAccent = getRoleAccent(user?.role);

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: roleAccent,
      background: NAV_BG,
      card: NAV_CARD,
      text: NAV_TEXT,
      border: NAV_BORDER,
      notification: COLORS.danger,
    },
  };

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: NAV_BG,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="medkit-outline"
          size={36}
          color={roleAccent}
          style={{ marginBottom: 14 }}
        />
        <ActivityIndicator size="large" color={roleAccent} />
        <Text style={{ ...FONTS.body, color: NAV_TEXT_MUTED, marginTop: 16 }}>
          Loading I Doc...
        </Text>
      </View>
    );
  }

  const RoleTabs = user ? getRoleTabs(user.role) : null;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={RoleTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorDetail"
              component={DoctorDetailScreen}
              options={{ title: "Doctor Profile" }}
            />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ title: "Book Appointment" }}
            />
            <Stack.Screen
              name="BookingDetail"
              component={BookingDetailScreen}
              options={{ title: "Booking Details" }}
            />
            <Stack.Screen
              name="MedicineList"
              component={MedicineListScreen}
              options={{ title: "Medicines" }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ title: "My Cart" }}
            />
            <Stack.Screen
              name="ChatRoom"
              component={ChatScreen}
              options={{ title: "Chat" }}
            />
            <Stack.Screen
              name="ChatList"
              component={ChatListScreen}
              options={{ title: "Support Messages" }}
            />
            <Stack.Screen
              name="VideoCall"
              component={VideoCallScreen}
              options={{ headerShown: false, presentation: "fullScreenModal" }}
            />
            <Stack.Screen
              name="Prescription"
              component={PrescriptionScreen}
              options={{ title: "Write Prescription" }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: "Notifications" }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: "Account Security" }}
            />
            <Stack.Screen
              name="MyOrders"
              component={MyOrdersScreen}
              options={{ title: "My Orders" }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ title: "Order Details" }}
            />
            <Stack.Screen
              name="MyPrescriptions"
              component={PrescriptionsScreen}
              options={{ title: "My Prescriptions" }}
            />
            <Stack.Screen
              name="PostRequest"
              component={PostRequestScreen}
              options={{ title: "Post a Request" }}
            />
            <Stack.Screen
              name="DoctorRatingInsights"
              component={DoctorRatingInsightsScreen}
              options={{ title: "Rating Insights" }}
            />
            <Stack.Screen
              name="PostAvailability"
              component={PostAvailabilityScreen}
              options={{ title: "Post Availability" }}
            />
            <Stack.Screen
              name="AdminDoctorDetail"
              component={AdminDoctorDetailScreen}
              options={{ title: "Review Application" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
