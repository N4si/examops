import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { isAdminIdentity, parseAdminEmails } from "./admin-auth"

describe("parseAdminEmails", () => {
  it("returns an empty list for undefined", () => {
    assert.deepEqual(parseAdminEmails(undefined), [])
  })

  it("returns an empty list for an empty or blank string", () => {
    assert.deepEqual(parseAdminEmails(""), [])
    assert.deepEqual(parseAdminEmails("  ,  , "), [])
  })

  it("trims spacing around entries", () => {
    assert.deepEqual(parseAdminEmails("  a@example.com ,b@example.com  "), [
      "a@example.com",
      "b@example.com",
    ])
  })

  it("lowercases entries", () => {
    assert.deepEqual(parseAdminEmails("Admin@Example.COM"), ["admin@example.com"])
  })

  it("drops empty entries", () => {
    assert.deepEqual(parseAdminEmails("a@example.com,,b@example.com,"), [
      "a@example.com",
      "b@example.com",
    ])
  })
})

describe("isAdminIdentity", () => {
  const allowlist = ["admin@example.com"]

  it("accepts an allowlisted email with a Google account", () => {
    assert.equal(isAdminIdentity("admin@example.com", ["google"], allowlist), true)
  })

  it("accepts an allowlisted email with Google among other providers", () => {
    assert.equal(isAdminIdentity("admin@example.com", ["github", "google"], allowlist), true)
  })

  it("rejects an allowlisted email with only a GitHub account", () => {
    assert.equal(isAdminIdentity("admin@example.com", ["github"], allowlist), false)
  })

  it("rejects an allowlisted email with no accounts", () => {
    assert.equal(isAdminIdentity("admin@example.com", [], allowlist), false)
  })

  it("rejects a non-allowlisted email with a Google account", () => {
    assert.equal(isAdminIdentity("someone@example.com", ["google"], allowlist), false)
  })

  it("rejects a null or undefined email", () => {
    assert.equal(isAdminIdentity(null, ["google"], allowlist), false)
    assert.equal(isAdminIdentity(undefined, ["google"], allowlist), false)
  })

  it("rejects everyone when the allowlist is empty", () => {
    assert.equal(isAdminIdentity("admin@example.com", ["google"], []), false)
  })

  it("matches the email case-insensitively", () => {
    assert.equal(isAdminIdentity("Admin@Example.com", ["google"], allowlist), true)
  })
})
