/**
 * @author mango
 * @description fetch type define
 */

import { isFunction } from "remeda";

import type DriveContext from "./context";
import type { ReceiverFunc } from "./model";
import { isFinite, isRawTextBody } from "./utils";

type ReadableValue = ReadableStreamReadValueResult<Uint8Array<ArrayBufferLike>>;

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
    const { body, ok, headers } = response;
    const { responseType } = context;

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

        context.response = new Response(stream);
        return;
      }
    }

    // TODO: test
    if (isAttchment) {
      context.body = (await response.blob()) as T;
      return;
    }

    if (responseType === "txt") {
      context.body = (await response.text()) as T;
      return;
    }

    if (responseType === "json") {
      context.body = (await response.json()) as T;
      return;
    }

    // TODO: test
    if (isRawTextBody(responseType ?? undefined)) {
      context.body = (await response.text()) as T;
      return;
    }
  };
