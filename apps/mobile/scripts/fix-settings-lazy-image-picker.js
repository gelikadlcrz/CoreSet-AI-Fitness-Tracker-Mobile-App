#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'app', '(tabs)', 'settings.tsx');
if (!fs.existsSync(file)) {
  console.error(`Could not find ${file}`);
  process.exit(1);
}

let text = fs.readFileSync(file, 'utf8');
text = text.replace(/\nimport \* as ImagePicker from 'expo-image-picker';\n/g, '\n');

const oldBlock = `  const pickProfilePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.75,
        exif: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        updateDraft(next => {
          next.profile.photoUri = result.assets[0].uri;
        });
      }
    } catch (error) {
      console.log('Profile photo picker error', error);
      Alert.alert(
        'Photo picker unavailable',
        'CoreSet could not open the photo picker. Please close and reopen the app, then try again.',
      );
    }
  };`;

const newBlock = `  const pickProfilePhoto = async () => {
    try {
      // Lazy-load ImagePicker so opening Settings does not initialize the native module.
      const ImagePicker = await import('expo-image-picker');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.75,
        exif: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        updateDraft(next => {
          next.profile.photoUri = result.assets[0].uri;
        });
      }
    } catch (error) {
      console.log('Profile photo picker error', error);
      Alert.alert(
        'Photo picker unavailable',
        'CoreSet could not open the photo picker. Please close and reopen the app, then try again.',
      );
    }
  };`;

if (text.includes(oldBlock)) {
  text = text.replace(oldBlock, newBlock);
} else if (text.includes('launchImageLibraryAsync')) {
  console.warn('Found launchImageLibraryAsync, but the exact handler did not match. No handler replacement was made. Please inspect manually.');
} else {
  console.log('No ImagePicker handler found. Only removed top-level import if present.');
}

fs.writeFileSync(file, text);
console.log('Settings image picker lazy-load fix applied.');
