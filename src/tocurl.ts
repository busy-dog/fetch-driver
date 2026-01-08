import { compact, isBlob, isFormData } from "./shared";
import { isNullish, isObjectType, isString } from "remeda";

import type { FetchMethod } from "./types";
import { methods } from "./types";

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

    const arrs = Array.from(current);

    return (arrs as [string, string][])
      .reduce<string[]>((acc, cur) => [...acc, format(...cur)], [])
      .join(" ");
  },
  body: async ({ body }: RequestInit = {}): Promise<string | void> => {
    function toBase64(body: Blob): Promise<string> {
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onerror = reject;
        reader.readAsDataURL(body);
        reader.onload = () => {
          const { result } = reader;
          if (isString(result)) resolve(result);
          reject(new Error("Failed to convert Blob to base64"));
        };
      });
    }

    if (isFormData(body)) {
      const arrs = Array.from(body) as [string, FormDataEntryValue][];
      return (
        await Promise.all(
          arrs.map(async ([key, value]) => {
            if (isBlob(value)) {
              return `-F "${key}=${await toBase64(value)}"`;
            }
            return `-F "${key}=${value}"`;
          }),
        )
      ).join(" ");
    }
    async function escape(body?: BodyInit): Promise<string | void> {
      if (isString(body)) return body.replace(/'/g, "'\\''");
      if (isBlob(body)) {
        const base64 = await toBase64(body);
        const [, data] = base64.split(",");
        if (isString(data)) return data;
      }
      if (isObjectType(body)) return escape(JSON.stringify(body));
      // if (isArrayBuffer(body)) {
      //   // TODO
      // }
    }
    const data = await escape(body ?? undefined);
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
export const toCurl = async (uri: string | URL, init?: RequestInit) => {
  const url = isString(uri) ? uri : uri.toString();
  return compact([
    "curl",
    `"${url}"`,
    generate.method(init),
    generate.header(init),
    await generate.body(init),
    generate.compress(init),
  ])
    .join(" ")
    .trim();
};
