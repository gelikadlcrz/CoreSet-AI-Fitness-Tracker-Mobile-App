import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CoreSet</Text>
      <Text style={styles.subtitle}>Your AI Fitness Tracker</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/test-db')}
      >
        <Text style={styles.buttonText}>Test WatermelonDB</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: '#aaa', fontSize: 16, marginTop: 8 },
  button: { marginTop: 40, backgroundColor: '#333', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});