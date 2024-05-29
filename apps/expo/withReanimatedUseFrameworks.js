
const plugins = require('expo/config-plugins')
const {
  mergeContents,
} = require('@expo/config-plugins/build/utils/generateCode')
const path = require('path')
const fs = require('fs')

module.exports = function withReanimatedUseFrameworks(config) {
  return plugins.withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      )
      const contents = fs.readFileSync(filePath, 'utf-8')

      const preInstall = mergeContents({
        tag: "reanimated_rnfirebase",
        src: contents,
        newSrc: [
          `pre_install do |installer|`,
          `installer.pod_targets.each do |pod|`,
          `if pod.name.eql?('RNScreens')`,
          `def pod.build_type`,
          `Pod::BuildType.static_library`,
          `end`,
          `end`,
          `end`,
          `end`,
        ].join('\n'),
        offset: 0,
        anchor: '  post_install do |installer|',
        comment: '#',
      })

      fs.writeFileSync(filePath, preInstall.contents)

      return config
    },
  ])
};