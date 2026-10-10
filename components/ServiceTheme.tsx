"use client";

import React from 'react';

/**
 * Shared theme variables for all service pages.
 * Wrap any page content in <ServiceTheme> to enable theme-aware styling.
 */
export const ServiceThemeStyles = () => (
  <style jsx global>{`
    /* Colour variables (--sp-*, --brand-*) are generated in lib/theme/tokens.ts and
       injected by the root layout, so there is one copy of every colour. */

    /* Text on anything painted with the primary colour uses --sp-on-primary, which
       is chosen for contrast: white on the light teal, near-black on dark mode gold,
       and recalculated for any colour set in Admin > Settings > Branding. */
    [style*="background: var(--sp-primary)"],
    [style*="background: var(--sp-primary,"],
    [style*="background: var(--sp-primary-dark"],
    [style*="background:var(--sp-primary)"],
    [style*="background:var(--sp-primary,"],
    [style*="background:var(--sp-primary-dark"] {
      color: var(--sp-on-primary, #FFFFFF) !important;
    }

    /* ============================================================
       GLOBAL SMOOTH TRANSITION
       ============================================================ */
    body,
    .service-hero,
    .sp-card,
    .sp-section,
    .sp-footer {
      transition: background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease;
    }
  `}</style>
);

/**
 * Wrapper component that applies theme styles + variables.
 */
export const ServiceTheme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <ServiceThemeStyles />
      {children}
    </>
  );
};