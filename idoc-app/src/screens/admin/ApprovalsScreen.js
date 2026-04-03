import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, Badge, Button, EmptyState, Chip } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { adminAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function AdminApprovalsScreen() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(false);

  const loadApprovals = async () => {
    setError(false);
    try {
      const { data } = await adminAPI.getPendingApprovals();
      const nextApprovals = Array.isArray(data) ? data : data?.results || [];
      setApprovals(nextApprovals);
    } catch (error) {
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

  const filteredApprovals = useMemo(() => {
    if (activeFilter === 'all') return approvals;
    return approvals.filter((item) => item.type === activeFilter);
  }, [approvals, activeFilter]);

  const handleApprove = async (item) => {
    try {
      if (item.type === 'doctor') {
        await adminAPI.approveDoctor(item.id);
      } else {
        await adminAPI.approvePharmacy(item.id);
      }
      setApprovals((current) => current.filter((approval) => approval.id !== item.id));
      Toast.show({ type: 'success', text1: 'Approved', text2: `${item.name} has been approved` });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Approval failed', text2: error.response?.data?.error || 'Please try again' });
    }
  };

  const handleReject = async (item) => {
    try {
      await adminAPI.rejectUser(item.id, { reason: 'Registration rejected by admin.' });
      setApprovals((current) => current.filter((approval) => approval.id !== item.id));
      Toast.show({ type: 'error', text1: 'Rejected', text2: `${item.name} has been rejected` });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Rejection failed', text2: error.response?.data?.error || 'Please try again' });
    }
  };

  const approvalCount = approvals.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Pending Approvals</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>{approvalCount} awaiting review</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        <Chip label={`All (${approvalCount})`} active={activeFilter === 'all'} onPress={() => setActiveFilter('all')} />
        <Chip label={`Doctors (${approvals.filter((item) => item.type === 'doctor').length})`} active={activeFilter === 'doctor'} onPress={() => setActiveFilter('doctor')} />
        <Chip label={`Pharmacies (${approvals.filter((item) => item.type === 'pharmacy').length})`} active={activeFilter === 'pharmacy'} onPress={() => setActiveFilter('pharmacy')} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredApprovals}
          keyExtractor={(i) => i.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadApprovals(); }} tintColor={COLORS.primary} />}
          contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
          ListEmptyComponent={
            error ? (
              <Card>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Approvals unavailable</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Pull down to retry loading approval queue.</Text>
              </Card>
            ) : (
              <EmptyState title="All caught up" message="No pending approvals" icon={<Ionicons name="checkmark-circle-outline" size={46} color={COLORS.success} />} />
            )
          }
          renderItem={({ item }) => (
            <Card style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Avatar name={item.name} size={50} color={item.type === 'doctor' ? COLORS.doctor : COLORS.pharmacy} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
                    <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
                    <Badge text={item.type} color={item.type === 'doctor' ? COLORS.doctor : COLORS.pharmacy} size="sm" />
                  </View>
                  <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 }}>{item.email}</Text>
                  {item.specialty && <Text style={{ ...FONTS.caption, color: COLORS.primary, marginTop: 2 }}>Specialty: {item.specialty}</Text>}
                  {item.address && <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 }}>{item.address}</Text>}
                  <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 4 }}>License: {item.license} • Submitted: {item.submitted}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
                <Button title="Approve" size="sm" onPress={() => handleApprove(item)} style={{ flex: 1 }} />
                <Button title="Reject" size="sm" variant="outline" color={COLORS.danger} onPress={() => handleReject(item)} style={{ flex: 1 }} />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
});
