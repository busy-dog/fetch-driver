import {
  filter,
  hasAtLeast,
  isArray,
  isNullish,
  isObjectType,
  isPlainObject,
  isString,
  join,
  map,
  mapValues,
  omitBy,
  pipe,
} from "remeda";

import { z } from "zod";

/**
 * 断言目标值是否为有限数
 */
export function isFinite(data: unknown): data is number {
  return Number.isFinite(data);
}

/**
 * 断言目标值是否为非空字符串
 */
export function isNonEmptyString(data: unknown): data is Exclude<string, ""> {
  return isString(data) && data.trim() !== "";
}

/**
 * 断言目标值是否为Blob对象
 */
export function isBlob(data: unknown): data is Blob {
  return data instanceof Blob;
}

/**
 * 断言目标值是否为FormData对象
 */
export function isFormData(data: unknown): data is FormData {
  return data instanceof FormData;
}

/**
 * 断言目标值是否为Uint8Array对象
 */
export function isUint8Array(data: unknown): data is Uint8Array {
  return data instanceof Uint8Array;
}

/**
 * 断言目标值是否为ArrayBufferLike对象
 */
export function isArrayBufferLike(data: unknown): data is ArrayBufferLike {
  return (
    isArrayBuffer(data) ||
    isUint8Array(data) ||
    (isObjectType(data) &&
      "ArrayBuffer" in data &&
      isArrayBuffer(data.ArrayBuffer))
  );
}

/**
 * 断言目标值是否为ArrayBufferView对象
 */
export function isArrayBufferView(data: unknown): data is ArrayBufferView {
  const schema = z.object({
    byteLength: z.number(),
    byteOffset: z.number(),
    buffer: z.instanceof(ArrayBuffer),
  });
  return z.safeParse(schema, data).success;
}

/**
 * 断言目标值是否为ArrayBuffer对象
 */
export function isArrayBuffer(data: unknown): data is ArrayBuffer {
  return data instanceof ArrayBuffer;
}

/**
 * 断言目标值是否为BufferSource对象
 */
export function isBufferSource(data: unknown): data is BufferSource {
  return (
    ArrayBuffer.isView(data) ||
    isArrayBufferLike(data) ||
    isArrayBufferView(data) ||
    isArrayBuffer(data)
  );
}

/**
 * 断言目标值是否为ReadableStream对象
 */
export function isReadableStream(data: unknown): data is ReadableStream {
  return data instanceof ReadableStream;
}

/**
 * 断言目标值是否为非原始的BodyInit对象
 */
export function isNonRawBodyInit(
  data: unknown,
): data is Exclude<BodyInit, string | URLSearchParams> {
  return (
    isBlob(data) ||
    isFormData(data) ||
    isBufferSource(data) ||
    isReadableStream(data)
  );
}

/**
 * 断言目标值是否为URLSearchParams对象
 */
export function isURLSearchParams(data: unknown): data is URLSearchParams {
  return data instanceof URLSearchParams;
}

/**
 * 断言目标值是否为非空数组
 */
export const isNonEmptyArray = (data: unknown): data is unknown[] => {
  return isArray(data) && hasAtLeast(data, 1);
};

/**
 * 断言目标值是否为非空字符串数组
 */
export function isStringArray(data: unknown): data is string[] {
  return isNonEmptyArray(data) && data.every(isString);
}

/**
 * 断言目标值是否为原始文本类型
 */
export function isRawTextBody(type?: string) {
  switch (type) {
    case "css":
    case "xml":
    case "html":
    case "plain":
    case "richtext":
    case "javascript":
      return true;
  }
  return false;
}

/**
 * 根据初始化数据构造并返回一个 URLSearchParams 对象。
 * 支持初始化数据类型：URLSearchParams、字符串、字符串数组和普通对象。
 * 如果初始化数据不匹配任何支持的类型，则返回 undefined。
 *
 * @param init 初始化数据。
 * @returns 一个 URLSearchParams 对象，或者 undefined（如果初始化数据不匹配任何支持的类型）。
 */
export function toSearchParams(init: unknown) {
  if (isURLSearchParams(init)) return init;
  if (isString(init)) return new URLSearchParams(init);
  if (isStringArray(init)) {
    return new URLSearchParams(
      pipe(
        init,
        filter((e) => e.includes("=")),
        map((e) => e.trim()),
        join("&"),
      ),
    );
  }
  if (isPlainObject(init)) {
    return new URLSearchParams(
      pipe(
        init,
        mapValues((val) => val?.toString() as string),
        omitBy(isNullish),
      ),
    );
  }
  return;
}

export type Nil = undefined | null;

export type Falsy = false | 0 | "" | Nil;

/**
 * 从数组中移除所有假值（false、null、0、""、undefined 和 NaN）。
 *
 * @param source 要压缩的输入数组。
 * @returns 一个移除了所有假值的数组。
 */
export function compact<T = unknown>(
  source: Array<T | Falsy> | ReadonlyArray<T | Falsy>,
): T[] {
  return source.filter(Boolean) as T[];
}
