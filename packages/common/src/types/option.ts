/** ===========================================================================
 * Inspired by the Result Option type.
 *
 * https://doc.rust-lang.org/rust-by-example/std/option.html
 * ============================================================================
 */

export interface ISome<T> {
  value: T;
  some: true;
}

export interface INone {
  some: false;
}

/**
 * Some type constructor class.
 */
export class Some<T> implements ISome<T> {
  value: T;
  some: true = true;

  static of<U>(value: U): Some<U> {
    return new Some(value);
  }

  constructor(value: T) {
    this.value = value;
  }
}

/**
 * None type constructor class.
 */
export class None implements INone {
  some: false = false;

  static of(): INone {
    return new None();
  }
}

export type Option<T> = ISome<T> | INone;
