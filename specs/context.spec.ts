import { describe, expect, it } from "vitest";

import { DriveContext } from "../src/context";

describe("检查上下文", () => {
  it("应当能正确处理 URLSearchParams", () => {
    const api = "/api";
    const data = { param1: "value1", param2: "value2" };
    const context = new DriveContext(api, {
      id: crypto.randomUUID(),
      data: new URLSearchParams(data),
    });
    context.init();
    expect(context.api).toStrictEqual("/api?param1=value1&param2=value2");
  });

  it("应当能正确处理 body", () => {
    const data1 = { key: "value" };
    const context1 = new DriveContext("/api", {
      data: data1,
    });
    context1.init();
    expect(context1.req.body).toStrictEqual(JSON.stringify(data1));
    expect(context1.req.headers.get("Content-Type")).toStrictEqual(
      "application/json",
    );

    const data2 = new FormData();
    const context2 = new DriveContext("/api", {
      data: data2,
    });
    context2.init();
    expect(context2.req.body).toStrictEqual(data2);

    const data3 = new Uint16Array([12]);
    const context3 = new DriveContext("/api", {
      data: data3,
    });
    context3.init();
    expect(context3.req.body).toStrictEqual(data3);
  });

  it("应当能正确处理数组数据", () => {
    const data = [1, 2, 3];
    const context = new DriveContext("/api", { data });
    context.init();
    expect(context.req.method).toStrictEqual("POST");
    expect(context.req.body).toStrictEqual(JSON.stringify(data));
    expect(context.req.headers.get("Content-Type")).toStrictEqual(
      "application/json",
    );
  });

  it("应当能正确处理方法", () => {
    const context1 = new DriveContext("/api");
    context1.init();
    expect(context1.req.method).toStrictEqual("GET");

    const context2 = new DriveContext("/api", {
      data: {
        key: "value",
      },
    });
    context2.init();
    expect(context2.req.method).toStrictEqual("POST");

    const context3 = new DriveContext("/api", {
      data: {
        key: "value",
      },
      method: "PUT",
    });
    context3.init();
    expect(context3.req.method).toStrictEqual("PUT");
  });

  it("应当能正确处理 headers", () => {
    const context = new DriveContext("/api", {
      data: {},
      headers: {
        "Content-Type": "application/json",
      },
    });
    context.init();
    expect(context.req.headers.get("Content-Type")).toStrictEqual(
      "application/json",
    );
  });

  it("应当能正确处理中断", () => {
    const context = new DriveContext("/api", {});
    context.init();
    context.initAbort(1000);
    expect(context.req.signal).toBeInstanceOf(AbortSignal);
  });

  it("应当能正确处理响应头", () => {
    const context = new DriveContext("/api", {});
    context.init();
    context.decodeHeader(
      new Response(null, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    expect(context.res.type).toStrictEqual("json");
    expect(context.res.charset).toStrictEqual("utf-8");
  });
});
