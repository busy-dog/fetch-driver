/**
 * @author mango
 * @description fetch type define
 */

import { filter, hasAtLeast, isArray, isEmpty, isNullish, isNumber, isObjectType, isPlainObject, isString, join, map, mapValues, omitBy, pipe } from "remeda";

import type { DriveMiddleware } from "./model";

/** Type narrow func define */
export interface NarrowFunc<T> {
  (source: unknown): boolean;
  (source: unknown): source is T;
}

/**
 * Removes falsy values (false, null, 0, "", undefined, and NaN) from an array.
 * @param source - The input array to compact.
 * @returns An array with falsy values removed.
 */
export function compact<T = unknown>(
  source: (T | undefined | null | false | '' | 0)[],
): T[] {
  return source.filter(Boolean) as T[];
}


/**
 * Narrow source type to `String` && Check is not empty string.
 */
export function isNonEmptyString(
  source: unknown,
): source is Exclude<string, ""> {
  return isString(source) && source.trim() !== "";
}

export const isEmptyValue = (
  data: unknown,
): data is '' | undefined | null | [] | Record<string, never> => {
  if (isNumber(data)) return Number.isNaN(data);
  if (isString(data)) return data.length === 0;
  if (isArray(data)) return !hasAtLeast(data, 1);
  if (isObjectType(data) && isEmpty(data)) return true;
  return false;
};

export const isNonEmptyArray = (source: unknown): source is unknown[] => {
  return isArray(source) && hasAtLeast(source, 1);
};

/**
 * Narrow source type to `Array` && Check is not empty.
 */
export function isStringArray(source: unknown): source is string[] {
  return isNonEmptyArray(source) && source.every(isString);
}


/**
 * Narrow source type to `Number` &amp;&amp; Check is not `Infinity`, `-Infinity`, `NaN`.
 */
export function isFinite(source: unknown): source is number {
  return Number.isFinite(source);
}

/**
 * Narrow source key type.
 * @example ```typescript
 * const obj: unknown;
 * isValidKey('key', obj, isString);
 * // obj is Recrode<'key', string>;
 * ```
 */
export function isValidKey<K extends string, T>(
  key: K,
  source: object,
  is: NarrowFunc<T>,
): source is Record<K, T> {
  return key in source && is((source as Record<K, T>)[key]);
}

/**
 * Checks if the provided source is an instance of FormData.
 *
 * @param source The value to check.
 * @returns Returns true if source is an instance of FormData, false otherwise.
 */
export function isFormData(source: unknown): source is FormData {
  return source instanceof FormData;
}

/**
 * Checks if the provided source is an instance of ReadableStream.
 *
 * @param source The value to check.
 * @returns Returns true if source is an instance of ReadableStream, false otherwise.
 */
export function isReadableStream(source: unknown): source is ReadableStream {
  return source instanceof ReadableStream;
}

/**
 * Checks if the given source is an instance of ArrayBuffer.
 * If is ArrayBuffer, narrow to type ArrayBuffer.
 * @param {unknown} source - The value to be checked.
 * @returns {boolean} Returns true if the source is an instance of ArrayBuffer, false otherwise.
 */
export function isArrayBuffer(source: unknown): source is ArrayBuffer {
  return source instanceof ArrayBuffer;
}

/**
 * Checks if the given source is an instance of Uint8Array.
 * If is Uint8Array, narrow to type Uint8Array.
 * @param {unknown} source - The value to be checked.
 * @returns {boolean} Returns true if the source is an instance of Uint8Array, false otherwise.
 */
export function isUint8Array(source: unknown): source is Uint8Array {
  return source instanceof Uint8Array;
}

/**
 * Narrow source type to `isArrayBufferLike`.
 */
export function isArrayBufferLike(source: unknown): source is ArrayBufferLike {
  return (
    isArrayBuffer(source) ||
    isUint8Array(source) ||
    (isObjectType(source) && isValidKey("ArrayBuffer", source, isArrayBuffer))
  );
}

/**
 * Narrow source type to `ArrayBufferView`.
 */
export function isArrayBufferView(source: unknown): source is ArrayBufferView {
  return (
    isObjectType(source) &&
    isValidKey("byteLength", source, isFinite) &&
    isValidKey("byteOffset", source, isFinite) &&
    isValidKey("buffer", source, isArrayBufferLike)
  );
}

/**
 * Narrow source type to `BufferSource`.
 */
export function isBufferSource(source: unknown): source is BufferSource {
  return (
    ArrayBuffer.isView(source) ||
    isArrayBufferLike(source) ||
    isArrayBufferView(source) ||
    isArrayBuffer(source)
  );
}

/**
 * Checks if the given source is an instance of URLSearchParams.
 * If is URLSearchParams, narrow to type URLSearchParams.
 * @param {unknown} source - The value to be checked.
 * @returns {boolean} Returns true if the source is an instance of URLSearchParams, false otherwise.
 */
export function isURLSearchParams(source: unknown): source is URLSearchParams {
  return source instanceof URLSearchParams;
}

/**
 * Checks if the given source is an instance of Blob.
 * If is Promise, narrow to type Promise.
 * @param {unknown} source - The value to be checked.
 * @returns {boolean} Returns true if the source is an instance of Blob, false otherwise.
 */
export function isBlob(source: unknown): source is Blob {
  return source instanceof Blob;
}


export function isNonRawBodyInit(
  source: unknown,
): source is Exclude<BodyInit, string | URLSearchParams> {
  return (
    isBlob(source) ||
    isFormData(source) ||
    isBufferSource(source) ||
    isReadableStream(source)
  );
}

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

export function downloader(href: string, download: string) {
  const element = document.createElement("a");
  document.body.appendChild(element);
  element.style.display = "none";
  element.download = download;
  element.href = href;
  element.click();
  document.body.removeChild(element);
}

export function src2name(src: string): string {
  const [path] = src.split("?");
  return path.split("/").reverse()?.[0];
}

export function createMiddleware<T = unknown>(middleware: DriveMiddleware<T>) {
  return middleware;
}


/**
 * Constructs and returns a URLSearchParams object based on the provided initialization data.
 * Supports initializing with various types: URLSearchParams, string, string arrays, and plain objects.
 * Returns undefined if the initialization data does not match any supported type.
 *
 * @param init The initialization data for URLSearchParams.
 * @returns A URLSearchParams object constructed from the provided data, or undefined if invalid.
 */
export function iSearchParams(init: unknown) {
  if (isEmptyValue(init)) return;
  if (isString(init) || isURLSearchParams(init)) {
    return new URLSearchParams(init);
  }
  if (isStringArray(init)) {
    return new URLSearchParams(
      pipe(
        init,
        filter((e) => e.includes('=')),
        map((e) => e.trim()),
        join('&'),
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