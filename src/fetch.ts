/**
 * @author mango
 * @description fetch core
 */

import { isArray, isObjectType } from "remeda";

import { compose } from "./compose";
import DriveContext from "./context";
import type {
  DriveFunc,
  DriveMiddleware,
  DriveOptions,
  DriveReport,
  ExtraOptions,
  FetchContext,
  FirstParam,
  Middleware,
} from "./model";
import { methods } from "./model";
import { parser } from "./parser";

function over<T>(
  first: FirstParam<T>,
  data?: object,
  init?: RequestInit & ExtraOptions<T>,
): DriveOptions<T> {
  if (isObjectType(first)) return first;
  return { api: first, data, ...init };
}

type DriveParams<T> = Parameters<typeof over<T>>;

type FetchDriverParams =
  | DriveMiddleware[]
  | { use?: DriveMiddleware[]; report?: DriveReport };

export default class FetchDriver {
  private report?: DriveReport;

  private middleware: DriveMiddleware[];

  constructor(opts: FetchDriverParams = {}) {
    const params = (() => (isArray(opts) ? { use: opts } : opts))();

    this.report = params.report;
    this.middleware = params.use ?? [];

    methods.forEach((method) => {
      const name = method.toLowerCase() as Lowercase<typeof method>;
      this.drive[name] = async <T>(...args: DriveParams<T>) =>
        (await this.request({ ...over(...args), method })).body;
    });
  }

  public request = async <T>({
    api,
    use,
    data,
    timeout,
    receiver,
    parse = parser(),
    ...init
  }: DriveOptions<T>) => {
    const context = new DriveContext<T>(api, data, init);

    const composed = compose<DriveContext>(
      (use as Middleware<DriveContext>[]) ?? this.middleware,
    );

    await composed(context, async () => {
      this.report?.beforeInit?.(context);
      context.init();
      this.report?.afterInit?.(context);

      context.initAbort(timeout);

      const { api, options } = context;

      this.report?.beforeFetch?.(context);
      const res = await fetch(api, options);
      this.report?.affterFetch?.(context);

      context.response = res;
      context.decodeHeader(res);

      this.report?.beforeParse?.(context);
      await parse(res, context, { receiver });
      this.report?.afterParse?.(context);
    });

    return context as FetchContext<T>;
  };

  public drive = (async <T>(...args: DriveParams<T>) => {
    return (await this.request(over(...args))).body;
  }) as DriveFunc;
}
