export function calculateEstimated1RM(weightKg: number, reps: number) {
  if (weightKg <= 0 || reps <= 0) {
    return 0;
  }

  return weightKg * (1 + reps / 30);
}

export function calculateTotalVolume(weightKg: number, reps: number) {
  if (weightKg <= 0 || reps <= 0) {
    return 0;
  }

  return weightKg * reps;
}

export function calculateVLwD(
  weightKg: number,
  reps: number,
  averageDisplacementM: number,
) {
  if (weightKg <= 0 || reps <= 0 || averageDisplacementM <= 0) {
    return 0;
  }

  return weightKg * reps * averageDisplacementM;
}

export function calculateTimeUnderTension(
  reps: number,
  averageRepDurationSec: number,
) {
  if (reps <= 0 || averageRepDurationSec <= 0) {
    return 0;
  }

  return reps * averageRepDurationSec;
}
