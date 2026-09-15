import Link from "next/link";

import { HeroSlider } from "@/components/features/HeroSlider";
import { createClient } from "@/lib/supabase/server";

const cedi = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

export default async function HomePage() {
  const supabase = await createClient();

  // design.md B8: select named columns, never *, and every list read takes a
  // limit. These run in parallel because none depends on another.
  const [slides, sections, tours, categories, testimonials] = await Promise.all([
    supabase
      .from("homepage_slides")
      .select("id, title, subtitle, description, image_url, button_text, button_link")
      .order("sort_order")
      .limit(8),
    supabase.from("homepage_sections").select("section, title, subtitle").limit(8),
    supabase
      .from("tours")
      .select(
        "id, title, slug, short_description, location, region, featured_image_url, price, discount_price, final_price, duration_days, rating, review_count",
      )
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("tour_categories").select("id, name, slug, description").order("sort_order").limit(8),
    supabase
      .from("testimonials")
      .select("id, author_name, author_position, content, rating")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const destinations = sections.data?.find((s) => s.section === "destinations");

  return (
    <>
      <HeroSlider slides={slides.data ?? []} />

      {(categories.data?.length ?? 0) > 0 && (
        <section className="container-custom py-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.data?.map((c) => (
              <Link
                key={c.id}
                href={`/tours?category=${c.slug}`}
                className="rounded-xl border border-line bg-surface p-5 transition hover:border-primary"
              >
                <p className="text-base font-semibold">{c.name}</p>
                <p className="mt-1 text-sm text-muted">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-custom pb-4">
        <div className="text-center">
          <span
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--color-primary)" }}
          >
            Discover
          </span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            {destinations?.title ?? "Featured Tours"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            {destinations?.subtitle ?? "Handpicked experiences across Ghana"}
          </p>
        </div>
      </section>

      <section className="container-custom pb-16 pt-8">
        {(tours.data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-line bg-canvas-subtle p-10 text-center text-muted">
            No tours are published yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.data?.map((tour) => {
              const hasDiscount =
                tour.discount_price !== null && tour.discount_price < tour.price;
              return (
                <article
                  key={tour.id}
                  className="group overflow-hidden rounded-xl border border-line bg-surface transition hover:shadow-lg"
                >
                  <Link href={`/tours/${tour.slug}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-canvas-subtle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tour.featured_image_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      {hasDiscount && (
                        <span
                          className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-ink"
                          style={{ background: "var(--color-accent)" }}
                        >
                          Save {cedi.format(tour.price - (tour.discount_price ?? 0))}
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-subtle">
                        {tour.location}
                        {tour.region ? `, ${tour.region}` : ""}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-snug">{tour.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {tour.short_description}
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-subtle">
                            {tour.duration_days} {tour.duration_days === 1 ? "day" : "days"}
                          </p>
                          <p className="text-lg font-bold" style={{ color: "var(--color-primary-hover)" }}>
                            {cedi.format(tour.final_price ?? tour.price)}
                          </p>
                        </div>
                        {tour.review_count > 0 && (
                          <p className="text-sm text-muted">
                            <span aria-hidden="true" style={{ color: "var(--color-accent)" }}>
                              {"★"}
                            </span>{" "}
                            {tour.rating}
                            <span className="sr-only"> out of 5</span>{" "}
                            <span className="text-subtle">({tour.review_count})</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/tours"
            className="inline-block rounded-md border-2 px-6 py-3 text-sm font-semibold transition"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary-hover)" }}
          >
            See all tours
          </Link>
        </div>
      </section>

      {(testimonials.data?.length ?? 0) > 0 && (
        <section style={{ background: "var(--bg-subtle)" }} className="py-16">
          <div className="container-custom">
            <h2 className="text-center text-3xl font-bold">What travellers say</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.data?.map((t) => (
                <figure key={t.id} className="rounded-xl border border-line bg-surface p-6">
                  <div aria-hidden="true" style={{ color: "var(--color-accent)" }}>
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="sr-only">{t.rating} out of 5</p>
                  <blockquote className="mt-3 text-sm leading-relaxed text-body">
                    {t.content}
                  </blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold">{t.author_name}</span>
                    {t.author_position && (
                      <span className="text-subtle">, {t.author_position}</span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
