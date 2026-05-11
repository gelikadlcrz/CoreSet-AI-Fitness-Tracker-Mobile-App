import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { exerciseRepository } from '@/backend/database';
import { syncDatabase } from '@/backend/sync/syncService';
import { authApi, setAuthToken } from '@/shared/services/apiClient';

export default function TestDbScreen() {
  const [result, setResult] = useState('Ready');
  const [exercises, setExercises] = useState(0);

  const loadExercises = async () => {
    try {
      const ex = await exerciseRepository.getAll();
      setExercises(ex.length);
    } catch (e: any) {
      setResult(`❌ DB error: ${e.message}`);
    }
  };

  useEffect(() => { loadExercises(); }, []);

  const handleLogin = async () => {
    try {
      setResult('Logging in...');
      const res = await authApi.login('test@coreset.com', 'test1234');
      setAuthToken(res.token);
      setResult(`✅ Logged in as ${res.user.email}`);
    } catch (e: any) {
      setResult(`❌ Login failed: ${e.message}`);
    }
  };

  const handleSync = async () => {
    try {
      setResult('Syncing...');
      await syncDatabase();
      await loadExercises();
      setResult('✅ Sync complete!');
    } catch (e: any) {
      setResult(`❌ Sync failed: ${e.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' }}>
      <Text style={{ fontSize: 18, textAlign: 'center', color: '#fff', marginBottom: 20 }}>{result}</Text>
      <Text style={{ fontSize: 16, color: '#aaa', marginBottom: 40 }}>Exercises in DB: {exercises}</Text>
      <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: '#333', padding: 16, borderRadius: 8, marginBottom: 16, width: 200, alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>1. Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSync} style={{ backgroundColor: '#1a7a3c', padding: 16, borderRadius: 8, width: 200, alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>2. Sync</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}