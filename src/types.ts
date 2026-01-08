import type DriveContext from "./context";

export type Next = () => Promise<void>;

export type ReadableValue = ReadableStreamReadValueResult<
  Uint8Array<ArrayBufferLike>
>;

export abstract class DriveHooks {
  abstract beforeInit?(ctx: DriveContext): Promise<void>;

  abstract afterInit?(ctx: DriveContext): Promise<void>;

  abstract beforeFetch?(ctx: DriveContext): Promise<void>;

  abstract afterFetch?(ctx: DriveContext): Promise<void>;

  abstract beforeParse?(ctx: DriveContext): Promise<void>;

  abstract afterParse?(ctx: DriveContext): Promise<void>;
}

export type Middleware<T> = (context: T, next: Next) => Promise<void>;

export type DriveMiddleware<T = unknown> = Middleware<DriveContext<T>>;

export type UseDriveMiddleware<T = unknown> = [string, DriveMiddleware<T>];

export type DriveRequest = {
  headers: Headers;
} & Omit<RequestInit, "headers">;

export interface ReceiverFunc<T> {
  (params: {
    size: number;
    done: boolean;
    percentage: number;
    context: DriveContext<T>;
    reader: ReadableStreamDefaultReader<Uint8Array>;
    value?: Uint8Array;
  }): void;
}

export interface BodyParseFunc<T> {
  (
    response: Response,
    context: DriveContext<T>,
    extra?: {
      receiver?: ReceiverFunc<T>;
    },
  ): Promise<void>;
}

export type ExtraOptions<T> = {
  /** abort fetch before timeout */
  timeout?: number;
  /** use extra middleware in current fetch */
  use?: UseDriveMiddleware[];
  /** progress callback */
  receiver?: ReceiverFunc<T>;
  /** body parse */
  parse?: BodyParseFunc<T>;
  /** json stringify */
  stringify?: typeof JSON.stringify;
};

// call the drive by DriveOptions
export type DriveOptions<T> = RequestInit &
  ExtraOptions<T> & {
    api: string;
    data?: object;
  };

export interface DriveMethodFunc {
  <T>(
    api: string,
    data?: object,
    init?: Omit<RequestInit, "method"> & ExtraOptions<T>,
  ): Promise<T>;
}

export type DriveFuncAttrs = Record<Lowercase<FetchMethod>, DriveMethodFunc>;

// drive func overloading
export interface DriveFunc extends DriveFuncAttrs {
  <T>(opts: DriveOptions<T>): Promise<T>;
  <T>(
    /** the fetch USVString */
    api: string,
    /** the fetch body */
    data?: object,
    /** the fetch request init */
    init?: RequestInit & ExtraOptions<T>,
  ): Promise<T>;
}

// drive func first param
export type FirstParam<T> = string | DriveOptions<T>;

// drive context after fetch over
export type FetchContext<T> = Required<DriveContext<T>>;

export type FetchMethod =
  | "GET"
  | "PUT"
  | "POST"
  | "HEAD"
  | "TRACE"
  | "PATCH"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS";

export const methods: readonly FetchMethod[] = [
  "GET",
  "PUT",
  "POST",
  "HEAD",
  "TRACE",
  "PATCH",
  "DELETE",
  "CONNECT",
  "OPTIONS",
];
