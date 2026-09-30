// Server-side loaders for the SEO data public pages need. Uses the request's
// Supabase client, so RLS decides what an anonymous visitor may see.

import { createClient as createPublicClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { Metadata } from "next";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { SEO_COLUMNS, seoFieldsFrom, siteSeoFrom } from "./site";
import type { ResolvedSeo, SeoFields, SiteSeo } from "./resolve";

// Site settings are public and identical for everyone, so they are read without
// the request's cookies. That keeps pages that only need site-wide SEO (the root
// layout) statically renderable.
export const getSiteSeo = cache(async (): Promise<SiteSeo> => {
  const supabase = createPublicClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  return siteSeoFrom(data, env.NEXT_PUBLIC_SITE_URL);
});

export async function getSeoFields(entityType: "blog_post" | "destination" | "blog_category", key: string): Promise<SeoFields> {
  const supabase = await createClient();
  const { data } = await supabase.from("seo_metadata").select(SEO_COLUMNS).eq("entity_type", entityType).eq("entity_key", key).maybeSingle();
  return seoFieldsFrom(data);
}

/** Next.js Metadata from resolved SEO values. No meta keywords, ever. */
export function toMetadata(r: ResolvedSeo, opts: { type: "article" | "website"; publishedTime?: string | null; modifiedTime?: string; siteName: string }): Metadata {
  return {
    title: { absolute: r.title },
    description: r.description || undefined,
    alternates: { canonical: r.canonical },
    robots: { index: r.robots.index, follow: r.robots.follow },
    openGraph: {
      type: opts.type,
      siteName: opts.siteName,
      url: r.og.url,
      title: r.og.title,
      description: r.og.description || undefined,
      images: r.og.image ? [r.og.image] : undefined,
      ...(opts.type === "article" ? { publishedTime: opts.publishedTime ?? undefined, modifiedTime: opts.modifiedTime } : {}),
    },
    twitter: {
      card: r.twitter.image ? "summary_large_image" : "summary",
      title: r.twitter.title,
      description: r.twitter.description || undefined,
      images: r.twitter.image ? [r.twitter.image] : undefined,
    },
  };
}
