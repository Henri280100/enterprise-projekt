import path from "node:path";
import cds from "@sap/cds";
import { describe, it, expect } from "vitest";

const { GET } = cds.test(path.resolve(__dirname, "../.."));
const auth = { username: "alice", password: "" };

describe("CommonService", () => {
  it("returns ping", async () => {
    const { data } = await GET("/common/ping()", { auth });
    expect(data.value).toBe("enterprise-app is running");
  });

  it("reads statuses", async () => {
    const { data } = await GET("/common/Statuses", { auth });
    expect(data.value).toHaveLength(8);
  });

  it("rejects anonymous request", async () => {
    await expect(GET("/common/Statuses")).rejects.toThrow(/401/);
  });
});
