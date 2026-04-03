import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, ROLE_CONFIG, SHADOWS } from '../utils/theme';

const ROLE_LABEL = {
  general: 'Patient',
  doctor: 'Doctor',
  pharmacy: 'Pharmacy',
  admin: 'Admin',
};

export default function AccountQuickMenu({ navigation }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.general;
  const roleLabel = ROLE_LABEL[user?.role] || 'User';

  const loginSummary = useMemo(() => {
    if (!user?.email) return 'No email on file';
    return `${user.email} • ${roleLabel}`;
  }, [user?.email, roleLabel]);

  const actions = [
    {
      key: 'profile',
      label: 'Profile Info',
      icon: 'person-circle-outline',
      onPress: () => navigation.navigate('Profile'),
    },
    {
      key: 'details',
      label: 'Login Details',
      icon: 'mail-outline',
      onPress: () => navigation.navigate('Profile', { focus: 'login-details' }),
    },
    {
      key: 'password',
      label: 'Password Management',
      icon: 'key-outline',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      key: 'picture',
      label: 'Profile Picture',
      icon: 'image-outline',
      onPress: () => navigation.navigate('Profile', { focus: 'profile-picture' }),
    },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: 'log-out-outline',
      danger: true,
      onPress: async () => {
        await logout();
      },
    },
  ];

  const handleAction = async (action) => {
    setOpen(false);
    await action.onPress();
  };

  const sheetWidth = Math.min(320, Math.max(240, width - (SPACING.xl * 2)));

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { width: sheetWidth }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Avatar name={user?.name || 'User'} uri={user?.avatar} size={44} color={roleConfig.color} />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.name}>{user?.name || 'User'}</Text>
                <Text style={styles.role} numberOfLines={1}>{loginSummary}</Text>
              </View>
            </View>

            {actions.map((action) => (
              <TouchableOpacity key={action.key} style={styles.item} onPress={() => handleAction(action)}>
                <Ionicons
                  name={action.icon}
                  size={18}
                  color={action.danger ? COLORS.danger : COLORS.textSecondary}
                  style={{ marginRight: SPACING.md }}
                />
                <Text style={[styles.itemText, action.danger && { color: COLORS.danger }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    marginLeft: SPACING.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 20, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 92,
    paddingRight: SPACING.xl,
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  name: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  role: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  itemText: {
    ...FONTS.body,
    color: COLORS.text,
  },
});
