import { describe, expect, it } from "vitest";
import { backendMode, exportDir, openStore } from "../src/config";
import { MemoryStore } from "../src/db-memory";

describe("backendMode", () => {
  it("is memory when nothing is set", () => expect(backendMode({})).toBe("memory"));
  it("is firestore when there's a Google Cloud project", () => expect(backendMode({ GOOGLE_CLOUD_PROJECT: "p" })).toBe("firestore"));
  it("takes BACKEND over the project", () => {
    expect(backendMode({ BACKEND: "memory", GOOGLE_CLOUD_PROJECT: "p" })).toBe("memory");
    expect(backendMode({ BACKEND: "firestore" })).toBe("firestore");
  });
  it("accepts memory when asked for", () => expect(backendMode({ BACKEND: "memory" })).toBe("memory"));
  it("refuses memory on Cloud Run", () => {
    expect(() => backendMode({ BACKEND: "memory", K_SERVICE: "x" })).toThrow(/Cloud Run/);
    expect(() => backendMode({ K_SERVICE: "x" })).toThrow(/Cloud Run/);
  });
  it("allows firestore on Cloud Run", () => expect(backendMode({ GOOGLE_CLOUD_PROJECT: "p", K_SERVICE: "x" })).toBe("firestore"));
  it("refuses any other value", () => expect(() => backendMode({ BACKEND: "other" })).toThrow(/BACKEND/));
});

describe("openStore", () => {
  it("opens a MemoryStore for BACKEND=memory", async () => {
    const store = await openStore({ BACKEND: "memory" });
    expect(store).toBeInstanceOf(MemoryStore);
    expect((store as MemoryStore).size).toBe(0);
  });
});

describe("exportDir", () => {
  it("is the default folder when nothing is set", () => expect(exportDir({})).toBe("./data/export"));
  it("is EXPORT_DIR when given", () => expect(exportDir({ EXPORT_DIR: "/data/export" })).toBe("/data/export"));
});
