const fs = require('fs');
const path = require('path');

const mobileRoot = path.resolve(__dirname, '..');
const appJsonPath = path.join(mobileRoot, 'app.json');
const settingsPath = path.join(mobileRoot, 'app', '(tabs)', 'settings.tsx');

function updateAppJson() {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const expo = appJson.expo || (appJson.expo = {});
  const ios = expo.ios || (expo.ios = {});
  const infoPlist = ios.infoPlist || (ios.infoPlist = {});

  infoPlist.NSPhotoLibraryUsageDescription =
    infoPlist.NSPhotoLibraryUsageDescription ||
    'CoreSet uses your photo library so you can choose a profile picture.';

  infoPlist.NSPhotoLibraryAddUsageDescription =
    infoPlist.NSPhotoLibraryAddUsageDescription ||
    'CoreSet may save edited profile images to your photo library if you choose to export them.';

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
        cameraPermission: 'CoreSet uses your camera so you can take a profile picture.',
        microphonePermission: false,
      },
    ]);
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  console.log('Updated app.json photo library configuration.');
}

function updateSettingsPicker() {
  if (!fs.existsSync(settingsPath)) {
    console.warn('Settings file not found, skipped picker function replacement.');
    return;
  }

  let source = fs.readFileSync(settingsPath, 'utf8');
  const replacement = `  const pickProfilePhoto = async () => {\n    try {\n      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);\n\n      if (!permission.granted) {\n        Alert.alert(\n          'Permission needed',\n          'Please allow photo library access in iOS Settings to update your CoreSet profile picture.',\n        );\n        return;\n      }\n\n      const result = await ImagePicker.launchImageLibraryAsync({\n        mediaTypes: ['images'],\n        allowsEditing: true,\n        aspect: [1, 1],\n        quality: 0.75,\n        exif: false,\n      });\n\n      if (!result.canceled && result.assets?.[0]?.uri) {\n        updateDraft(next => {\n          next.profile.photoUri = result.assets[0].uri;\n        });\n      }\n    } catch (error) {\n      console.log('Profile photo picker error', error);\n      Alert.alert(\n        'Photo picker error',\n        'CoreSet could not open your photo library. Rebuild the development build after adding photo permissions, then try again.',\n      );\n    }\n  };`;

  const pattern = /  const pickProfilePhoto = async \(\) => \{[\s\S]*?\n  \};(?=\n\n  const handleSignIn)/;

  if (!pattern.test(source)) {
    console.warn('Could not find pickProfilePhoto function. No replacement was made.');
    return;
  }

  source = source.replace(pattern, replacement);
  fs.writeFileSync(settingsPath, source);
  console.log('Updated Settings photo picker handler.');
}

updateAppJson();
updateSettingsPicker();
