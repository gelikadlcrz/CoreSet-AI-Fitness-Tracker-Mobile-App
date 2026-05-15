# CoreSet Local DB and Remote Sync Flow

This mobile build uses a local-first database design.

## Current local database role

WatermelonDB is the source of truth while the app is running on the phone. It stores:

- user profile and local sign-in state
- body metrics
- settings and preferences
- exercise cache
- routines
- routine exercises
- workout sessions
- workout sets
- rep-level AI analytics
- export history metadata

This keeps workouts usable even when the phone has no connection.

## Remote database role

PostgreSQL on Aiven should stay behind the backend API. The mobile app should never connect directly to PostgreSQL.

Expected remote flow:

```text
Mobile app
  -> backend API
  -> PostgreSQL / Aiven
```

## Table mapping

| PostgreSQL table | WatermelonDB table | Notes |
|---|---|---|
| users | user_profiles + app_settings | user_profiles stores identity/profile; app_settings stores app preferences and defaults |
| body_metrics | body_stats | local canonical fields use kg and cm |
| exercises | exercises | exercises are pulled from `/exercises` and cached locally |
| routines | routines | ready for create, edit, soft-delete, and future sync |
| routine_exercises | routine_exercises | joins routines to exercises and stores target sets/reps/rest |
| sessions | sessions | active workout and completed workout session records |
| sets | workout_sets | local name avoids conflict with JS `Set`; maps to remote `sets` |
| reps | reps | AI rep-level data for future STGCN/pose analytics |
| exports | exports | export history metadata |

## Routines and exercises service

The file below is ready for the routine CRUD UI:

```text
src/features/workout/services/routineService.ts
```

It provides:

- `getRoutines()`
- `getRoutineExercises(routineId)`
- `createRoutine(input)`
- `updateRoutine(routineId, input)`
- `addExerciseToRoutine(routineId, input)`
- `updateRoutineExercise(routineExerciseId, input)`
- `removeExerciseFromRoutine(routineExerciseId)`
- `deleteRoutine(routineId)`

Deletes are soft deletes using `deleted_at`, matching the PostgreSQL schema style.

## Settings behavior

Preferences are saved immediately:

- weight unit: `kg` / `lbs`
- distance unit: `m` / `in`
- theme: `dark` / `light`
- sound enabled
- haptics enabled

Profile/body/workout defaults/AI confidence are saved only after the Save confirmation.

## Unit storage rule

Store canonical values locally:

- weight: `weight_kg`
- height: `height_cm`
- rep displacement: `displacement_m`

Only the UI converts to `lbs` or `in`.

## Next backend routes for groupmates

Recommended future routes:

```text
GET    /exercises
GET    /users/:id/settings
PUT    /users/:id/settings
GET    /users/:id/routines
POST   /users/:id/routines
PUT    /routines/:routineId
DELETE /routines/:routineId
POST   /routines/:routineId/exercises
PUT    /routine-exercises/:routineExerciseId
DELETE /routine-exercises/:routineExerciseId
POST   /sessions
PUT    /sessions/:sessionId
POST   /sessions/:sessionId/sets
PUT    /sets/:setId
POST   /sets/:setId/reps
```
