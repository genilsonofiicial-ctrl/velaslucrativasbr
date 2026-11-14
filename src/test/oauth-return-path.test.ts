import { describe, expect, it } from "vitest";

import { oauthReturnPath } from "@/lib/oauth-return-path";

describe("oauthReturnPath", () => {
  it("preserves a local consent path with query and fragment", () => {
    expect(oauthReturnPath("/.lovable/oauth/consent?authorization_id=abc#decidir")).toBe(
      "/.lovable/oauth/consent?authorization_id=abc#decidir",
    );
  });

  it("rejects external, network and backslash addresses", () => {
    expect(oauthReturnPath("https://externo.example")).toBe("/");
    expect(oauthReturnPath("//externo.example")).toBe("/");
    expect(oauthReturnPath("/\\externo.example/")).toBe("/");
  });

  it("rejects controls and invalid values", () => {
    expect(oauthReturnPath("/entrar?next=%0au")).toBe("/entrar?next=%0au");
    expect(oauthReturnPath("/entrar\n")).toBe("/");
    expect(oauthReturnPath(undefined)).toBe("/");
  });
});
