/** ===========================================================================
 * This file defines the Jest-like expectation library which is used in
 * the Workspace tests and provided to the Workspace testing challenges
 * for users to use. These library mimics the Jest library (and the
 * method comments are generally adapted from the @types/jest file).
 *
 * Because this is also user-facing, it is separated from the other
 * browser-test-utils.
 * ============================================================================
 */
declare function test(message: string, testFunction: () => void): void;
declare type Path = Array<string | number>;
declare class Expectation {
    private value;
    private not;
    private MAX_LINE_LENGTH;
    constructor(value: any);
    /**
     * Checks that a value is what you expect. Does not perform deep equality
     * comparisons.
     */
    toBe(expected: any): void;
    /**
     * Assert that a value equals and expected value, performing deep
     * equality checks when appropriate.
     */
    toEqual(expected: any): void;
    /**
     * For comparing floating point numbers.
     */
    toBeGreaterThan(n: number): void;
    /**
     * For comparing floating point numbers.
     */
    toBeGreaterThanOrEqual(n: number): void;
    /**
     * For comparing floating point numbers.
     */
    toBeLessThan(n: number): void;
    /**
     * For comparing floating point numbers.
     */
    toBeLessThanOrEqual(n: number): void;
    /**
     * Check that a string matches a regular expression.
     */
    toMatch(strOrReg: string | RegExp): void;
    /**
     * Use to check if property at provided reference keyPath exists for an object.
     * For checking deeply nested properties in an object you may use dot notation or an array containing
     * the keyPath for deep references.
     *
     * Optionally, you can provide a value to check if it's equal to the value present at keyPath
     * on the target object. This matcher uses 'deep equality' (like `toEqual()`) and recursively checks
     * the equality of all fields.
     *
     * @example
     *
     * expect(houseForSale).toHaveProperty('kitchen.area', 20);
     */
    toHaveProperty(keyPath: Path | string, optionalTestValue?: any): void;
    /**
     * Use when you don't care what a value is, you just want to ensure a value
     * is true in a boolean context. In JavaScript, there are six falsy values:
     * `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.
     */
    toBeTruthy(): void;
    /**
     * When you don't care what a value is, you just want to
     * ensure a value is false in a boolean context.
     */
    toBeFalsy(): void;
    /**
     * Using exact equality with floating point numbers is a bad idea.
     * Rounding means that intuitive things fail.
     * The default for numDigits is 2.
     */
    toBeCloseTo(expected: number, precision?: number): void;
    /**
     * Ensure that a variable is not undefined.
     */
    toBeDefined(): void;
    /**
     * Used when you want to check that an item is in a list.
     * For testing the items in the list, this uses `===`, a strict equality check.
     *
     * Optionally, you can provide a type for the expected value via a generic.
     * This is particularly useful for ensuring expected objects have the right
     * structure.
     */
    toContain(val: any): void;
    /**
     * Used to test that a function throws when it is called.
     */
    toThrow(optionalFailureMessage?: string): void;
    private assert;
    private assertEqual;
    private deepEqual;
    private jsonDiff;
    private stringify;
    private truncateMiddle;
    private isObject;
    private hasIn;
    /**
     * A Proxy handler to "negate" the results of function calls. In this case
     * negation means throwing when the method would otherwise not have thrown,
     * since this is to be used with the expect library
     */
    methodNegationProxyHandler: {
        get: (obj: Expectation, prop: string) => any;
    };
    private getIn;
}
declare const expect: (x: any) => Expectation;
