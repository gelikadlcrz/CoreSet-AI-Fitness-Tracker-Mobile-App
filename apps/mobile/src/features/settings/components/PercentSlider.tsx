import { useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../../shared/theme';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export default function PercentSlider({ label, value, onChange }: Props) {
  const [width, setWidth] = useState(1);
  const safeValue = Math.max(0, Math.min(100, value));

  const updateFromX = (x: number) => {
    const next = Math.round(Math.max(0, Math.min(1, x / width)) * 100);
    onChange(next);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => updateFromX(event.nativeEvent.locationX),
    onPanResponderMove: event => updateFromX(event.nativeEvent.locationX),
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{safeValue}%</Text>
      </View>

      <View
        style={styles.track}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: `${safeValue}%` }]} />
        <View style={[styles.thumb, { left: `${safeValue}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  value: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  track: {
    height: 26,
    justifyContent: 'center',
  },
  fill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    backgroundColor: COLORS.text,
    borderWidth: 4,
    borderColor: COLORS.accent,
  },
});
