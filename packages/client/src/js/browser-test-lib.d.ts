declare function test(message: string, testFunction: () => void): void;
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
declare const get: (selector: string) => HTMLElement;
declare const getAll: (selector: string) => any;
declare const getStyle: (el: HTMLElement, cssProp: string, pseudoSelector?: string) => string;
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
