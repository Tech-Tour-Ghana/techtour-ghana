import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { MobileNav } from "./MobileNav";

// Server Component. Reads the navigation straight from Supabase, which is what
// replaces the old /api/navbar endpoint. design.md B1: read in a Server
// Component, do not add a route just to wrap a single table read.
export async function Navbar() {
  const supabase = await createClient();

  const { data: menus } = await supabase
    .from("navbar_menus")
    .select("id, label, url, has_dropdown")
    .order("sort_order", { ascending: true })
    .limit(20);

  const items = menus ?? [];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur">
      <nav className="container-custom flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-white"
            style={{ background: "var(--color-primary)" }}
          >
            TT
          </span>
          <span className="text-base">
            TechTour <span style={{ color: "var(--color-primary)" }}>Ghana</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.url || "/"}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-canvas-subtle hover:text-body"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/tours"
            className="hidden rounded-md px-4 py-2 text-sm font-semibold text-white transition sm:inline-block"
            style={{ background: "var(--color-primary)" }}
          >
            Book a tour
          </Link>
          <MobileNav items={items} />
        </div>
      </nav>
    </header>
  );
}
