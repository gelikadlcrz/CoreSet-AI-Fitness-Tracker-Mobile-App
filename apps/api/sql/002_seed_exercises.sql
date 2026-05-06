-- apps/api/sql/002_seed_exercises.sql

INSERT INTO exercises (
  name, primary_muscle, secondary_muscles,
  equipment_type, movement_pattern,
  is_ai_tracked, ai_exercise_class, is_bodyweight
) VALUES

('Push Up',             'Chest', '["Triceps","Front Delt"]', 'Bodyweight', 'Horizontal Push', TRUE, 'push_up',     TRUE),
('Pull Up',             'Lats',  '["Biceps","Rear Delt"]',   'Bodyweight', 'Vertical Pull',   TRUE, 'pull_up',     TRUE),
('Bodyweight Squat',    'Quads', '["Glutes","Hamstrings"]',  'Bodyweight', 'Squat',           TRUE, 'squat',       TRUE),
('Barbell Bench Press', 'Chest', '["Triceps","Front Delt"]', 'Barbell',    'Horizontal Push', TRUE, 'bench_press', FALSE);