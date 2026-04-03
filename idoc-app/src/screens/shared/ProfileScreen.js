import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar, Badge, Button, Input, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, ROLE_CONFIG } from '../../utils/theme';
import Toast from 'react-native-toast-message';

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialty, setSpecialty] = useState(user?.doctor_profile?.specialty || user?.specialty || '');
  const [experience, setExperience] = useState(user?.doctor_profile?.experience || user?.experience || '');
  const [fee, setFee] = useState(String(user?.doctor_profile?.fee ?? user?.fee ?? ''));
  const [licenseNumber, setLicenseNumber] = useState(user?.doctor_profile?.license_number || user?.license || '');
  const [bio, setBio] = useState(user?.doctor_profile?.bio || '');
  const [pharmacyName, setPharmacyName] = useState(user?.pharmacy_profile?.pharmacy_name || user?.pharmacyName || '');
  const [pharmacyLicense, setPharmacyLicense] = useState(user?.pharmacy_profile?.license_number || user?.pharmacyLicense || '');
  const [address, setAddress] = useState(user?.pharmacy_profile?.address || '');
  const [deliveryTime, setDeliveryTime] = useState(user?.pharmacy_profile?.delivery_time || '');
  const [activeInfoItem, setActiveInfoItem] = useState(null);
  const [activePanel, setActivePanel] = useState(null);

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.general;
  const hasDoctorProfile = user?.role === 'doctor';
  const hasPharmacyProfile = user?.role === 'pharmacy';

  const profileSubtitle = useMemo(() => {
    if (hasDoctorProfile) {
      return 'Update your clinic profile and availability details.';
    }
    if (hasPharmacyProfile) {
      return 'Update your pharmacy information and delivery settings.';
    }
    return 'Keep your patient profile up to date.';
  }, [hasDoctorProfile, hasPharmacyProfile]);

  useEffect(() => {
    const focus = route?.params?.focus;
    if (focus === 'login-details') {
      setActivePanel('login-details');
    }
    if (focus === 'profile-picture') {
      setActivePanel('profile-picture');
    }
  }, [route?.params?.focus]);

  const handleSave = async () => {
    try {
      const payload = { name, phone };

      if (hasDoctorProfile) {
        payload.doctor_profile = {
          specialty,
          experience,
          fee,
          license_number: licenseNumber,
          bio,
        };
      }

      if (hasPharmacyProfile) {
        payload.pharmacy_profile = {
          pharmacy_name: pharmacyName,
          license_number: pharmacyLicense,
          address,
          delivery_time: deliveryTime,
        };
      }

      await updateProfile(payload);
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile Updated' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to update', text2: e.message });
    }
  };

  const handleLogout = () => {
    logout();
    Toast.show({ type: 'info', text1: 'Logged out' });
  };

  const accountItems = [
    { key: 'login-details', label: 'Login Details', icon: 'mail-outline' },
    { key: 'password-management', label: 'Password Management', icon: 'key-outline', screen: 'ChangePassword' },
    { key: 'profile-picture', label: 'Profile Picture', icon: 'image-outline' },
  ];

  const menuItems = [
    { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
    { label: 'Payment History', icon: 'card-outline', screen: 'MyOrders' },
    { label: 'Help & Support', icon: 'help-circle-outline', content: 'For urgent issues, use in-app chat or contact support@idoc.app. We reply within 24 hours.' },
    { label: 'Privacy Policy', icon: 'shield-checkmark-outline', content: 'I Doc stores only required healthcare data. We protect all account data with role-based access and secure token authentication.' },
    { label: 'Terms of Service', icon: 'document-text-outline', content: 'Consultations are provided by approved professionals. Medicine orders and payments follow platform terms and local regulations.' },
    { label: 'About I Doc', icon: 'information-circle-outline', content: 'I Doc is a role-based healthcare platform connecting patients, doctors, pharmacies, and admins in one secure system.' },
  ];

  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
      return;
    }
    setActiveInfoItem(item);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Profile</Text>
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={{ alignItems: 'center' }}>
          <Avatar name={user?.name} size={80} color={roleConfig.color} />
          <Text style={{ ...FONTS.h3, color: COLORS.text, marginTop: SPACING.md }}>{user?.name}</Text>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: 2 }}>{user?.email}</Text>
          <Badge text={roleConfig.label} color={roleConfig.color} style={{ marginTop: SPACING.sm }} />
          <Text style={{ ...FONTS.caption, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.lg }}>
            {profileSubtitle}
          </Text>
        </View>
      </Card>

      {/* Edit Profile */}
      {editing ? (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.lg }}>
          <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Edit Profile</Text>
          <Input label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          {hasDoctorProfile && (
            <>
              <Input label="Specialty" value={specialty} onChangeText={setSpecialty} />
              <Input label="Experience" value={experience} onChangeText={setExperience} />
              <Input label="Consultation Fee" value={fee} onChangeText={setFee} keyboardType="numeric" />
              <Input label="License Number" value={licenseNumber} onChangeText={setLicenseNumber} />
              <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} />
            </>
          )}
          {hasPharmacyProfile && (
            <>
              <Input label="Pharmacy Name" value={pharmacyName} onChangeText={setPharmacyName} />
              <Input label="License Number" value={pharmacyLicense} onChangeText={setPharmacyLicense} />
              <Input label="Address" value={address} onChangeText={setAddress} multiline numberOfLines={3} />
              <Input label="Delivery Time" value={deliveryTime} onChangeText={setDeliveryTime} />
            </>
          )}
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            <Button title="Save" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Card
          onPress={() => setEditing(true)}
          style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.lg, padding: SPACING.md }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="create-outline" size={18} color={COLORS.primary} style={{ marginRight: SPACING.md }} />
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </Card>
      )}

      <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.lg }}>
        <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.sm }}>Account Settings</Text>
        {accountItems.map((item, idx) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => {
              if (item.screen) {
                navigation.navigate(item.screen);
              } else {
                setActivePanel(item.key);
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: SPACING.md,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: COLORS.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={item.icon} size={18} color={COLORS.primary} style={{ marginRight: SPACING.md }} />
              <Text style={{ ...FONTS.body, color: COLORS.text }}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </Card>

      {activePanel === 'login-details' && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md }}>
          <Text style={{ ...FONTS.h4, color: COLORS.text }}>Login Details</Text>
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: SPACING.sm }}>Email: {user?.email || 'N/A'}</Text>
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Role: {roleConfig.label}</Text>
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Approved: {user?.is_approved ? 'Yes' : 'Pending'}</Text>
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Blocked: {user?.is_blocked ? 'Yes' : 'No'}</Text>
          <View style={{ marginTop: SPACING.md }}>
            <Button title="Close" variant="outline" onPress={() => setActivePanel(null)} />
          </View>
        </Card>
      )}

      {activePanel === 'profile-picture' && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md }}>
          <Text style={{ ...FONTS.h4, color: COLORS.text }}>Profile Picture</Text>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm }}>
            Avatar upload can be managed from profile edit in this build. Full gallery/camera upload workflow can be added next.
          </Text>
          <View style={{ marginTop: SPACING.md }}>
            <Button
              title="Open Profile Edit"
              onPress={() => {
                setActivePanel(null);
                setEditing(true);
                Toast.show({ type: 'info', text1: 'Profile editor opened' });
              }}
            />
          </View>
        </Card>
      )}

      {/* Menu Items */}
      <View style={{ marginTop: SPACING.xl }}>
        {menuItems.map((item, index) => (
          <Card
            key={index}
            onPress={() => handleMenuPress(item)}
            style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.sm, padding: SPACING.md }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={item.icon} size={18} color={COLORS.primary} style={{ marginRight: SPACING.md }} />
                <Text style={{ ...FONTS.body, color: COLORS.text }}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </Card>
        ))}
      </View>

      {activeInfoItem && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={activeInfoItem.icon} size={18} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
            <Text style={{ ...FONTS.h4, color: COLORS.text }}>{activeInfoItem.label}</Text>
          </View>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm }}>{activeInfoItem.content}</Text>
          <View style={{ marginTop: SPACING.md }}>
            <Button title="Close" variant="outline" color={COLORS.primary} onPress={() => setActiveInfoItem(null)} />
          </View>
        </Card>
      )}

      {/* Logout */}
      <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xl }}>
        <Button title="Sign Out" variant="outline" color={COLORS.danger} onPress={handleLogout} />
      </View>

      <Text style={{ ...FONTS.small, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl }}>
        I Doc v1.0.0
      </Text>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
  profileCard: { marginHorizontal: SPACING.xl, paddingVertical: SPACING.xxl },
});
