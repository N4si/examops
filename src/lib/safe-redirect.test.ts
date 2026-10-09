import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { safeCallbackUrl } from "./safe-redirect"

describe("safeCallbackUrl", () => {
  it("allows a same-origin path", () => {
    assert.equal(safeCallbackUrl("/admin"), "/admin")
  })

  it("allows a path with a query string", () => {
    assert.equal(safeCallbackUrl("/certs/x?y=1"), "/certs/x?y=1")
  })

  it("falls back for undefined and null", () => {
    assert.equal(safeCallbackUrl(undefined), "/dashboard")
    assert.equal(safeCallbackUrl(null), "/dashboard")
  })

  it("falls back for an empty string", () => {
    assert.equal(safeCallbackUrl(""), "/dashboard")
  })

  it("falls back for an absolute URL", () => {
    assert.equal(safeCallbackUrl("https://evil.com"), "/dashboard")
  })

  it("falls back for a protocol-relative URL", () => {
    assert.equal(safeCallbackUrl("//evil.com"), "/dashboard")
  })

  it("falls back for a backslash protocol-relative URL", () => {
    assert.equal(safeCallbackUrl("/\\evil.com"), "/dashboard")
  })

  it("falls back for a javascript: URL", () => {
    assert.equal(safeCallbackUrl("javascript:alert(1)"), "/dashboard")
  })

  it("falls back for a path containing ://", () => {
    assert.equal(safeCallbackUrl("/redirect?to=https://evil.com"), "/dashboard")
  })

  it("falls back for control characters", () => {
    assert.equal(safeCallbackUrl("/\t/evil.com"), "/dashboard")
    assert.equal(safeCallbackUrl("/admin\n"), "/dashboard")
  })

  it("uses a custom fallback", () => {
    assert.equal(safeCallbackUrl("//evil.com", "/"), "/")
  })
})
