/* eslint-disable */
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function() {
          return this;
        }),
      g
    );
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var _this = this;
/** ===========================================================================
 * Global test helpers.
 * ============================================================================
 */
/**
 * A shortcut for document.querySelector
 * @param {string} selector CSS Selector
 */
var get = function(selector) {
  return document.querySelector(selector);
};
/**
 * A shortcut for getting an array of all elements that match the selector
 * @param {string} selector CSS Selector
 */
var getAll = function(selector) {
  return Array.prototype.slice.call(document.querySelectorAll(selector));
};
/**
 * A wrapper around window.getComputedStyle
 *
 * @param {Element} el DOM Element
 * @param {string} cssProp CSS property name. I.e. "background-color"
 */
var getStyle = function(el, cssProp, pseudoSelector) {
  if (pseudoSelector === void 0) {
    pseudoSelector = null;
  }
  var view =
    el.ownerDocument && el.ownerDocument.defaultView
      ? el.ownerDocument.defaultView
      : window;
  var style = view.getComputedStyle(el, pseudoSelector);
  // @ts-ignore
  return style.getPropertyValue(cssProp) || style[cssProp];
};
/**
 * Get the innerHTML from an element given an HTML selector.
 *
 * NOTE: This is called getText so it's more clear it is the method to use
 * for getting and performing assertions on text content of HTML elements.
 * That is because using .innerText will break in our unit test environment,
 * so we don't want to use it. Naming this method getText should more strongly
 * suggest to use this when performing text assertions.
 *
 * NOTE: This approach is advisable to be used to get text for HTML elements
 * because it will work in both the app and unit testing environment.
 */
var getText = function(selector) {
  try {
    var element = get(selector);
    // @ts-ignore
    var html = element.innerHTML;
    return html.trim();
  } catch (err) {
    throw err; // Just rethrow
  }
};
var css = function(propName, value) {
  var dummy = get("#dummy-test-div");
  // Create the dummy div if not present
  if (!dummy) {
    dummy = document.createElement("div");
    dummy.id = "dummy-test-div";
    dummy.style.display = "none";
    document.body.appendChild(dummy);
  }
  // Grab the initial style so that we can reset later
  // @ts-ignore
  var initial = dummy.style[propName];
  // Set the new style and get the style as computed by the browser
  // @ts-ignore
  dummy.style[propName] = value;
  var result = getStyle(dummy, propName);
  // Reset to the initial value on the dummy el
  // @ts-ignore
  dummy.style[propName] = initial;
  return result;
};
var cssColor = function(value) {
  return css("color", value);
};
// Helper to parse the boxes of console messages and convert them
// to objects and extract the messages to help with writing test
// assertions.
var parseLogBox = function(box) {
  var parsedBoxLogs = box.map(function(x) {
    return JSON.parse(x);
  });
  var messageBox = parsedBoxLogs.map(function(x) {
    return x[0];
  });
  return messageBox;
};
// Given a box of logged console messages (see above function) and
// a message, return if the box contains that message exactly.
var inBox = function(box, message) {
  var result = box.find(function(m) {
    return m === message;
  });
  return !!result;
};
// Check for a message in the console log box, but after some delay.
// This is a helper for running tests in async challenges, where a challenge
// may need to log a message but after waiting for some time.
var checkBoxAsync = function(box, message, delay) {
  return __awaiter(_this, void 0, void 0, function() {
    return __generator(this, function(_a) {
      return [
        2 /*return*/,
        new Promise(function(resolve) {
          setTimeout(function() {
            var result = inBox(box, message);
            resolve(result);
          }, delay);
        }),
      ];
    });
  });
};
// Wait some time... useful for pausing to let async challenges have some
// time to complete some actions.
var wait = function(time) {
  return __awaiter(_this, void 0, void 0, function() {
    return __generator(this, function(_a) {
      return [
        2 /*return*/,
        new Promise(function(resolve) {
          return setTimeout(resolve, time);
        }),
      ];
    });
  });
};
// Helper to quickly fail a test.
// @ts-ignore
var fail = function() {
  return expect(false).toBe(true);
};
// Helper to quickly pass a test.
var pass = function() {
  return expect(true).toBe(true);
};
// Generate a random string id
var __id = function() {
  return (
    Math.random()
      .toString(36)
      .substring(2) + Date.now().toString(36)
  );
};
// Generate a random number in a min...max range
var __randomInRange = function(min, max) {
  return Math.round(Math.random() * (max - min) + min);
};
/** ===========================================================================
 * Database Challenge API Helpers
 * ----------------------------------------------------------------------------
 * These utils rely on the database-challenge-api which executes database
 * queries against a database and returns results to be checked with
 * assertions in the test environment.
 *
 * Reference: https://github.com/pairwise-tech/database-challenge-api
 * ============================================================================
 */
/**
 * Mock a MongoClient API to help test MongoDB challenges. This approach
 * feels workable for a first version. Alternatively, we may need/want
 * to just arbitrarily execute NodeJS code, which may come with the backend
 * challenges anyway.
 */
var MockMongoCollection = /** @class */ (function() {
  function MockMongoCollection() {
    this.args = null;
  }
  MockMongoCollection.prototype.getArgs = function() {
    return this.args;
  };
  MockMongoCollection.prototype.insertOne = function(args) {
    return __awaiter(this, void 0, void 0, function() {
      return __generator(this, function(_a) {
        this.args = args;
        return [2 /*return*/];
      });
    });
  };
  return MockMongoCollection;
})();
var usersCollection = new MockMongoCollection();
/**
 * Switch the database URL if you need to test and run the Database Challenge
 * API server locally:
 */
// const DATABASE_CHALLENGE_API = "http://localhost:5000";
var DATABASE_CHALLENGE_API = "https://database-challenge-api.uc.r.appspot.com";
/**
 * Helper for SQL code challenges.
 */
var executePostgresQuery = function(preSqlQuery, userSqlQuery, postSqlQuery) {
  return __awaiter(_this, void 0, void 0, function() {
    var url,
      userQuery,
      preQuery,
      postQuery,
      body,
      headers,
      response,
      text,
      result,
      err_1;
    return __generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 5, , 6]);
          url = DATABASE_CHALLENGE_API + "/postgres/query";
          userQuery = userSqlQuery;
          preQuery = preSqlQuery || "";
          postQuery = postSqlQuery || "";
          body = JSON.stringify({
            userQuery: userQuery,
            preQuery: preQuery,
            postQuery: postQuery,
          });
          headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
          };
          return [
            4 /*yield*/,
            fetch(url, {
              body: body,
              headers: headers,
              method: "post",
            }),
          ];
        case 1:
          response = _a.sent();
          if (!!response.ok) return [3 /*break*/, 3];
          return [4 /*yield*/, response.text()];
        case 2:
          text = _a.sent();
          throw new Error(text);
        case 3:
          return [4 /*yield*/, response.json()];
        case 4:
          result = _a.sent();
          return [2 /*return*/, result];
        case 5:
          err_1 = _a.sent();
          // Throw err to fail test
          throw err_1;
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
/**
 * Helper for MongoDB code challenges.
 */
var executeMongoDBQuery = function(args) {
  return __awaiter(_this, void 0, void 0, function() {
    var url, body, headers, response, result, err_2;
    return __generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          url = DATABASE_CHALLENGE_API + "/mongodb/query";
          body = JSON.stringify({ args: args });
          headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
          };
          return [
            4 /*yield*/,
            fetch(url, {
              body: body,
              headers: headers,
              method: "post",
            }),
          ];
        case 1:
          response = _a.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          result = _a.sent();
          return [2 /*return*/, result];
        case 3:
          err_2 = _a.sent();
          // Throw err to fail test
          throw err_2;
        case 4:
          return [2 /*return*/];
      }
    });
  });
};
/** ===========================================================================
 * React Native Web Test Helpers
 * ============================================================================
 */
// Determine if a text element exists with the given text for a
// React Native challenge.
var reactNativeTextExists = function(text) {
  // Text components are rendered as divs:
  var containers = document.getElementsByTagName("div");
  // @ts-ignore
  for (var _i = 0, containers_1 = containers; _i < containers_1.length; _i++) {
    var div = containers_1[_i];
    if (div.innerHTML === text) {
      return true;
    }
  }
  return false;
};
// Determine if a button element exists with the given text for a
// React Native challenge.
var reactNativeButtonWithTextExists = function(text) {
  // Buttons are rendered as divs with a button role:
  var buttons = document.querySelectorAll('[role="button"]');
  // @ts-ignore
  for (var _i = 0, buttons_1 = buttons; _i < buttons_1.length; _i++) {
    var button = buttons_1[_i];
    // @ts-ignore
    if (button.firstChild.innerHTML === text) {
      return true;
    }
  }
  return false;
};
/** ===========================================================================
 * Expose Globals
 * ============================================================================
 */
// @ts-ignore
window.get = get;
// @ts-ignore
window.getAll = getAll;
// @ts-ignore
window.getStyle = getStyle;
// @ts-ignore
window.getText = getText;
// @ts-ignore
window.reactNativeTextExists = reactNativeTextExists;
// @ts-ignore
window.reactNativeButtonWithTextExists = reactNativeButtonWithTextExists;
