import { isFinite } from "./shared";
import { isFunction } from "remeda";

import type { DriveContext } from "./context";
import type { ReadableValue, ReceiverFunc } from "./types";

/**
 * 用于读取流数据，并将其传递给控制器
 * @param reader 读取器
 * @param controller 控制器
 * @param percentage 百分比回调
 */
async function pump(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  controller: ReadableStreamDefaultController,
  percentage?: (current: ReadableValue) => void,
): Promise<void> {
  const res = await reader.read();
  if (res.done) {
    controller.close();
  } else {
    percentage?.(res);
    controller.enqueue(res.value);
    await pump(reader, controller, percentage);
  }
}

export type RawTextBodyType =
  | "txt"
  | "css"
  | "xml"
  | "html"
  | "plain"
  | "richtext"
  | "javascript";

// #region rawtext
/**
 * 断言目标值是否为原始文本类型
 */
export function isRawTextBody(type?: string): type is RawTextBodyType {
  switch (type) {
    case "txt":
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
// #endregion rawtext

export const parser =
  () =>
  async <T>(
    response: Response,
    context: DriveContext<T>,
    params: {
      receiver?: ReceiverFunc<T>;
    } = {},
  ) => {
    const { res } = context;
    const { body, ok, headers, status } = response;

    context.res.status = status;
    context.res.headers = headers;
    const disposition = headers.get("Content-Disposition");
    const isAttchment = disposition?.includes("attachment");

    if (ok) {
      const { receiver } = params;
      const size = Number(headers.get("Content-Length"));
      const isShard = isFinite(size) && isFunction(receiver);

      if (body && isShard && size > 0) {
        const received = { bytes: 0 };
        const reader = body.getReader();
        const stream = new ReadableStream({
          async start(controller) {
            await pump(reader, controller, ({ value, done }) => {
              received.bytes += value.length;
              const percentage = (100 * received.bytes) / size;
              receiver({
                size,
                value,
                reader,
                context,
                percentage,
                done: percentage === 100 || done,
              });
            });
          },
        });

        context.res.raw = new Response(stream);
        return;
      }
    }

    if (isAttchment) {
      context.res.body = (await response.blob()) as T;
      return;
    }

    if (res.type === "json") {
      context.res.body = (await response.json()) as T;
      return;
    }

    if (!res.type || isRawTextBody(res.type)) {
      context.res.body = (await response.text()) as T;
      return;
    }
  };
