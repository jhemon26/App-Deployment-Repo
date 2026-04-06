import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';

export default function RatingInsightsScreen({ navigation, route }) {
  const { dashboard, loading, refresh } = useRoleDashboard('doctor');
  const params = route?.params || {};

  const stats = useMemo(() => {
    const source = dashboard || {};
    const totalPatients = Number(params.totalPatients ?? source.total_patients ?? 0);
    const rating = Number(params.rating ?? source.rating ?? 0);
    const totalReviews = Number(
      params.totalReviews ?? source.total_reviews ?? source.reviews_count ?? source.review_count ?? 0
    );
    const completedAppointments = Number(
      params.completedAppointments ?? source.completed_appointments ??
      (source.appointments || []).filter((apt) => String(apt?.status || '').toLowerCase() === 'completed').length ?? 0
    );
    const pendingReviews = Math.max(
      Number(params.pendingReviews ?? source.pending_reviews ?? (completedAppointments - totalReviews)),
      0
    );

    const ratingBreakdown = source.rating_breakdown || source.reviews_breakdown || {};
    const recentReviews = source.recent_reviews || source.reviews || [];

    return {
      totalPatients,
      rating,
      totalReviews,
      completedAppointments,
      pendingReviews,
      ratingBreakdown,
      recentReviews,
    };
  }, [dashboard, params]);

  const starRows = [5, 4, 3, 2, 1].map((star) => {
    const count = Number(
      stats.ratingBreakdown?.[star] ??
      stats.ratingBreakdown?.[String(star)] ??
      0
    );
    const ratio = stats.totalReviews > 0 ? count / stats.totalReviews : 0;
    return { star, count, ratio };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>Rating Insights</Text>
            <Text style={styles.heroSubtitle}>Performance and review quality overview</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.heroBadgeText}>{stats.rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Patients Seen</Text>
            <Text style={styles.kpiValue}>{stats.totalPatients}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Total Reviews</Text>
            <Text style={styles.kpiValue}>{stats.totalReviews}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Pending Reviews</Text>
            <Text style={styles.kpiValue}>{stats.pendingReviews}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Completed Consults</Text>
            <Text style={styles.kpiValue}>{stats.completedAppointments}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Star Distribution</Text>
        {starRows.map((row) => (
          <View key={row.star} style={styles.starRow}>
            <View style={styles.starLabelWrap}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.starLabel}>{row.star}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.max(row.ratio * 100, row.count > 0 ? 6 : 0)}%` }]} />
            </View>
            <Text style={styles.starCount}>{row.count}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Feedback</Text>
        {!stats.recentReviews.length ? (
          <Text style={styles.emptyText}>No review comments available yet.</Text>
        ) : (
          stats.recentReviews.slice(0, 4).map((review, idx) => {
            const reviewer = review?.patient_name || review?.patient?.name || review?.author || 'Patient';
            const score = Number(review?.rating || 0);
            const comment = review?.comment || review?.text || 'No written comment';
            return (
              <View key={`${review?.id || idx}`} style={styles.reviewRow}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewer} numberOfLines={1}>{reviewer}</Text>
                  <View style={styles.reviewScore}>
                    <Ionicons name="star" size={11} color={COLORS.warning} />
                    <Text style={styles.reviewScoreText}>{score > 0 ? score.toFixed(1) : '--'}</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{comment}</Text>
              </View>
            );
          })
        )}
      </Card>

      <View style={styles.actionRow}>
        <Button title={loading ? 'Refreshing...' : 'Refresh Data'} onPress={refresh} loading={loading} style={{ flex: 1 }} />
        <Button title="Back" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxxxl },

  heroCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    marginBottom: SPACING.md,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { ...FONTS.h3, color: COLORS.text },
  heroSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '18',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.warning + '45',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { ...FONTS.captionBold, color: COLORS.warning, marginLeft: 4 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.md, rowGap: 10, columnGap: 10 },
  kpiItem: {
    width: '48.5%',
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  kpiLabel: { ...FONTS.small, color: COLORS.textSecondary },
  kpiValue: { ...FONTS.h4, color: COLORS.text, marginTop: 4 },

  sectionCard: { borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  sectionTitle: { ...FONTS.bodyBold, color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary },

  starRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  starLabelWrap: { width: 34, flexDirection: 'row', alignItems: 'center' },
  starLabel: { ...FONTS.small, color: COLORS.textSecondary, marginLeft: 3 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: { height: '100%', backgroundColor: COLORS.warning },
  starCount: { ...FONTS.small, color: COLORS.textSecondary, width: 24, textAlign: 'right' },

  reviewRow: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewer: { ...FONTS.captionBold, color: COLORS.text, flex: 1, marginRight: 8 },
  reviewScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '18',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reviewScoreText: { ...FONTS.small, color: COLORS.warning, marginLeft: 4 },
  reviewComment: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 },

  actionRow: { flexDirection: 'row', columnGap: SPACING.sm },
});
