import {
  useEffect,
  useState,
} from 'react';

import { database } from '../../../database';

export function useExercises() {
  const [exercises, setExercises] =
    useState<any[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const collection =
      database.collections.get(
        'exercises'
      );

    const records =
      await collection.query().fetch();

    setExercises(records);
  }

  return {
    exercises,
  };
}