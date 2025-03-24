import { isNullish, isObjectType, isString } from "remeda";
import { compact, isFormData } from "./utils";

import type { FetchMethod } from "./model";
import { methods } from "./model";

export const generate = {
  /**
   * see https://fetch.spec.whatwg.org/#methods
   *
   * @param {any} RequestInit
   */
  method: ({ method = "" }: RequestInit = {}): string | void => {
    const current = method.toUpperCase() as FetchMethod;
    if (methods.includes(current)) return `-X ${current}`;
    return "-X GET";
  },
  /**
   * @param {object={}} options
   * @param {object|Headers} options.headers
   * @returns {HeaderParams} An Object with the header info
   */
  header: ({ headers }: RequestInit = {}): string | void => {
    if (isNullish(headers)) return;
    const current = new Headers(headers);
    current.delete("content-length");
    const format = (name: string, val: string) =>
      `-H "${name}: ${val.replace(/(\\|")/g, "\\$1")}"`;

    // @ts-ignore
    const arrs = Array.from(current);

    return (arrs as [string, string][])
      .reduce<string[]>((acc, cur) => [...acc, format(...cur)], [])
      .join(" ");
  },
  body: ({ body }: RequestInit = {}): string | void => {
    if (isFormData(body)) {
      // @ts-ignore
      const arrs = Array.from(body);
      return (arrs as [string, string][])
        .map(([key, value]) => `-F "${key}=${value}"`)
        .join(" ");
    }
    // if (isBlob(body) || isArrayBuffer(body)) {
    //   // TODO
    // }
    function escape(body?: BodyInit): string | void {
      if (isString(body)) return body.replace(/'/g, `'\\''`);
      if (isObjectType(body)) return escape(JSON.stringify(body));
    }
    const data = escape(body ?? undefined);
    if (isString(data)) return `--data-binary '${data}'`;
  },
  compress: ({ headers }: RequestInit = {}): string => {
    return new Headers(headers)?.has("accept-encoding") ? " --compressed" : "";
  },
};

/**
 * @param {string|URL} uri
 * @param {RequestInit} init
 */
export const fetch2curl = (uri: string | URL, init?: RequestInit) => {
  const url = isString(uri) ? uri : uri.toString();
  return compact([
    "curl",
    `"${url}"`,
    generate.method(init),
    generate.header(init),
    generate.body(init),
    generate.compress(init),
  ])
    .join(" ")
    .trim();
};
