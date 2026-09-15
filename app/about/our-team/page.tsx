"use client";

import React from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faQuoteLeft,
  faAward,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';

/* ============================================================
   TEAM MEMBERS
   ============================================================ */

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  initials: string;
  isLead?: boolean;
  isCoLead?: boolean;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Prince Kyei',
    role: 'CEO & Founder',
    bio: "Visionary founder leading TechTour Ghana's mission to redefine African tourism through technology and cultural authenticity.",
    image: '/images/p-kyei.jpg',
    initials: 'PK',
    isLead: true,
  },
  {
    name: 'Stiffler Awuah Benard',
    role: 'Co-Founder & CTO',
    bio: 'Technology architect behind our VR tours, digital marketplace, and the platforms that power authentic Ghanaian experiences.',
    image: '/images/stiff.png',
    initials: 'SB',
    isCoLead: true,
  },
  {
    name: 'David Osei Boateng',
    role: 'Chief Operations Officer',
    bio: 'Operations leader ensuring every TechTour experience — from booking to return — runs flawlessly across all 16 regions of Ghana.',
    image: '/images/david-osei.jpg',
    initials: 'DB',
  },
];

/* ============================================================
   STATS
   ============================================================ */

const stats = [
  { value: '3', label: 'Core Team Members' },
  { value: '25+', label: 'Combined Years Experience' },
  { value: '16', label: 'Regions Covered' },
  { value: '100%', label: 'Mission-Driven' },
];

/* ============================================================
   PAGE COMPONENT
   ============================================================ */

export default function OurTeamPage() {
  return (
    <ServiceTheme>
      <main className="our-team-page">
        {/* ===== HERO ===== */}
        <section className="team-hero">
          <div className="team-hero-bg" />
          <div className="team-hero-container">
            <span className="team-hero-label">Our Team</span>
            <h1 className="team-hero-title">
              The People Behind <br />
              <span className="team-hero-accent">TechTour Ghana</span>
            </h1>
            <p className="team-hero-subtitle">
              A small, dedicated team united by a shared mission — to showcase the true beauty of
              Ghana to the world while creating meaningful impact for local communities.
            </p>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="team-stats-section">
          <div className="team-stats-container">
            {stats.map((stat, idx) => (
              <div key={idx} className="team-stat-card">
                <div className="team-stat-value">{stat.value}</div>
                <div className="team-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== TEAM GRID ===== */}
        <section className="team-grid-section">
          <div className="team-grid-container">
            <div className="team-grid-header">
              <span className="section-label">The Team</span>
              <h2 className="section-title">
                Meet Our <span className="section-title-accent">Leadership</span>
              </h2>
              <p className="section-subtitle">
                Experts in tourism, technology, and operations — dedicated to elevating Ghana's
                place on the world stage.
              </p>
            </div>

            <div className="team-grid">
              {teamMembers.map((member, idx) => (
                <article
                  key={idx}
                  className={`team-card ${
                    member.isLead ? 'team-card--lead' : ''
                  } ${member.isCoLead ? 'team-card--colead' : ''}`}
                >
                  <div className="team-card-image">
                    <img
                      src={member.image}
                      alt={member.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector(
                          '.team-avatar-fallback'
                        ) as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="team-avatar-fallback">{member.initials}</div>

                    {member.isLead && (
                      <span className="team-lead-badge">
                        <FontAwesomeIcon icon={faAward} />
                        Founder
                      </span>
                    )}

                    {member.isCoLead && (
                      <span className="team-colead-badge">
                        <FontAwesomeIcon icon={faAward} />
                        Co-Founder
                      </span>
                    )}
                  </div>

                  <div className="team-card-content">
                    <h3 className="team-card-name">{member.name}</h3>
                    <span className="team-card-role">{member.role}</span>
                    <p className="team-card-bio">{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== QUOTE ===== */}
        <section className="team-quote-section">
          <div className="team-quote-container">
            <div className="team-quote-mark">
              <FontAwesomeIcon icon={faQuoteLeft} />
            </div>
            <blockquote className="team-quote">
              We're not just building a tourism company. We're building a bridge between Ghana's
              rich heritage and the world — with technology as our tool and community as our
              compass.
            </blockquote>
            <p className="team-quote-author">— Prince Kyei, CEO & Founder</p>
          </div>
        </section>

        {/* ===== JOIN CTA ===== */}
        <section className="team-cta">
          <div className="team-cta-bg" />
          <div className="team-cta-container">
            <h2 className="team-cta-title">Want to Join Our Team?</h2>
            <p className="team-cta-text">
              We're always looking for passionate people who share our vision for African tourism.
            </p>
            <div className="team-cta-actions">
              <Link href="/about/careers" className="team-cta-btn primary">
                View Open Roles
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              <Link href="/about/contact-us" className="team-cta-btn secondary">
                Get in Touch
              </Link>
            </div>
          </div>
        </section>

        <BackToTop accentColor="teal" />

        <style jsx>{`
          .our-team-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== HERO ===== */
          .team-hero {
            position: relative;
            overflow: hidden;
            padding: 100px 32px 80px;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .team-hero-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 20% 30%,
                rgba(230, 166, 77, 0.25) 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 80% 70%,
                rgba(255, 255, 255, 0.15) 0%,
                transparent 45%
              );
          }

          .team-hero-container {
            position: relative;
            z-index: 2;
            max-width: 900px;
            margin: 0 auto;
            text-align: center;
          }

          .team-hero-label {
            display: inline-block;
            padding: 8px 20px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 30px;
            color: #FFFFFF;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 24px;
          }

          .team-hero-title {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 20px 0;
            line-height: 1.15;
            letter-spacing: -0.02em;
          }

          .team-hero-accent {
            color: #E6A64D;
          }

          .team-hero-subtitle {
            font-size: clamp(1rem, 1.5vw, 1.15rem);
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 auto;
            max-width: 700px;
          }

          /* ===== STATS ===== */
          .team-stats-section {
            padding: 0 32px;
            margin-top: -40px;
            margin-bottom: 60px;
            position: relative;
            z-index: 10;
          }

          .team-stats-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }

          .team-stat-card {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 16px;
            padding: 24px 20px;
            text-align: center;
            box-shadow: var(--sp-shadow-md);
            transition: all 0.3s ease;
          }

          .team-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--sp-shadow-lg);
            border-color: rgba(19, 158, 162, 0.4);
          }

          .team-stat-value {
            font-size: 2rem;
            font-weight: 800;
            color: #139EA2;
            line-height: 1;
            letter-spacing: -0.02em;
          }

          .team-stat-label {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            font-weight: 500;
            margin-top: 6px;
          }

          /* ===== TEAM GRID SECTION ===== */
          .team-grid-section {
            padding: 20px 32px 80px;
          }

          .team-grid-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .team-grid-header {
            text-align: center;
            margin-bottom: 56px;
          }

          .section-label {
            display: inline-block;
            color: #139EA2;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .section-title {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .section-title-accent {
            color: #139EA2;
          }

          .section-subtitle {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            line-height: 1.7;
            margin: 16px auto 0;
            max-width: 600px;
          }

          /* ===== TEAM GRID ===== */
          .team-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
          }

          .team-card {
            display: flex;
            flex-direction: column;
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            overflow: hidden;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .team-card:hover {
            transform: translateY(-8px);
            border-color: rgba(19, 158, 162, 0.4);
            box-shadow: var(--sp-shadow-lg);
          }

          /* Founder variant , gold accent */
          .team-card--lead {
            border-color: rgba(230, 166, 77, 0.3);
          }

          .team-card--lead:hover {
            border-color: rgba(230, 166, 77, 0.6);
          }

          /* Co-Founder variant , teal accent */
          .team-card--colead {
            border-color: rgba(19, 158, 162, 0.35);
          }

          .team-card--colead:hover {
            border-color: rgba(19, 158, 162, 0.7);
          }

          /* ===== IMAGE ===== */
          .team-card-image {
            position: relative;
            width: 100%;
            aspect-ratio: 3 / 4;
            overflow: hidden;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .team-card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 20%;
            display: block;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            /* Prevent blur from scaled background gradient */
            image-rendering: -webkit-optimize-contrast;
          }

          .team-card:hover .team-card-image img {
            transform: scale(1.06);
          }

          .team-avatar-fallback {
            position: absolute;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
            color: #FFFFFF;
            font-size: 72px;
            font-weight: 800;
            letter-spacing: 2px;
            z-index: 1;
          }

          .team-card-image img[style*='display: none'] + .team-avatar-fallback {
            display: flex;
          }

          /* ===== BADGES ===== */
          .team-lead-badge,
          .team-colead-badge {
            position: absolute;
            top: 16px;
            right: 16px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
            z-index: 2;
          }

          .team-lead-badge {
            background: rgba(230, 166, 77, 0.95);
            color: #1A1A2E;
          }

          .team-colead-badge {
            background: rgba(19, 158, 162, 0.95);
            color: #FFFFFF;
          }

          .team-lead-badge :global(svg),
          .team-colead-badge :global(svg) {
            font-size: 11px;
          }

          /* ===== CARD CONTENT ===== */
          .team-card-content {
            padding: 24px 24px 28px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .team-card-name {
            font-size: 1.2rem;
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 6px 0;
            letter-spacing: -0.01em;
            line-height: 1.25;
          }

          .team-card-role {
            display: inline-block;
            font-size: 0.78rem;
            font-weight: 700;
            color: #139EA2;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 14px;
          }

          .team-card--lead .team-card-role {
            color: #E6A64D;
          }

          .team-card--colead .team-card-role {
            color: #139EA2;
          }

          .team-card-bio {
            font-size: 0.875rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0;
          }

          /* ===== QUOTE ===== */
          .team-quote-section {
            padding: 60px 32px;
            background: var(--sp-bg-secondary);
            border-top: 1px solid var(--sp-border);
            border-bottom: 1px solid var(--sp-border);
          }

          .team-quote-container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }

          .team-quote-mark {
            width: 60px;
            height: 60px;
            margin: 0 auto 24px;
            border-radius: 50%;
            background: rgba(19, 158, 162, 0.12);
            color: #139EA2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .team-quote {
            font-size: clamp(1.15rem, 2vw, 1.5rem);
            font-weight: 600;
            color: var(--sp-text-primary);
            line-height: 1.55;
            margin: 0 0 20px 0;
            letter-spacing: -0.01em;
            font-style: italic;
          }

          .team-quote-author {
            font-size: 0.9rem;
            color: var(--sp-text-muted);
            margin: 0;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          /* ===== CTA ===== */
          .team-cta {
            position: relative;
            padding: 80px 32px;
            overflow: hidden;
          }

          .team-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .team-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .team-cta-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .team-cta-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 0 32px 0;
          }

          .team-cta-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .team-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 30px;
            font-size: 0.95rem;
            font-weight: 700;
            transition: all 0.3s ease;
          }

          .team-cta-btn.primary {
            background: #E6A64D;
            color: #1A1A2E;
            box-shadow: 0 8px 24px rgba(230, 166, 77, 0.3);
          }

          .team-cta-btn.primary:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .team-cta-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(10px);
          }

          .team-cta-btn.secondary:hover {
            background: #FFFFFF;
            color: #139EA2;
            transform: translateY(-3px);
          }

          .team-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .team-cta-btn.primary:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== RESPONSIVE ===== */

          /* Tablet , 2 columns */
          @media (max-width: 992px) {
            .team-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }

            .team-stats-container {
              grid-template-columns: repeat(2, 1fr);
            }

            .team-card-content {
              padding: 20px 18px 24px;
            }

            .team-card-name {
              font-size: 1.1rem;
            }
          }

          /* Mobile , keep 2 columns */
          @media (max-width: 640px) {
            .team-hero {
              padding: 60px 20px 50px;
            }

            .team-stats-section {
              padding: 0 20px;
              margin-top: -30px;
              margin-bottom: 40px;
            }

            .team-grid-section {
              padding: 20px 20px 60px;
            }

            .team-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 14px;
            }

            .team-card {
              border-radius: 16px;
            }

            .team-card-content {
              padding: 14px 14px 18px;
            }

            .team-card-name {
              font-size: 0.95rem;
              margin-bottom: 4px;
            }

            .team-card-role {
              font-size: 0.68rem;
              letter-spacing: 0.5px;
              margin-bottom: 10px;
            }

            .team-card-bio {
              font-size: 0.75rem;
              line-height: 1.5;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            .team-lead-badge,
            .team-colead-badge {
              top: 10px;
              right: 10px;
              padding: 5px 10px;
              font-size: 9px;
            }

            .team-lead-badge :global(svg),
            .team-colead-badge :global(svg) {
              font-size: 9px;
            }

            .team-avatar-fallback {
              font-size: 48px;
            }

            .team-quote-section {
              padding: 40px 20px;
            }

            .team-cta {
              padding: 60px 20px;
            }

            .team-cta-actions {
              flex-direction: column;
            }

            .team-cta-btn {
              justify-content: center;
            }

            .team-stat-card {
              padding: 18px 14px;
            }

            .team-stat-value {
              font-size: 1.5rem;
            }

            .team-stat-label {
              font-size: 0.75rem;
            }
          }

          /* Very small phones */
          @media (max-width: 380px) {
            .team-grid {
              gap: 10px;
            }

            .team-card-content {
              padding: 12px 10px 14px;
            }

            .team-card-name {
              font-size: 0.85rem;
            }

            .team-card-role {
              font-size: 0.62rem;
            }

            .team-card-bio {
              font-size: 0.7rem;
              -webkit-line-clamp: 2;
            }

            .team-avatar-fallback {
              font-size: 40px;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}