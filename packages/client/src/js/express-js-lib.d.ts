declare type RouteHandler = (request: any, response: any) => void;
declare type RequestBody = any | undefined;
declare const express: () => {
    request: {
        get: (path: string, payload: RequestBody) => Promise<unknown>;
        put: (path: string, payload: RequestBody) => Promise<unknown>;
        post: (path: string, payload: RequestBody) => Promise<unknown>;
        delete: (path: string, payload: RequestBody) => Promise<unknown>;
    };
    getState: () => {
        port: any;
        isListening: boolean;
    };
    get: (path: string, handler: RouteHandler) => void;
    post: (path: string, handler: RouteHandler) => void;
    put: (path: string, handler: RouteHandler) => void;
    delete: (path: string, handler: RouteHandler) => void;
    listen: (serverPort: number, callback: () => void) => void;
};
