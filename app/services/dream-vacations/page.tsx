"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUmbrellaBeach,
  faHotel,
  faPlane,
  faMapSigns,
  faUtensils,
  faSpa,
  faUsers,
  faArrowRight,
  faStar,
  faLocationDot,
  faClock,
  faFilter,
  faHeart,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import ServiceHero from '@/components/ServiceHero';
import { ServiceTheme } from '@/components/ServiceTheme';

interface Vacation {
  id: number;
  title: string;
  destination: string;
  country: string;
  flag: string;
  type: 'beach' | 'safari' | 'city' | 'luxury' | 'adventure';
  duration: string;
  rating: number;
  price: string;
  oldPrice?: string;
  description: string;
  highlights: string[];
  image: string;
  badge?: string;
}

const vacations: Vacation[] = [
  {
    id: 1,
    title: 'Maldives Luxury Escape',
    destination: 'Maldives',
    country: 'Maldives',
    flag: '🇲🇻',
    type: 'beach',
    duration: '7 days / 6 nights',
    rating: 4.9,
    price: 'From GHS 25,000',
    oldPrice: 'GHS 32,000',
    description: 'Overwater villa, private beach, and world-class spa treatments in paradise.',
    highlights: ['Overwater Villa', 'All-Inclusive', 'Spa & Wellness'],
    image: '/images/vacations/maldives.jpg',
    badge: 'Best Seller',
  },
  {
    id: 2,
    title: 'Kenya Safari Adventure',
    destination: 'Masai Mara',
    country: 'Kenya',
    flag: '🇰🇪',
    type: 'safari',
    duration: '5 days / 4 nights',
    rating: 4.8,
    price: 'From GHS 18,000',
    description: 'Witness the Great Migration and the Big Five in luxury tented camps.',
    highlights: ['Big Five Safari', 'Luxury Tented Camp', 'Game Drives'],
    image: '/images/vacations/kenya.jpg',
  },
  {
    id: 3,
    title: 'Dubai City & Luxury',
    destination: 'Dubai',
    country: 'UAE',
    flag: '🇦🇪',
    type: 'city',
    duration: '4 days / 3 nights',
    rating: 4.7,
    price: 'From GHS 15,000',
    description: 'Experience the futuristic skyline, desert safaris, and world-class shopping.',
    highlights: ['Burj Khalifa', 'Desert Safari', 'Luxury Shopping'],
    image: '/images/vacations/dubai.jpg',
    badge: 'Popular',
  },
  {
    id: 4,
    title: 'Santorini Sunset Romance',
    destination: 'Santorini',
    country: 'Greece',
    flag: '🇬🇷',
    type: 'luxury',
    duration: '6 days / 5 nights',
    rating: 4.9,
    price: 'From GHS 22,000',
    description: 'Whitewashed villas, iconic sunsets, and Mediterranean charm for two.',
    highlights: ['Cliffside Villa', 'Sunset Cruise', 'Wine Tasting'],
    image: '/images/vacations/santorini.jpg',
    badge: 'Romantic',
  },
  {
    id: 5,
    title: 'Bali Wellness Retreat',
    destination: 'Bali',
    country: 'Indonesia',
    flag: '🇮🇩',
    type: 'luxury',
    duration: '8 days / 7 nights',
    rating: 4.8,
    price: 'From GHS 19,000',
    oldPrice: 'GHS 24,000',
    description: 'Rejuvenate your mind, body, and soul in a tropical wellness sanctuary.',
    highlights: ['Yoga & Meditation', 'Spa Treatments', 'Organic Cuisine'],
    image: '/images/vacations/bali.jpg',
    badge: 'Wellness',
  },
  {
    id: 6,
    title: 'Cape Town Discovery',
    destination: 'Cape Town',
    country: 'South Africa',
    flag: '🇿🇦',
    type: 'city',
    duration: '6 days / 5 nights',
    rating: 4.7,
    price: 'From GHS 14,000',
    description: 'Table Mountain, wine country, and stunning coastal drives in one trip.',
    highlights: ['Table Mountain', 'Wine Tasting', 'Cape Point'],
    image: '/images/vacations/capetown.jpg',
  },
];

const categories = [
  { id: 'all', label: 'All Vacations', icon: faUmbrellaBeach },
  { id: 'beach', label: 'Beach', icon: faUmbrellaBeach },
  { id: 'safari', label: 'Safari', icon: faMapSigns },
  { id: 'city', label: 'City', icon: faHotel },
  { id: 'luxury', label: 'Luxury', icon: faSpa },
  { id: 'adventure', label: 'Adventure', icon: faPlane },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  beach: { bg: 'rgba(19, 158, 162, 0.12)', text: '#139EA2' },
  safari: { bg: 'rgba(230, 166, 77, 0.15)', text: '#D4953A' },
  city: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6' },
  luxury: { bg: 'rgba(236, 72, 153, 0.12)', text: '#EC4899' },
  adventure: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981' },
};

export default function DreamVacationsPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredVacations =
    activeCategory === 'all'
      ? vacations
      : vacations.filter((v) => v.type === activeCategory);

  return (
    <ServiceTheme>
      <main className="dream-vacations-page">
        {/* ===== HERO ===== */}
        <ServiceHero
          title="Your Perfect"
          titleAccent="Getaway Awaits"
          description="Curated all-inclusive vacation packages that blend luxury, culture, and adventure. From beachfront resorts to safari lodges, we craft trips you'll never forget."
          accentColor="teal"
        />

        {/* ===== INTRO STATS ===== */}
        <section className="intro-stats-section">
          <div className="intro-stats-container">
            <div className="intro-stat">
              <div className="intro-stat-value">100+</div>
              <div className="intro-stat-label">Destinations</div>
            </div>
            <div className="intro-stat">
              <div className="intro-stat-value">300+</div>
              <div className="intro-stat-label">Partner Resorts</div>
            </div>
            <div className="intro-stat">
              <div className="intro-stat-value">5K+</div>
              <div className="intro-stat-label">Dream Trips</div>
            </div>
            <div className="intro-stat">
              <div className="intro-stat-value">4.9</div>
              <div className="intro-stat-label">Client Rating</div>
            </div>
          </div>
        </section>

        {/* ===== VACATIONS SECTION ===== */}
        <section className="vacations-section">
          <div className="vacations-container">
            <div className="vacations-header">
              <div className="vacations-header-content">
                <span className="vacations-label">Explore</span>
                <h2 className="vacations-title">
                  Find Your <span className="vacations-title-accent">Perfect Escape</span>
                </h2>
                <p className="vacations-subtitle">
                  From tropical beaches to mountain adventures, discover curated all-inclusive packages for every dream.
                </p>
              </div>
            </div>

            {/* ===== FILTER ===== */}
            <div className="vacations-filter">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <FontAwesomeIcon icon={cat.icon} />
                  <span>{cat.label}</span>
                  {activeCategory === cat.id && (
                    <span className="filter-count">
                      {cat.id === 'all' ? vacations.length : filteredVacations.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ===== VACATIONS GRID ===== */}
            <div className="vacations-grid">
              {filteredVacations.map((vacation) => {
                const catColor = categoryColors[vacation.type]!;
                return (
                  <article key={vacation.id} className="vacation-card">
                    <div className="vacation-image">
                      <img
                        src={vacation.image}
                        alt={vacation.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Crect width='400' height='280' fill='%23139EA2'/%3E%3Ctext x='200' y='140' font-family='Inter' font-size='22' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                            vacation.title
                          )}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                      <div className="vacation-image-overlay" />

                      <div className="vacation-image-badges">
                        <span
                          className="vacation-type-badge"
                          style={{ background: catColor.bg, color: catColor.text }}
                        >
                          <FontAwesomeIcon
                            icon={
                              categories.find((c) => c.id === vacation.type)?.icon ||
                              faUmbrellaBeach
                            }
                          />
                          {vacation.type.charAt(0).toUpperCase() + vacation.type.slice(1)}
                        </span>
                        {vacation.badge && (
                          <span className="vacation-promo-badge">
                            <FontAwesomeIcon icon={faHeart} />
                            {vacation.badge}
                          </span>
                        )}
                      </div>

                      <div className="vacation-image-bottom">
                        <span className="vacation-flag">{vacation.flag}</span>
                        <span className="vacation-rating">
                          <FontAwesomeIcon icon={faStar} />
                          {vacation.rating}
                        </span>
                      </div>
                    </div>

                    <div className="vacation-content">
                      <div className="vacation-meta">
                        <span className="vacation-meta-item">
                          <FontAwesomeIcon icon={faLocationDot} />
                          {vacation.destination}
                        </span>
                        <span className="vacation-meta-item">
                          <FontAwesomeIcon icon={faClock} />
                          {vacation.duration}
                        </span>
                      </div>

                      <h3 className="vacation-title-card">{vacation.title}</h3>
                      <p className="vacation-description">{vacation.description}</p>

                      <div className="vacation-highlights">
                        {vacation.highlights.map((highlight, idx) => (
                          <span key={idx} className="vacation-highlight">
                            {highlight}
                          </span>
                        ))}
                      </div>

                      <div className="vacation-footer">
                        <div className="vacation-price-block">
                          {vacation.oldPrice && (
                            <span className="vacation-old-price">
                              {vacation.oldPrice}
                            </span>
                          )}
                          <span className="vacation-price">{vacation.price}</span>
                        </div>
                        <Link
                          href={`/services/dream-vacations/${vacation.id}`}
                          className="vacation-cta"
                        >
                          Book Now
                          <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* ===== LOAD MORE AS GRID CARD ===== */}
              <article className="vacation-card load-more-card">
                <Link href="/services/dream-vacations/all" className="load-more-link">
                  <div className="load-more-card-content">
                    <div className="load-more-icon">
                      <FontAwesomeIcon icon={faLayerGroup} />
                    </div>
                    <h3 className="load-more-title">Load More Vacations</h3>
                    <p className="load-more-desc">
                      Explore all {vacations.length}+ all-inclusive packages worldwide with advanced filters
                    </p>
                    <span className="load-more-cta">
                      View All Vacations
                      <FontAwesomeIcon icon={faArrowRight} />
                    </span>
                  </div>
                </Link>
              </article>
            </div>

            {filteredVacations.length === 0 && (
              <div className="vacations-empty">
                <FontAwesomeIcon icon={faFilter} />
                <h3>No vacations found</h3>
                <p>Try a different category</p>
              </div>
            )}
          </div>
        </section>

        {/* ===== INCLUDED SECTION ===== */}
        <section className="included-section">
          <div className="included-container">
            <div className="included-header">
              <span className="included-label">All-Inclusive</span>
              <h2 className="included-title">
                Every Package <span className="included-title-accent">Includes</span>
              </h2>
            </div>

            <div className="included-grid">
              <div className="included-item">
                <FontAwesomeIcon icon={faHotel} />
                <h4>Luxury Stays</h4>
                <p>Handpicked 4-5 star resorts</p>
              </div>
              <div className="included-item">
                <FontAwesomeIcon icon={faPlane} />
                <h4>Flights & Transfers</h4>
                <p>Round-trip airfare included</p>
              </div>
              <div className="included-item">
                <FontAwesomeIcon icon={faUtensils} />
                <h4>All Meals</h4>
                <p>Full board and drinks</p>
              </div>
              <div className="included-item">
                <FontAwesomeIcon icon={faMapSigns} />
                <h4>Curated Activities</h4>
                <p>Tours and experiences</p>
              </div>
              <div className="included-item">
                <FontAwesomeIcon icon={faSpa} />
                <h4>Wellness Access</h4>
                <p>Spa and wellness facilities</p>
              </div>
              <div className="included-item">
                <FontAwesomeIcon icon={faUsers} />
                <h4>24/7 Concierge</h4>
                <p>Dedicated support team</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="vacations-cta">
          <div className="vacations-cta-bg" />
          <div className="vacations-cta-container">
            <h2 className="vacations-cta-title">Let's Plan Your Dream Vacation</h2>
            <p className="vacations-cta-text">
              Speak with our vacation specialists and start crafting the trip you've always imagined.
            </p>
            <Link href="/contact" className="vacations-cta-btn">
              Plan My Vacation
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>

        {/* ===== BACK TO TOP ===== */}
        <BackToTop accentColor="teal" />

        <style jsx>{`
          .dream-vacations-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== INTRO STATS ===== */
          .intro-stats-section {
            padding: 0 32px;
            margin-top: -40px;
            margin-bottom: 60px;
            position: relative;
            z-index: 10;
          }

          .intro-stats-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }

          .intro-stat {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 16px;
            padding: 24px 20px;
            text-align: center;
            box-shadow: var(--sp-shadow-md);
            transition: all 0.3s ease;
          }

          .intro-stat:hover {
            transform: translateY(-4px);
            box-shadow: var(--sp-shadow-lg);
            border-color: var(--sp-border-hover);
          }

          .intro-stat-value {
            font-size: 2rem;
            font-weight: 800;
            color: #139EA2;
            line-height: 1;
            letter-spacing: -0.02em;
          }

          .intro-stat-label {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            font-weight: 500;
            margin-top: 6px;
          }

          /* ===== VACATIONS SECTION ===== */
          .vacations-section {
            padding: 20px 32px 80px;
          }

          .vacations-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .vacations-header {
            margin-bottom: 40px;
          }

          .vacations-header-content {
            max-width: 700px;
          }

          .vacations-label {
            display: inline-block;
            color: #139EA2;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .vacations-title {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .vacations-title-accent {
            color: #139EA2;
          }

          .vacations-subtitle {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            line-height: 1.7;
            margin: 0;
          }

          /* ===== FILTER ===== */
          .vacations-filter {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 32px;
            padding: 8px;
            background: var(--sp-bg-card);
            border-radius: 16px;
            border: 1px solid var(--sp-border);
            box-shadow: var(--sp-shadow-sm);
            width: fit-content;
          }

          .filter-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            background: transparent;
            border: none;
            border-radius: 10px;
            color: var(--sp-text-secondary);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
            white-space: nowrap;
          }

          .filter-btn :global(svg) {
            font-size: 12px;
            color: var(--sp-text-muted);
            transition: color 0.25s ease;
          }

          .filter-btn:hover {
            background: rgba(19, 158, 162, 0.06);
            color: #139EA2;
          }

          .filter-btn:hover :global(svg) {
            color: #139EA2;
          }

          .filter-btn.active {
            background: #139EA2;
            color: #FFFFFF;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(19, 158, 162, 0.25);
          }

          .filter-btn.active :global(svg) {
            color: #FFFFFF;
          }

          .filter-count {
            background: rgba(255, 255, 255, 0.2);
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 4px;
          }

          /* ===== VACATIONS GRID ===== */
          .vacations-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .vacation-card {
            background: var(--sp-bg-card);
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid var(--sp-border);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
          }

          .vacation-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--sp-shadow-lg);
            border-color: var(--sp-border-hover);
          }

          /* ===== IMAGE ===== */
          .vacation-image {
            position: relative;
            height: 240px;
            overflow: hidden;
            background: linear-gradient(135deg, #139EA2, #0D7A7D);
          }

          .vacation-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .vacation-card:hover .vacation-image img {
            transform: scale(1.08);
          }

          .vacation-image-overlay {
            position: absolute;
            inset: 0;
            background: var(--sp-overlay-gradient);
          }

          .vacation-image-badges {
            position: absolute;
            top: 14px;
            left: 14px;
            right: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }

          .vacation-type-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
          }

          .vacation-type-badge :global(svg) {
            font-size: 10px;
          }

          .vacation-promo-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 12px;
            background: rgba(230, 166, 77, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            color: #1A1A2E;
            letter-spacing: 0.3px;
            text-transform: uppercase;
          }

          .vacation-promo-badge :global(svg) {
            font-size: 9px;
          }

          .vacation-image-bottom {
            position: absolute;
            bottom: 14px;
            left: 14px;
            right: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .vacation-flag {
            font-size: 26px;
            line-height: 1;
            filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
          }

          .vacation-rating {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            color: #1A1A2E;
          }

          .vacation-rating :global(svg) {
            color: #E6A64D;
            font-size: 10px;
          }

          /* ===== CONTENT ===== */
          .vacation-content {
            padding: 20px 22px 22px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .vacation-meta {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }

          .vacation-meta-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            color: var(--sp-text-muted);
            font-weight: 500;
          }

          .vacation-meta-item :global(svg) {
            font-size: 10px;
            color: #139EA2;
          }

          .vacation-title-card {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 10px 0;
            letter-spacing: -0.01em;
            line-height: 1.3;
          }

          .vacation-description {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0 0 14px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .vacation-highlights {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 18px;
          }

          .vacation-highlight {
            font-size: 0.7rem;
            color: var(--sp-tag-text);
            background: var(--sp-tag-bg);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
            border: 1px solid var(--sp-tag-border);
          }

          .vacation-footer {
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid var(--sp-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .vacation-price-block {
            display: flex;
            flex-direction: column;
            line-height: 1.1;
          }

          .vacation-old-price {
            font-size: 0.7rem;
            color: var(--sp-text-muted);
            text-decoration: line-through;
            margin-bottom: 2px;
          }

          .vacation-price {
            font-size: 0.85rem;
            font-weight: 700;
            color: #139EA2;
          }

          .vacation-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 16px;
            background: #139EA2;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 10px;
            font-size: 0.78rem;
            font-weight: 600;
            transition: all 0.25s ease;
            white-space: nowrap;
          }

          .vacation-cta:hover {
            background: #0D7A7D;
            transform: translateX(3px);
          }

          .vacation-cta :global(svg) {
            font-size: 10px;
          }

          /* ===== LOAD MORE AS GRID CARD ===== */
          .load-more-card {
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
            border: none;
            min-height: 100%;
            display: flex;
            align-items: stretch;
          }

          .load-more-link {
            display: flex;
            width: 100%;
            text-decoration: none;
            color: #FFFFFF;
            border-radius: 18px;
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .load-more-card-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 28px;
            width: 100%;
            gap: 12px;
          }

          .load-more-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            color: #FFFFFF;
            margin-bottom: 8px;
            transition: all 0.3s ease;
          }

          .load-more-card:hover .load-more-icon {
            background: rgba(255, 255, 255, 0.25);
            transform: scale(1.1) rotate(8deg);
          }

          .load-more-title {
            font-size: 1.15rem;
            font-weight: 800;
            color: #FFFFFF;
            margin: 0;
            letter-spacing: -0.01em;
          }

          .load-more-desc {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.5;
            margin: 0;
            max-width: 240px;
          }

          .load-more-cta {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 22px;
            background: #FFFFFF;
            color: #139EA2;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 700;
            margin-top: 8px;
            transition: all 0.3s ease;
          }

          .load-more-card:hover .load-more-cta {
            background: #E6A64D;
            color: #1A1A2E;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(230, 166, 77, 0.4);
          }

          .load-more-cta :global(svg) {
            font-size: 12px;
            transition: transform 0.3s ease;
          }

          .load-more-card:hover .load-more-cta :global(svg) {
            transform: translateX(3px);
          }

          /* ===== EMPTY STATE ===== */
          .vacations-empty {
            text-align: center;
            padding: 80px 20px;
            color: var(--sp-text-muted);
          }

          .vacations-empty :global(svg) {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.3;
          }

          .vacations-empty h3 {
            font-size: 1.2rem;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .vacations-empty p {
            font-size: 0.9rem;
            margin: 0;
          }

          /* ===== INCLUDED SECTION ===== */
          .included-section {
            padding: 80px 32px;
            background: var(--sp-bg-secondary);
            border-top: 1px solid var(--sp-border);
            transition: background 0.4s ease;
          }

          .included-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .included-header {
            text-align: center;
            margin-bottom: 48px;
          }

          .included-label {
            display: inline-block;
            color: #139EA2;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .included-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .included-title-accent {
            color: #139EA2;
          }

          .included-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 20px;
          }

          .included-item {
            text-align: center;
            padding: 20px 12px;
            border-radius: 14px;
            background: var(--sp-bg-card);
            transition: all 0.3s ease;
          }

          .included-item:hover {
            background: rgba(19, 158, 162, 0.08);
            transform: translateY(-4px);
          }

          .included-item :global(svg) {
            font-size: 26px;
            color: #139EA2;
            margin-bottom: 12px;
          }

          .included-item h4 {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 4px 0;
          }

          .included-item p {
            font-size: 0.78rem;
            color: var(--sp-text-secondary);
            margin: 0;
            line-height: 1.4;
          }

          /* ===== CTA ===== */
          .vacations-cta {
            position: relative;
            padding: 80px 32px;
            overflow: hidden;
          }

          .vacations-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .vacations-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .vacations-cta-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .vacations-cta-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 0 28px 0;
          }

          .vacations-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: #E6A64D;
            color: #1A1A2E;
            text-decoration: none;
            border-radius: 30px;
            font-size: 0.95rem;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: 0 8px 24px rgba(230, 166, 77, 0.3);
          }

          .vacations-cta-btn:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .vacations-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .vacations-cta-btn:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 992px) {
            .vacations-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .included-grid {
              grid-template-columns: repeat(3, 1fr);
            }
            .intro-stats-container {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 640px) {
            .intro-stats-section {
              padding: 0 20px;
              margin-top: -30px;
              margin-bottom: 40px;
            }
            .vacations-section {
              padding: 20px 20px 60px;
            }
            .vacations-grid {
              grid-template-columns: 1fr;
            }
            .vacations-filter {
              width: 100%;
              overflow-x: auto;
              flex-wrap: nowrap;
              scrollbar-width: none;
            }
            .vacations-filter::-webkit-scrollbar {
              display: none;
            }
            .filter-btn {
              flex-shrink: 0;
            }
            .included-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .included-section,
            .vacations-cta {
              padding: 60px 20px;
            }
            .intro-stat {
              padding: 18px 14px;
            }
            .intro-stat-value {
              font-size: 1.5rem;
            }
            .intro-stat-label {
              font-size: 0.75rem;
            }
            .vacation-footer {
              flex-direction: column;
              align-items: stretch;
            }
            .vacation-cta {
              justify-content: center;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}