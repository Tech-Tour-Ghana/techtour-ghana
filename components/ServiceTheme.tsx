"use client";

import React from 'react';

/**
 * Shared theme variables for all service pages.
 * Wrap any page content in <ServiceTheme> to enable theme-aware styling.
 */
export const ServiceThemeStyles = () => (
  <style jsx global>{`
    /* ============================================================
       SERVICE PAGE THEME VARIABLES
       ============================================================ */
    :root,
    [data-theme="bright"] {
      --sp-bg-primary: #F9F9F9;
      --sp-bg-secondary: #FFFFFF;
      --sp-bg-card: #FFFFFF;
      --sp-bg-card-hover: #F9F9F9;
      --sp-bg-input: #FFFFFF;
      --sp-bg-elevated: #FFFFFF;
      
      --sp-text-primary: #1A1A2E;
      --sp-text-secondary: #4A4A4A;
      --sp-text-muted: #9CA3AF;
      --sp-text-subtle: #6B7280;
      
      --sp-border: rgba(19, 158, 162, 0.08);
      --sp-border-hover: rgba(19, 158, 162, 0.2);
      --sp-border-strong: rgba(19, 158, 162, 0.15);
      
      --sp-shadow-sm: 0 4px 12px rgba(19, 158, 162, 0.05);
      --sp-shadow-md: 0 8px 24px rgba(19, 158, 162, 0.08);
      --sp-shadow-lg: 0 20px 40px rgba(19, 158, 162, 0.15);
      
      --sp-tag-bg: #F9F9F9;
      --sp-tag-border: rgba(19, 158, 162, 0.06);
      --sp-tag-text: #4A4A4A;
      
      --sp-primary: #139EA2;
      --sp-primary-dark: #0D7A7D;
      --sp-primary-light: rgba(19, 158, 162, 0.12);
      
      --sp-accent: #E6A64D;
      --sp-accent-dark: #D4953A;
      --sp-accent-light: rgba(230, 166, 77, 0.15);
      
      --sp-overlay-gradient: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.15) 0%,
        rgba(0, 0, 0, 0.05) 40%,
        rgba(0, 0, 0, 0.5) 100%
      );
    }

    [data-theme="dim"] {
      --sp-bg-primary: #0A0A0A;
      --sp-bg-secondary: #0F0F0F;
      --sp-bg-card: #1A1A1A;
      --sp-bg-card-hover: #222222;
      --sp-bg-input: #1A1A1A;
      --sp-bg-elevated: #1A1A1A;
      
      --sp-text-primary: #FFFFFF;
      --sp-text-secondary: #B0B0B0;
      --sp-text-muted: #6B7280;
      --sp-text-subtle: #9CA3AF;
      
      --sp-border: rgba(230, 166, 77, 0.1);
      --sp-border-hover: rgba(230, 166, 77, 0.25);
      --sp-border-strong: rgba(230, 166, 77, 0.15);
      
      --sp-shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.3);
      --sp-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
      --sp-shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.5);
      
      --sp-tag-bg: rgba(255, 255, 255, 0.05);
      --sp-tag-border: rgba(255, 255, 255, 0.05);
      --sp-tag-text: #B0B0B0;
      
      --sp-primary: #E6A64D;
      --sp-primary-dark: #D4953A;
      --sp-primary-light: rgba(230, 166, 77, 0.15);
      
      --sp-accent: #139EA2;
      --sp-accent-dark: #0D7A7D;
      --sp-accent-light: rgba(19, 158, 162, 0.15);
      
      --sp-overlay-gradient: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.3) 0%,
        rgba(0, 0, 0, 0.2) 40%,
        rgba(0, 0, 0, 0.7) 100%
      );
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