-- apps/api/sql/004_seed_full_exercises.sql
-- Full global exercise library seed.
-- Safe to re-run — uses ON CONFLICT DO NOTHING.
-- The 4 AI-tracked exercises use fixed UUIDs matching what's already in your DB.
-- All others get stable UUIDs so re-runs don't duplicate rows.

INSERT INTO exercises (
  exercise_id,
  name,
  primary_muscle,
  secondary_muscles,
  equipment_type,
  movement_pattern,
  is_ai_tracked,
  ai_exercise_class,
  is_bodyweight,
  is_custom,
  created_by_user
) VALUES

-- ─────────────────────────────────────────────────────────────
-- AI-TRACKED (4 special exercises with AI rep detection)
-- These UUIDs must match what's already in your DB exactly.
-- ─────────────────────────────────────────────────────────────
('e2e740d6-475a-4dcd-9332-fe73fb75c37e', 'Push Up',             'Chest',      '["Triceps","Front Delt"]',          'Bodyweight', 'Horizontal Push', TRUE,  'push_up',     TRUE,  FALSE, NULL),
('1e05d446-e461-4dbc-a87d-ec8b069ca2be', 'Pull Up',             'Lats',       '["Biceps","Rear Delt"]',             'Bodyweight', 'Vertical Pull',   TRUE,  'pull_up',     TRUE,  FALSE, NULL),
('2c305cc1-72ec-422c-9edd-4d082319bdf3', 'Bodyweight Squat',    'Quads',      '["Glutes","Hamstrings"]',            'Bodyweight', 'Squat',           TRUE,  'squat',       TRUE,  FALSE, NULL),
('0c57b0a5-be58-4f1d-b033-8d4c482b59b2', 'Barbell Bench Press', 'Chest',      '["Triceps","Front Delt"]',           'Barbell',    'Horizontal Push', TRUE,  'bench_press', FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- PUSH — Chest
-- ─────────────────────────────────────────────────────────────
('b1000001-0000-0000-0000-000000000001', 'Incline Barbell Bench Press', 'Chest', '["Front Delt","Triceps"]',         'Barbell',    'Horizontal Push', FALSE, NULL, FALSE, FALSE, NULL),
('b1000001-0000-0000-0000-000000000002', 'Decline Barbell Bench Press', 'Chest', '["Triceps","Front Delt"]',         'Barbell',    'Horizontal Push', FALSE, NULL, FALSE, FALSE, NULL),
('b1000001-0000-0000-0000-000000000003', 'Dumbbell Bench Press',        'Chest', '["Triceps","Front Delt"]',         'Dumbbell',   'Horizontal Push', FALSE, NULL, FALSE, FALSE, NULL),
('b1000001-0000-0000-0000-000000000004', 'Incline Dumbbell Press',      'Chest', '["Front Delt","Triceps"]',         'Dumbbell',   'Horizontal Push', FALSE, NULL, FALSE, FALSE, NULL),
('b1000001-0000-0000-0000-000000000005', 'Cable Chest Fly',             'Chest', '["Front Delt"]',                   'Cable',      'Horizontal Push', FALSE, NULL, FALSE, FALSE, NULL),
('b1000001-0000-0000-0000-000000000006', 'Pec Deck Fly',                'Chest', '["Front Delt"]',                   'Machine',    'Horizontal Push', FALSE, NULL, FALSE, FALSE, NULL),
('b1000001-0000-0000-0000-000000000007', 'Dips',                        'Chest', '["Triceps","Front Delt"]',         'Bodyweight', 'Vertical Push',   FALSE, NULL, TRUE,  FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- PUSH — Shoulders
-- ─────────────────────────────────────────────────────────────
('b2000001-0000-0000-0000-000000000001', 'Overhead Press',              'Front Delt',   '["Lateral Delt","Triceps"]',   'Barbell',    'Vertical Push',   FALSE, NULL, FALSE, FALSE, NULL),
('b2000001-0000-0000-0000-000000000002', 'Dumbbell Shoulder Press',     'Front Delt',   '["Lateral Delt","Triceps"]',   'Dumbbell',   'Vertical Push',   FALSE, NULL, FALSE, FALSE, NULL),
('b2000001-0000-0000-0000-000000000003', 'Arnold Press',                'Front Delt',   '["Lateral Delt","Triceps"]',   'Dumbbell',   'Vertical Push',   FALSE, NULL, FALSE, FALSE, NULL),
('b2000001-0000-0000-0000-000000000004', 'Lateral Raise',               'Lateral Delt', '["Front Delt"]',               'Dumbbell',   'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('b2000001-0000-0000-0000-000000000005', 'Cable Lateral Raise',         'Lateral Delt', '["Front Delt"]',               'Cable',      'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('b2000001-0000-0000-0000-000000000006', 'Front Raise',                 'Front Delt',   '["Lateral Delt"]',             'Dumbbell',   'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- PUSH — Triceps
-- ─────────────────────────────────────────────────────────────
('b3000001-0000-0000-0000-000000000001', 'Tricep Pushdown',             'Triceps', '[]',                              'Cable',      'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('b3000001-0000-0000-0000-000000000002', 'Overhead Tricep Extension',   'Triceps', '[]',                              'Dumbbell',   'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('b3000001-0000-0000-0000-000000000003', 'Skull Crusher',               'Triceps', '[]',                              'Barbell',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('b3000001-0000-0000-0000-000000000004', 'Close Grip Bench Press',      'Triceps', '["Chest","Front Delt"]',          'Barbell',    'Horizontal Push', FALSE, NULL, FALSE, FALSE, NULL),
('b3000001-0000-0000-0000-000000000005', 'Diamond Push Up',             'Triceps', '["Chest","Front Delt"]',          'Bodyweight', 'Horizontal Push', FALSE, NULL, TRUE,  FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- PULL — Back
-- ─────────────────────────────────────────────────────────────
('c1000001-0000-0000-0000-000000000001', 'Barbell Row',                 'Lats',  '["Traps","Biceps","Rear Delt"]',   'Barbell',    'Horizontal Pull', FALSE, NULL, FALSE, FALSE, NULL),
('c1000001-0000-0000-0000-000000000002', 'Dumbbell Row',                'Lats',  '["Biceps","Rear Delt"]',           'Dumbbell',   'Horizontal Pull', FALSE, NULL, FALSE, FALSE, NULL),
('c1000001-0000-0000-0000-000000000003', 'Lat Pulldown',                'Lats',  '["Biceps","Rear Delt"]',           'Cable',      'Vertical Pull',   FALSE, NULL, FALSE, FALSE, NULL),
('c1000001-0000-0000-0000-000000000004', 'Seated Cable Row',            'Lats',  '["Traps","Biceps"]',               'Cable',      'Horizontal Pull', FALSE, NULL, FALSE, FALSE, NULL),
('c1000001-0000-0000-0000-000000000005', 'T-Bar Row',                   'Lats',  '["Traps","Biceps","Rear Delt"]',   'Barbell',    'Horizontal Pull', FALSE, NULL, FALSE, FALSE, NULL),
('c1000001-0000-0000-0000-000000000006', 'Chest Supported Row',         'Lats',  '["Rear Delt","Biceps"]',           'Dumbbell',   'Horizontal Pull', FALSE, NULL, FALSE, FALSE, NULL),
('c1000001-0000-0000-0000-000000000007', 'Straight Arm Pulldown',       'Lats',  '["Teres Major"]',                  'Cable',      'Vertical Pull',   FALSE, NULL, FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- PULL — Rear Delt / Traps
-- ─────────────────────────────────────────────────────────────
('c2000001-0000-0000-0000-000000000001', 'Face Pull',                   'Rear Delt', '["Traps","External Rotators"]', 'Cable',     'Horizontal Pull', FALSE, NULL, FALSE, FALSE, NULL),
('c2000001-0000-0000-0000-000000000002', 'Reverse Pec Deck',            'Rear Delt', '["Traps"]',                    'Machine',    'Horizontal Pull', FALSE, NULL, FALSE, FALSE, NULL),
('c2000001-0000-0000-0000-000000000003', 'Barbell Shrug',               'Traps',     '["Rear Delt"]',                'Barbell',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('c2000001-0000-0000-0000-000000000004', 'Dumbbell Shrug',              'Traps',     '["Rear Delt"]',                'Dumbbell',   'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- PULL — Biceps
-- ─────────────────────────────────────────────────────────────
('c3000001-0000-0000-0000-000000000001', 'Barbell Curl',                'Biceps', '["Brachialis"]',                  'Barbell',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('c3000001-0000-0000-0000-000000000002', 'Dumbbell Curl',               'Biceps', '["Brachialis"]',                  'Dumbbell',   'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('c3000001-0000-0000-0000-000000000003', 'Hammer Curl',                 'Brachialis', '["Biceps"]',                  'Dumbbell',   'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('c3000001-0000-0000-0000-000000000004', 'Incline Dumbbell Curl',       'Biceps', '["Brachialis"]',                  'Dumbbell',   'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('c3000001-0000-0000-0000-000000000005', 'Cable Curl',                  'Biceps', '["Brachialis"]',                  'Cable',      'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('c3000001-0000-0000-0000-000000000006', 'Preacher Curl',               'Biceps', '[]',                              'Barbell',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- LEGS — Quads
-- ─────────────────────────────────────────────────────────────
('d1000001-0000-0000-0000-000000000001', 'Barbell Back Squat',          'Quads', '["Glutes","Hamstrings","Adductors"]', 'Barbell', 'Squat',          FALSE, NULL, FALSE, FALSE, NULL),
('d1000001-0000-0000-0000-000000000002', 'Barbell Front Squat',         'Quads', '["Glutes","Hamstrings"]',           'Barbell',    'Squat',           FALSE, NULL, FALSE, FALSE, NULL),
('d1000001-0000-0000-0000-000000000003', 'Goblet Squat',                'Quads', '["Glutes","Hamstrings"]',           'Dumbbell',   'Squat',           FALSE, NULL, FALSE, FALSE, NULL),
('d1000001-0000-0000-0000-000000000004', 'Leg Press',                   'Quads', '["Glutes","Hamstrings"]',           'Machine',    'Squat',           FALSE, NULL, FALSE, FALSE, NULL),
('d1000001-0000-0000-0000-000000000005', 'Hack Squat',                  'Quads', '["Glutes","Hamstrings"]',           'Machine',    'Squat',           FALSE, NULL, FALSE, FALSE, NULL),
('d1000001-0000-0000-0000-000000000006', 'Leg Extension',               'Quads', '[]',                                'Machine',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('d1000001-0000-0000-0000-000000000007', 'Bulgarian Split Squat',       'Quads', '["Glutes","Hamstrings"]',           'Dumbbell',   'Squat',           FALSE, NULL, FALSE, FALSE, NULL),
('d1000001-0000-0000-0000-000000000008', 'Walking Lunge',               'Quads', '["Glutes","Hamstrings"]',           'Dumbbell',   'Squat',           FALSE, NULL, FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- LEGS — Hamstrings & Glutes
-- ─────────────────────────────────────────────────────────────
('d2000001-0000-0000-0000-000000000001', 'Deadlift',                    'Hamstrings', '["Glutes","Lats","Traps","Lower Back"]', 'Barbell', 'Hinge',   FALSE, NULL, FALSE, FALSE, NULL),
('d2000001-0000-0000-0000-000000000002', 'Romanian Deadlift',           'Hamstrings', '["Glutes","Lower Back"]',       'Barbell',    'Hinge',           FALSE, NULL, FALSE, FALSE, NULL),
('d2000001-0000-0000-0000-000000000003', 'Sumo Deadlift',               'Hamstrings', '["Glutes","Adductors","Lower Back"]', 'Barbell', 'Hinge',      FALSE, NULL, FALSE, FALSE, NULL),
('d2000001-0000-0000-0000-000000000004', 'Leg Curl',                    'Hamstrings', '[]',                            'Machine',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('d2000001-0000-0000-0000-000000000005', 'Nordic Hamstring Curl',       'Hamstrings', '["Glutes"]',                   'Bodyweight', 'Isolation',       FALSE, NULL, TRUE,  FALSE, NULL),
('d2000001-0000-0000-0000-000000000006', 'Hip Thrust',                  'Glutes', '["Hamstrings"]',                   'Barbell',    'Hinge',           FALSE, NULL, FALSE, FALSE, NULL),
('d2000001-0000-0000-0000-000000000007', 'Glute Bridge',                'Glutes', '["Hamstrings"]',                   'Bodyweight', 'Hinge',           FALSE, NULL, TRUE,  FALSE, NULL),
('d2000001-0000-0000-0000-000000000008', 'Cable Kickback',              'Glutes', '["Hamstrings"]',                   'Cable',      'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- LEGS — Calves
-- ─────────────────────────────────────────────────────────────
('d3000001-0000-0000-0000-000000000001', 'Standing Calf Raise',         'Calves', '[]',                               'Machine',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('d3000001-0000-0000-0000-000000000002', 'Seated Calf Raise',           'Calves', '[]',                               'Machine',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('d3000001-0000-0000-0000-000000000003', 'Leg Press Calf Raise',        'Calves', '[]',                               'Machine',    'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),

-- ─────────────────────────────────────────────────────────────
-- CORE
-- ─────────────────────────────────────────────────────────────
('e1000001-0000-0000-0000-000000000001', 'Plank',                       'Core', '["Lower Back"]',                    'Bodyweight', 'Isolation',       FALSE, NULL, TRUE,  FALSE, NULL),
('e1000001-0000-0000-0000-000000000002', 'Ab Wheel Rollout',            'Core', '["Lower Back","Lats"]',             'Bodyweight', 'Isolation',       FALSE, NULL, TRUE,  FALSE, NULL),
('e1000001-0000-0000-0000-000000000003', 'Cable Crunch',                'Core', '[]',                                'Cable',      'Isolation',       FALSE, NULL, FALSE, FALSE, NULL),
('e1000001-0000-0000-0000-000000000004', 'Hanging Leg Raise',           'Core', '["Hip Flexors"]',                   'Bodyweight', 'Isolation',       FALSE, NULL, TRUE,  FALSE, NULL),
('e1000001-0000-0000-0000-000000000005', 'Russian Twist',               'Core', '["Obliques"]',                      'Bodyweight', 'Isolation',       FALSE, NULL, TRUE,  FALSE, NULL),
('e1000001-0000-0000-0000-000000000006', 'Dead Bug',                    'Core', '["Lower Back"]',                    'Bodyweight', 'Isolation',       FALSE, NULL, TRUE,  FALSE, NULL)

ON CONFLICT (exercise_id) DO NOTHING;