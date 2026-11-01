// The reference in a backend error response is shown to the person, so only a short plain string is accepted.
import assert from "node:assert/strict";
import { test } from "vitest";
import { ApiError, parseErrorId } from "../../src/app/failure";

test("error reference: a backend id is accepted, anything else is not", () => {
  const id = "30f4c7b7-57b0-41ae-9e7d-f1e511cb569c";
  assert.equal(parseErrorId({ error: "not found", id }), id);
  for (const body of [null, undefined, "id", 5, [], {}, { id: 5 }, { id: "" }, { id: "short" }, { id: "has spaces in it" }, { id: "<script>alert(1)</script>" }, { id: "x".repeat(65) }]) {
    assert.equal(parseErrorId(body), null, JSON.stringify(body));
  }
});

test("ApiError keeps the reference, or null", () => {
  assert.equal(new ApiError("HTTP 500", "abc-12345").id, "abc-12345");
  assert.equal(new ApiError("HTTP 500").id, null);
});
