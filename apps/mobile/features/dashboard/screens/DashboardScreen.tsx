import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getDashboardHome } from '../services/dashboardService';
import { DASHBOARD_ROUTES } from '../services/dashboardRoutes';
import type { DashboardHomeVM, DashboardRoutineCardVM, DashboardActivityVM } from '../types/dashboard.types';

const logo = require('../../../assets/images/icon.png');

const COLORS = {
  bg: '#000000',
  card: '#202020',
  cardSoft: '#2A2A2A',
  border: '#333333',
  text: '#FFFFFF',
  muted: '#8E8E93',
  yellow: '#E0FB4A',
  orange: '#FF5A36',
};

function Header({ onProfilePress }: { onProfilePress: () => void }) {
  return (
    <View style={styles.header}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />

      <Pressable onPress={onProfilePress} style={styles.profileButton} hitSlop={10}>
        <Ionicons name="person-outline" size={22} color={COLORS.yellow} />
      </Pressable>
    </View>
  );
}

function QuickStartCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quickStartCard}>
      <View style={styles.quickStartGlow} />
      <View style={styles.quickStartTextWrap}>
        <Text style={styles.quickStartLabel}>QUICK START</Text>
        <Text style={styles.quickStartTitle}>Start Empty Session</Text>
        <Text style={styles.quickStartDesc}>Jump in and start tracking your workout now.</Text>
      </View>

      <View style={styles.playButton}>
        <Ionicons name="play" size={24} color="#FFFFFF" style={styles.playIcon} />
      </View>
    </Pressable>
  );
}

function SectionHeader({
  title,
  icon,
  actionLabel,
  onActionPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  actionLabel: string;
  onActionPress: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Ionicons name={icon} size={18} color={COLORS.yellow} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Pressable onPress={onActionPress} hitSlop={8}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function RoutineCard({ routine, onPress }: { routine: DashboardRoutineCardVM; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.routineCard}>
      <View style={styles.routineIcon}>
        <Ionicons name="barbell-outline" size={27} color="#111111" />
      </View>

      <Text style={styles.routineName} numberOfLines={1}>{routine.name}</Text>
      <Text style={styles.routineMuscles} numberOfLines={2}>{routine.musclesLabel}</Text>

      <View style={styles.routineDivider} />
      <Text style={styles.routineDateLabel}>Last used</Text>
      <Text style={styles.routineDate} numberOfLines={1}>{routine.lastUsedLabel}</Text>
    </Pressable>
  );
}

function ActivityCard({ activity }: { activity: DashboardActivityVM }) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityThumb}>
        <Ionicons name="fitness-outline" size={22} color="#222222" />
      </View>

      <View style={styles.activityInfo}>
        <Text style={styles.activityName} numberOfLines={1}>{activity.title}</Text>
        <Text style={styles.activityTime} numberOfLines={1}>{activity.dateLabel}</Text>
      </View>

      <View style={styles.activityStats}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statVolume} numberOfLines={1}>{activity.totalVolumeLabel}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlockSmall}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statDuration} numberOfLines={1}>{activity.durationLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardHomeVM | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getDashboardHome()
      .then(data => {
        if (mounted) setDashboard(data);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const goToCapture = useCallback(() => {
    router.push(DASHBOARD_ROUTES.captureEmpty as any);
  }, [router]);

  const goToRoutineCapture = useCallback((routineId: string) => {
    router.push(DASHBOARD_ROUTES.captureRoutine(routineId) as any);
  }, [router]);

  if (isLoading || !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.yellow} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header onProfilePress={() => router.push(DASHBOARD_ROUTES.profile as any)} />

        <View style={styles.greetingWrap}>
          <Text style={styles.greeting}>{dashboard.greeting}</Text>
          <Text style={styles.subtitle}>{dashboard.subtitle}</Text>
        </View>

        <QuickStartCard onPress={goToCapture} />

        <SectionHeader
          icon="barbell-outline"
          title="Routine Quick-Launch"
          actionLabel="See all"
          onActionPress={() => router.push(DASHBOARD_ROUTES.routines as any)}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routineList}
        >
          {dashboard.routines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onPress={() => goToRoutineCapture(routine.id)}
            />
          ))}
        </ScrollView>

        <SectionHeader
          icon="pulse-outline"
          title="Recent Activity"
          actionLabel="View all"
          onActionPress={() => router.push(DASHBOARD_ROUTES.analytics as any)}
        />

        <View style={styles.activityList}>
          {dashboard.recentActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  logo: {
    width: 42,
    height: 42,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(224, 251, 74, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingWrap: {
    marginBottom: 20,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
  },
  quickStartCard: {
    minHeight: 124,
    borderWidth: 1,
    borderColor: COLORS.yellow,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickStartGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(224, 251, 74, 0.055)',
  },
  quickStartTextWrap: {
    flex: 1,
    paddingRight: 18,
  },
  quickStartLabel: {
    color: COLORS.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  quickStartTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  quickStartDesc: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 210,
  },
  playButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionAction: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '600',
  },
  routineList: {
    gap: 10,
    paddingRight: 16,
    paddingBottom: 28,
  },
  routineCard: {
    width: 104,
    minHeight: 152,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },
  routineIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  routineName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    width: '100%',
    textAlign: 'center',
  },
  routineMuscles: {
    color: COLORS.muted,
    fontSize: 9.5,
    lineHeight: 13,
    textAlign: 'center',
    minHeight: 27,
    marginTop: 4,
  },
  routineDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 9,
    marginBottom: 7,
  },
  routineDateLabel: {
    color: COLORS.muted,
    fontSize: 9.5,
  },
  routineDate: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#9B9B9B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  activityName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  activityTime: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },
  activityStats: {
    width: 136,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statBlock: {
    width: 62,
  },
  statBlockSmall: {
    width: 54,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 9.5,
    marginBottom: 3,
  },
  statVolume: {
    color: COLORS.orange,
    fontSize: 11.5,
    fontWeight: '800',
  },
  statDuration: {
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
});
