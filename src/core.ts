import {
  concat,
  filter,
  isArray,
  isObjectType,
  isString,
  map,
  pipe,
} from "remeda";

import { compose } from "./compose";
import { DriveContext } from "./context";
import { isMatch } from "./match";
import { parser } from "./parser";
import type {
  BodyParseFunc,
  DriveFunc,
  DriverHooks,
  DriverMiddleware,
  DriverOptions,
  DriverParams,
  ExtraOptions,
  FetchContext,
  FirstParam,
  MiddlewarePattern,
  UseDriverMiddleware,
} from "./types";
import { methods } from "./types";

function over<T>(
  first: FirstParam<T>,
  data?: object,
  init?: RequestInit & ExtraOptions<T>,
): DriverOptions<T> {
  if (isObjectType(first)) return first;
  return { api: first, data, ...init };
}

type DriveParams<T> = Parameters<typeof over<T>>;

export class Driver {
  private hooks?: DriverHooks;

  private randomId: () => string;

  private parser: <T>() => BodyParseFunc<T>;

  private middlewares: UseDriverMiddleware[];

  constructor(opts: DriverParams = {}) {
    const params = (() => (isArray(opts) ? { use: opts } : opts))();

    this.hooks = params.hooks;
    this.middlewares = params.use ?? [];
    this.parser = params.parser ?? parser;
    this.randomId = params.randomId ?? DriveContext.randomId;

    methods.forEach((method) => {
      const name = method.toLowerCase() as Lowercase<typeof method>;
      this.drive[name] = async <T>(...args: DriveParams<T>) =>
        (await this.request({ ...over(...args), method })).res.body!;
    });
  }

  public use = (pattern: MiddlewarePattern, middleware: DriverMiddleware) => {
    this.middlewares.push([pattern, middleware]);
    return this;
  };

  public request = async <T>({
    api,
    use,
    data,
    timeout,
    receiver,
    parse = this.parser<T>(),
    stringify = JSON.stringify,
    ...init
  }: DriverOptions<T>) => {
    const { middlewares, randomId } = this;

    const context = new DriveContext<T>(api, {
      ...init,
      data,
      id: randomId(),
    });

    const matched = pipe(
      middlewares,
      filter(([arg]) =>
        isString(arg) ? isMatch(context.path, arg) : arg(context.clone()),
      ),
      map(([, middleware]) => middleware),
      concat(use ?? []),
    );

    const composed = compose(matched);

    await composed(context, async () => {
      const { hooks } = this;
      await hooks?.beforeInit?.(context);
      context.init();
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
