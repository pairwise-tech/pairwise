/** ===========================================================================
 * Result type!
 *
 * ~ Ok|Err
 * ============================================================================
 */

export interface IOk<T> {
  result: T;
  error?: undefined;
}

export interface IErr<E> {
  error: E;
  result?: undefined;
}

export class Ok<T> implements IOk<T> {
  result: T;
  error = undefined;

  constructor(result: T) {
    this.result = result;
  }
}

export class Err<E> implements IErr<E> {
  result: undefined;
  error: E;

  constructor(error: E) {
    this.error = error;
  }
}

/* Useful, not? I like it (?) */
export type Result<T, E> = IOk<T> | IErr<E>;
