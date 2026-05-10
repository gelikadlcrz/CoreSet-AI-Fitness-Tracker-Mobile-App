// Runtime validation for the push body that the phone sends to POST /api/sync.
// Import validatePushPayload in the sync controller to reject malformed pushes
// before they reach the service layer.

import { z } from 'zod';

// ── Leaf schemas ──────────────────────────────────────────────

const ExercisePushSchema = z.object({
  id:               z.string().uuid(),
  name:             z.string().min(1),
  primary_muscle:   z.string().min(1),
  secondary_muscles:z.unknown().optional(),
  equipment_type:   z.string().optional(),
  movement_pattern: z.string().optional(),
  is_ai_tracked:    z.boolean().optional(),
  ai_exercise_class:z.string().optional(),
  is_bodyweight:    z.boolean().optional(),
  is_custom:        z.boolean().optional(),
  created_by_user:  z.string().uuid().optional(),
});

const RoutinePushSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1),
  notes:       z.string().optional(),
  last_used_at:z.string().optional(),
});

const RoutineExercisePushSchema = z.object({
  id:              z.string().uuid(),
  routine_id:      z.string().uuid(),
  exercise_id:     z.string().uuid(),
  sort_order:      z.number().int().min(0),
  target_sets:     z.number().int().optional(),
  target_reps_min: z.number().int().optional(),
  target_reps_max: z.number().int().optional(),
  target_rpe:      z.number().min(0).max(10).optional(),
  rest_interval_s: z.number().int().optional(),
  notes:           z.string().optional(),
});

const SessionPushSchema = z.object({
  id:                         z.string().uuid(),
  routine_id:                 z.string().uuid().optional(),
  started_at:                 z.string().datetime(),
  ended_at:                   z.string().datetime().optional(),
  total_reps:                 z.number().int().optional(),
  total_vl_with_displacement: z.number().optional(),
  total_vl_traditional:       z.number().optional(),
  total_duration_s:           z.number().int().optional(),
  notes:                      z.string().optional(),
});

const SetPushSchema = z.object({
  id:                    z.string().uuid(),
  session_id:            z.string().uuid(),
  exercise_id:           z.string().uuid(),
  set_number:            z.number().int().min(1),
  is_warmup:             z.boolean().default(false),
  log_mode:              z.enum(['ai', 'manual']),
  load_kg:               z.number().optional(),
  rep_count:             z.number().int().optional(),
  rpe:                   z.number().min(0).max(10).optional(),
  vl_with_displacement:  z.number().optional(),
  vl_traditional:        z.number().optional(),
  total_displacement_m:  z.number().optional(),
  avg_rep_duration_s:    z.number().optional(),
  model_confidence_avg:  z.number().min(0).max(1).optional(),
  estimated_1rm:         z.number().optional(),
  started_at:            z.string().datetime().optional(),
  ended_at:              z.string().datetime().optional(),
  notes:                 z.string().optional(),
});

const RepPushSchema = z.object({
  id:                    z.string().uuid(),
  set_id:                z.string().uuid(),
  rep_number:            z.number().int().min(1),
  total_duration_s:      z.number().optional(),
  eccentric_duration_s:  z.number().optional(),
  concentric_duration_s: z.number().optional(),
  displacement_m:        z.number().optional(),
  peak_angular_velocity: z.number().optional(),
  model_confidence:      z.number().min(0).max(1).optional(),
  flagged:               z.boolean().default(false),
});

const BodyMetricPushSchema = z.object({
  id:            z.string().uuid(),
  logged_date:   z.string().datetime(),
  bodyweight_kg: z.number().optional(),
  body_fat_pct:  z.number().min(0).max(100).optional(),
  notes:         z.string().optional(),
});

// ── Entity changes wrapper ────────────────────────────────────

function entityChanges<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    created: z.array(schema).default([]),
    updated: z.array(schema).default([]),
    deleted: z.array(z.string().uuid()).default([]),
  });
}

// ── Top-level push body ───────────────────────────────────────

export const PushPayloadSchema = z.object({
  lastPulledAt: z.number().int().min(0),
  changes: z.object({
    exercises:          entityChanges(ExercisePushSchema).optional(),
    routines:           entityChanges(RoutinePushSchema).optional(),
    routine_exercises:  entityChanges(RoutineExercisePushSchema).optional(),
    sessions:           entityChanges(SessionPushSchema).optional(),
    sets:               entityChanges(SetPushSchema).optional(),
    reps:               entityChanges(RepPushSchema).optional(),
    body_metrics:       entityChanges(BodyMetricPushSchema).optional(),
  }),
});

export type PushPayloadInput = z.infer<typeof PushPayloadSchema>;

/**
 * Call this in the sync controller before passing data to the service.
 * Throws a ZodError with a readable message if the body is malformed.
 *
 * Usage in sync.controller.ts:
 *   const validated = validatePushPayload(req.body);
 *   await syncService.pushChanges(userId, validated.changes, validated.lastPulledAt);
 */
export const validatePushPayload = (raw: unknown): PushPayloadInput => {
  return PushPayloadSchema.parse(raw);
};