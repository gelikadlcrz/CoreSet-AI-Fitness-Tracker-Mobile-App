const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODEL_FILE = 'pose_landmarker_full.task';

/**
 * Copies the MediaPipe pose landmarker task model into the iOS app bundle.
 *
 * The react-native-mediapipe native detector loads the model by filename:
 *   pose_landmarker_full.task
 *
 * Metro asset registration alone is not enough for that native lookup on iOS,
 * so this plugin copies the .task file into ios/<projectName>/ and adds it to
 * Xcode's Copy Bundle Resources phase during prebuild/run:ios.
 */
module.exports = function withMediapipeModel(config) {
  config = withDangerousMod(config, [
    'ios',
    async config => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName || 'CoreSet';

      const possibleSources = [
        path.join(projectRoot, 'ml', 'models', MODEL_FILE),
        path.join(projectRoot, 'assets', 'models', MODEL_FILE),
      ];

      const sourcePath = possibleSources.find(filePath => fs.existsSync(filePath));

      if (!sourcePath) {
        throw new Error(
          `Missing MediaPipe model ${MODEL_FILE}. Expected it in one of:\n` +
            possibleSources.map(filePath => `- ${filePath}`).join('\n')
        );
      }

      const destinationDir = path.join(platformProjectRoot, projectName);
      const destinationPath = path.join(destinationDir, MODEL_FILE);

      fs.mkdirSync(destinationDir, { recursive: true });
      fs.copyFileSync(sourcePath, destinationPath);

      return config;
    },
  ]);

  config = withXcodeProject(config, config => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName || 'CoreSet';
    const resourcePath = `${projectName}/${MODEL_FILE}`;

    const fileReferences = project.hash.project.objects.PBXFileReference || {};
    const alreadyAdded = Object.values(fileReferences).some(
      entry => typeof entry === 'object' && entry.path === MODEL_FILE
    );

    if (!alreadyAdded) {
      project.addResourceFile(resourcePath, {
        target: project.getFirstTarget().uuid,
        lastKnownFileType: 'file',
      });
    }

    return config;
  });

  return config;
};
