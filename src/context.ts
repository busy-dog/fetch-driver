import {
  isFinite,
  isNonEmptyString,
  isNonRawBodyInit,
  isURLSearchParams,
  toSearchParams,
} from "./shared";
import mime from "mime";
import { nanoid } from "nanoid";
import {
  clone,
  isArray,
  isFunction,
  isNullish,
  isPlainObject,
  isString,
} from "remeda";

import type { DataStringifyFunc, DriverRequest } from "./types";

type InitParams = {
  stringify: DataStringifyFunc;
};

export class DriveContext<T = unknown> {
  public api: string;

  public url: URL | null;

  public path: string;

  public req: DriverRequest;

  public data?: object;

  public res: {
    type?: string;
    charset?: string;
    raw?: Response;
    headers?: Headers;
    status?: number;
    body?: T;
  } = {};

  static toURL = (api: string) => {
    try {
      return URL.parse(api);
    } catch (_) {
      return null;
    }
  };

  static randomId = () => nanoid().replace(/-/g, "").slice(0, 8);

  constructor(
    api: string,
    params?: RequestInit & {
      id?: string;
      data?: object;
    },
  ) {
    const {
      id = DriveContext.randomId(),
      data,
      headers,
      ...rest
    } = params ?? {};

    this.api = api;
    this.data = data;
    this.url = DriveContext.toURL(api);
    this.path = this.url?.pathname ?? api;

    this.req = {
      id,
      ...rest,
      headers: new Headers(headers),
    };
  }

  private initApi = (_: InitParams) => {
    const { api, data } = this;
    // TODO api 为 null报错
    if (isURLSearchParams(data)) {
      const arr = api.split("?");
      const [path, ...searchs] = arr;
      const search = searchs.join("?");
      const queries = `${data.toString()}&${search}`;
      this.api = `${path}?${new URLSearchParams(queries).toString()}`;
    }
  };

  private initBody = ({ stringify }: InitParams) => {
    const { body, headers } = this.req;

    if (isNullish(body)) {
      const { data } = this;
      if (isNonRawBodyInit(data)) {
        this.req.body = data;
      }
      if (isArray(data) || isPlainObject(data)) {
        const key = "Content-Type";
        const value = "application/json";

        this.req.body = stringify(data);
        if (!headers.has(key)) headers.set(key, value);
      }
    }
  };

  private initMethod = (_: InitParams) => {
    if (!this.req.method) {
      const { body } = this.req;
      this.req.method = isNullish(body) ? "GET" : "POST";
    }
  };

  public init = ({ stringify = JSON.stringify }: Partial<InitParams> = {}) => {
    this.initApi({ stringify });
    this.initBody({ stringify });
    this.initMethod({ stringify });
    return this;
  };

  public initAbort = (timeout?: number) => {
    if (isFunction(AbortController) && isFinite(timeout)) {
      const controller = new AbortController();

      this.req.signal = controller.signal;
      setTimeout(() => controller.abort(), timeout);
    }
  };

  public decodeHeader = (response: Response) => {
    const { res } = this;
    const { headers } = response;
    const type = headers.get("Content-Type");
    if (res) {
      if (isNonEmptyString(type)) {
        const fields = type.split(";");
        const params = toSearchParams(fields);
        const charset = params?.get("charset");
        if (isString(charset)) {
          res.charset = charset;
        }
        for (const iterator of fields) {
          const extension = mime.getExtension(iterator);
          if (isString(extension) && !isString(res.type)) {
            res.type = extension;
          }
        }
      } else {
        if (!isString(res.type)) {
          res.type = "txt";
        }
      }
    }
  };

  public clone = () => {
    const { api, url, path, req, data, res } = this;
    const { headers, ...rest } = req;
    return {
      api,
      url,
      path,
      req: {
        headers: new Headers(headers),
        ...clone(rest),
      },
      res: clone(res),
      data: clone(data),
    };
  };
}
