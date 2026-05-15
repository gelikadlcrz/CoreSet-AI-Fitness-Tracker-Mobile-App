# CoreSet Settings and Workout Sync Flow

## Local-first rule

WatermelonDB remains the app source of truth during workouts. The app can create and update routines, routine exercises, active sessions, sets, reps, settings, body stats, and profile values locally even when offline.

## Signed-out rule

A signed-out user can:

- pull the public exercise library
- create local routines
- start local workout sessions
- save local sets/reps
- edit local settings

A signed-out user cannot push user-owned data online. User-owned data includes settings, profile, body stats, routines, sessions, sets, reps, and exports.

## Signed-in rule

When a user signs in, the app adopts guest/local-only records by updating their local `remote_user_id` fields. Future backend sync can then compare local `updated_at` values with Aiven PostgreSQL `updated_at` values.

## Conflict rule for future Aiven sync

- No remote id: local-only record; push after login.
- Same remote id and cloud `updated_at` newer: pull cloud.
- Same remote id and local `updated_at` newer: push local.
- `deleted_at` exists: deletion wins unless manually restored.

## Table mapping

| PostgreSQL | WatermelonDB |
|---|---|
| users | user_profiles + app_settings |
| body_metrics | body_stats |
| exercises | exercises |
| routines | routines |
| routine_exercises | routine_exercises |
| sessions | sessions |
| sets | workout_sets |
| reps | reps |
| exports | exports |
