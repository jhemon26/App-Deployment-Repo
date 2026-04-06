import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar, Badge, Button, Input, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, ROLE_CONFIG } from '../../utils/theme';
import { authAPI } from '../../services/api';
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.general;
  const hasDoctorProfile = user?.role === 'doctor';
  const hasPharmacyProfile = user?.role === 'pharmacy';

  const profileSubtitle = useMemo(() => {
    if (hasDoctorProfile) return 'Doctor · Approved practitioner';
    if (hasPharmacyProfile) return 'Pharmacy · Registered provider';
    return 'Patient · I Doc member';
  }, [hasDoctorProfile, hasPharmacyProfile]);

  useEffect(() => {
    const focus = route?.params?.focus;
    if (focus === 'login-details') setActivePanel('login-details');
    if (focus === 'profile-picture') setActivePanel('profile-picture');
  }, [route?.params?.focus]);

  const handleSave = async () => {
    try {
      const payload = { name, phone };
      if (hasDoctorProfile) {
        payload.doctor_profile = { specialty, experience, fee, license_number: licenseNumber, bio };
      }
      if (hasPharmacyProfile) {
        payload.pharmacy_profile = { pharmacy_name: pharmacyName, license_number: pharmacyLicense, address, delivery_time: deliveryTime };
      }
      await updateProfile(payload);
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile Updated' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to update', text2: e.message });
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: 'Permission required', text2: 'Allow photo access to upload a profile picture' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('profile_picture', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      });
      await authAPI.updateProfile(formData);
      await updateProfile({});
      Toast.show({ type: 'success', text1: 'Profile picture updated' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: e.response?.data?.detail || 'Please try again' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    logout();
    Toast.show({ type: 'info', text1: 'Logged out' });
  };

  const accountItems = [
    { key: 'login-details', label: 'Login Details', icon: 'mail-outline', sub: user?.email || '' },
    { key: 'password-management', label: 'Password', icon: 'key-outline', screen: 'ChangePassword', sub: 'Change your password' },
    { key: 'profile-picture', label: 'Profile Picture', icon: 'image-outline', sub: 'Update your avatar' },
  ];

  const menuItems = [
    { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', sub: 'Your alerts and updates' },
    { label: 'Payment History', icon: 'card-outline', screen: 'MyOrders', sub: 'Orders and transactions' },
    { label: 'Help & Support', icon: 'help-circle-outline', sub: 'Get assistance', content: 'For urgent issues, use in-app chat or contact support@idoc.app. We reply within 24 hours.' },
    { label: 'Privacy Policy', icon: 'shield-checkmark-outline', sub: 'How we protect your data', content: 'I Doc stores only required healthcare data. We protect all account data with role-based access and secure token authentication.' },
    { label: 'Terms of Service', icon: 'document-text-outline', sub: 'Platform usage terms', content: 'Consultations are provided by approved professionals. Medicine orders and payments follow platform terms and local regulations.' },
    { label: 'About I Doc', icon: 'information-circle-outline', sub: 'Version 1.0.0', content: 'I Doc is a role-based healthcare platform connecting patients, doctors, pharmacies, and admins in one secure system.' },
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
      {/* Profile Banner */}
      <View style={[styles.banner, { borderBottomColor: roleConfig.color }]}>
        <View style={[styles.avatarRing, { borderColor: roleConfig.color + '60' }]}>
          {user?.profile_picture ? (
            <Image
              source={{ uri: user.profile_picture }}
              style={{ width: 68, height: 68, borderRadius: 34 }}
            />
          ) : (
            <Avatar name={user?.name} size={68} color={roleConfig.color} />
          )}
        </View>
        <Text style={{ ...FONTS.h4, color: COLORS.text, marginTop: SPACING.sm }}>{user?.name}</Text>
        <Text style={{ ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 }}>{user?.email}</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs }}>
          <Badge text={roleConfig.label} color={roleConfig.color} size="sm" />
          <Badge
            text={user?.is_approved ? 'Approved' : 'Pending'}
            color={user?.is_approved ? COLORS.success : COLORS.warning}
            size="sm"
          />
        </View>
        <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: SPACING.xs }}>
          {profileSubtitle}
        </Text>
      </View>

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
            <Button title="Save Changes" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <TouchableOpacity
          style={[styles.editRow, { marginHorizontal: SPACING.xl, marginTop: SPACING.lg }]}
          onPress={() => setEditing(true)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ marginLeft: SPACING.md }}>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Edit Profile</Text>
              <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 1 }}>Update your personal info</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Account Settings */}
      <Text style={styles.groupLabel}>Account</Text>
      <Card style={styles.menuGroup}>
        {accountItems.map((item, idx) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => {
              if (item.screen) navigation.navigate(item.screen);
              else setActivePanel(item.key);
            }}
            style={[styles.menuRow, idx > 0 && { borderTopWidth: 1, borderTopColor: COLORS.border }]}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name={item.icon} size={18} color={COLORS.primary} />
              </View>
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={{ ...FONTS.body, color: COLORS.text }}>{item.label}</Text>
                {item.sub ? <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 1 }} numberOfLines={1}>{item.sub}</Text> : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Expanded panels */}
      {activePanel === 'login-details' && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md }}>
          <Text style={{ ...FONTS.h4, color: COLORS.text }}>Login Details</Text>
          <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
            {[
              { label: 'Email', value: user?.email || 'N/A', icon: 'mail-outline' },
              { label: 'Role', value: roleConfig.label, icon: 'person-outline' },
              { label: 'Account Status', value: user?.is_approved ? 'Approved' : 'Pending', icon: 'checkmark-circle-outline' },
            ].map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={row.icon} size={14} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{row.label}: </Text>
                <Text style={{ ...FONTS.captionBold, color: COLORS.text }}>{row.value}</Text>
              </View>
            ))}
          </View>
          <Button title="Close" variant="outline" onPress={() => setActivePanel(null)} style={{ marginTop: SPACING.md }} />
        </Card>
      )}

      {activePanel === 'profile-picture' && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md }}>
          <Text style={{ ...FONTS.h4, color: COLORS.text }}>Profile Picture</Text>
          <View style={{ alignItems: 'center', marginVertical: SPACING.lg }}>
            {user?.profile_picture ? (
              <Image
                source={{ uri: user.profile_picture }}
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.border }}
              />
            ) : (
              <Avatar name={user?.name} size={80} color={roleConfig.color} />
            )}
          </View>
          <Button
            title={uploadingPhoto ? 'Uploading...' : 'Choose from Library'}
            onPress={handlePickPhoto}
            loading={uploadingPhoto}
          />
          <Button title="Close" variant="outline" onPress={() => setActivePanel(null)} style={{ marginTop: SPACING.sm }} />
        </Card>
      )}

      {/* General menu */}
      <Text style={styles.groupLabel}>More</Text>
      <Card style={styles.menuGroup}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleMenuPress(item)}
            style={[styles.menuRow, idx > 0 && { borderTopWidth: 1, borderTopColor: COLORS.border }]}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.bgElevated }]}>
                <Ionicons name={item.icon} size={18} color={COLORS.textSecondary} />
              </View>
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={{ ...FONTS.body, color: COLORS.text }}>{item.label}</Text>
                {item.sub ? <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 1 }}>{item.sub}</Text> : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Info panel */}
      {activeInfoItem && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md, backgroundColor: COLORS.bgElevated, borderColor: COLORS.border, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
            <Ionicons name={activeInfoItem.icon} size={18} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
            <Text style={{ ...FONTS.h4, color: COLORS.text }}>{activeInfoItem.label}</Text>
          </View>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary, lineHeight: 22 }}>{activeInfoItem.content}</Text>
          <Button title="Close" variant="outline" color={COLORS.primary} onPress={() => setActiveInfoItem(null)} style={{ marginTop: SPACING.md }} />
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
  banner: {
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 3,
  },
  avatarRing: {
    padding: 3,
    borderRadius: RADIUS.full,
    borderWidth: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  groupLabel: {
    ...FONTS.captionBold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  menuGroup: {
    marginHorizontal: SPACING.xl,
    padding: 0,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
