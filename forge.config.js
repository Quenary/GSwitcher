module.exports = {
  packagerConfig: {
    icon: './dist/gswitcher/assets/icon/favicon',
    ignore: [
      "^/.angular",
      "^/.vscode",
      "^/build",
      "^/src",
      "^/out"
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Quenary',
          name: 'GSwitcher'
        },
        prerelease: true
      }
    }
  ]
};
