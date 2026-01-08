import { isFinite, isRawTextBody } from "./shared";
import { isFunction } from "remeda";

import type DriveContext from "./context";
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
    controller.close(); // TODO: test
  } else {
    percentage?.(res);
    controller.enqueue(res.value);
    await pump(reader, controller, percentage);
  } // TODO: test
}

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
          start(controller) {
            pump(reader, controller, ({ value, done }) => {
              received.bytes += value.length;
              receiver({
                done,
                size,
                value,
                reader,
                context,
                percentage: (100 * received.bytes) / size,
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

    if (res.type === "txt") {
      context.res.body = (await response.text()) as T;
      return;
    }

    if (res.type === "json") {
      context.res.body = (await response.json()) as T;
      return;
    }

    if (isRawTextBody(res.type ?? undefined)) {
      context.res.body = (await response.text()) as T;
      return;
    }
  };
