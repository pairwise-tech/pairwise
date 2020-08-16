declare function it(message: string, testFunction: () => void): void;
declare const MAX_LINE_LENGTH = 16;
declare const assert: (condition: boolean, message?: string) => boolean;
declare const assertEqual: (a: any, b: any) => boolean;
declare const deepEqual: (a: any, b: any) => boolean;
declare const jsonDiff: (a: any, b: any) => string;
declare const stringify: (x: any) => string;
declare const truncateMiddle: (x: string) => string;
declare const isObject: (value: any) => boolean;
declare type Path = Array<string | number>;
declare const hasIn: ([k, ...nextPath]: Path, obj: any) => boolean;
declare const getIn: ([k, ...nextPath]: Path, obj: any, notSetValue?: any) => any;
declare const methodNegationProxyHandler: {
    get: (obj: Expectation, prop: string) => any;
};
declare class Expectation {
    value: any;
    not: Expectation;
    constructor(value: any);
    find(): boolean;
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeLessThan(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toMatch(strOrReg: string | RegExp): void;
    toHaveProperty(keyPath: Path | string, optionalTestValue?: any): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toBeDefined(): void;
    toContain(val: any): void;
    toThrow(optionalFailureMessage?: string): void;
}
declare const expect: (x: any) => Expectation;
