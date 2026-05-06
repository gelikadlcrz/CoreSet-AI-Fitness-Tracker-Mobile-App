import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as userRepo from '../repositories/users.repo';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_please_change_in_production';

export const registerUser = async (email: string, passwordPlain: string, displayName: string) => {
  const existingUser = await userRepo.findUserByEmail(email);
  if (existingUser) throw new Error('Email is already registered');

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);
  const authId = crypto.randomUUID(); // Generates a dummy auth_id for now

  return await userRepo.createUser(authId, email, passwordHash, displayName);
};

export const loginUser = async (email: string, passwordPlain: string) => {
  const user = await userRepo.findUserByEmail(email);
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!isMatch) throw new Error('Invalid email or password');

  const token = jwt.sign(
    { id: user.user_id, email: user.email }, // Updated to user_id
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: { id: user.user_id, email: user.email, displayName: user.display_name }, token };
};

export const getUserProfile = async (userId: string) => {
  const user = await userRepo.findUserById(userId);
  if (!user) throw new Error('User not found');
  return user;
};

export const updateUserProfile = async (userId: string, updateData: { email: string; displayName: string }) => {
  const user = await userRepo.findUserById(userId);
  if (!user) throw new Error('User not found');
  return await userRepo.updateUser(userId, updateData.email, updateData.displayName);
};