import * as exerciseRepo from '../repositories/exercises.repo';

export const fetchAllExercises = async () => {
  return await exerciseRepo.getAllExercises();
};

export const fetchExerciseById = async (exerciseId: string) => {
  const exercise = await exerciseRepo.getExerciseById(exerciseId);
  if (!exercise) throw new Error('Exercise not found');
  return exercise;
};

export const createNewExercise = async (name: string, primaryMuscle: string, equipmentType: string) => {
  if (!name || !primaryMuscle) throw new Error('Name and primary muscle are required');
  return await exerciseRepo.createExercise(name, primaryMuscle, equipmentType);
};

export const modifyExercise = async (exerciseId: string, data: { name: string; primaryMuscle: string; equipmentType: string }) => {
  await fetchExerciseById(exerciseId); // Verify it exists and isn't deleted
  return await exerciseRepo.updateExercise(exerciseId, data.name, data.primaryMuscle, data.equipmentType);
};

export const removeExercise = async (exerciseId: string) => {
  await fetchExerciseById(exerciseId); 
  return await exerciseRepo.deleteExercise(exerciseId);
};