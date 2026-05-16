# CoreSet AI Fitness Tracker Mobile App

CoreSet is an AI-powered mobile fitness tracker that uses on-device pose estimation and exercise recognition to support active workout monitoring. The app uses the phone camera to detect body landmarks, display a live skeleton overlay, classify exercises, and count repetitions locally on the device.

> Current focus: MediaPipe-based pose tracking has been integrated into the workout capture flow. ST-GCN classification and rep counting are still being tuned to match the training preprocessing pipeline.

---

## Features

- Camera-based workout capture
- MediaPipe Pose Landmarker integration
- Live skeleton overlay
- On-device ST-GCN exercise classification
- Repetition counting through density-map post-processing
- Workout overlay showing detected exercise class, confidence, repetition count, and FPS
- iOS native build support through Expo prebuild/dev client

---

## Supported Exercise Classes

The deployed ST-GCN model currently uses this class order:

```ts
['squat', 'push_up', 'bench_press', 'pull_up']
```

Keep this order consistent with the training pipeline and exported TFLite model.

---

## Tech Stack

- React Native
- Expo / Expo Router
- TypeScript
- React Native Vision Camera
- react-native-mediapipe
- react-native-fast-tflite
- MediaPipe Pose Landmarker
- ST-GCN TFLite model
- PNPM workspace setup
- iOS native build through Xcode

---

## Project Structure

```text
CoreSet-AI-Fitness-Tracker-Mobile-App/
├── apps/
│   └── mobile/
│       ├── app/
│       │   ├── (tabs)/
│       │   ├── capture/
│       │   └── workout/
│       ├── assets/
│       │   └── models/
│       │       └── pose_landmarker_full.task
│       ├── features/
│       │   ├── capture/
│       │   │   ├── camera/CameraView.tsx
│       │   │   ├── hooks/useCapture.ts
│       │   │   ├── inference/STGCNRunner.ts
│       │   │   ├── overlays/RepOverlay.tsx
│       │   │   ├── overlays/SkeletonOverlay.tsx
│       │   │   ├── pose/BlazePoseDetector.ts
│       │   │   ├── postprocessing/RepCounter.ts
│       │   │   └── utils/temporalBuffer.ts
│       │   └── mediapipe-test/MediaPipeTestScreen.tsx
│       ├── ml/
│       │   ├── graph/adjacencyMatrix.ts
│       │   ├── models/stgcn_int8.tflite
│       │   └── preprocessing/normalizePose.ts
│       ├── ios/
│       ├── app.json
│       ├── babel.config.js
│       ├── metro.config.js
│       └── package.json
└── package.json
```

---

## Prerequisites

Install the following before running the project:

- Node.js
- PNPM
- Xcode
- CocoaPods
- iOS physical device or simulator
- Expo CLI through `npx expo`

For iOS device testing, make sure:

- the iPhone is unlocked
- Developer Mode is enabled
- the device trusts the Mac
- the correct Apple development team is selected in Xcode
- the bundle identifier is `com.coreset.app`

---

## Installation

From the project root:

```bash
pnpm install
```

Then go to the mobile app folder:

```bash
cd apps/mobile
```

Install iOS pods:

```bash
npx pod-install ios
```

---

## Required Model Assets

The app needs the following local model files:

```text
apps/mobile/assets/models/pose_landmarker_full.task
apps/mobile/ml/models/stgcn_int8.tflite
```

The MediaPipe model must also be bundled into the iOS app resources:

```text
apps/mobile/ios/pose_landmarker_full.task
```

Verify the model files:

```bash
ls -lh assets/models/pose_landmarker_full.task
ls -lh ios/pose_landmarker_full.task
```

Verify that the MediaPipe task file was included in the built iOS app bundle:

```bash
APP=$(find ~/Library/Developer/Xcode/DerivedData -path "*Build/Products/Debug-iphoneos/CoreSet.app" -type d | tail -1)
ls "$APP" | grep pose_landmarker
```

Expected output:

```text
pose_landmarker_full.task
```

---

## Important iOS Configuration

The app requires React Native New Architecture for native TFLite and MediaPipe modules.

Check:

```bash
cat ios/Podfile.properties.json
```

Expected:

```json
{
  "expo.jsEngine": "hermes",
  "EX_DEV_CLIENT_NETWORK_INSPECTOR": "true",
  "newArchEnabled": "true"
}
```

If `newArchEnabled` is missing or set incorrectly, native modules such as `Tflite` may fail to load.

---

## Running the App

Start Metro for the development client:

```bash
npx expo start -c --dev-client
```

Build and run on iOS:

```bash
npx expo run:ios --device
```

If Expo fails to launch the app but the build succeeds, open the workspace directly:

```bash
open ios/CoreSet.xcworkspace
```

Then select the iPhone in Xcode and press **Run**.

---

## MediaPipe Test Screen

The MediaPipe test screen is used to verify pose detection separately before integrating it into the real workout flow.

It confirms:

- MediaPipe model loading
- pose detector initialization
- 33 landmark output
- live skeleton overlay
- corrected portrait overlay mapping

The test screen should display a moving skeleton that follows the person accurately.

---

## Workout Capture Flow

The real workout screen uses this pipeline:

```text
MediaPipe camera
→ MediaPipe image landmarks
→ skeleton overlay

MediaPipe world landmarks
→ normalizePose()
→ TemporalBuffer
→ ST-GCN TFLite model
→ classification output + density map
→ RepCounter
→ RepOverlay
```

Image landmarks are used for the visual overlay because they map better to the camera preview. World landmarks are used for ST-GCN because the training pipeline uses world-coordinate pose sequences for angle-feature extraction.

---

## ST-GCN Input Notes

The current mobile preprocessing uses:

```text
14 angle channels
33 BlazePose / MediaPipe joints
64-frame temporal window
shape: [C, T, V, 1]
```

Where:

```text
C = 14
T = 64
V = 33
M = 1
```

The mobile app computes angle-based features in:

```text
apps/mobile/ml/preprocessing/normalizePose.ts
```

The temporal window is prepared in:

```text
apps/mobile/features/capture/utils/temporalBuffer.ts
```

---

## Current Known Issue

ST-GCN classification and rep counting may still be inaccurate until the mobile app applies the same normalization statistics used during model training.

The training checkpoint should provide:

```text
feat_mean
feat_std
```

These values need to be applied to the mobile ST-GCN input before inference. Without them, the model may become biased toward one class or produce unreliable density maps.

---

## Extracting ST-GCN Normalization Stats

From the ML pipeline repository:

```bash
cd /Users/gelika/VsCode/CoreSet-AI-Fitness-Tracker-ML-Pipeline
```

Run:

```bash
python - <<'PY'
import torch
import json
from pathlib import Path

ckpt_path = Path("/Users/gelika/VsCode/CoreSet-AI-Fitness-Tracker-ML-Pipeline/checkpoint/best_stgcn_model.pth")

ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False)

feat_mean = ckpt.get("feat_mean")
feat_std = ckpt.get("feat_std")

if feat_mean is None or feat_std is None:
    raise SystemExit("ERROR: feat_mean / feat_std not found in checkpoint.")

feat_mean = feat_mean.cpu().numpy().reshape(-1).tolist()
feat_std = feat_std.cpu().numpy().reshape(-1).tolist()

out = {
    "checkpoint": str(ckpt_path),
    "feat_mean": feat_mean,
    "feat_std": feat_std
}

output_path = Path("/Users/gelika/VsCode/CoreSet-AI-Fitness-Tracker-ML-Pipeline/stgcn_norm_stats.json")
output_path.write_text(json.dumps(out, indent=2))

print("Saved:", output_path)
print("feat_mean length:", len(feat_mean))
print("feat_std length:", len(feat_std))
PY
```

After extracting the stats, add them to the mobile app and apply them before ST-GCN inference.

---

## Common Troubleshooting

### `Tflite could not be found`

Check that New Architecture is enabled:

```bash
cat ios/Podfile.properties.json
```

Expected:

```json
"newArchEnabled": "true"
```

Then rebuild the native app.

### `pose_landmarker_full.task could not be opened`

Make sure the task file exists in both:

```text
assets/models/pose_landmarker_full.task
ios/pose_landmarker_full.task
```

Also confirm it appears in Xcode under:

```text
Build Phases → Copy Bundle Resources
```

### `new NativeEventEmitter() requires a non-null argument`

Avoid importing from the root package:

```ts
import { usePoseDetection } from 'react-native-mediapipe';
```

Use the pose submodule instead:

```ts
import { usePoseDetection } from 'react-native-mediapipe/src/poseDetection';
import { Delegate, RunningMode } from 'react-native-mediapipe/src/shared/types';
```

This prevents the app from touching unrelated native modules such as ObjectDetection.

### Skeleton appears sideways

Use the corrected portrait mapping:

```ts
const rotatedX = 1 - point.y;
const rotatedY = point.x;
```

This matches the current front-camera MediaPipe output to the portrait phone preview.

### iPhone connection timeout

If the build succeeds but Expo cannot connect to the iPhone:

1. Unlock the iPhone.
2. Reconnect the cable.
3. Open Xcode.
4. Go to `Window → Devices and Simulators`.
5. Wait for the device to finish preparing.
6. Run through Xcode using:

```bash
open ios/CoreSet.xcworkspace
```

---

## Development Notes

Recommended workflow before risky native changes:

```bash
git add -A
git commit -m "Describe stable checkpoint"
```

Then create a feature branch:

```bash
git switch -c feature/your-feature-name
```

Native package changes usually require:

```bash
npx pod-install ios
npx expo run:ios --device
```

Metro-only reloads are not enough when native modules or model resources change.

---

## Suggested Commit Messages

```bash
git commit -m "Implement MediaPipe pose test screen"
git commit -m "Bundle MediaPipe pose model for iOS"
git commit -m "Integrate MediaPipe pose tracking into workout capture"
git commit -m "Fix ST-GCN class label mapping"
git commit -m "Add ST-GCN normalization stats"
```

---

## Status

Working:

- MediaPipe detector initialization
- MediaPipe model bundling on iOS
- MediaPipe test screen
- Accurate skeleton overlay in the test screen
- MediaPipe integration into workout capture

Needs tuning:

- ST-GCN input normalization with `feat_mean` and `feat_std`
- classification reliability
- rep-counting threshold logic
- performance optimization for real-time workout mode

---

## License

This project is for academic and research development purposes.
