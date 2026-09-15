"use client";

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faChevronRight,
  faArrowRight,
  faHotel,
  faPlane,
  faBuilding,
  faUniversity,
  faGlobeAfrica,
  faChalkboardTeacher,
  faLocationDot,
  faEnvelope,
  faPhone,
  faLayerGroup,
  faHandshake,
  faShieldAlt,
  faClock,
  faMapMarkedAlt,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';

/* ============================================================
   PARTNER CATEGORY CONFIG
   ============================================================ */

interface CategoryConfig {
  slug: string;
  title: string;
  shortLabel: string;
  description: string;
  heroImage: string;
  icon: any;
}

const categoryConfig: Record<string, CategoryConfig> = {
  hotels: {
    slug: 'hotels',
    title: 'Hotels & Resorts',
    shortLabel: 'Hotels',
    description:
      'From boutique guesthouses in Accra to beachfront resorts along the Cape Coast, our hotel partners offer world-class hospitality rooted in Ghanaian warmth.',
    heroImage: '/images/partners/hotels.jpg',
    icon: faHotel,
  },
  'tour-operators': {
    slug: 'tour-operators',
    title: 'Tour Operators & Guides',
    shortLabel: 'Tour Operators',
    description:
      "Certified local experts who bring Ghana's history, culture, and landscapes to life — from Kakum canopy walks to Cape Coast heritage tours.",
    heroImage: '/images/partners/tour-operators.jpg',
    icon: faPlane,
  },
  artisans: {
    slug: 'artisans',
    title: 'Artisans & Creators',
    shortLabel: 'Artisans',
    description:
      'Talented craftspeople crafting authentic Ghanaian products — from kente weaving and beadwork to wood carving and traditional pottery.',
    heroImage: '/images/partners/artisans.jpg',
    icon: faBuilding,
  },
  educational: {
    slug: 'educational',
    title: 'Educational Institutions',
    shortLabel: 'Institutions',
    description:
      'Universities, schools, and research centers offering study abroad programs and cultural exchanges across Ghana.',
    heroImage: '/images/partners/education.jpg',
    icon: faUniversity,
  },
  ngos: {
    slug: 'ngos',
    title: 'NGOs & Community Organizations',
    shortLabel: 'NGOs',
    description:
      'Mission-driven organizations advancing sustainable tourism and community development across Ghana.',
    heroImage: '/images/partners/ngos.jpg',
    icon: faGlobeAfrica,
  },
  'travel-agencies': {
    slug: 'travel-agencies',
    title: 'Travel Agencies',
    shortLabel: 'Agencies',
    description:
      'B2B travel partners who book TechTour Ghana experiences for their clients worldwide.',
    heroImage: '/images/partners/travel-agencies.jpg',
    icon: faChalkboardTeacher,
  },
};

/* ============================================================
   SAMPLE PARTNERS DATA
   , Replace this with data fetched from your backend
   ============================================================ */

interface Partner {
  id: number;
  name: string;
  location: string;
  image: string;
  since?: string;
}

const partnersByCategory: Record<string, Partner[]> = {
  hotels: [
    { id: 1, name: 'Kempinski Hotel Gold Coast', location: 'Accra, Greater Accra', image: '/images/partners/logos/kempinski.jpg', since: '2019' },
    { id: 2, name: 'Mövenpick Ambassador Hotel', location: 'Accra, Greater Accra', image: '/images/partners/logos/movenpick.jpg', since: '2020' },
    { id: 3, name: 'Coconut Grove Regency Hotel', location: 'Accra, Greater Accra', image: '/images/partners/logos/coconut-grove.jpg' },
    { id: 4, name: 'Cape Coast Beach Resort', location: 'Cape Coast, Central Region', image: '/images/partners/logos/cape-coast-beach.jpg' },
    { id: 5, name: 'Zaina Lodge', location: 'Mole National Park, Savannah', image: '/images/partners/logos/zaina-lodge.jpg' },
    { id: 6, name: 'Aqua Safari Resort', location: 'Ada Foah, Greater Accra', image: '/images/partners/logos/aqua-safari.jpg' },
    { id: 7, name: 'Labadi Beach Hotel', location: 'Accra, Greater Accra', image: '/images/partners/logos/labadi-beach.jpg' },
    { id: 8, name: 'Volta Serene Hotel', location: 'Ho, Volta Region', image: '/images/partners/logos/volta-serene.jpg' },
  ],
  'tour-operators': [
    { id: 1, name: 'Ashanti Tours', location: 'Kumasi, Ashanti Region', image: '/images/partners/logos/ashanti-tours.jpg' },
    { id: 2, name: 'Kakum Adventure Guides', location: 'Cape Coast, Central Region', image: '/images/partners/logos/kakum-adventure.jpg' },
    { id: 3, name: 'Accra City Walks', location: 'Accra, Greater Accra', image: '/images/partners/logos/accra-city-walks.jpg' },
    { id: 4, name: 'Northern Safari Co.', location: 'Tamale, Northern Region', image: '/images/partners/logos/northern-safari.jpg' },
    { id: 5, name: 'Volta Eco Tours', location: 'Ho, Volta Region', image: '/images/partners/logos/volta-eco.jpg' },
    { id: 6, name: 'Cape Coast Heritage Tours', location: 'Cape Coast, Central Region', image: '/images/partners/logos/cape-coast-heritage.jpg' },
  ],
  artisans: [
    { id: 1, name: 'Kente Weavers of Bonwire', location: 'Bonwire, Ashanti Region', image: '/images/partners/logos/bonwire-kente.jpg' },
    { id: 2, name: 'Krobo Bead Artisans', location: 'Krobo Odumase, Eastern Region', image: '/images/partners/logos/krobo-beads.jpg' },
    { id: 3, name: 'Ahwiaa Wood Carvers', location: 'Ahwiaa, Ashanti Region', image: '/images/partners/logos/ahwiaa-wood.jpg' },
    { id: 4, name: 'Sirigu Pottery Collective', location: 'Sirigu, Upper East Region', image: '/images/partners/logos/sirigu-pottery.jpg' },
    { id: 5, name: 'Accra Arts Centre', location: 'Accra, Greater Accra', image: '/images/partners/logos/accra-arts.jpg' },
    { id: 6, name: 'Bolgatanga Basketry', location: 'Bolgatanga, Upper East Region', image: '/images/partners/logos/bolgatanga-baskets.jpg' },
  ],
  educational: [
    { id: 1, name: 'University of Ghana', location: 'Legon, Greater Accra', image: '/images/partners/logos/ug.jpg' },
    { id: 2, name: 'Kwame Nkrumah University', location: 'Kumasi, Ashanti Region', image: '/images/partners/logos/knust.jpg' },
    { id: 3, name: 'University of Cape Coast', location: 'Cape Coast, Central Region', image: '/images/partners/logos/ucc.jpg' },
    { id: 4, name: 'Ashesi University', location: 'Berekuso, Eastern Region', image: '/images/partners/logos/ashesi.jpg' },
  ],
  ngos: [
    { id: 1, name: 'Ghana Tourism Authority', location: 'Accra, Greater Accra', image: '/images/partners/logos/gta.jpg' },
    { id: 2, name: 'African Centre for Cultural Excellence', location: 'Cape Coast, Central Region', image: '/images/partners/logos/acce.jpg' },
    { id: 3, name: 'Sustainable Ghana Initiative', location: 'Kumasi, Ashanti Region', image: '/images/partners/logos/sgi.jpg' },
    { id: 4, name: 'Northern Development Trust', location: 'Tamale, Northern Region', image: '/images/partners/logos/ndt.jpg' },
  ],
  'travel-agencies': [
    { id: 1, name: 'Global Voyages Travel', location: 'United States', image: '/images/partners/logos/global-voyages.jpg' },
    { id: 2, name: 'AfroTravel Network', location: 'United Kingdom', image: '/images/partners/logos/afrotravel.jpg' },
    { id: 3, name: 'Pan-African Journeys', location: 'South Africa', image: '/images/partners/logos/pan-african.jpg' },
    { id: 4, name: 'Wanderlust Africa', location: 'Germany', image: '/images/partners/logos/wanderlust.jpg' },
    { id: 5, name: 'Sankofa Travel Group', location: 'Canada', image: '/images/partners/logos/sankofa.jpg' },
  ],
};

/* ============================================================
   PAGE COMPONENT
   ============================================================ */

export default function PartnerDirectoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug || '');

  const config = categoryConfig[slug];
  const partners = partnersByCategory[slug] || [];

  /* --- Not found --- */
  if (!config) {
    return (
      <ServiceTheme>
        <main className="partner-notfound">
          <div className="partner-notfound-inner">
            <h1>Category Not Found</h1>
            <p>We couldn't find that partner category.</p>
            <Link href="/about/partnership" className="partner-notfound-btn">
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Partnership
            </Link>
          </div>
          <BackToTop accentColor="teal" />
        </main>
      </ServiceTheme>
    );
  }

  return (
    <ServiceTheme>
      <main className="partner-directory-page">
        {/* ===== HERO ===== */}
        <section className="partner-hero">
          <div className="partner-hero-bg" />

          <div className="partner-hero-container">
            {/* Breadcrumb , LEFT ALIGNED */}
            <nav className="partner-breadcrumb" aria-label="Breadcrumb">

              <div className="partner-breadcrumb-trail">
                <Link href="/" className="partner-breadcrumb-btn">
                  Home
                </Link>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="partner-breadcrumb-sep"
                />
                <Link
                  href="/about/partnership"
                  className="partner-breadcrumb-btn"
                >
                  Partnership
                </Link>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="partner-breadcrumb-sep"
                />
                <span className="partner-breadcrumb-btn current">
                  {config.shortLabel}
                </span>
              </div>
            </nav>

            {/* Hero content , LEFT ALIGNED */}
            <div className="partner-hero-content">
              <div className="partner-hero-icon">
                <FontAwesomeIcon icon={config.icon} />
              </div>

              <span className="partner-hero-eyebrow">Our Partner Network</span>

              <h1 className="partner-hero-title">
                {config.title}{' '}
                <span className="partner-hero-accent">Partners</span>
              </h1>

              <p className="partner-hero-subtitle">{config.description}</p>
            </div>

            {/* Stats , LEFT ALIGNED on desktop, centered on mobile */}
            <div className="partner-hero-stats">
              <div className="partner-hero-stat">
                <span className="partner-hero-stat-icon">
                  <FontAwesomeIcon icon={faHandshake} />
                </span>
                <div className="partner-hero-stat-body">
                  <span className="partner-hero-stat-value">
                    {partners.length}+
                  </span>
                  <span className="partner-hero-stat-label">Active Partners</span>
                </div>
              </div>

              <div className="partner-hero-stat">
                <span className="partner-hero-stat-icon">
                  <FontAwesomeIcon icon={faShieldAlt} />
                </span>
                <div className="partner-hero-stat-body">
                  <span className="partner-hero-stat-value">100%</span>
                  <span className="partner-hero-stat-label">Verified</span>
                </div>
              </div>

              <div className="partner-hero-stat">
                <span className="partner-hero-stat-icon">
                  <FontAwesomeIcon icon={faClock} />
                </span>
                <div className="partner-hero-stat-body">
                  <span className="partner-hero-stat-value">24/7</span>
                  <span className="partner-hero-stat-label">Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PARTNERS GRID ===== */}
        <section className="partner-grid-section">
          <div className="partner-grid-container">
            <div className="partner-grid-header">
              <span className="section-label">
                <FontAwesomeIcon icon={faMapMarkedAlt} />
                Directory
              </span>
              <h2 className="section-title">
                Meet Our <span className="section-title-accent">Partners</span>
              </h2>
              <p className="section-subtitle">
                Every partner below is vetted, verified, and committed to
                delivering exceptional Ghanaian experiences.
              </p>
            </div>

            {partners.length > 0 ? (
              <div className="partner-grid">
                {partners.map((partner) => (
                  <article key={partner.id} className="partner-card">
                    <div className="partner-card-image">
                      <img
                        src={partner.image}
                        alt={partner.name}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = (e.target as HTMLImageElement)
                            .parentElement?.querySelector(
                              '.partner-card-fallback'
                            ) as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="partner-card-fallback">
                        {partner.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="partner-card-overlay" />

                      {partner.since && (
                        <span className="partner-card-badge">
                          Since {partner.since}
                        </span>
                      )}
                    </div>

                    <div className="partner-card-content">
                      <h3 className="partner-card-name">{partner.name}</h3>
                      <p className="partner-card-location">
                        <FontAwesomeIcon icon={faLocationDot} />
                        {partner.location}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="partner-empty">
                <FontAwesomeIcon icon={faLayerGroup} />
                <h3>Partners coming soon</h3>
                <p>
                  We're onboarding {config.title.toLowerCase()} partners right
                  now.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ===== BECOME A PARTNER CTA ===== */}
        <section className="partner-cta">
          <div className="partner-cta-bg" />
          <div className="partner-cta-container">
            <div className="partner-cta-icon">
              <FontAwesomeIcon icon={faHandshake} />
            </div>
            <h2 className="partner-cta-title">Want to Join Them?</h2>
            <p className="partner-cta-text">
              Become a {config.shortLabel.toLowerCase()} partner and reach
              thousands of travelers across the world.
            </p>
            <div className="partner-cta-actions">
              <Link
                href="/about/partnership#apply"
                className="partner-cta-btn primary"
              >
                Apply to Partner
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              <Link
                href="/about/partnership"
                className="partner-cta-btn secondary"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to Partnership
              </Link>
            </div>

            <div className="partner-cta-contact">
              <span>
                <FontAwesomeIcon icon={faEnvelope} />
                partners@techtourghana.com
              </span>
              <span>
                <FontAwesomeIcon icon={faPhone} />
                +233 (0) 30 123 4567
              </span>
            </div>
          </div>
        </section>

        <BackToTop accentColor="teal" />

        <style jsx>{`
          /* ===== NOT FOUND ===== */
          .partner-notfound {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }

          .partner-notfound-inner {
            text-align: center;
            max-width: 500px;
          }

          .partner-notfound h1 {
            font-size: 2rem;
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 12px 0;
          }

          .partner-notfound p {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            margin: 0 0 24px 0;
          }

          .partner-notfound-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: #139EA2;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.25s ease;
          }

          .partner-notfound-btn:hover {
            background: #0D7A7D;
            transform: translateY(-2px);
          }

          /* ===== PAGE ===== */
          .partner-directory-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== HERO ===== */
          .partner-hero {
            position: relative;
            overflow: hidden;
            padding: 48px 32px 72px;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .partner-hero-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 15% 20%,
                rgba(230, 166, 77, 0.3) 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 85% 80%,
                rgba(255, 255, 255, 0.15) 0%,
                transparent 45%
              );
          }

          .partner-hero-container {
            position: relative;
            z-index: 2;
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          /* ===== BREADCRUMB , LEFT ALIGNED ===== */
          .partner-breadcrumb {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            /* Explicit left alignment */
            justify-content: flex-start;
            align-self: flex-start;
          }

          .partner-breadcrumb-back {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.15);
            color: #FFFFFF;
            cursor: pointer;
            transition: all 0.25s ease;
            font-size: 14px;
            flex-shrink: 0;
            backdrop-filter: blur(10px);
            font-family: inherit;
          }

          .partner-breadcrumb-back:hover {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #139EA2;
            transform: translateX(-3px);
          }

          .partner-breadcrumb-trail {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .partner-breadcrumb-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 0.85rem;
            font-weight: 600;
            text-decoration: none;
            white-space: nowrap;
            transition: all 0.25s ease;
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.12);
            color: rgba(255, 255, 255, 0.95);
          }

          .partner-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.6);
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .partner-breadcrumb-btn.current {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #139EA2;
            font-weight: 700;
            cursor: default;
          }

          .partner-breadcrumb-sep {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            flex-shrink: 0;
          }

          /* ===== HERO CONTENT , LEFT ALIGNED ===== */
          .partner-hero-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            max-width: 800px;
          }

          .partner-hero-icon {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
          }

          .partner-hero-eyebrow {
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #E6A64D;
          }

          .partner-hero-title {
            font-size: clamp(1.8rem, 4.5vw, 3rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0;
            line-height: 1.15;
            letter-spacing: -0.02em;
          }

          .partner-hero-accent {
            color: #E6A64D;
          }

          .partner-hero-subtitle {
            font-size: clamp(0.95rem, 1.5vw, 1.1rem);
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0;
          }

          /* ===== STATS , LEFT ALIGNED ===== */
          .partner-hero-stats {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            margin-top: 8px;
          }

          .partner-hero-stat {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 22px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 14px;
            transition: all 0.25s ease;
          }

          .partner-hero-stat:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.35);
            transform: translateY(-2px);
          }

          .partner-hero-stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: rgba(230, 166, 77, 0.2);
            color: #E6A64D;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
          }

          .partner-hero-stat-body {
            display: flex;
            flex-direction: column;
            line-height: 1.1;
          }

          .partner-hero-stat-value {
            font-size: 1.4rem;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.02em;
          }

          .partner-hero-stat-label {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.8);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            margin-top: 2px;
          }

          /* ===== GRID SECTION ===== */
          .partner-grid-section {
            padding: 72px 32px 80px;
          }

          .partner-grid-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .partner-grid-header {
            text-align: center;
            margin-bottom: 48px;
          }

          .section-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #139EA2;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .section-label :global(svg) {
            font-size: 13px;
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
            max-width: 640px;
          }

          /* ===== PARTNER GRID ===== */
          .partner-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
          }

          .partner-card {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 18px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
          }

          .partner-card:hover {
            transform: translateY(-6px);
            border-color: rgba(19, 158, 162, 0.4);
            box-shadow: var(--sp-shadow-lg);
          }

          .partner-card-image {
            position: relative;
            width: 100%;
            aspect-ratio: 1 / 1;
            overflow: hidden;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .partner-card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            display: block;
          }

          .partner-card:hover .partner-card-image img {
            transform: scale(1.06);
          }

          .partner-card-fallback {
            position: absolute;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
            color: #FFFFFF;
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 2px;
            z-index: 1;
          }

          .partner-card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              transparent 55%,
              rgba(0, 0, 0, 0.25) 100%
            );
            pointer-events: none;
          }

          .partner-card-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 5px 12px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            color: #139EA2;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            z-index: 2;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          }

          .partner-card-content {
            padding: 18px 18px 20px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .partner-card-name {
            font-size: 1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 6px 0;
            line-height: 1.3;
            letter-spacing: -0.01em;
          }

          .partner-card-location {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.78rem;
            color: var(--sp-text-secondary);
            margin: 0;
            line-height: 1.4;
          }

          .partner-card-location :global(svg) {
            color: #139EA2;
            font-size: 11px;
            flex-shrink: 0;
          }

          /* ===== EMPTY ===== */
          .partner-empty {
            text-align: center;
            padding: 80px 20px;
            color: var(--sp-text-muted);
          }

          .partner-empty :global(svg) {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.3;
          }

          .partner-empty h3 {
            font-size: 1.2rem;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .partner-empty p {
            font-size: 0.9rem;
            margin: 0;
          }

          /* ===== CTA ===== */
          .partner-cta {
            position: relative;
            padding: 80px 32px;
            overflow: hidden;
          }

          .partner-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .partner-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .partner-cta-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
          }

          .partner-cta-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .partner-cta-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 0 32px 0;
          }

          .partner-cta-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .partner-cta-btn {
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

          .partner-cta-btn.primary {
            background: #E6A64D;
            color: #1A1A2E;
            box-shadow: 0 8px 24px rgba(230, 166, 77, 0.3);
          }

          .partner-cta-btn.primary:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .partner-cta-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(10px);
          }

          .partner-cta-btn.secondary:hover {
            background: #FFFFFF;
            color: #139EA2;
            transform: translateY(-3px);
          }

          .partner-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .partner-cta-btn.primary:hover :global(svg) {
            transform: translateX(4px);
          }

          .partner-cta-contact {
            display: flex;
            gap: 24px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          }

          .partner-cta-contact span {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.85rem;
          }

          .partner-cta-contact :global(svg) {
            font-size: 13px;
            opacity: 0.8;
          }

          /* ===== RESPONSIVE ===== */

          /* Tablet , 3 columns */
          @media (max-width: 992px) {
            .partner-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }

            .partner-hero {
              padding: 40px 28px 64px;
            }

            .partner-hero-content {
              max-width: 100%;
            }
          }

          /* Small tablet , 2 columns */
          @media (max-width: 768px) {
            .partner-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }

            .partner-hero-stats {
              gap: 12px;
            }
          }

          /* Mobile */
          @media (max-width: 640px) {
            .partner-hero {
              padding: 32px 20px 56px;
            }

            .partner-hero-container {
              gap: 24px;
            }

            /* Breadcrumb , stays LEFT aligned on mobile */
            .partner-breadcrumb {
              gap: 8px;
              justify-content: flex-start;
              align-self: flex-start;
              width: 100%;
            }

            .partner-breadcrumb-back {
              width: 34px;
              height: 34px;
              font-size: 12px;
            }

            .partner-breadcrumb-btn {
              padding: 6px 12px;
              font-size: 0.75rem;
              border-radius: 8px;
            }

            .partner-breadcrumb-sep {
              font-size: 8px;
            }

            /* Hero content */
            .partner-hero-icon {
              width: 60px;
              height: 60px;
              font-size: 22px;
              border-radius: 16px;
            }

            .partner-hero-eyebrow {
              font-size: 11px;
              letter-spacing: 1.5px;
            }

            .partner-hero-title {
              font-size: 1.65rem;
            }

            .partner-hero-subtitle {
              font-size: 0.9rem;
            }

            /* Stats , 3 equal columns on mobile */
            .partner-hero-stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              width: 100%;
              margin-top: 4px;
            }

            .partner-hero-stat {
              flex-direction: column;
              align-items: center;
              text-align: center;
              padding: 12px 8px;
              gap: 8px;
              border-radius: 12px;
            }

            .partner-hero-stat-icon {
              width: 32px;
              height: 32px;
              font-size: 13px;
              border-radius: 9px;
            }

            .partner-hero-stat-value {
              font-size: 1.1rem;
            }

            .partner-hero-stat-label {
              font-size: 0.58rem;
              letter-spacing: 0.5px;
            }

            /* Grid section */
            .partner-grid-section {
              padding: 48px 20px 60px;
            }

            .partner-grid-header {
              margin-bottom: 36px;
            }

            .partner-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }

            .partner-card {
              border-radius: 14px;
            }

            .partner-card-content {
              padding: 12px 12px 14px;
            }

            .partner-card-name {
              font-size: 0.85rem;
            }

            .partner-card-location {
              font-size: 0.7rem;
            }

            .partner-card-badge {
              top: 8px;
              right: 8px;
              padding: 4px 9px;
              font-size: 9px;
            }

            .partner-card-fallback {
              font-size: 32px;
            }

            /* CTA */
            .partner-cta {
              padding: 60px 20px;
            }

            .partner-cta-actions {
              flex-direction: column;
            }

            .partner-cta-btn {
              justify-content: center;
            }

            .partner-cta-contact {
              flex-direction: column;
              gap: 12px;
              align-items: center;
            }
          }

          /* Extra small phones */
          @media (max-width: 380px) {
            .partner-breadcrumb-btn {
              padding: 5px 10px;
              font-size: 0.7rem;
            }

            .partner-breadcrumb-back {
              width: 30px;
              height: 30px;
              font-size: 11px;
            }

            .partner-hero-stat {
              padding: 10px 6px;
            }

            .partner-hero-stat-value {
              font-size: 1rem;
            }

            .partner-hero-stat-label {
              font-size: 0.55rem;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}