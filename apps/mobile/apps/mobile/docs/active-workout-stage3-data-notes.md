# Active Workout Stage 3 Data Notes

This patch aligns the local demo workout with the current active-workout UI and sync model.

## Why exercise previews previously showed icons

The current seed data only inserts exercise name, muscle, equipment, AI flag, AI class, and bodyweight flag. The later schema upgrade adds `default_notes`, `thumbnail_url`, and `demo_video_url`, but those fields are not populated by the original seed data. When `thumbnail_url` is empty, the mobile UI correctly falls back to an icon.

Run `backend/sql/006_exercise_metadata_and_sample_data.sql` against Aiven to populate demo descriptions and placeholder thumbnail URLs.

## Local demo data

The local WatermelonDB sample workout now includes:

- Bench Press — AI-tracked, weighted
- Lateral Raise — manual accessory
- Squat — AI-tracked, weighted
- Pull Up and Push Up available in the Add Exercise picker
- Negative weight support for assisted bodyweight movements at the DB/service layer

The active local demo session is automatically reseeded if the app finds the old local demo version.

## Check buttons

Set check buttons are touchable and toggle between incomplete and completed. Tapping a completed check toggles it back to incomplete.
