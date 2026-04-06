import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, Button, Card, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { adminAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function AdminDoctorDetailScreen({ navigation, route }) {
  const { item } = route.params;
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const approvalType = item?.type || item?.role || 'doctor';
  const typeColor = approvalType === 'doctor' ? COLORS.doctor : COLORS.pharmacy;
  const typeLabel = approvalType.charAt(0).toUpperCase() + approvalType.slice(1);

  const infoRows = [
    { label: 'Email', value: item?.email, icon: 'mail-outline' },
    { label: 'Phone', value: item?.phone || 'Not provided', icon: 'call-outline' },
    { label: 'License Number', value: item?.license || item?.license_number || 'Not provided', icon: 'card-outline' },
    ...(approvalType === 'doctor' ? [
      { label: 'Specialty', value: item?.specialty || 'Not specified', icon: 'medical-outline' },
      { label: 'Experience', value: item?.experience || 'Not specified', icon: 'time-outline' },
      { label: 'Consultation Fee', value: item?.fee ? `฿${item.fee}` : 'Not specified', icon: 'cash-outline' },
      { label: 'Bio', value: item?.bio || 'No bio provided', icon: 'document-text-outline' },
    ] : [
      { label: 'Pharmacy Name', value: item?.pharmacy_name || item?.name, icon: 'storefront-outline' },
      { label: 'Address', value: item?.address || 'Not provided', icon: 'location-outline' },
      { label: 'Delivery Time', value: item?.delivery_time || 'Not specified', icon: 'bicycle-outline' },
    ]),
    { label: 'Submitted', value: item?.submitted ? new Date(item.submitted).toLocaleDateString() : 'N/A', icon: 'calendar-outline' },
  ];

  const handleApprove = () => {
    Alert.alert(
      'Approve Application',
      `Approve ${item?.name}? They will be notified and gain full access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setApproving(true);
            try {
              if (approvalType === 'doctor') {
                await adminAPI.approveDoctor(item.id);
              } else {
                await adminAPI.approvePharmacy(item.id);
              }
              Toast.show({ type: 'success', text1: 'Approved', text2: `${item?.name} has been approved and notified` });
              navigation.goBack();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Approval failed', text2: error.response?.data?.error || 'Please try again' });
            } finally {
              setApproving(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Application',
      `Reject ${item?.name}? This action will notify them of the rejection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejecting(true);
            try {
              await adminAPI.rejectUser(item.id, { reason: 'Application rejected after admin review.' });
              Toast.show({ type: 'error', text1: 'Rejected', text2: `${item?.name}'s application has been rejected` });
              navigation.goBack();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Rejection failed', text2: error.response?.data?.error || 'Please try again' });
            } finally {
              setRejecting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Banner Header */}
      <View style={[styles.banner, { borderBottomColor: typeColor }]}>
        <View style={[styles.avatarRing, { borderColor: typeColor + '50' }]}>
          <Avatar name={item?.name} size={68} color={typeColor} />
        </View>
        <Text style={{ ...FONTS.h3, color: COLORS.text, marginTop: SPACING.sm, textAlign: 'center' }}>
          {item?.name}
        </Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 }}>
          {approvalType === 'doctor' ? item?.specialty || 'Doctor' : item?.pharmacy_name || 'Pharmacy'}
        </Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
          <Badge text={typeLabel} color={typeColor} />
          <Badge text="Pending Review" color={COLORS.warning} />
        </View>
      </View>

      {/* Quick stats row for doctors */}
      {approvalType === 'doctor' && (
        <View style={styles.statsRow}>
          {[
            { label: 'Experience', value: item?.experience || 'N/A', icon: 'time-outline' },
            { label: 'Fee', value: item?.fee ? `฿${item.fee}` : 'N/A', icon: 'cash-outline' },
            { label: 'Specialty', value: item?.specialty || 'N/A', icon: 'medical-outline' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statItem, SHADOWS.sm]}>
              <View style={[styles.statIcon, { backgroundColor: typeColor + '20' }]}>
                <Ionicons name={stat.icon} size={16} color={typeColor} />
              </View>
              <Text style={{ ...FONTS.captionBold, color: COLORS.text, marginTop: SPACING.sm, textAlign: 'center' }} numberOfLines={1}>
                {stat.value}
              </Text>
              <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Application Details</Text>
        {infoRows.map((row, i) => (
          <View key={i}>
            {i > 0 && <Divider />}
            <View style={styles.infoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.infoIconWrap, { backgroundColor: typeColor + '15' }]}>
                  <Ionicons name={row.icon} size={14} color={typeColor} />
                </View>
                <Text style={styles.infoLabel}>{row.label}</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={row.label === 'Bio' || row.label === 'Address' ? 4 : 1}>
                {row.value || '—'}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Documents */}
      {item?.documents?.length > 0 && (
        <Card style={styles.infoCard}>
          <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>
            Uploaded Documents ({item.documents.length})
          </Text>
          {item.documents.map((doc, i) => (
            <TouchableOpacity
              key={i}
              style={styles.docItem}
              onPress={() => {
                const url = typeof doc === 'string' ? doc : doc.url || doc.file;
                if (url) Linking.openURL(url);
              }}
            >
              <View style={[styles.infoIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="document-outline" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.docName} numberOfLines={1}>
                {typeof doc === 'string' ? `Document ${i + 1}` : doc.name || `Document ${i + 1}`}
              </Text>
              <Ionicons name="open-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {(!item?.documents || item.documents.length === 0) && (
        <Card style={[styles.infoCard, { backgroundColor: COLORS.bgElevated }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.infoIconWrap, { backgroundColor: COLORS.border }]}>
              <Ionicons name="document-outline" size={14} color={COLORS.textMuted} />
            </View>
            <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginLeft: SPACING.md }}>No documents uploaded</Text>
          </View>
        </Card>
      )}

      {/* Admin notice */}
      <Card style={[styles.infoCard, { backgroundColor: COLORS.warning + '10', borderColor: COLORS.warning + '40', borderWidth: 1 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} style={{ marginRight: SPACING.sm, marginTop: 2 }} />
          <Text style={{ ...FONTS.caption, color: COLORS.warning, flex: 1 }}>
            Approving activates the account immediately and notifies the applicant. Rejection also sends a notification with the reason.
          </Text>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Approve"
          color={COLORS.success}
          onPress={handleApprove}
          loading={approving}
          style={{ flex: 1 }}
        />
        <Button
          title="Reject"
          variant="outline"
          color={COLORS.danger}
          onPress={handleReject}
          loading={rejecting}
          style={{ flex: 1 }}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  banner: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '30%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: { marginHorizontal: SPACING.xl, marginBottom: SPACING.md },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  infoLabel: { ...FONTS.caption, color: COLORS.textSecondary },
  infoValue: { ...FONTS.captionBold, color: COLORS.text, flex: 1.5, textAlign: 'right' },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  docName: { ...FONTS.body, color: COLORS.primary, flex: 1, marginLeft: SPACING.sm },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});
