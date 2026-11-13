import { Link } from "@tanstack/react-router";

import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  return (
    <nav
      aria-label="Menu"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={
                      isActive
                        ? "flex h-8 w-12 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground"
                        : "flex h-8 w-12 items-center justify-center rounded-full"
                    }
                  >
                    <Icon className="size-5" />
                  </span>
                  {label}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
