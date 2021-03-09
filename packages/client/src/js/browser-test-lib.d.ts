/** ===========================================================================
 * This file provides additional test utils and type definitions for
 * our Workspace test environment.
 * ============================================================================
 */
/** ===========================================================================
 * Type definitions for additional test utils which are provided in the
 * test-utils file, e.g. see TEST_UTILS_GLOBALS.
 * ============================================================================
 */
declare const __user_code_string__: string;
declare const __secret_log_box: string[];
declare const __secret_warn_box: string[];
declare const __secret_error_box: string[];
declare const __secret_info_box: string[];
interface TestCase {
    message: string;
    test: (...args: any) => void;
}
declare const __USER_TEST_LIST__: TestCase[];
/** ===========================================================================
 * Global test helpers.
 * ============================================================================
 */
/**
 * A shortcut for document.querySelector
 * @param {string} selector CSS Selector
 */
declare const get: (selector: string) => HTMLElement;
/**
 * A shortcut for getting an array of all elements that match the selector
 * @param {string} selector CSS Selector
 */
declare const getAll: (selector: string) => any;
/**
 * A wrapper around window.getComputedStyle
 *
 * @param {Element} el DOM Element
 * @param {string} cssProp CSS property name. I.e. "background-color"
 */
declare const getStyle: (el: HTMLElement, cssProp: string, pseudoSelector?: string | null) => string;
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
declare const getText: (selector: string) => string;
declare type Maybe<T> = T | null;
declare const css: (propName: string, value: string | number) => string;
declare const cssColor: (value: string) => string;
declare const parseLogBox: (box: string[]) => string[];
declare const inBox: (box: string[], message: string) => boolean;
declare const checkBoxAsync: (box: string[], message: string, delay: number) => Promise<boolean>;
declare const wait: (time: number) => Promise<unknown>;
declare const fail: () => void;
declare const pass: () => void;
declare const __id: () => string;
declare const __randomInRange: (min: any, max: any) => number;
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
declare class MockMongoCollection {
    private args;
    private getArgs;
    insertOne(args: any): Promise<any>;
}
declare const usersCollection: MockMongoCollection;
/**
 * Switch the database URL if you need to test and run the Database Challenge
 * API server locally:
 *
 * TODO: It might be nice if this DATABASE_CHALLENGE_API was an environment
 * variable, but this is a little tricky because these files are built
 * independently and then just included directly as JS in runtime.
 */
declare const DATABASE_CHALLENGE_API = "https://database-challenge-api.uc.r.appspot.com";
/**
 * Helper for SQL code challenges.
 */
declare const executePostgresQuery: (preSqlQuery: string, userSqlQuery: string, postSqlQuery: string) => Promise<any>;
/**
 * Helper for MongoDB code challenges.
 */
declare const executeMongoDBQuery: (args: any) => Promise<any>;
/** ===========================================================================
 * React Native Web Test Helpers
 * ============================================================================
 */
declare const reactNativeTextExists: (text: string) => boolean;
declare const reactNativeButtonWithTextExists: (text: string) => boolean;
