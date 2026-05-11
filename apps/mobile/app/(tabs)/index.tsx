import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>CoreSet</Text>
      <Text style={styles.sub}>Edge AI Fitness Tracker</Text>
      <Pressable style={styles.btn} onPress={() => router.push('/capture')}>
        <Text style={styles.btnText}>START WORKOUT</Text>
      </Pressable>
      <TouchableOpacity style={styles.testBtn} onPress={() => router.push('/test-db')}>
        <Text style={styles.testBtnText}>Test WatermelonDB</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { color: '#FFF', fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  sub: { color: '#FFFFFF55', fontSize: 14, letterSpacing: 1 },
  btn: {
    marginTop: 32, backgroundColor: '#00E5FF',
    paddingHorizontal: 40, paddingVertical: 18, borderRadius: 16,
  },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 2 },
  testBtn: { marginTop: 8, backgroundColor: '#333', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  testBtnText: { color: '#fff', fontSize: 14 },
});
