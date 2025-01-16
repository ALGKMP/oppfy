const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const path = require("path");

module.exports = withTurborepoManagedCache(
  withMonorepoPaths(getDefaultConfig(__dirname)),
);

function withMonorepoPaths(config) {
  const projectRoot = __dirname;
  const workspaceRoot = path.resolve(projectRoot, "../..");

  // Watch all files in the monorepo
  config.watchFolders = [workspaceRoot];

  // Resolve modules within the project's node_modules first, then monorepo modules
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ];

  // Block heavy dependencies that aren't needed in the App Clip
  config.resolver.blockList = [
    /.*firebase.*/,
    /.*sentry.*/,
    /.*ffmpeg.*/,
    /.*vision-camera.*/,
  ];

  return config;
}

function withTurborepoManagedCache(config) {
  config.cacheStores = [
    new FileStore({ root: path.join(__dirname, "node_modules/.cache/metro") }),
  ];
  return config;
}
