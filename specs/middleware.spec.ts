/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import { generate } from "../src/tocurl";
import { Driver } from "../src/core";

describe("中间件", () => {
  it("基础用法", async () => {
    const params = new URLSearchParams({
      q1: "v1",
      q2: "v2",
    });

    const { drive } = new Driver().use("*", async (_, next) => {
      await next();
    });

    const res = await drive.get("https://echo.apifox.com/get", params);

    console.log(res);
  });
});
