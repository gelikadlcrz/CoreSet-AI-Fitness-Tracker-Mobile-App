#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(process.cwd(), 'app.json');
if (!fs.existsSync(appJsonPath)) {
  console.error(`Could not find ${appJsonPath}`);
  process.exit(1);
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = appJson.expo || appJson;
expo.plugins = expo.plugins || [];

const pluginName = './plugins/withMediapipeModel';
const hasPlugin = expo.plugins.some((plugin) => {
  if (Array.isArray(plugin)) return plugin[0] === pluginName;
  return plugin === pluginName;
});

if (!hasPlugin) {
  const routerIndex = expo.plugins.findIndex((plugin) => plugin === 'expo-router' || (Array.isArray(plugin) && plugin[0] === 'expo-router'));
  if (routerIndex >= 0) {
    expo.plugins.splice(routerIndex + 1, 0, pluginName);
  } else {
    expo.plugins.unshift(pluginName);
  }
  console.log('Registered withMediapipeModel plugin in app.json.');
} else {
  console.log('withMediapipeModel plugin already registered.');
}

expo.ios = expo.ios || {};
expo.ios.infoPlist = expo.ios.infoPlist || {};
expo.ios.infoPlist.NSPhotoLibraryUsageDescription = expo.ios.infoPlist.NSPhotoLibraryUsageDescription || 'CoreSet uses your photo library so you can choose a profile picture.';
expo.ios.infoPlist.NSPhotoLibraryAddUsageDescription = expo.ios.infoPlist.NSPhotoLibraryAddUsageDescription || 'CoreSet may save edited profile images to your photo library if you choose to export them.';

if (appJson.expo) appJson.expo = expo;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
