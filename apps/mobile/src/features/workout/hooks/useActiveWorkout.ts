import { useCallback, useEffect, useState } from 'react';
import { addSetToExercise, finishActiveWorkout, getActiveWorkout, type ActiveWorkoutView } from '../services/workoutService';

export function useActiveWorkout() {
  const [workout, setWorkout] = useState<ActiveWorkoutView | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const active = await getActiveWorkout();
    setWorkout(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSet = async (exerciseId: string) => {
    await addSetToExercise(exerciseId);
    await reload();
  };

  const finish = async () => {
    await finishActiveWorkout();
    await reload();
  };

  return {
    workout,
    loading,
    reload,
    addSet,
    finish,
  };
}
