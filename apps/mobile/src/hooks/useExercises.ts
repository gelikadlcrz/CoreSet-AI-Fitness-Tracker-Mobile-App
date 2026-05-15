import {
  useEffect,
  useState,
} from 'react';

import { database } from '../database';

export function useExercises() {
  const [exercises, setExercises] =
    useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const collection =
        database.collections.get(
          'exercises'
        );

      const data =
        await collection.query().fetch();

      setExercises(data);
    }

    load();
  }, []);

  return exercises;
}