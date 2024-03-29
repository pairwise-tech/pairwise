/* eslint-disable */
var express = function () {
    var port = null;
    var isListening = false;
    var routes = [];
    var parseQueryString = function (queryString) {
        var params = {};
        var index = queryString.indexOf("?");
        var q = queryString.slice(index + 1);
        var pairs = q.split("&");
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split("=");
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
        }
        return params;
    };
    var toPathKey = function (http, path) {
        var paramsIndex = path.indexOf("?");
        if (paramsIndex === -1) {
            return http + "-" + path;
        }
        else {
            return http + "-" + path.slice(0, paramsIndex);
        }
    };
    var handler = function (path, pathKey, payload) {
        var _loop_1 = function (route, handler_1) {
            if (route === pathKey) {
                return { value: new Promise(function (resolve, reject) {
                        var res = {
                            send: function (value) { return resolve(value); }
                        };
                        var params = parseQueryString(path);
                        var req = { body: payload, params: params };
                        try {
                            handler_1(req, res);
                        }
                        catch (err) {
                            reject(err);
                        }
                    }) };
            }
        };
        for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
            var _a = routes_1[_i], route = _a[0], handler_1 = _a[1];
            var state_1 = _loop_1(route, handler_1);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        throw new Error("No matching route handler for path: " + path);
    };
    return {
        request: {
            get: function (path, payload) {
                var pathKey = toPathKey("get", path);
                return handler(path, pathKey, payload);
            },
            put: function (path, payload) {
                var pathKey = toPathKey("put", path);
                return handler(path, pathKey, payload);
            },
            post: function (path, payload) {
                var pathKey = toPathKey("post", path);
                return handler(path, pathKey, payload);
            },
            "delete": function (path, payload) {
                var pathKey = toPathKey("delete", path);
                return handler(path, pathKey, payload);
            }
        },
        getState: function () {
            return {
                port: port,
                isListening: isListening
            };
        },
        get: function (path, handler) {
            var pathKey = toPathKey("get", path);
            if (typeof handler === "function") {
                routes.push([pathKey, handler]);
            }
            else {
                throw new Error("Handler must be a function");
            }
        },
        post: function (path, handler) {
            var pathKey = toPathKey("post", path);
            if (typeof handler === "function") {
                routes.push([pathKey, handler]);
            }
            else {
                throw new Error("Handler must be a function");
            }
        },
        put: function (path, handler) {
            var pathKey = toPathKey("put", path);
            if (typeof handler === "function") {
                routes.push([pathKey, handler]);
            }
            else {
                throw new Error("Handler must be a function");
            }
        },
        "delete": function (path, handler) {
            var pathKey = toPathKey("delete", path);
            if (typeof handler === "function") {
                routes.push([pathKey, handler]);
            }
            else {
                throw new Error("Handler must be a function");
            }
        },
        listen: function (serverPort, callback) {
            port = serverPort;
            isListening = true;
            callback();
            return;
        }
    };
};
