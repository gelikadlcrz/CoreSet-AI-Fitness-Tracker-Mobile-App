#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const iosDir = path.join(projectRoot, 'ios');
const xcodeprojDir = path.join(iosDir, 'CoreSet.xcodeproj');
const pbxprojPath = path.join(xcodeprojDir, 'project.pbxproj');
const iosAppDir = path.join(iosDir, 'CoreSet');

const candidates = [
  path.join(projectRoot, 'ml', 'models', 'pose_landmarker_full.task'),
  path.join(projectRoot, 'assets', 'models', 'pose_landmarker_full.task'),
];

const source = candidates.find((candidate) => fs.existsSync(candidate));
if (!source) {
  console.error('Could not find pose_landmarker_full.task. Checked:');
  for (const candidate of candidates) console.error(`- ${candidate}`);
  process.exit(1);
}

if (!fs.existsSync(pbxprojPath)) {
  console.error(`Could not find Xcode project at ${pbxprojPath}. Run npx expo prebuild --platform ios first.`);
  process.exit(1);
}

fs.mkdirSync(iosAppDir, { recursive: true });
const destination = path.join(iosAppDir, 'pose_landmarker_full.task');
fs.copyFileSync(source, destination);
console.log(`Copied MediaPipe model to ${destination}`);

let xcode;
try {
  xcode = require('xcode');
} catch (error) {
  console.error('Missing xcode npm package. Run pnpm install from the repo root, then rerun this script.');
  process.exit(1);
}

const project = xcode.project(pbxprojPath);
project.parseSync();

const target = project.getFirstTarget().uuid;
const relativePath = 'CoreSet/pose_landmarker_full.task';
const pbx = fs.readFileSync(pbxprojPath, 'utf8');

if (pbx.includes('pose_landmarker_full.task')) {
  console.log('pose_landmarker_full.task is already referenced in the Xcode project.');
} else {
  project.addResourceFile(relativePath, { target });
  fs.writeFileSync(pbxprojPath, project.writeSync());
  console.log('Added pose_landmarker_full.task to Xcode Copy Bundle Resources.');
}

console.log('Done. Now run: cd ios && pod install --repo-update && cd .. && npx expo run:ios --device');
