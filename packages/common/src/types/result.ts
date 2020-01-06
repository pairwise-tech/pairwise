/** ===========================================================================
 * Result type!
 *
 * ~ Ok|Err
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

/* Useful, not? I like it (?) */
export type Result<T, E> = IOk<T> | IErr<E>;
