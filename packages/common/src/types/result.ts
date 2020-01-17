/** ===========================================================================
 * Result type!
 *
 * This is a Result type inspired by Rust.
 *
 * Reference: https://doc.rust-lang.org/rust-by-example/error/result.html
 *
 * It always also to provide robust type checking around operations which
 * may have a failure status, and to avoid arbitrarily throwing and catching
 * errors to communicate failure. This is especially useful because TypeScript
 * provides no utility to type check thrown errors. Thrown errors are like
 * an any type on fire in TypeScript. The Result type helps us avoid that.
 * ============================================================================
 */

export interface IOk<T> {
  value: T;
  error?: undefined;
}

export interface IErr<E> {
  error: E;
  value?: undefined;
}

/**
 * Ok type constructor class.
 */
export class Ok<T> implements IOk<T> {
  value: T;
  error = undefined;

  static of<U>(value: U): Ok<U> {
    return new Ok(value);
  }

  constructor(value: T) {
    this.value = value;
  }
}

/**
 * Err type constructor class.
 */
export class Err<E> implements IErr<E> {
  value: undefined;
  error: E;

  static of<U>(value: U): Err<U> {
    return new Err(value);
  }

  constructor(error: E) {
    this.error = error;
  }
}

export type Result<T, E> = IOk<T> | IErr<E>;
