"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faChevronRight,
  faStar,
  faMapMarkedAlt,
  faClock,
  faCalendarAlt,
  faUsers,
  faCheckCircle,
  faHeart,
  faShare,
  faLocationDot,
  faArrowRight,
  faShieldAlt,
  faGlobeAfrica,
  faHandshake,
  faHotel,
  faPlane,
  faUtensils,
  faCamera,
  faCompass,
  faSpa,
  faUmbrellaBeach,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
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
  longDescription: string;
  highlights: string[];
  included: string[];
  image: string;
  gallery: string[];
  bestTime: string;
  groupSize: string;
  difficulty: string;
  badge?: string;
}

const vacationsData: Record<number, Vacation> = {
  1: {
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
    longDescription:
      'Escape to the pristine atolls of the Maldives, where crystal-clear turquoise waters meet powder-white sands. Your journey begins with a scenic seaplane transfer to your private overwater villa, complete with a glass floor, infinity pool, and direct lagoon access. Spend your days snorkeling vibrant coral reefs, indulging in world-class spa treatments, and dining on fresh seafood under the stars. This all-inclusive package is designed for travelers seeking the ultimate blend of luxury, romance, and natural beauty.',
    highlights: [
      'Overwater Villa with Private Pool',
      'All-Inclusive Dining & Premium Drinks',
      'Daily Spa Treatment',
      'Snorkeling & Water Sports',
      'Sunset Dolphin Cruise',
    ],
    included: [
      'Round-trip international flights',
      'Seaplane transfers to resort',
      '6 nights in overwater villa',
      'All meals & premium beverages',
      'Daily spa & wellness access',
      'Snorkeling gear & water sports',
      'Sunset dolphin cruise',
      '24/7 dedicated concierge',
    ],
    image: '/images/vacations/maldives.jpg',
    gallery: [
      '/images/vacations/maldives-1.jpg',
      '/images/vacations/maldives-2.jpg',
      '/images/vacations/maldives-3.jpg',
    ],
    bestTime: 'November - April',
    groupSize: '2-4 people',
    difficulty: 'Easy',
    badge: 'Best Seller',
  },
};

// Fallback generator
const getVacationById = (id: number): Vacation => {
  if (vacationsData[id]) return vacationsData[id];

  return {
    id,
    title: 'Dream Vacation Package',
    destination: 'Paradise Destination',
    country: 'International',
    flag: '',
    type: 'luxury',
    duration: '7 days / 6 nights',
    rating: 4.8,
    price: 'From GHS 20,000',
    description: 'An unforgettable all-inclusive vacation crafted for the perfect getaway.',
    longDescription:
      'This exceptional vacation package offers the perfect blend of relaxation, adventure, and cultural immersion. From luxurious accommodations to curated experiences, every detail has been thoughtfully designed to create memories that last a lifetime. Our expert travel designers ensure you experience the very best of your destination.',
    highlights: [
      'Luxury Accommodations',
      'All-Inclusive Dining',
      'Curated Activities',
      'Personal Concierge',
      'Seamless Travel',
    ],
    included: [
      'Round-trip flights',
      'Airport transfers',
      'Accommodation',
      'All meals & drinks',
      'Curated activities',
      '24/7 support',
    ],
    image: '/images/vacations/default.jpg',
    gallery: [],
    bestTime: 'Year-round',
    groupSize: '2-6 people',
    difficulty: 'Easy',
  };
};

const categoryColors: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  beach: { bg: 'rgba(19, 158, 162, 0.12)', text: '#139EA2', label: 'Beach', icon: faUmbrellaBeach },
  safari: { bg: 'rgba(230, 166, 77, 0.15)', text: '#D4953A', label: 'Safari', icon: faMapMarkedAlt },
  city: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6', label: 'City', icon: faMapMarkedAlt },
  luxury: { bg: 'rgba(236, 72, 153, 0.12)', text: '#EC4899', label: 'Luxury', icon: faSpa },
  adventure: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', label: 'Adventure', icon: faCompass },
};

export default function VacationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vacationId = Number(params?.id);
  const vacation = getVacationById(vacationId);
  const catColor = categoryColors[vacation.type]!;

  const [activeImage, setActiveImage] = useState(0);
  const [bookingDate, setBookingDate] = useState('');
  const [travelers, setTravelers] = useState(2);

  const images = [vacation.image, ...vacation.gallery].filter(Boolean);

  return (
    <ServiceTheme>
      <main className="vacation-detail-page">
        {/* ===== BREADCRUMB ===== */}
        <nav className="detail-breadcrumb-nav" aria-label="Breadcrumb">
          <div className="detail-breadcrumb-container">

            <div className="detail-breadcrumb-trail">
              <Link href="/" className="detail-breadcrumb-btn">
                Home
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <Link href="/services/dream-vacations" className="detail-breadcrumb-btn">
                Dream Vacations
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <Link href="/services/dream-vacations/all" className="detail-breadcrumb-btn">
                All Vacations
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <span className="detail-breadcrumb-btn current">{vacation.title}</span>
            </div>
          </div>
        </nav>

        {/* ===== HERO GALLERY ===== */}
        <section className="detail-hero">
          <div className="detail-hero-image">
            <img
              src={images[activeImage]}
              alt={vacation.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%23139EA2'/%3E%3Ctext x='600' y='300' font-family='Inter' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                  vacation.title
                )}%3C/text%3E%3C/svg%3E`;
              }}
            />
            <div className="detail-hero-overlay" />

            <div className="detail-hero-badges">
              <span
                className="detail-category-badge"
                style={{ background: catColor.bg, color: catColor.text }}
              >
                <FontAwesomeIcon icon={catColor.icon} />
                {catColor.label}
              </span>
              <span className="detail-rating-badge">
                <FontAwesomeIcon icon={faStar} />
                {vacation.rating}
              </span>
              {vacation.badge && (
                <span className="detail-promo-badge">
                  <FontAwesomeIcon icon={faHeart} />
                  {vacation.badge}
                </span>
              )}
            </div>

            <div className="detail-hero-actions">
              <button className="icon-action-btn" aria-label="Save">
                <FontAwesomeIcon icon={faHeart} />
              </button>
              <button className="icon-action-btn" aria-label="Share">
                <FontAwesomeIcon icon={faShare} />
              </button>
            </div>

            <div className="detail-hero-content">
              <div className="detail-hero-flag">{vacation.flag}</div>
              <h1 className="detail-title">{vacation.title}</h1>
              <div className="detail-meta-row">
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faLocationDot} />
                  {vacation.destination}, {vacation.country}
                </span>
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faClock} />
                  {vacation.duration}
                </span>
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faUsers} />
                  {vacation.groupSize}
                </span>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="detail-gallery-thumbs">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`gallery-thumb ${activeImage === idx ? 'active' : ''}`}
                  onClick={() => setActiveImage(idx)}
                >
                  <img
                    src={img}
                    alt={`${vacation.title} ${idx + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23139EA2'/%3E%3C/svg%3E`;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ===== MAIN CONTENT ===== */}
        <section className="detail-content">
          <div className="detail-content-container">
            {/* LEFT COLUMN */}
            <div className="detail-main">
              <div className="detail-section">
                <h2 className="detail-section-title">About This Experience</h2>
                <p className="detail-long-description">{vacation.longDescription}</p>
              </div>

              <div className="detail-section">
                <h2 className="detail-section-title">Trip Highlights</h2>
                <div className="detail-highlights-grid">
                  {vacation.highlights.map((h, i) => (
                    <div key={i} className="detail-highlight-item">
                      <FontAwesomeIcon icon={faStar} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h2 className="detail-section-title">What's Included</h2>
                <ul className="detail-included-list">
                  {vacation.included.map((item, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h2 className="detail-section-title">Trip Information</h2>
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <div className="info-icon">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </div>
                    <div>
                      <span className="info-label">Best Time to Visit</span>
                      <span className="info-value">{vacation.bestTime}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <div className="info-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div>
                      <span className="info-label">Group Size</span>
                      <span className="info-value">{vacation.groupSize}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <div className="info-icon">
                      <FontAwesomeIcon icon={faCompass} />
                    </div>
                    <div>
                      <span className="info-label">Activity Level</span>
                      <span className="info-value">{vacation.difficulty}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <div className="info-icon">
                      <FontAwesomeIcon icon={faShieldAlt} />
                    </div>
                    <div>
                      <span className="info-label">Protection</span>
                      <span className="info-value">Fully Insured</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h2 className="detail-section-title">Why Book With TechTour Ghana</h2>
                <div className="detail-why-grid">
                  <div className="why-item">
                    <FontAwesomeIcon icon={faGlobeAfrica} />
                    <h4>Curated Destinations</h4>
                    <p>Hand-picked resorts and experiences for exceptional quality</p>
                  </div>
                  <div className="why-item">
                    <FontAwesomeIcon icon={faHandshake} />
                    <h4>Personal Service</h4>
                    <p>Dedicated travel designer from booking to return</p>
                  </div>
                  <div className="why-item">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <h4>Fully Protected</h4>
                    <p>Comprehensive travel insurance and 24/7 support</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - BOOKING CARD */}
            <aside className="detail-sidebar">
              <div className="booking-card">
                <div className="booking-price-row">
                  <div>
                    {vacation.oldPrice && (
                      <span className="booking-old-price">{vacation.oldPrice}</span>
                    )}
                    <span className="booking-price">{vacation.price}</span>
                  </div>
                  <span className="booking-per-person">per person</span>
                </div>

                <div className="booking-divider" />

                <div className="booking-field">
                  <label>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="booking-field">
                  <label>
                    <FontAwesomeIcon icon={faUsers} />
                    Number of Travelers
                  </label>
                  <div className="guest-selector">
                    <button
                      onClick={() => setTravelers(Math.max(1, travelers - 1))}
                      className="guest-btn"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="guest-count">{travelers}</span>
                    <button
                      onClick={() => setTravelers(travelers + 1)}
                      className="guest-btn"
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="booking-total">
                  <span className="total-label">Estimated Total</span>
                  <span className="total-value">
                    GHS{' '}
                    {(
                      parseInt(vacation.price.replace(/\D/g, '')) * travelers
                    ).toLocaleString()}
                  </span>
                </div>

                <button className="booking-submit">
                  Book This Vacation
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>

                <p className="booking-note">
                  <FontAwesomeIcon icon={faShieldAlt} />
                  No charge until confirmed
                </p>

                <div className="booking-contact">
                  <p>
                    Need help? <a href="/contact">Talk to us</a>
                  </p>
                </div>
              </div>

              <div className="quick-facts">
                <h3 className="quick-facts-title">Quick Facts</h3>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faLocationDot} />
                  <div>
                    <span className="qf-label">Destination</span>
                    <span className="qf-value">{vacation.destination}</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <span className="qf-label">Duration</span>
                    <span className="qf-value">{vacation.duration}</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faStar} />
                  <div>
                    <span className="qf-label">Rating</span>
                    <span className="qf-value">{vacation.rating} / 5</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faCamera} />
                  <div>
                    <span className="qf-label">Photo Friendly</span>
                    <span className="qf-value">Yes</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="detail-cta">
          <div className="detail-cta-container">
            <h2 className="detail-cta-title">Explore More Dream Vacations</h2>
            <p className="detail-cta-text">
              Discover more unforgettable all-inclusive experiences worldwide.
            </p>
            <Link href="/services/dream-vacations/all" className="detail-cta-btn">
              View All Vacations
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>

        <BackToTop accentColor="teal" />

        <style jsx>{`
          .vacation-detail-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== BREADCRUMB ===== */
          .detail-breadcrumb-nav {
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
            padding: 20px 32px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          }

          .detail-breadcrumb-container {
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .detail-breadcrumb-back {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            cursor: pointer;
            transition: all 0.25s ease;
            font-size: 14px;
            flex-shrink: 0;
            backdrop-filter: blur(10px);
            font-family: inherit;
          }

          .detail-breadcrumb-back:hover {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #139EA2;
            transform: translateX(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .detail-breadcrumb-trail {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .detail-breadcrumb-btn {
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
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.9);
            letter-spacing: 0.2px;
          }

          .detail-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.5);
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .detail-breadcrumb-btn.current {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #0D7A7D;
            font-weight: 700;
            cursor: default;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
            max-width: 280px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .detail-breadcrumb-sep {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            flex-shrink: 0;
          }

          /* ===== HERO ===== */
          .detail-hero {
            max-width: 1280px;
            margin: 0 auto;
            padding: 32px;
          }

          .detail-hero-image {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            height: 480px;
            background: linear-gradient(135deg, #139EA2, #0D7A7D);
          }

          .detail-hero-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .detail-hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.2) 0%,
              rgba(0, 0, 0, 0.1) 30%,
              rgba(0, 0, 0, 0.75) 100%
            );
          }

          .detail-hero-badges {
            position: absolute;
            top: 24px;
            left: 24px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .detail-category-badge,
          .detail-rating-badge,
          .detail-promo-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .detail-rating-badge {
            background: rgba(230, 166, 77, 0.95);
            color: #1A1A2E;
          }

          .detail-promo-badge {
            background: rgba(236, 72, 153, 0.95);
            color: #FFFFFF;
          }

          .detail-hero-actions {
            position: absolute;
            top: 24px;
            right: 24px;
            display: flex;
            gap: 10px;
          }

          .icon-action-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            color: #1A1A2E;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.25s ease;
            font-family: inherit;
          }

          .icon-action-btn:hover {
            background: #139EA2;
            color: #FFFFFF;
            transform: scale(1.1);
          }

          .detail-hero-content {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 40px 32px 32px;
            color: #FFFFFF;
          }

          .detail-hero-flag {
            font-size: 40px;
            line-height: 1;
            margin-bottom: 12px;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
          }

          .detail-title {
            font-size: clamp(2rem, 4vw, 3rem);
            font-weight: 800;
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
            line-height: 1.1;
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
          }

          .detail-meta-row {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
          }

          .detail-meta-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.95rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.95);
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          }

          /* Gallery thumbs */
          .detail-gallery-thumbs {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .gallery-thumb {
            flex-shrink: 0;
            width: 120px;
            height: 80px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid transparent;
            cursor: pointer;
            padding: 0;
            background: none;
            transition: all 0.25s ease;
          }

          .gallery-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .gallery-thumb.active {
            border-color: #139EA2;
            transform: scale(1.05);
          }

          /* ===== MAIN ===== */
          .detail-content {
            padding: 20px 32px 80px;
          }

          .detail-content-container {
            max-width: 1280px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 48px;
            align-items: start;
          }

          .detail-main {
            display: flex;
            flex-direction: column;
            gap: 40px;
          }

          .detail-section {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            padding: 32px;
          }

          .detail-section-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 20px 0;
            letter-spacing: -0.01em;
          }

          .detail-long-description {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            line-height: 1.75;
            margin: 0;
          }

          .detail-highlights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 14px;
          }

          .detail-highlight-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: var(--sp-tag-bg);
            border-radius: 12px;
            font-size: 0.9rem;
            color: var(--sp-text-primary);
            font-weight: 500;
            border: 1px solid var(--sp-tag-border);
          }

          .detail-highlight-item :global(svg) {
            color: #E6A64D;
            font-size: 14px;
            flex-shrink: 0;
          }

          .detail-included-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 12px;
          }

          .detail-included-list li {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 0.95rem;
            color: var(--sp-text-secondary);
            line-height: 1.5;
          }

          .detail-included-list :global(svg) {
            color: #10B981;
            font-size: 16px;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .detail-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }

          .detail-info-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px;
            border-radius: 14px;
            background: var(--sp-tag-bg);
            border: 1px solid var(--sp-tag-border);
          }

          .info-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(19, 158, 162, 0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #139EA2;
            font-size: 18px;
            flex-shrink: 0;
          }

          .info-label {
            display: block;
            font-size: 0.7rem;
            color: var(--sp-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 600;
            margin-bottom: 2px;
          }

          .info-value {
            display: block;
            font-size: 0.95rem;
            color: var(--sp-text-primary);
            font-weight: 700;
          }

          .detail-why-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
          }

          .why-item {
            text-align: center;
            padding: 24px 16px;
            border-radius: 16px;
            background: var(--sp-tag-bg);
            border: 1px solid var(--sp-tag-border);
          }

          .why-item :global(svg) {
            font-size: 28px;
            color: #139EA2;
            margin-bottom: 12px;
          }

          .why-item h4 {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 6px 0;
          }

          .why-item p {
            font-size: 0.8rem;
            color: var(--sp-text-secondary);
            margin: 0;
            line-height: 1.5;
          }

          /* ===== SIDEBAR ===== */
          .detail-sidebar {
            position: sticky;
            top: 100px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .booking-card {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            padding: 28px;
            box-shadow: var(--sp-shadow-lg);
          }

          .booking-price-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 20px;
            gap: 12px;
          }

          .booking-old-price {
            display: block;
            font-size: 0.8rem;
            color: var(--sp-text-muted);
            text-decoration: line-through;
            margin-bottom: 2px;
          }

          .booking-price {
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--sp-primary);
            letter-spacing: -0.02em;
          }

          .booking-per-person {
            font-size: 0.8rem;
            color: var(--sp-text-muted);
            white-space: nowrap;
          }

          .booking-divider {
            height: 1px;
            background: var(--sp-border);
            margin-bottom: 20px;
          }

          .booking-field {
            margin-bottom: 18px;
          }

          .booking-field label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--sp-text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .booking-field label :global(svg) {
            color: var(--sp-primary);
            font-size: 12px;
          }

          .booking-field input {
            width: 100%;
            padding: 12px 14px;
            border: 1.5px solid var(--sp-border);
            border-radius: 10px;
            background: var(--sp-bg-input);
            color: var(--sp-text-primary);
            font-family: inherit;
            font-size: 0.9rem;
            transition: all 0.25s ease;
          }

          .booking-field input:focus {
            outline: none;
            border-color: var(--sp-primary);
            box-shadow: 0 0 0 3px var(--sp-primary-light);
          }

          .guest-selector {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px;
            border: 1.5px solid var(--sp-border);
            border-radius: 10px;
            background: var(--sp-bg-input);
          }

          .guest-btn {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            border: none;
            background: var(--sp-primary-light);
            color: var(--sp-primary);
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            font-family: inherit;
          }

          .guest-btn:hover {
            background: var(--sp-primary);
            color: #FFFFFF;
          }

          .guest-count {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
          }

          .booking-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-top: 1px solid var(--sp-border);
            border-bottom: 1px solid var(--sp-border);
            margin-bottom: 20px;
          }

          .total-label {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            font-weight: 500;
          }

          .total-value {
            font-size: 1.3rem;
            font-weight: 800;
            color: var(--sp-text-primary);
            letter-spacing: -0.02em;
          }

          .booking-submit {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: var(--sp-primary);
            color: #FFFFFF;
            font-size: 0.95rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
            font-family: inherit;
            letter-spacing: 0.3px;
          }

          .booking-submit:hover {
            background: var(--sp-primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(19, 158, 162, 0.3);
          }

          .booking-submit :global(svg) {
            transition: transform 0.3s ease;
          }

          .booking-submit:hover :global(svg) {
            transform: translateX(4px);
          }

          .booking-note {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 12px;
            font-size: 0.75rem;
            color: var(--sp-text-muted);
            text-align: center;
          }

          .booking-note :global(svg) {
            color: #10B981;
            font-size: 11px;
          }

          .booking-contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--sp-border);
            text-align: center;
            font-size: 0.8rem;
            color: var(--sp-text-muted);
          }

          .booking-contact :global(a) {
            color: var(--sp-primary);
            font-weight: 600;
            text-decoration: none;
          }

          .booking-contact :global(a:hover) {
            text-decoration: underline;
          }

          /* Quick Facts */
          .quick-facts {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            padding: 24px;
          }

          .quick-facts-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 16px 0;
          }

          .quick-fact {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 0;
            border-bottom: 1px solid var(--sp-border);
          }

          .quick-fact:last-child {
            border-bottom: none;
          }

          .quick-fact :global(svg) {
            width: 32px;
            height: 32px;
            padding: 8px;
            border-radius: 8px;
            background: var(--sp-primary-light);
            color: var(--sp-primary);
            font-size: 14px;
            flex-shrink: 0;
          }

          .qf-label {
            display: block;
            font-size: 0.7rem;
            color: var(--sp-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 600;
          }

          .qf-value {
            display: block;
            font-size: 0.85rem;
            color: var(--sp-text-primary);
            font-weight: 600;
            margin-top: 2px;
          }

          /* ===== CTA ===== */
          .detail-cta {
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
            padding: 80px 32px;
            text-align: center;
          }

          .detail-cta-container {
            max-width: 700px;
            margin: 0 auto;
          }

          .detail-cta-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .detail-cta-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 0 28px 0;
          }

          .detail-cta-btn {
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

          .detail-cta-btn:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .detail-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .detail-cta-btn:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 992px) {
            .detail-content-container {
              grid-template-columns: 1fr;
              gap: 32px;
            }
            .detail-sidebar {
              position: static;
            }
            .detail-hero-image {
              height: 360px;
            }
          }

          @media (max-width: 640px) {
            .detail-breadcrumb-nav {
              padding: 16px 20px;
            }
            .detail-breadcrumb-back {
              width: 34px;
              height: 34px;
              font-size: 12px;
            }
            .detail-breadcrumb-btn {
              padding: 6px 12px;
              font-size: 0.75rem;
              border-radius: 8px;
            }
            .detail-breadcrumb-btn.current {
              max-width: 140px;
            }

            .detail-hero {
              padding: 20px;
            }
            .detail-hero-image {
              height: 280px;
              border-radius: 16px;
            }
            .detail-hero-content {
              padding: 24px 20px 20px;
            }
            .detail-hero-badges {
              top: 16px;
              left: 16px;
            }
            .detail-hero-actions {
              top: 16px;
              right: 16px;
            }
            .icon-action-btn {
              width: 38px;
              height: 38px;
              font-size: 14px;
            }
            .detail-meta-row {
              gap: 16px;
            }
            .detail-meta-item {
              font-size: 0.85rem;
            }

            .detail-content {
              padding: 20px 20px 60px;
            }
            .detail-section {
              padding: 24px 20px;
            }
            .gallery-thumb {
              width: 90px;
              height: 60px;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}