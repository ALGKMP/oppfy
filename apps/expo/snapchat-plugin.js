module.exports = function withSnapchat(
  config,
  { snapchatClientId},
) {
  if (!config.ios) {
    config.ios = {};
  }
  if (!config.ios.infoPlist) {
    config.ios.infoPlist = {};
  }

  config.ios.infoPlist["LSApplicationQueriesSchemes"] = [
    "snapchat",
    "bitmoji-sdk",
    "itms-apps",
  ];
  config.ios.infoPlist["SCSDKClientId"] = snapchatClientId;
  config.ios.infoPlist["SCSDKRedirectUrl"] = "oppfyapp://homepage/someshit";
  config.ios.infoPlist["URL Types / Document Role"] = "Editor";
  config.ios.infoPlist["URL Types / URL Identifier"] = "app.oppfy";
  config.ios.infoPlist["URL Types / URL Schemes "] =["oppfyapp"];

  return config;
};
