const fs = require('fs');
const path = require('path');

const mobileRoot = path.resolve(__dirname, '..');
const settingsPath = path.join(mobileRoot, 'app', '(tabs)', 'settings.tsx');
const workoutPath = path.join(mobileRoot, 'src', 'features', 'workout', 'screens', 'ActiveWorkoutSessionScreen.tsx');
const appJsonPath = path.join(mobileRoot, 'app.json');

function ensureImagePickerImport(source) {
  if (source.includes("from 'expo-image-picker'") || source.includes('from "expo-image-picker"')) return source;
  const anchor = /import .* from ['"]react-native['"];\n/;
  if (anchor.test(source)) {
    return source.replace(anchor, match => `${match}import * as ImagePicker from 'expo-image-picker';\n`);
  }
  return `import * as ImagePicker from 'expo-image-picker';\n${source}`;
}

function updatePhotoPicker() {
  if (!fs.existsSync(settingsPath)) {
    console.warn(`Settings file not found: ${settingsPath}`);
    return;
  }

  let source = fs.readFileSync(settingsPath, 'utf8');
  source = ensureImagePickerImport(source);

  const replacement = `  const pickProfilePhoto = async () => {\n    try {\n      const result = await ImagePicker.launchImageLibraryAsync({\n        mediaTypes: ImagePicker.MediaTypeOptions.Images,\n        allowsEditing: false,\n        quality: 0.75,\n        exif: false,\n      });\n\n      if (!result.canceled && result.assets?.[0]?.uri) {\n        updateDraft(next => {\n          next.profile.photoUri = result.assets[0].uri;\n        });\n      }\n    } catch (error) {\n      console.log('Profile photo picker error', error);\n      Alert.alert(\n        'Photo picker unavailable',\n        'CoreSet could not open the photo picker. Please close and reopen the app, then try again.',\n      );\n    }\n  };`;

  const pattern = /  const pickProfilePhoto = async \(\) => \{[\s\S]*?\n  \};(?=\n\n  const |\n\n  function |\n\n  return \(|\n\n  if \()/;

  if (!pattern.test(source)) {
    console.warn('Could not find pickProfilePhoto function. No replacement was made.');
  } else {
    source = source.replace(pattern, replacement);
    fs.writeFileSync(settingsPath, source);
    console.log('Updated Settings photo picker to use the safer iOS picker flow.');
  }
}

function updateAppJson() {
  if (!fs.existsSync(appJsonPath)) {
    console.warn(`app.json not found: ${appJsonPath}`);
    return;
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const expo = appJson.expo || (appJson.expo = {});
  const ios = expo.ios || (expo.ios = {});
  const infoPlist = ios.infoPlist || (ios.infoPlist = {});

  infoPlist.NSPhotoLibraryUsageDescription =
    infoPlist.NSPhotoLibraryUsageDescription ||
    'CoreSet uses your photo library so you can choose a profile picture.';

  infoPlist.NSPhotoLibraryAddUsageDescription =
    infoPlist.NSPhotoLibraryAddUsageDescription ||
    'CoreSet uses photo access only when you choose or update your profile picture.';

  const plugins = expo.plugins || (expo.plugins = []);
  const hasImagePicker = plugins.some(plugin =>
    plugin === 'expo-image-picker' ||
    (Array.isArray(plugin) && plugin[0] === 'expo-image-picker')
  );

  if (!hasImagePicker) {
    plugins.push([
      'expo-image-picker',
      {
        photosPermission: 'CoreSet uses your photo library so you can choose a profile picture.',
        cameraPermission: 'CoreSet uses your camera only if you choose to take a profile picture.',
      },
    ]);
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  console.log('Verified app.json photo usage descriptions.');
}

function updateActiveWorkoutLoad() {
  if (!fs.existsSync(workoutPath)) {
    console.warn(`ActiveWorkoutSessionScreen not found: ${workoutPath}`);
    return;
  }

  let source = fs.readFileSync(workoutPath, 'utf8');

  const replacement = `  const load = async () => {\n    try {\n      const activeSession = await getOrCreateActiveWorkoutSession();\n      setSession(activeSession);\n    } catch (error) {\n      console.log('Local workout session load error', error);\n    }\n\n    try {\n      const exercises = await listAvailableExercises();\n      setAvailableExercises(exercises);\n    } catch (error) {\n      console.log('Local exercise list load error', error);\n    }\n\n    pullExercises()\n      .then(async () => {\n        const [syncedSession, syncedExercises] = await Promise.all([\n          getOrCreateActiveWorkoutSession(),\n          listAvailableExercises(),\n        ]);\n        setSession(syncedSession);\n        setAvailableExercises(syncedExercises);\n      })\n      .catch(error => {\n        console.log('Exercise sync skipped', error);\n      });\n  };`;

  const pattern = /  const load = async \(\) => \{[\s\S]*?\n  \};(?=\n\n  useEffect\(\(\) => \{)/;

  if (!pattern.test(source)) {
    console.warn('Could not find ActiveWorkout load function. No replacement was made.');
  } else {
    source = source.replace(pattern, replacement);
    fs.writeFileSync(workoutPath, source);
    console.log('Updated ActiveWorkout load flow to render local data first and sync in the background.');
  }
}

updateAppJson();
updatePhotoPicker();
updateActiveWorkoutLoad();
