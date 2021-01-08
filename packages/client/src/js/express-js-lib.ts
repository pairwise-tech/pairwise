/* eslint-disable */

type RouteHandler = (request: any, response: any) => void;

type RequestBody = any | undefined;

const express = () => {
  const routes: Array<[string, RouteHandler]> = [];

  const toPathKey = (http: string, path: string) => `${http}-${path}`;

  const handler = (path: string, payload?: RequestBody) => {
    for (const [route, handler] of routes) {
      if (route === path) {
        return new Promise((resolve, reject) => {
          const res = {
            send: (value: any) => resolve(value),
          };
          const req = { body: payload };
          try {
            handler(req, res);
          } catch (err) {
            reject(err);
          }
        });
      }
    }

    throw new Error(`No matching route handler for path: ${path}`);
  };

  return {
    request: {
      get: (path: string, payload: RequestBody) => {
        const pathKey = toPathKey("get", path);
        return handler(pathKey);
      },
      put: (path: string, payload: RequestBody) => {
        const pathKey = toPathKey("put", path);
        return handler(pathKey);
      },
      post: (path: string, payload: RequestBody) => {
        const pathKey = toPathKey("post", path);
        return handler(pathKey);
      },
      delete: (path: string, payload: RequestBody) => {
        const pathKey = toPathKey("delete", path);
        return handler(pathKey);
      },
    },
    get: (path: string, handler: RouteHandler): void => {
      const pathKey = toPathKey("get", path);
      if (typeof handler === "function") {
        routes.push([pathKey, handler]);
      } else {
        throw new Error("Handler must be a function");
      }
    },
    post: (path: string, handler: RouteHandler): void => {
      const pathKey = toPathKey("post", path);
      if (typeof handler === "function") {
        routes.push([pathKey, handler]);
      } else {
        throw new Error("Handler must be a function");
      }
    },
    put: (path: string, handler: RouteHandler): void => {
      const pathKey = toPathKey("put", path);
      if (typeof handler === "function") {
        routes.push([pathKey, handler]);
      } else {
        throw new Error("Handler must be a function");
      }
    },
    delete: (path: string, handler: RouteHandler): void => {
      const pathKey = toPathKey("delete", path);
      if (typeof handler === "function") {
        routes.push([pathKey, handler]);
      } else {
        throw new Error("Handler must be a function");
      }
    },
    listen: (port: number, callback: () => void): void => {
      callback();
      return;
    },
  };
};
