/**
 * @author mango
 * @description middlewares compose
 */

import type { Middleware, Next } from './model';

export function compose<T>(
  middlewares: Middleware<T>[]
): Middleware<T> {
  return function (context: T, next?: Next) {
    const closure = { offset: -1 };

    function dispatch(index: number): Promise<void> {
      if (index <= closure.offset) {
        throw new Error('next() called mutiple times');
      }

      closure.offset = index;

      if (index === middlewares.length) {
        return Promise.resolve(next?.());
      }

      const middleware = middlewares[index];

      return Promise.resolve(
        middleware(context, dispatch.bind(null, index + 1)),
      );
    }

    return dispatch(0);
  };
};
