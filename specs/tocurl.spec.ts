/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import { generate, toCurl } from "../src/tocurl";

const iGeneratedHeaderChecker = (init: RequestInit["headers"]) => {
  const headers = new Headers(init);
  const res = generate.header({ headers: init });

  expect(res).toMatch(new RegExp('( -H ".*?: .*?")+'));

  headers.forEach((val, key) => {
    if (key === "content-length") {
      expect(
        res?.includes(`-H "${key}: ${val}"`) ||
          res?.includes(`-H "${key.toLowerCase()}: ${val}"`),
      ).toBeFalsy();
    } else {
      expect(
        res?.includes(`-H "${key}: ${val}"`) ||
          res?.includes(`-H "${key.toLowerCase()}: ${val}"`),
      ).toBeTruthy();
    }
  });
};

describe("生成方法参数", () => {
  it("无方法", () => {
    expect(generate.method({})).toStrictEqual("-X GET");
  });
  it("POST 方法", () => {
    expect(
      generate.method({
        method: "post",
      }),
    ).toStrictEqual("-X POST");
  });
  it("PUT 方法", () => {
    const option = {
      method: "Put",
    };
    expect(generate.method(option)).toStrictEqual("-X PUT");
  });
  it("GET 方法", () => {
    const option = {
      method: "GET",
    };
    expect(generate.method(option)).toStrictEqual("-X GET");
  });
  it("PATCH 方法", () => {
    const option = {
      method: "PATCH",
    };
    expect(generate.method(option)).toStrictEqual("-X PATCH");
  });
  it("DELETE 方法", () => {
    const option = {
      method: "DELETE",
    };
    expect(generate.method(option)).toStrictEqual("-X DELETE");
  });
  it("HEAD 方法", () => {
    const option = {
      method: "HEAD",
    };
    expect(generate.method(option)).toStrictEqual("-X HEAD");
  });
  it("OPTIONS 方法", () => {
    const option = {
      method: "OPTIONS",
    };
    expect(generate.method(option)).toStrictEqual("-X OPTIONS");
  });
  it("未知方法", () => {
    const option = {
      method: "xxxx",
    };
    expect(generate.method(option)).toStrictEqual("-X GET");
  });
});

describe("生成头部选项", () => {
  it("无头部选项", () => {
    expect(generate.header({})).toBeUndefined();
  });

  const headers: HeadersInit = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": "axios/0.18.0",
    "X-Test": "TestVal",
  };

  it("正确解析无编码的对象头部", () => {
    iGeneratedHeaderChecker(headers);
  });

  it("正确解析有编码的对象头部", () => {
    iGeneratedHeaderChecker({
      ...headers,
      "accept-encoding": "gzip",
    });
  });

  it("解析对象头部时忽略 content-length", () => {
    iGeneratedHeaderChecker({
      ...headers,
      "content-length": "12345",
    });
  });
});

describe("生成请求体参数", () => {
  it("无请求体", async () => {
    expect(await generate.body({})).toBeUndefined();
  });
  it("字符串请求体", async () => {
    expect(await generate.body({ body: "a" })).toEqual("--data-binary 'a'");
  });
  it("数字请求体", async () => {
    expect(await generate.body({ body: (12345)?.toString() })).toEqual(
      "--data-binary '12345'",
    );
  });
  it("文件请求体", async () => {
    expect(
      await generate.body({
        body: new Blob(["image data"], { type: "image/png" }),
      }),
    ).toEqual("--data-binary 'aW1hZ2UgZGF0YQ=='");
  });
  it("对象请求体", async () => {
    const options = {
      test: "test:",
      testNumber: 12345,
      testDate: new Date(1609251707077),
      testQuotes: '"test"',
    };
    expect(
      await generate.body({
        body: JSON.stringify(options),
      }),
    ).toEqual(
      `--data-binary '{"test":"test:","testNumber":12345,"testDate":"2020-12-29T14:21:47.077Z","testQuotes":"\\\"test\\\""}'`,
    );
  });
});

describe("生成压缩参数", () => {
  it("无压缩", () => {
    expect(generate.compress({})).toEqual("");
  });
  it("有压缩", () => {
    expect(
      generate.compress({
        headers: new Headers({
          "accept-encoding": "gzip",
        }),
      }),
    ).toEqual(" --compressed");
  });
});

describe("toCurl", () => {
  const host = "https://google.com/";
  it("URL 字符串和空选项", async () => {
    expect(await toCurl(new URL(host))).toStrictEqual(`curl "${host}" -X GET`);
  });

  it("URL 对象和空选项", async () => {
    expect(await toCurl(host, { method: "POST" })).toStrictEqual(
      `curl "${host}" -X POST`,
    );
  });

  it("URL 字符串且无选项", async () => {
    expect(await toCurl(host, { method: "POST" })).toStrictEqual(
      `curl "${host}" -X POST`,
    );
  });

  it("URL 字符串和请求对象", async () => {
    expect(await toCurl("google.com", { method: "POST" })).toEqual(
      'curl "google.com" -X POST',
    );
  });

  it("应该处理 FormData 字符串字段", async () => {
    const src = "http://localhost/api/submit";

    const formData = new FormData();
    formData.append("username", "john_doe");
    formData.append("email", "john@example.com");

    formData.append(
      "avatar",
      new Blob(["image data"], { type: "image/png" }),
      "avatar.png",
    );

    expect(
      await toCurl(src, {
        method: "POST",
        body: formData,
        headers: {
          "User-Agent": "TestAgent",
        },
      }),
    ).toBe(
      `curl "${src}" -X POST -H "user-agent: TestAgent" -F "username=john_doe" -F "email=john@example.com" -F "avatar=data:image/png;base64,aW1hZ2UgZGF0YQ=="`,
    );
  });
});
