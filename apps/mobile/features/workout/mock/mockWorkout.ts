import { Exercise } from '../types/exercise.types';

export const MOCK_WORKOUT: Exercise[] = [
  {
    id: '1',
    name: 'Bench Press',
    sets: [
      {
        id: '1',
        reps: 5,
        weight: 65,
        rpe: 7,
      },
      {
        id: '2',
        reps: 4,
        weight: 70,
        rpe: 8,
      },
    ],
  },

  {
    id: '2',
    name: 'Incline Dumbbell Press',
    sets: [
      {
        id: '1',
        reps: 10,
        weight: 24,
        rpe: 8,
      },
    ],
  },
];