export var PluginType;
(function (PluginType) {
    PluginType["preset"] = "preset";
    PluginType["plugin"] = "plugin";
})(PluginType || (PluginType = {}));
export var ServiceStage;
(function (ServiceStage) {
    ServiceStage[ServiceStage["uninitialized"] = 0] = "uninitialized";
    ServiceStage[ServiceStage["constructor"] = 1] = "constructor";
    ServiceStage[ServiceStage["init"] = 2] = "init";
    ServiceStage[ServiceStage["initPresets"] = 3] = "initPresets";
    ServiceStage[ServiceStage["initPlugins"] = 4] = "initPlugins";
    ServiceStage[ServiceStage["initHooks"] = 5] = "initHooks";
    ServiceStage[ServiceStage["pluginReady"] = 6] = "pluginReady";
    ServiceStage[ServiceStage["getConfig"] = 7] = "getConfig";
    ServiceStage[ServiceStage["getPaths"] = 8] = "getPaths";
    ServiceStage[ServiceStage["run"] = 9] = "run";
})(ServiceStage || (ServiceStage = {}));
export var ConfigChangeType;
(function (ConfigChangeType) {
    ConfigChangeType["reload"] = "reload";
    ConfigChangeType["regenerateTmpFiles"] = "regenerateTmpFiles";
})(ConfigChangeType || (ConfigChangeType = {}));
export var ApplyPluginsType;
(function (ApplyPluginsType) {
    ApplyPluginsType["add"] = "add";
    ApplyPluginsType["modify"] = "modify";
    ApplyPluginsType["event"] = "event";
})(ApplyPluginsType || (ApplyPluginsType = {}));
export var EnableBy;
(function (EnableBy) {
    EnableBy["register"] = "register";
    EnableBy["config"] = "config";
})(EnableBy || (EnableBy = {}));
