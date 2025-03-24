/**
 * @author mango
 * @description fetch context
 */
import mime from "mime";

import {
  isArray,
  isNullish,
  isFunction,
  isPlainObject,
  isString,
  
} from "remeda";

import type { DriveContextOptions } from "./model";
import { isFinite, iSearchParams, isURLSearchParams, isNonRawBodyInit, isNonEmptyString } from "./utils";

export default class DriveContext<T = unknown> {
  /** the fetch src */
  public api: string;

  /** the fetch init options */
  public options: DriveContextOptions;

  /** the fetch response body (parse val) */
  public body?: T;

  /** the fetch request body */
  public data?: object;

  /** the fetch response */
  public response?: Response;

  /** the response type */
  public responseType?: string;

  /** the response charset */
  public responseCharset?: string;

  constructor(api: string, data?: object, params?: RequestInit) {
    const { headers, ...options } = params ?? {};

    this.api = api;
    this.data = data;
    this.options = {
      ...options,
      headers: new Headers(headers),
    };
  }

  /** init request src */
  private initApi = () => {
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

  /** init request body */
  private initBody = () => {
    const { body, headers } = this.options;

    if (isNullish(body)) {
      const { data } = this;
      if (isNonRawBodyInit(data)) {
        this.options.body = data;
      }
      if (isArray(data) || isPlainObject(data)) {
        const key = "Content-Type";
        const value = "application/json";

        this.options.body = JSON.stringify(data);
        !headers.has(key) && headers.set(key, value);
      }
    }
  };

  /** init method */
  private initMethod = () => {
    if (!this.options.method) {
      const { body } = this.options;
      this.options.method = isNullish(body) ? "GET" : "POST";
    }
  };

  /** init context */
  public init = () => {
    this.initApi();
    this.initBody();
    this.initMethod();
  };

  /** use `AbortController` abort cur fetch when timeout */
  public initAbort = (timeout?: number) => {
    if (isFunction(AbortController) && isFinite(timeout)) {
      const controller = new AbortController();

      this.options.signal = controller.signal;
      setTimeout(() => controller.abort(), timeout);
    }
  };

  /** get Content-Type & charset by response header before response */
  public decodeHeader = (response: Response) => {
    const { headers } = response;
    const type = headers.get("Content-Type");

    if (isNonEmptyString(type)) {
      const fields = type.split(";");

      // get response content type
      for (const iterator of fields) {
        const { responseType } = this;
        const extension = mime.getExtension(iterator);
        if (isString(extension) && !isString(responseType)) {
          this.responseType = extension;
        }
      }

      // get response charset
      const params = iSearchParams(fields);
      const charset = params?.get("charset");
      if (isString(charset)) this.responseCharset = charset;
    }
  };
}
