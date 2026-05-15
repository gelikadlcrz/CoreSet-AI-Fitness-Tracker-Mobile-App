const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withSimdjson(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const targetLine = "target 'CoreSet' do";

      const podToInsert = `
  pod 'simdjson',
    :path => '../../../node_modules/@nozbe/simdjson',
    :modular_headers => true
`;

      if (!podfile.includes("pod 'simdjson'")) {
        podfile = podfile.replace(
          targetLine,
          `${targetLine}\n${podToInsert}`
        );

        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};