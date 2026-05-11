import { View, Text, StyleSheet } from 'react-native';
export default function SettingsScreen() {
  return <View style={s.root}><Text style={s.t}>Settings</Text></View>;
}
const s = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }, t: { color: '#FFF', fontSize: 24, fontWeight: '700' } });