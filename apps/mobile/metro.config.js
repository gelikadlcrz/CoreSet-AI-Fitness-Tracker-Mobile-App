const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

// Add tflite as a recognized asset extension
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'tflite',
  'task',
  'txt',
  'bin',
];

module.exports = config;