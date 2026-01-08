import { toSearchParams } from "../src/shared";
import { isError } from "remeda";
import { describe, expect, it } from "vitest";

import type { DriveContext } from "../src/context";
import { Driver } from "../src/core";
import { toCurl } from "../src/tocurl";
import type { DriverHooks } from "../src/types";

// TODO 检查选项
const driver = new Driver({
  use: [],
  hooks: {
    beforeInit: async (_) => {},
    afterInit: async (_) => {},
    beforeParse: async (_) => {},
  },
});

const { drive, request } = driver;

const host = "https://echo.apifox.com";

const iSrc = (api: string) => `${host}${api}`;

describe("HTTP 方法", () => {
  const headers = new Headers();

  headers.append("Accept", "*/*");
  headers.append("Host", "echo.apifox.com");
  headers.append("Connection", "keep-alive");

  it("使用Query参数", async () => {
    expect(
      await drive({
        headers,
        api: iSrc("/get"),
        redirect: "follow",
        data: toSearchParams({ q1: "v1", q2: "v2" }),
      }),
    ).toMatchObject({
      args: { q1: "v1", q2: "v2" },
      url: "http://echo.apifox.com/get?q1=v1&q2=v2",
      headers: {
        Accept: "*/*",
        Connection: "close",
        Host: "echo.apifox.com",
        "Sec-Fetch-Mode": "cors",
      },
    });
  });

  describe("在 fetch 执行前输出 curl 命令", () => {
    it("should echo curl string before fetch", async () => {
      const terminal = {
        rows: [] as string[],
        echo: (str: string) => {
          terminal.rows.push(str);
        },
      };

      class Hooks implements DriverHooks {
        async beforeFetch(context: DriveContext) {
          const { api, req } = context;
          terminal.echo(await toCurl(api, req));
        }

        async afterFetch(context: DriveContext) {
          const { res } = context;
          terminal.echo(res?.headers?.toString() ?? "");
        }

        async afterParse(context: DriveContext) {
          const { res } = context;
          terminal.echo(JSON.stringify(res.body));
        }
      }

      const { drive } = new Driver({ hooks: new Hooks() });

      await drive.get(iSrc("/get"));

      const curl = `curl "${iSrc("/get")}" -X GET`;
      expect(terminal.rows[0]).toStrictEqual(curl);
      expect(terminal.rows[1]).toStrictEqual("");
      expect(JSON.parse(terminal.rows[2])).toMatchObject({
        url: "http://echo.apifox.com/get",
        headers: {
          Accept: "*/*",
          Connection: "close",
          Host: "echo.apifox.com",
          "Sec-Fetch-Mode": "cors",
        },
      });
    });
  });

  it("使用POST参数", async () => {
    const data = {
      d: "deserunt",
      dd: "adipisicing enim deserunt Duis",
    };
    expect(
      await drive.post(iSrc("/post"), data, {
        headers,
        redirect: "follow",
      }),
    ).toMatchObject({
      args: {},
      form: {},
      files: {},
      json: data,
      data: JSON.stringify(data),
      url: "http://echo.apifox.com/post",
      headers: {
        Accept: "*/*",
        Connection: "close",
        Host: "echo.apifox.com",
        "Sec-Fetch-Mode": "cors",
        "Content-Length": "54",
        "Content-Type": "application/json",
      },
    });
  });

  it("应当能正确处理 FormData", async () => {
    const data = new FormData();
    data.append("d", "deserunt");
    data.append("dd", "adipisicing enim deserunt Duis");
    expect(
      await drive.post(iSrc("/post"), data, {
        headers,
        redirect: "follow",
      }),
    ).toMatchObject({
      args: {},
      form: {},
      files: {},
    });
  });
});

describe("动态内容", () => {
  it("GET 延迟返回", async () => {
    expect(
      await drive({
        api: iSrc("/delay/5"),
      }),
    ).toMatchObject({
      args: {},
      data: "",
      files: {},
      form: {},
      headers: {
        Accept: "*/*",
        Connection: "close",
        Host: "echo.apifox.com",
        "Sec-Fetch-Mode": "cors",
      },
      url: "http://echo.apifox.com/delay/5",
    });
  });
  it("GET 中断超时的延迟返回", async () => {
    try {
      await drive({
        timeout: 1000,
        api: iSrc("/delay/5"),
      });
    } catch (error) {
      if (isError(error)) {
        expect(error.name).toBe("AbortError");
      }
    }
  });
});

describe("接收器应当在请求过程中被调用", () => {
  it("应该在请求过程中被调用并给出进度", async () => {
    const current = { percentage: 0 };
    await request({
      mode: "cors",
      api: iSrc("/image/jpeg"),
      receiver: ({ percentage: cur }) => {
        const { percentage: pre } = current;
        current.percentage = Number(cur.toFixed(2));
        expect(cur >= pre && cur <= 100).toBeTruthy();
      },
    });
  });
});

describe("应当能在构建后添加中间件", () => {
  it("中间件应当可以无视请求失败", async () => {
    const driver = new Driver([]);

    driver.use("/get", async (ctx, next) => {
      try {
        await next();
      } catch (_) {}
      ctx.res.body = "Hello, world!";
    });

    const { drive } = driver;
    expect(await drive.get("/get")).toBe("Hello, world!");
  });
});
