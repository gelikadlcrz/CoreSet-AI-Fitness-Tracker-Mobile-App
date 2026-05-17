const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function findModel(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'ml', 'models', 'pose_landmarker_full.task'),
    path.join(projectRoot, 'assets', 'models', 'pose_landmarker_full.task'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

module.exports = function withMediapipeModel(config) {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const source = findModel(projectRoot);
      if (!source) {
        throw new Error('Missing pose_landmarker_full.task in ml/models or assets/models.');
      }

      const appName = config.modRequest.projectName || 'CoreSet';
      const appDir = path.join(config.modRequest.platformProjectRoot, appName);
      fs.mkdirSync(appDir, { recursive: true });
      fs.copyFileSync(source, path.join(appDir, 'pose_landmarker_full.task'));
      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const appName = config.modRequest.projectName || 'CoreSet';
    const relativePath = `${appName}/pose_landmarker_full.task`;
    const target = project.getFirstTarget().uuid;

    const fileRefs = project.hash.project.objects.PBXFileReference || {};
    const alreadyAdded = Object.values(fileRefs).some(
      (entry) => entry && typeof entry === 'object' && entry.path === 'pose_landmarker_full.task'
    );

    if (!alreadyAdded) {
      project.addResourceFile(relativePath, { target });
    }

    return config;
  });

  return config;
};
