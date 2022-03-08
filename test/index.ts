// export const bar = 'a string'
// export const foo: number = 1

/**
 * Add two numbers
 *
 * @param one - the first number
 * @param two - the second number
 *
 * @default two = 2
 *
 * @example
 * add(1, 2)
 */
export default interface Interface {
  one: boolean | number
  two?: number
}

// export type Type = number & Interface

/**
 * Add two numbers
 *
 * @param name - the first number
 * @param age - the second number
 *
 * @default age = 2
 *
 * @example
 * add(1, 2)
 */
export type Person = {
  name?: string
  age: number
  getName: () => string
}

/**
 * Add two numbers
 *
 * @param left - the first number
 * @param right - the second number
 *
 * @default left = 1
 *
 * @example
 * add(1, 2)
 */
// export function add(left: number, right: number): string {
//   return ''
// }

// /**
//  * Subtract two numbers
//  */
// export function subtract(left: number, right): string {
//   return ''
// }

// /**
//  * @param foo - the callback
//  */
// export function withCallback(foo: (value: string) => string): string {
//   return ''
// }

/**
 * A car
 *
 * @property wheels - A circle thing
 */
// export class Car {
//   wheels: number
// }
