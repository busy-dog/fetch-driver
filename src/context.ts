import {
  isFinite,
  isNonEmptyString,
  isNonRawBodyInit,
  isURLSearchParams,
  toSearchParams,
} from "./shared";
import mime from "mime";
import {
  isArray,
  isFunction,
  isNullish,
  isPlainObject,
  isString,
} from "remeda";

import type { DriveRequest } from "./types";

type InitParams = {
  stringify: typeof JSON.stringify;
};

export default class DriveContext<T = unknown> {
  public api: string;

  public req: DriveRequest;

  public data?: object;

  public res: {
    type?: string;
    charset?: string;
    raw?: Response;
    headers?: Headers;
    status?: number;
    body?: T;
  } = {};

  constructor(api: string, data?: object, params?: RequestInit) {
    const { headers, ...rest } = params ?? {};

    this.api = api;
    this.data = data;
    this.req = {
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
  };

  public initAbort = (timeout?: number) => {
    if (isFunction(AbortController) && isFinite(timeout)) {
      const controller = new AbortController();

      this.req.signal = controller.signal;
      setTimeout(() => controller.abort(), timeout);
    }
  };

  public decodeHeader = (response: Response) => {
    const { headers } = response;
    const type = headers.get("Content-Type");

    if (isNonEmptyString(type)) {
      const fields = type.split(";");

      for (const iterator of fields) {
        const { res } = this;
        const extension = mime.getExtension(iterator);
        if (isString(extension) && !isString(res?.type)) {
          this.res!.type = extension;
        }
      }

      const params = toSearchParams(fields);
      const charset = params?.get("charset");
      if (isString(charset)) this.res.charset = charset;
    }
  };
}

export type { DriveContext };
