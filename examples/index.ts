import { iSearchParams } from "../src/utils";
import drive from "./request";

export async function query(params: object) {
  return await drive.get("/api/query/xxx", iSearchParams(params));
}

export async function submit(data: object) {
  return await drive.post("/api/submit/xxx", data);
}
