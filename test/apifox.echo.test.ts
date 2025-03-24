import { describe, expect, it } from "vitest";

import { isError } from "remeda";

import type DriveContext from "../src/context";
import FetchDriver from "../src/fetch";
import { fetch2curl } from "../src/fetch2curl";
import type { DriveReport } from "../src/model";
import { iSearchParams } from "../src/utils";
const { drive } = new FetchDriver();

const host = "https://echo.apifox.com";

const iSrc = (api: string) => `${host}${api}`;

describe("HTTP 方法", () => {
  const headers = new Headers();
  headers.append("User-Agent", "Apifox/1.0.0 (https://apifox.com)");
  headers.append("Accept", "*/*");
  headers.append("Host", "echo.apifox.com");
  headers.append("Connection", "keep-alive");

  it("使用Query参数", async () => {
    expect(
      await drive({
        headers,
        api: iSrc("/get"),
        redirect: "follow",
        data: iSearchParams({ q1: "v1", q2: "v2" }),
      }),
    ).toMatchObject({
      args: { q1: "v1", q2: "v2" },
      url: "http://echo.apifox.com/get?q1=v1&q2=v2",
      headers: {
        Accept: "*/*",
        "Accept-Encoding": "br, gzip, deflate",
        "Accept-Language": "*",
        Connection: "close",
        Host: "echo.apifox.com",
        "Sec-Fetch-Mode": "cors",
        "User-Agent": "Apifox/1.0.0 (https://apifox.com)",
        "X-From-Alb": "true",
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

      class Report implements DriveReport {
        beforeFetch(context: DriveContext): void {
          const { api, options } = context;
          terminal.echo(fetch2curl(api, options));
        }

        affterFetch(context: DriveContext): void {
          const { response } = context;
          terminal.echo(response?.headers?.toString() ?? "");
        }

        afterParse(context: DriveContext): void {
          const { body } = context;
          terminal.echo(JSON.stringify(body));
        }
      }

      const { drive } = new FetchDriver({ report: new Report() });

      await drive.get(iSrc("/get"));

      const curl = `curl "${iSrc("/get")}" -X GET`;
      expect(terminal.rows[0]).toStrictEqual(curl);
      expect(terminal.rows[1]).toStrictEqual("");
      expect(JSON.parse(terminal.rows[2])).toMatchObject({
        url: "http://echo.apifox.com/get",
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "br, gzip, deflate",
          "Accept-Language": "*",
          Connection: "close",
          Host: "echo.apifox.com",
          "Sec-Fetch-Mode": "cors",
          "X-From-Alb": "true",
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
        "Accept-Encoding": "br, gzip, deflate",
        "Accept-Language": "*",
        Connection: "close",
        Host: "echo.apifox.com",
        "Sec-Fetch-Mode": "cors",
        "Content-Length": "54",
        "Content-Type": "application/json",
        "User-Agent": "Apifox/1.0.0 (https://apifox.com)",
        "X-From-Alb": "true",
      },
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
        "Accept-Encoding": "br, gzip, deflate",
        "Accept-Language": "*",
        Connection: "close",
        Host: "echo.apifox.com",
        "Sec-Fetch-Mode": "cors",
        "User-Agent": "undici",
        "X-From-Alb": "true",
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
