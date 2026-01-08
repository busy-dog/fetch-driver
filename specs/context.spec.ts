import { describe, expect, it } from "vitest";

import DriveContext from "../src/context";

describe("DriveContext", () => {
  it("应该正确初始化 API", () => {
    const api = "/api";
    const data = { param1: "value1", param2: "value2" };
    const context = new DriveContext(api, new URLSearchParams(data));
    context.init();
    expect(context.api).toStrictEqual("/api?param1=value1&param2=value2");
  });

  it("应该正确初始化 body", () => {
    const data1 = { key: "value" };
    const context1 = new DriveContext("/api", data1);
    context1.init();
    expect(context1.req.body).toStrictEqual(JSON.stringify(data1));
    expect(context1.req.headers.get("Content-Type")).toStrictEqual(
      "application/json",
    );

    const data2 = new FormData();
    const context2 = new DriveContext("/api", data2);
    context2.init();
    expect(context2.req.body).toStrictEqual(data2);

    const data3 = new Uint16Array([12]);
    const context3 = new DriveContext("/api", data3);
    context3.init();
    expect(context3.req.body).toStrictEqual(data3);
  });

  it("应该正确字符串化数组数据", () => {
    const data = [1, 2, 3];
    const context = new DriveContext("/api", data);
    context.init();
    expect(context.req.method).toStrictEqual("POST");
    expect(context.req.body).toStrictEqual(JSON.stringify(data));
    expect(context.req.headers.get("Content-Type")).toStrictEqual(
      "application/json",
    );
  });

  it("应该正确初始化方法", () => {
    const context1 = new DriveContext("/api");
    context1.init();
    expect(context1.req.method).toStrictEqual("GET");

    const context2 = new DriveContext("/api", { key: "value" });
    context2.init();
    expect(context2.req.method).toStrictEqual("POST");
  });
});
