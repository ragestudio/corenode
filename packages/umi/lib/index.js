"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  Link: true,
  NavLink: true,
  Prompt: true,
  Redirect: true,
  Route: true,
  Router: true,
  StaticRouter: true,
  MemoryRouter: true,
  Switch: true,
  matchPath: true,
  withRouter: true,
  useHistory: true,
  useLocation: true,
  useParams: true,
  useRouteMatch: true,
  __RouterContext: true,
  createBrowserHistory: true,
  createHashHistory: true,
  createMemoryHistory: true,
  Plugin: true,
  ApplyPluginsType: true,
  dynamic: true
};
Object.defineProperty(exports, "Link", {
  enumerable: true,
  get: function get() {
    return _runtime().Link;
  }
});
Object.defineProperty(exports, "NavLink", {
  enumerable: true,
  get: function get() {
    return _runtime().NavLink;
  }
});
Object.defineProperty(exports, "Prompt", {
  enumerable: true,
  get: function get() {
    return _runtime().Prompt;
  }
});
Object.defineProperty(exports, "Redirect", {
  enumerable: true,
  get: function get() {
    return _runtime().Redirect;
  }
});
Object.defineProperty(exports, "Route", {
  enumerable: true,
  get: function get() {
    return _runtime().Route;
  }
});
Object.defineProperty(exports, "Router", {
  enumerable: true,
  get: function get() {
    return _runtime().Router;
  }
});
Object.defineProperty(exports, "StaticRouter", {
  enumerable: true,
  get: function get() {
    return _runtime().StaticRouter;
  }
});
Object.defineProperty(exports, "MemoryRouter", {
  enumerable: true,
  get: function get() {
    return _runtime().MemoryRouter;
  }
});
Object.defineProperty(exports, "Switch", {
  enumerable: true,
  get: function get() {
    return _runtime().Switch;
  }
});
Object.defineProperty(exports, "matchPath", {
  enumerable: true,
  get: function get() {
    return _runtime().matchPath;
  }
});
Object.defineProperty(exports, "withRouter", {
  enumerable: true,
  get: function get() {
    return _runtime().withRouter;
  }
});
Object.defineProperty(exports, "useHistory", {
  enumerable: true,
  get: function get() {
    return _runtime().useHistory;
  }
});
Object.defineProperty(exports, "useLocation", {
  enumerable: true,
  get: function get() {
    return _runtime().useLocation;
  }
});
Object.defineProperty(exports, "useParams", {
  enumerable: true,
  get: function get() {
    return _runtime().useParams;
  }
});
Object.defineProperty(exports, "useRouteMatch", {
  enumerable: true,
  get: function get() {
    return _runtime().useRouteMatch;
  }
});
Object.defineProperty(exports, "__RouterContext", {
  enumerable: true,
  get: function get() {
    return _runtime().__RouterContext;
  }
});
Object.defineProperty(exports, "createBrowserHistory", {
  enumerable: true,
  get: function get() {
    return _runtime().createBrowserHistory;
  }
});
Object.defineProperty(exports, "createHashHistory", {
  enumerable: true,
  get: function get() {
    return _runtime().createHashHistory;
  }
});
Object.defineProperty(exports, "createMemoryHistory", {
  enumerable: true,
  get: function get() {
    return _runtime().createMemoryHistory;
  }
});
Object.defineProperty(exports, "Plugin", {
  enumerable: true,
  get: function get() {
    return _runtime().Plugin;
  }
});
Object.defineProperty(exports, "ApplyPluginsType", {
  enumerable: true,
  get: function get() {
    return _runtime().ApplyPluginsType;
  }
});
Object.defineProperty(exports, "dynamic", {
  enumerable: true,
  get: function get() {
    return _runtime().dynamic;
  }
});

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _runtime() {
  const data = require("@nodecorejs/runtime");

  _runtime = function _runtime() {
    return data;
  };

  return data;
}

var _coreExports = require("@@/core/coreExports");

Object.keys(_coreExports).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _coreExports[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _coreExports[key];
    }
  });
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }