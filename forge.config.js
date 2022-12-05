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
  ]
};
