import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from "react-native";

export default function CaptureScreen() {
  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
      }}
      style={styles.container}
    >
      {/* Dark Overlay */}
      <View style={styles.overlay} />

      {/* Duration */}
      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>DURATION</Text>
        <Text style={styles.durationText}>1:00</Text>
      </View>

      {/* Exercise Card */}
      <View style={styles.exerciseCard}>
        <Text style={styles.cardLabel}>Exercise</Text>

        <Text style={styles.exerciseName}>
          Bench{"\n"}Press
        </Text>

        <View style={styles.metricContainer}>
          <Text style={styles.cardLabel}>Reps</Text>
          <Text style={styles.metricValue}>1/20</Text>
        </View>

        <View style={styles.metricContainer}>
          <Text style={styles.cardLabel}>Set</Text>
          <Text style={styles.metricValue}>1/4</Text>
        </View>
      </View>

      {/* Left Controls */}
      <View style={styles.leftControls}>
        <TouchableOpacity style={styles.controlButton}>
          <View style={styles.stopSquare} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.rotateText}>↻</Text>
        </TouchableOpacity>

        {/* Confidence Meter */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceFill} />
          <View style={styles.confidenceMarker} />
        </View>
      </View>

      {/* Fake Skeleton */}
      <View style={styles.skeletonContainer}>
        <View style={[styles.joint, { top: 120, left: 160 }]} />
        <View style={[styles.joint, { top: 180, left: 200 }]} />
        <View style={[styles.joint, { top: 260, left: 250 }]} />
        <View style={[styles.joint, { top: 350, left: 290 }]} />

        <View style={[styles.line, {
          top: 150,
          left: 175,
          width: 60,
          transform: [{ rotate: "35deg" }],
        }]} />

        <View style={[styles.line, {
          top: 225,
          left: 220,
          width: 70,
          transform: [{ rotate: "55deg" }],
        }]} />
      </View>

      {/* Bottom Rep Counter */}
      <View style={styles.repCounter}>
        <Text style={styles.repLabel}>LIVE REP COUNT</Text>
        <Text style={styles.repValue}>+1</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  durationContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 24,
  },

  durationLabel: {
    color: "#ccc",
    fontSize: 10,
    textAlign: "center",
  },

  durationText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },

  exerciseCard: {
    position: "absolute",
    top: 140,
    right: 20,
    width: 120,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 24,
    padding: 16,
  },

  cardLabel: {
    color: "#aaa",
    fontSize: 12,
  },

  exerciseName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
    marginBottom: 20,
  },

  metricContainer: {
    marginBottom: 16,
  },

  metricValue: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },

  leftControls: {
    position: "absolute",
    left: 16,
    top: "35%",
    alignItems: "center",
    gap: 20,
  },

  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  stopSquare: {
    width: 16,
    height: 16,
    backgroundColor: "white",
  },

  rotateText: {
    color: "white",
    fontSize: 24,
  },

  confidenceContainer: {
    width: 50,
    height: 220,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
  },

  confidenceFill: {
    width: "100%",
    height: 150,
    backgroundColor: "#52ff52",
    position: "absolute",
    bottom: 0,
  },

  confidenceMarker: {
    width: 30,
    height: 8,
    borderRadius: 4,
    backgroundColor: "yellow",
    marginBottom: 10,
  },

  skeletonContainer: {
    flex: 1,
  },

  joint: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#7CFF00",
  },

  line: {
    position: "absolute",
    height: 6,
    backgroundColor: "#7CFF00",
    borderRadius: 3,
  },

  repCounter: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 30,
  },

  repLabel: {
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
  },

  repValue: {
    color: "#7CFF00",
    fontSize: 54,
    fontWeight: "bold",
    textAlign: "center",
  },
});