"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    // Respect the reduced motion preference rather than only softening the
    // transition. An auto-advancing carousel is motion, so it stops entirely.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const id = window.setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section aria-label="Featured destinations" className="relative">
      <div className="relative h-[520px] w-full overflow-hidden sm:h-[600px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== current}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            {/* Plain img rather than next/image: these URLs are editor
                supplied and may point at any host, and the remote patterns
                allowlist is a phase 3 decision. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image_url}
              alt=""
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(26,26,46,0.92) 0%, rgba(26,26,46,0.65) 45%, rgba(26,26,46,0.15) 100%)",
              }}
            />
          </div>
        ))}

        <div className="absolute inset-0">
          <div className="container-custom flex h-full flex-col justify-center">
            <div className="max-w-xl text-white">
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--color-accent)" }}
              >
                {slides[current]?.subtitle}
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {slides[current]?.title}
              </h1>
              <p className="mt-4 max-w-md text-base text-white/80">
                {slides[current]?.description}
              </p>
              <Link
                href={slides[current]?.button_link || "/tours"}
                className="mt-8 inline-block rounded-md px-6 py-3 text-sm font-semibold text-white transition"
                style={{ background: "var(--color-primary)" }}
              >
                {slides[current]?.button_text || "Explore Now"}
              </Link>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0">
            <div className="container-custom flex gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Show slide ${i + 1}, ${slide.title}`}
                  aria-current={i === current}
                  className="h-11 w-11 sm:h-auto sm:w-auto sm:p-0"
                >
                  <span
                    aria-hidden="true"
                    className="block h-1.5 rounded-full transition-all"
                    style={{
                      width: i === current ? "2rem" : "0.75rem",
                      background:
                        i === current ? "var(--color-primary)" : "rgba(255,255,255,0.5)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
