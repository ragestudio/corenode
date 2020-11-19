"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootPackage = exports.getGit = exports.getDevRuntimeEnvs = exports.getRuntimeEnv = exports.rootPackage = void 0;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function _path() {
    return data;
  };

  return data;
}

function _fs() {
  const data = _interopRequireDefault(require("fs"));

  _fs = function _fs() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.json'];

const findenvs = require('find-up').sync(syncEnvs);

let runtimeEnv = {};

const rootPackage = _path().default.resolve(`${process.cwd()}/package.json`);

exports.rootPackage = rootPackage;

if (findenvs) {
  try {
    // @ts-ignore
    runtimeEnv = JSON.parse(_fs().default.readFileSync(findenvs));
  } catch (error) {
    console.log("Failed trying load runtime env"); // (⓿_⓿) terrible...
  }
} else {
  console.log("Runtime env (.nodecore) is missing");
}

const getRuntimeEnv = () => {
  return runtimeEnv;
};

exports.getRuntimeEnv = getRuntimeEnv;

const getDevRuntimeEnvs = () => {
  if (!runtimeEnv || typeof runtimeEnv.devRuntime == "undefined") {
    return false;
  }

  return runtimeEnv.devRuntime;
};

exports.getDevRuntimeEnvs = getDevRuntimeEnvs;

const getGit = () => {
  const envs = getDevRuntimeEnvs();

  if (!envs || typeof envs.originGit == "undefined") {
    return false;
  }

  return envs.originGit;
};

exports.getGit = getGit;

const getRootPackage = () => {
  if (!rootPackage) {
    return false;
  }

  try {
    // @ts-ignore
    const fileStream = JSON.parse(_fs().default.readFileSync(rootPackage));

    if (fileStream) {
      return fileStream;
    }

    return false;
  } catch (error) {
    return false;
  }
};

exports.getRootPackage = getRootPackage;