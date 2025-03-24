import type { DriveMiddleware } from "@busymango/fetch-driver";
import { downloader, src2name } from "@busymango/fetch-driver";

import { isBlob, iSearchParams } from "../../src/utils";

const disposition: DriveMiddleware = async (context, next) => {
  await next();

  const { response } = context;

  if (response?.ok) {
    const { api, body } = context;
    const { headers } = response;
    // 如果是附件请求则直接下载附件
    if (headers.has("Content-Disposition")) {
      const disposition = headers.get("Content-Disposition");
      const [mode, ...fields] = disposition?.trim()?.split(";") ?? [];

      if (mode.trim() === "attachment" && isBlob(body)) {
        const params = iSearchParams(fields);
        const name = params?.get("filename");
        const src = URL.createObjectURL(body);
        downloader(src, name ?? src2name(api));
        URL.revokeObjectURL(src);
      }
    }
  }
};

export default disposition;
