import { describe, expect, it } from "vitest";

import { compose } from "../src/compose";

describe("compose", () => {
  it("应该正确处理请求", async () => {
    type Context = { body: string };

    const ref: Context = { body: "" };

    const composed = compose<Context>([
      async (ctx, next) => {
        ctx.body = "Hello, ";
        await next();
      },
      async (ctx, next) => {
        ctx.body += "world!";
        await next();
      },
    ]);

    await composed(ref, async () => {});

    expect(ref.body).toBe("Hello, world!");
  });
});
