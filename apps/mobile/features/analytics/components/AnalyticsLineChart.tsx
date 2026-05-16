import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { formatShortDate } from '../utils/analyticsHelpers';
import { AnalyticsPoint } from '../types/analytics.types';

const UI = {
  border: '#444444',
  orange: '#F26035',
  accent: '#DADA4F',
  textMuted: '#A0A0A0',
};

const CHART_HEIGHT = 166;
const LINE_WIDTH = 3;

type Segment = {
  id: string;
  left: number;
  top: number;
  width: number;
  angle: string;
  color: string;
  opacity?: number;
  height?: number;
};

type Dot = {
  id: string;
  x: number;
  y: number;
  color: string;
};

type Props = {
  points: AnalyticsPoint[];
  values: number[];
  overlayValues?: number[];
  showOverlay?: boolean;
  valueLabel?: string;
};

function getRange(values: number[]) {
  const cleanValues = values.filter((value) => Number.isFinite(value));

  if (!cleanValues.length) {
    return { min: 0, max: 1 };
  }

  const min = Math.min(...cleanValues);
  const max = Math.max(...cleanValues);

  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }

  const padding = (max - min) * 0.18;
  return { min: min - padding, max: max + padding };
}

function toCoordinates(values: number[], width: number) {
  const { min, max } = getRange(values);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  return values.map((value, index) => {
    const normalized = (value - min) / (max - min);
    const y = CHART_HEIGHT - normalized * (CHART_HEIGHT - 24) - 12;
    return {
      x: values.length > 1 ? step * index : width / 2,
      y,
    };
  });
}

function makeSegments(
  coordinates: Array<{ x: number; y: number }>,
  color: string,
  idPrefix: string,
  opacity = 1,
  height = LINE_WIDTH,
): Segment[] {
  return coordinates.slice(0, -1).map((point, index) => {
    const next = coordinates[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const centerX = (point.x + next.x) / 2;
    const centerY = (point.y + next.y) / 2;

    return {
      id: `${idPrefix}-${index}`,
      left: centerX - distance / 2,
      top: centerY - height / 2,
      width: distance,
      angle: `${Math.atan2(dy, dx)}rad`,
      color,
      opacity,
      height,
    };
  });
}

export default function AnalyticsLineChart({
  points,
  values,
  overlayValues = [],
  showOverlay = false,
  valueLabel,
}: Props) {
  const [chartWidth, setChartWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  const { mainSegments, overlaySegments, dots } = useMemo(() => {
    if (!chartWidth || values.length === 0) {
      return { mainSegments: [], overlaySegments: [], dots: [] };
    }

    const mainCoordinates = toCoordinates(values, chartWidth);
    const overlayCoordinates = toCoordinates(overlayValues, chartWidth);

    return {
      mainSegments: makeSegments(mainCoordinates, UI.orange, 'main'),
      overlaySegments: makeSegments(
        overlayCoordinates,
        UI.accent,
        'overlay',
        0.9,
        2,
      ),
      dots: mainCoordinates.map((point, index) => ({
        id: `dot-${index}`,
        x: point.x,
        y: point.y,
        color: UI.orange,
      })),
    };
  }, [chartWidth, overlayValues, values]);

  const firstLabel = points[0] ? formatShortDate(points[0].date) : '';
  const lastLabel = points[points.length - 1]
    ? formatShortDate(points[points.length - 1].date)
    : '';

  return (
    <View>
      <View style={styles.chartArea} onLayout={handleLayout}>
        <View style={[styles.gridLine, { top: 32 }]} />
        <View style={[styles.gridLine, { top: 82 }]} />
        <View style={[styles.gridLine, { top: 132 }]} />

        {showOverlay &&
          overlaySegments.map((segment) => (
            <View
              key={segment.id}
              style={[
                styles.segment,
                {
                  left: segment.left,
                  top: segment.top,
                  width: segment.width,
                  height: segment.height,
                  backgroundColor: segment.color,
                  opacity: segment.opacity,
                  transform: [{ rotateZ: segment.angle }],
                },
              ]}
            />
          ))}

        {mainSegments.map((segment) => (
          <View
            key={segment.id}
            style={[
              styles.segment,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                height: segment.height,
                backgroundColor: segment.color,
                opacity: segment.opacity,
                transform: [{ rotateZ: segment.angle }],
              },
            ]}
          />
        ))}

        {dots.map((dot) => (
          <View
            key={dot.id}
            style={[
              styles.dot,
              {
                left: dot.x - 4,
                top: dot.y - 4,
                backgroundColor: dot.color,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{firstLabel}</Text>
        <Text style={styles.footerText}>{valueLabel}</Text>
        <Text style={styles.footerText}>{lastLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartArea: {
    height: CHART_HEIGHT,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: UI.border,
  },
  segment: {
    position: 'absolute',
    borderRadius: 999,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  footerText: {
    color: UI.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
