"use client";

import Link from "next/link";
import { useState } from "react";

type Item = { id: string; label: string; url: string | null };

// The only interactive part of the navigation, kept as a small Client
// Component so the rest of the header stays a Server Component and its data
// never reaches the browser as JSON.
export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid h-11 w-11 place-items-center rounded-md border border-line text-body"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      <div
        id="mobile-nav-panel"
        hidden={!open}
        className="absolute left-0 right-0 top-16 border-b border-line bg-canvas shadow-lg"
      >
        <ul className="container-custom py-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.url || "/"}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 text-base font-medium text-body hover:bg-canvas-subtle"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
