import { View, Text } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Explore</Text>
      <Text style={{ color: '#aaa', fontSize: 14, marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}