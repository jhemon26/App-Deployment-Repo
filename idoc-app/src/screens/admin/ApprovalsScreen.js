import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { adminAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function AdminApprovalsScreen({ navigation, route }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(route?.params?.initialFilter || 'all');
  const [error, setError] = useState(false);

  const loadApprovals = async () => {
    setError(false);
    try {
      const { data } = await adminAPI.getPendingApprovals();
      const nextApprovals = Array.isArray(data) ? data : data?.results || [];
      setApprovals(nextApprovals);
    } catch (err) {
      setApprovals([]);
      setError(true);
      Toast.show({ type: 'error', text1: 'Could not load approvals', text2: 'Pull to refresh and try again.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.initialFilter) setActiveFilter(route.params.initialFilter);
      loadApprovals();
    }, [route?.params?.initialFilter])
  );

  const getApprovalType = (item) => item.type || item.role;

  const getSubmittedLabel = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  };

  const filteredApprovals = useMemo(() => {
    if (activeFilter === 'all') return approvals;
    return approvals.filter((item) => getApprovalType(item) === activeFilter);
  }, [approvals, activeFilter]);

  const doctorCount = approvals.filter((item) => getApprovalType(item) === 'doctor').length;
  const pharmacyCount = approvals.filter((item) => getApprovalType(item) === 'pharmacy').length;
  const approvalCount = approvals.length;

  const handleApprove = async (item) => {
    try {
      if (getApprovalType(item) === 'doctor') {
        await adminAPI.approveDoctor(item.id);
      } else {
        await adminAPI.approvePharmacy(item.id);
      }
      setApprovals((current) => current.filter((approval) => approval.id !== item.id));
      Toast.show({ type: 'success', text1: 'Approved', text2: `${item.name} has been approved` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Approval failed', text2: err.response?.data?.error || 'Please try again' });
    }
  };

  const handleReject = async (item) => {
    try {
      await adminAPI.rejectUser(item.id, { reason: 'Registration rejected by admin.' });
      setApprovals((current) => current.filter((approval) => approval.id !== item.id));
      Toast.show({ type: 'error', text1: 'Rejected', text2: `${item.name} has been rejected` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Rejection failed', text2: err.response?.data?.error || 'Please try again' });
    }
  };

  const renderApprovalCard = ({ item }) => {
    const approvalType = getApprovalType(item);
    const typeColor = approvalType === 'doctor' ? COLORS.doctor : COLORS.pharmacy;
    const label = approvalType ? approvalType.charAt(0).toUpperCase() + approvalType.slice(1) : 'User';
    const licenseValue = item.license || item.license_number || 'N/A';

    return (
      <View style={[styles.card, { borderLeftColor: typeColor }, SHADOWS.sm]}>
        <TouchableOpacity
          style={styles.cardTop}
          onPress={() => navigation.navigate('AdminDoctorDetail', { item })}
          activeOpacity={0.75}
        >
          <Avatar name={item.name} size={36} color={typeColor} />
          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              <Badge text={label} color={typeColor} size="sm" />
            </View>
            <Text style={styles.email}>{item.email}</Text>
            {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}
            {!!item.address && <Text style={styles.address} numberOfLines={2}>{item.address}</Text>}

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="card-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>License: {licenseValue}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{getSubmittedLabel(item.submitted)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionArea}>
          <View style={styles.actionRow}>
            <Button title="Approve" color={COLORS.success} onPress={() => handleApprove(item)} style={{ flex: 1 }} />
            <Button title="Reject" variant="outline" color={COLORS.danger} onPress={() => handleReject(item)} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Pending Approvals</Text>
        <Text style={styles.pageSubtitle}>{approvalCount} awaiting review</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {[
            { key: 'all', label: `All (${approvalCount})` },
            { key: 'doctor', label: `Doctors (${doctorCount})` },
            { key: 'pharmacy', label: `Pharmacies (${pharmacyCount})` },
          ].map((item) => {
            const active = activeFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(item.key)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.admin} />
        </View>
      ) : (
        <FlatList
          data={filteredApprovals}
          keyExtractor={(i) => i.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadApprovals(); }}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.danger + '20' }]}> 
                  <Ionicons name="alert-circle-outline" size={32} color={COLORS.danger} />
                </View>
                <Text style={styles.emptyTitle}>Approvals unavailable</Text>
                <Text style={styles.emptyText}>Pull down to retry loading approval queue.</Text>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.success + '20' }]}> 
                  <Ionicons name="checkmark-circle-outline" size={32} color={COLORS.success} />
                </View>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.emptyText}>No pending approvals at this time.</Text>
              </View>
            )
          }
          renderItem={renderApprovalCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerCard: {
    marginHorizontal: SPACING.xl,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  pageTitle: { ...FONTS.h2, color: COLORS.text },
  pageSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },

  tabBar: { paddingTop: 8, paddingBottom: 2 },
  tabChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tabChipActive: { backgroundColor: COLORS.admin, borderColor: COLORS.admin },
  tabChipText: { ...FONTS.captionBold, color: COLORS.textSecondary, fontSize: 12 },
  tabChipTextActive: { ...FONTS.captionBold, color: COLORS.textInverse, fontSize: 12 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  infoCol: { flex: 1, marginLeft: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING.sm, flexWrap: 'wrap' },
  name: { ...FONTS.bodyBold, color: COLORS.text },
  email: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 3 },
  specialty: { ...FONTS.caption, color: COLORS.primary, marginTop: 2 },
  address: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 5, marginTop: 4 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaText: { ...FONTS.small, color: COLORS.textMuted, marginLeft: 4 },

  actionArea: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 7, marginTop: 7 },
  actionRow: { flexDirection: 'row', columnGap: SPACING.md },

  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 64, height: 64, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.lg },
  emptyText: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});
