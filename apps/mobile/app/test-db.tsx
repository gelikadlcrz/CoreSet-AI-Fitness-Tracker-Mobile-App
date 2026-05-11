import { View, Text } from 'react-native';

export default function TestDbScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff' }}>
        Empty screen
      </Text>
    </View>
  );
}