import { concat, filter, isArray, isObjectType, map, pipe } from "remeda";

import { compose } from "./compose";
import DriveContext from "./context";
import { isMatch } from "./match";
import { parser } from "./parser";
import type {
  DriveFunc,
  DriveHooks,
  DriveMiddleware,
  DriveOptions,
  ExtraOptions,
  FetchContext,
  FirstParam,
  UseDriveMiddleware,
} from "./types";
import { methods } from "./types";

function over<T>(
  first: FirstParam<T>,
  data?: object,
  init?: RequestInit & ExtraOptions<T>,
): DriveOptions<T> {
  if (isObjectType(first)) return first;
  return { api: first, data, ...init };
}

type DriveParams<T> = Parameters<typeof over<T>>;

type DriverParams =
  | UseDriveMiddleware[]
  | { use?: UseDriveMiddleware[]; hooks?: DriveHooks };

export class Driver {
  private hooks?: DriveHooks;

  private middlewares: UseDriveMiddleware[];

  constructor(opts: DriverParams = {}) {
    const params = (() => (isArray(opts) ? { use: opts } : opts))();

    this.hooks = params.hooks;
    this.middlewares = params.use ?? [];

    methods.forEach((method) => {
      const name = method.toLowerCase() as Lowercase<typeof method>;
      this.drive[name] = async <T>(...args: DriveParams<T>) =>
        (await this.request({ ...over(...args), method })).res.body!;
    });
  }

  public use = (pattern: string, middleware: DriveMiddleware) => {
    this.middlewares.push([pattern, middleware]);
    return this;
  };

  public request = async <T>({
    api,
    use,
    data,
    timeout,
    receiver,
    parse = parser(),
    stringify = JSON.stringify,
    ...init
  }: DriveOptions<T>) => {
    const context = new DriveContext<T>(api, data, init);

    const path = (() => {
      try {
        return new URL(api).pathname;
      } catch (_) {
        return api;
      }
    })();

    const matched = pipe(
      use ?? [],
      concat(this.middlewares),
      filter(([pattern]) => isMatch(path, pattern)),
      map(([, middleware]) => middleware),
    );

    const composed = compose(matched);

    await composed(context, async () => {
      const { hooks } = this;
      await hooks?.beforeInit?.(context);
      context.init({ stringify });
      await hooks?.afterInit?.(context);

      context.initAbort(timeout);

      const { api, req } = context;

      await hooks?.beforeFetch?.(context);
      const res = await fetch(api, req);
      await hooks?.afterFetch?.(context);

      context.res.raw = res;
      context.decodeHeader(res);

      await hooks?.beforeParse?.(context);
      await parse(res, context, { receiver });
      await hooks?.afterParse?.(context);
    });

    return context as FetchContext<T>;
  };

  public drive = (async <T>(...args: DriveParams<T>) => {
    return (await this.request(over(...args))).res.body!;
  }) as DriveFunc;
}
