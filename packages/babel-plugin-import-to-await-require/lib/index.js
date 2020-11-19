"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.specifiersToProperties = specifiersToProperties;
exports.default = _default;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _utils() {
  const data = require("@nodecorejs/utils");

  _utils = function _utils() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function specifiersToProperties(specifiers) {
  return specifiers.reduce((memo, s) => {
    if (_utils().t.isImportDefaultSpecifier(s)) {
      memo.properties.push(_utils().t.objectProperty(_utils().t.identifier('default'), s.local));
    } else if (_utils().t.isExportDefaultSpecifier(s)) {
      memo.properties.push(_utils().t.objectProperty(_utils().t.identifier('default'), s.exported));
    } else if (_utils().t.isExportSpecifier(s)) {
      memo.properties.push(_utils().t.objectProperty(s.local, s.exported));
    } else if (_utils().t.isImportNamespaceSpecifier(s)) {
      memo.namespaceIdentifier = s.local;
    } else {
      memo.properties.push(_utils().t.objectProperty(s.imported, s.local));
    }

    return memo;
  }, {
    properties: [],
    namespaceIdentifier: null
  });
}

function isMatchLib(path, libs, alias) {
  return libs.concat(Object.keys(alias)).some(lib => {
    if (typeof lib === 'string') {
      return lib === path;
    } else {
      return lib.test(path);
    }
  });
}

function getPath(path, alias) {
  const keys = Object.keys(alias);

  for (var _i = 0, _keys = keys; _i < _keys.length; _i++) {
    const key = _keys[_i];

    if (path.startsWith(key)) {
      return path.replace(key, alias[key]);
    }
  }

  return path;
}

function _default() {
  return {
    visitor: {
      Program: {
        exit(path, {
          opts
        }) {
          const variableDeclarations = [];
          let index = path.node.body.length - 1;

          while (index >= 0) {
            const d = path.node.body[index];

            if (_utils().t.isImportDeclaration(d)) {
              var _opts$onTransformDeps;

              const isMatch = isMatchLib(d.source.value, opts.libs, opts.alias || {});
              (_opts$onTransformDeps = opts.onTransformDeps) === null || _opts$onTransformDeps === void 0 ? void 0 : _opts$onTransformDeps.call(opts, {
                source: d.source.value,
                file: path.hub.file.opts.filename,
                isMatch
              });

              if (isMatch) {
                const _specifiersToProperti = specifiersToProperties(d.specifiers),
                      properties = _specifiersToProperti.properties,
                      namespaceIdentifier = _specifiersToProperti.namespaceIdentifier;

                const id = _utils().t.objectPattern(properties);

                const init = _utils().t.awaitExpression(_utils().t.callExpression(_utils().t.import(), [_utils().t.stringLiteral(`${opts.remoteName}/${getPath(d.source.value, opts.alias || {})}`)]));

                if (namespaceIdentifier) {
                  if (properties.length) {
                    variableDeclarations.unshift(_utils().t.variableDeclaration('const', [_utils().t.variableDeclarator(id, namespaceIdentifier)]));
                  }

                  variableDeclarations.unshift(_utils().t.variableDeclaration('const', [_utils().t.variableDeclarator(namespaceIdentifier, init)]));
                } else {
                  variableDeclarations.unshift(_utils().t.variableDeclaration('const', [_utils().t.variableDeclarator(id, init)]));
                }

                path.node.body.splice(index, 1);
              }
            }

            if (_utils().t.isExportAllDeclaration(d) && d.source) {
              var _opts$onTransformDeps2;

              (_opts$onTransformDeps2 = opts.onTransformDeps) === null || _opts$onTransformDeps2 === void 0 ? void 0 : _opts$onTransformDeps2.call(opts, {
                source: d.source.value,
                file: path.hub.file.opts.filename,
                isMatch: false,
                isExportAllDeclaration: true
              });
            } // export { bar } from 'foo';


            if (_utils().t.isExportNamedDeclaration(d) && d.source) {
              var _opts$onTransformDeps3;

              const isMatch = isMatchLib(d.source.value, opts.libs, opts.alias || {});
              (_opts$onTransformDeps3 = opts.onTransformDeps) === null || _opts$onTransformDeps3 === void 0 ? void 0 : _opts$onTransformDeps3.call(opts, {
                source: d.source.value,
                file: path.hub.file.opts.filename,
                isMatch
              });

              if (isMatch) {
                const _specifiersToProperti2 = specifiersToProperties(d.specifiers),
                      properties = _specifiersToProperti2.properties;

                const id = _utils().t.objectPattern(properties);

                const init = _utils().t.awaitExpression(_utils().t.callExpression(_utils().t.import(), [_utils().t.stringLiteral(`${opts.remoteName}/${getPath(d.source.value, opts.alias || {})}`)]));

                variableDeclarations.unshift(_utils().t.variableDeclaration('const', [_utils().t.variableDeclarator(id, init)]));
                d.source = null;
              }
            }

            index -= 1;
          }

          path.node.body = [...variableDeclarations, ...path.node.body];
        }

      }
    }
  };
}