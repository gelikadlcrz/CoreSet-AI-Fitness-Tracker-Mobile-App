import type { DashboardDbSnapshot } from '../types/dashboard.types';

export const DEMO_USER_ID = 'demo_user_001';

export const mockDashboardDb: DashboardDbSnapshot = {
  users: [
    {
      id: DEMO_USER_ID,
      first_name: 'Lyshael',
      last_name: 'Bernal',
      email: 'lyshael@example.com',
      avatar_url: null,
    },
  ],

  routines: [
    {
      id: 'routine_push_day',
      user_id: DEMO_USER_ID,
      name: 'Push Day',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-05T07:00:00.000Z',
    },
    {
      id: 'routine_pull_day',
      user_id: DEMO_USER_ID,
      name: 'Pull Day',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-04T07:00:00.000Z',
    },
    {
      id: 'routine_leg_day',
      user_id: DEMO_USER_ID,
      name: 'Leg Day',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-03T07:00:00.000Z',
    },
    {
      id: 'routine_upper_day',
      user_id: DEMO_USER_ID,
      name: 'Upper Day',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-02T07:00:00.000Z',
    },
  ],

  routine_muscle_groups: [
    { id: 'mg_push_1', routine_id: 'routine_push_day', muscle_group: 'Chest' },
    { id: 'mg_push_2', routine_id: 'routine_push_day', muscle_group: 'Shoulders' },
    { id: 'mg_push_3', routine_id: 'routine_push_day', muscle_group: 'Triceps' },
    { id: 'mg_pull_1', routine_id: 'routine_pull_day', muscle_group: 'Back' },
    { id: 'mg_pull_2', routine_id: 'routine_pull_day', muscle_group: 'Biceps' },
    { id: 'mg_pull_3', routine_id: 'routine_pull_day', muscle_group: 'Rear Delts' },
    { id: 'mg_leg_1', routine_id: 'routine_leg_day', muscle_group: 'Quads' },
    { id: 'mg_leg_2', routine_id: 'routine_leg_day', muscle_group: 'Hamstrings' },
    { id: 'mg_leg_3', routine_id: 'routine_leg_day', muscle_group: 'Glutes' },
    { id: 'mg_upper_1', routine_id: 'routine_upper_day', muscle_group: 'Chest' },
    { id: 'mg_upper_2', routine_id: 'routine_upper_day', muscle_group: 'Back' },
    { id: 'mg_upper_3', routine_id: 'routine_upper_day', muscle_group: 'Arms' },
  ],

  workout_sessions: [
    {
      id: 'session_2026_05_08_push',
      user_id: DEMO_USER_ID,
      routine_id: 'routine_push_day',
      title: 'Push Day',
      started_at: '2026-05-08T06:45:00.000Z',
      ended_at: '2026-05-08T07:50:00.000Z',
      status: 'completed',
    },
    {
      id: 'session_2026_05_06_pull',
      user_id: DEMO_USER_ID,
      routine_id: 'routine_pull_day',
      title: 'Pull Day',
      started_at: '2026-05-06T18:15:00.000Z',
      ended_at: '2026-05-06T19:08:00.000Z',
      status: 'completed',
    },
    {
      id: 'session_2026_05_05_push',
      user_id: DEMO_USER_ID,
      routine_id: 'routine_push_day',
      title: 'Push Day',
      started_at: '2026-05-05T06:30:00.000Z',
      ended_at: '2026-05-05T07:35:00.000Z',
      status: 'completed',
    },
    {
      id: 'session_2026_05_03_leg',
      user_id: DEMO_USER_ID,
      routine_id: 'routine_leg_day',
      title: 'Leg Day',
      started_at: '2026-05-03T07:00:00.000Z',
      ended_at: '2026-05-03T08:12:00.000Z',
      status: 'completed',
    },
  ],

  workout_sets: [
    { id: 'set_001', session_id: 'session_2026_05_08_push', exercise_name: 'Bench Press', weight_kg: 100, reps: 8, rpe: 8.5, source: 'ai_verified' },
    { id: 'set_002', session_id: 'session_2026_05_08_push', exercise_name: 'Bench Press', weight_kg: 100, reps: 8, rpe: 8.5, source: 'ai_verified' },
    { id: 'set_003', session_id: 'session_2026_05_08_push', exercise_name: 'Incline Dumbbell Press', weight_kg: 40, reps: 12, rpe: 9, source: 'manual' },
    { id: 'set_004', session_id: 'session_2026_05_08_push', exercise_name: 'Overhead Press', weight_kg: 60, reps: 10, rpe: 8, source: 'ai_verified' },
    { id: 'set_005', session_id: 'session_2026_05_08_push', exercise_name: 'Triceps Pushdown', weight_kg: 35, reps: 15, rpe: 8, source: 'manual' },

    { id: 'set_006', session_id: 'session_2026_05_06_pull', exercise_name: 'Pull Up', weight_kg: 75, reps: 8, rpe: 8, source: 'ai_verified' },
    { id: 'set_007', session_id: 'session_2026_05_06_pull', exercise_name: 'Barbell Row', weight_kg: 80, reps: 10, rpe: 8, source: 'ai_verified' },
    { id: 'set_008', session_id: 'session_2026_05_06_pull', exercise_name: 'Lat Pulldown', weight_kg: 65, reps: 12, rpe: 8, source: 'manual' },

    { id: 'set_009', session_id: 'session_2026_05_05_push', exercise_name: 'Bench Press', weight_kg: 95, reps: 8, rpe: 8, source: 'ai_verified' },
    { id: 'set_010', session_id: 'session_2026_05_05_push', exercise_name: 'Bench Press', weight_kg: 95, reps: 8, rpe: 8, source: 'ai_verified' },
    { id: 'set_011', session_id: 'session_2026_05_05_push', exercise_name: 'Overhead Press', weight_kg: 57.5, reps: 10, rpe: 8, source: 'ai_verified' },

    { id: 'set_012', session_id: 'session_2026_05_03_leg', exercise_name: 'Squat', weight_kg: 120, reps: 8, rpe: 8.5, source: 'ai_verified' },
    { id: 'set_013', session_id: 'session_2026_05_03_leg', exercise_name: 'Romanian Deadlift', weight_kg: 100, reps: 10, rpe: 8, source: 'manual' },
    { id: 'set_014', session_id: 'session_2026_05_03_leg', exercise_name: 'Leg Press', weight_kg: 180, reps: 12, rpe: 9, source: 'manual' },
  ],
};
