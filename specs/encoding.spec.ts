import { describe, expect, it } from "vitest";

import { Driver } from "../src/core";

describe("外部编码", () => {
  const { drive, request } = new Driver();

  describe("数据 URI", () => {
    it("应该接受 base64 编码的 gif 数据 URI", async () => {
      const { res } = await request({
        api: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
      });

      const { status, headers } = res;
      expect(status).toStrictEqual(200);
      expect(headers?.get("Content-Type")).toStrictEqual("image/gif");

      const buffer = await res.raw?.arrayBuffer();
      expect(buffer?.byteLength).toStrictEqual(35);
      expect(buffer).to.be.an.instanceOf(ArrayBuffer);
    });

    it("应该接受指定字符集的数据 URI", async () => {
      const { res } = await request<string>({
        api: "data:text/plain;charset=UTF-8;page=21,the%20data:1234,5678",
        parse: async (response, context) => {
          context.res.body = await response.text();
        },
      });

      const { status, headers } = res.raw ?? {};

      expect(status).toStrictEqual(200);

      expect(headers?.get("Content-Type")).toStrictEqual(
        "text/plain;charset=UTF-8",
      );

      expect(res.body).toStrictEqual("the data:1234,5678");
    });

    it("应该接受纯文本的数据 URI", async () => {
      const { res } = await request({
        api: "data:,Hello%20World!",
        parse: async (response, context) => {
          context.res.body = await response.text();
        },
      });

      const { status, headers } = res.raw ?? {};

      expect(status).toStrictEqual(200);

      expect(headers?.get("Content-Type")).toStrictEqual(
        "text/plain;charset=US-ASCII",
      );

      expect(res.body).toStrictEqual("Hello World!");

      const result = await drive("data:,Hello%20World!");

      expect(result).toStrictEqual("Hello World!");
    });
  });
});
