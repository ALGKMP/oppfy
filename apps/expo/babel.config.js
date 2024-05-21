/** @type {import("@babel/core").ConfigFunction} */
module.exports = function (api) {
  api.cache.forever();

  return {
    presets: [["babel-preset-expo"]],
    plugins: ["babel-plugin-react-compiler", "react-native-reanimated/plugin"],
  };
};
