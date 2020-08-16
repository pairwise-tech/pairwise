declare function test(message: string, testFunction: () => void): void;
declare type Path = Array<string | number>;
declare class Expectation {
    value: any;
    not: Expectation;
    MAX_LINE_LENGTH: number;
    constructor(value: any);
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
    private assert;
    private assertEqual;
    private deepEqual;
    private jsonDiff;
    private stringify;
    private truncateMiddle;
    private isObject;
    private hasIn;
    methodNegationProxyHandler: {
        get: (obj: Expectation, prop: string) => any;
    };
    private getIn;
}
declare const expect: (x: any) => Expectation;
