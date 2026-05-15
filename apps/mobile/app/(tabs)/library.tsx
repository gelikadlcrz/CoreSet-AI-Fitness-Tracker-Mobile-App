import {
  useEffect,
} from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

import {
  pullExercises,
} from '../../src/services/sync/pullExercises';

import {
  useExercises,
} from '../../src/hooks/useExercises';

import {
  COLORS,
} from '../../shared/theme';

export default function LibraryScreen() {
  const exercises =
    useExercises();

  useEffect(() => {
    pullExercises();
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>
        Exercise Library
      </Text>

      <FlatList
        data={exercises}
        keyExtractor={(item: any) =>
          item.id
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.name}
            </Text>

            <Text
              style={styles.group}
            >
              {item.muscleGroup}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,

    backgroundColor:
      COLORS.background,

    paddingTop: 80,
    paddingHorizontal: 20,
  },

  title: {
    color: COLORS.text,

    fontSize: 28,
    fontWeight: '800',

    marginBottom: 24,
  },

  card: {
    backgroundColor:
      COLORS.surface,

    padding: 18,

    borderRadius: 18,

    marginBottom: 14,
  },

  name: {
    color: COLORS.text,

    fontSize: 18,
    fontWeight: '700',
  },

  group: {
    color:
      COLORS.textSecondary,

    marginTop: 6,
  },
});