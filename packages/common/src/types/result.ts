/** ===========================================================================
 * Result type!
 *
 * This is a Result type inspired by Rust.
 *
 * Reference: https://doc.rust-lang.org/rust-by-example/error/result.html
 *
 * The Result type allows us to provide type checking to operations which may
 * fail, since in TypeScript there is no way to convey type information in
 * functions which may "throw" an error.
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
