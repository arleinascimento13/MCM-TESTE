import { describe, it, expect } from "vitest";
import { buildQueryString } from "@/lib/utils";

describe("buildQueryString", () => {
  it("ignora valores nulos e indefinidos", () => {
    expect(buildQueryString({ page: 1, status: null, termo: undefined })).toBe("page=1");
  });
});
