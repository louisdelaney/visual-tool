import { describe, expect, it } from "vitest";
import { TokenBucket } from "../src/ratelimit";

describe("TokenBucket", () => {
  it("allows 60 in a minute, then refuses", () => {
    let now = 0;
    const bucket = new TokenBucket(60, () => now);
    for (let i = 0; i < 60; i++) expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false);
  });

  it("refills at the per-minute rate: about 30 tokens after 30 seconds", () => {
    let now = 0;
    const bucket = new TokenBucket(60, () => now);
    for (let i = 0; i < 60; i++) bucket.take();
    now += 30_000;
    let allowed = 0;
    while (bucket.take()) allowed++;
    expect(allowed).toBe(30);
  });

  it("never holds more than a minute's worth", () => {
    let now = 0;
    const bucket = new TokenBucket(5, () => now);
    now += 10 * 60_000;
    let allowed = 0;
    while (bucket.take()) allowed++;
    expect(allowed).toBe(5);
  });
});
