import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each(["/estudio", "/biblioteca", "/minhas-velas", "/guia", "/entrar", "/admin"])(
    "matches a page for %s",
    (path) => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      expect(router.matchRoutes(path).at(-1)?.routeId).not.toBe(rootRouteId);
    },
  );

  it("keeps Minhas velas and Admin behind the sign-in gate", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const path of ["/minhas-velas", "/admin"]) {
      const ids = router.matchRoutes(path).map((m) => m.routeId);
      expect(ids).toContain("/_authenticated");
    }
    for (const path of ["/estudio", "/biblioteca"]) {
      const ids = router.matchRoutes(path).map((m) => m.routeId);
      expect(ids).not.toContain("/_authenticated");
    }
  });
});
