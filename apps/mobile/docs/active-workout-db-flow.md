# CoreSet Active Workout DB Flow

This patch keeps the active workout screen local-first.

## Local WatermelonDB flow

- `exercises` stores the exercise library pulled from the backend `/exercises` route.
- `routines` stores workout plans.
- `routine_exercises` stores the exercises inside each routine, including:
  - sort order
  - default sets/reps/rest
  - notes
  - `focus_metric` selected from the analytics button
- `sessions` stores active/completed/cancelled workout sessions.
- `workout_sets` stores each set for a session and routine exercise, including:
  - set type: `normal`, `warmup`, `failure`, `drop`
  - previous weight/reps
  - current weight/reps/RPE
  - rest time
  - completed state

## Cloud sync rule

Unsigned users can save locally only. User-owned data should not be pushed online until sign-in.

After sign-in, records with no remote id can be uploaded to Aiven through backend API routes later.

## AI camera button

The camera button appears only for AI-tracked movements:
- push up
- squat
- pull up
- bench press

The button opens the same `/capture` route used by the Home tab's Start Workout button.
