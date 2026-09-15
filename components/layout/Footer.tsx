import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

// The old API served this region through six separate endpoints, one per
// footer column, plus one each for settings, contacts, social and legal.
// footer_quick_links now carries a category, so four queries cover the whole
// footer and the columns are grouped in memory.
export async function Footer() {
  const supabase = await createClient();

  const [settings, features, links, contacts, social, legal] = await Promise.all([
    supabase
      .from("footer_settings")
      .select("company_name, tagline, copyright_text")
      .limit(1)
      .maybeSingle(),
    supabase.from("footer_features").select("id, title, description").order("sort_order").limit(8),
    supabase
      .from("footer_quick_links")
      .select("id, category, label, url")
      .order("sort_order")
      .limit(60),
    supabase.from("footer_contacts").select("id, text").order("sort_order").limit(10),
    supabase.from("social_links").select("id, platform, url").order("sort_order").limit(12),
    supabase.from("legal_links").select("id, label, url").order("sort_order").limit(10),
  ]);

  const year = new Date().getFullYear();
  const columns = ["destinations", "services", "company", "support"] as const;
  const heading: Record<string, string> = {
    destinations: "Destinations",
    services: "Services",
    company: "Company",
    support: "Support",
  };

  return (
    <footer style={{ background: "var(--color-ink)" }} className="mt-20 text-white">
      {(features.data?.length ?? 0) > 0 && (
        <div className="border-b border-white/10">
          <div className="container-custom grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.data?.map((f) => (
              <div key={f.id}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
                  {f.title}
                </p>
                <p className="mt-1 text-sm text-white/70">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container-custom grid gap-10 py-14 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-lg font-bold">
            {settings.data?.company_name ?? "TechTour Ghana"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            {settings.data?.tagline ?? "Tourism at your finger-tip."}
          </p>

          {(contacts.data?.length ?? 0) > 0 && (
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              {contacts.data?.map((c) => (
                <li key={c.id}>{c.text}</li>
              ))}
            </ul>
          )}
        </div>

        {columns.map((col) => {
          const items = links.data?.filter((l) => l.category === col) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={col}>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {heading[col]}
              </p>
              <ul className="mt-4 space-y-2">
                {items.map((l) => (
                  <li key={l.id}>
                    <Link href={l.url} className="text-sm text-white/80 underline-offset-4 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10">
        <div className="container-custom flex flex-col gap-4 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {year} {settings.data?.company_name ?? "TechTour Ghana"}.{" "}
            {settings.data?.copyright_text ?? "All rights reserved."}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legal.data?.map((l) => (
              <Link key={l.id} href={l.url} className="underline-offset-4 hover:underline">
                {l.label}
              </Link>
            ))}
            {social.data?.map((s) => (
              <a
                key={s.id}
                href={s.url}
                rel="noopener noreferrer"
                target="_blank"
                className="capitalize underline-offset-4 hover:underline"
              >
                {s.platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
