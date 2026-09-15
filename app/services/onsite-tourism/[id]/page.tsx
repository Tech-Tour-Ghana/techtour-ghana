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
  faUtensils,
  faCamera,
  faCompass,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';

interface Site {
  id: number;
  name: string;
  region: string;
  category: 'heritage' | 'nature' | 'culture' | 'adventure';
  duration: string;
  rating: number;
  price: string;
  description: string;
  longDescription: string;
  highlights: string[];
  included: string[];
  image: string;
  gallery: string[];
  bestTime: string;
  groupSize: string;
  difficulty: string;
}

const sitesData: Record<number, Site> = {
  1: {
    id: 1,
    name: 'Cape Coast Castle',
    region: 'Central Region',
    category: 'heritage',
    duration: '3-4 hours',
    rating: 4.9,
    price: 'From GHS 120',
    description: 'A UNESCO World Heritage Site and powerful reminder of the transatlantic slave trade, offering guided tours through history.',
    longDescription: 'Cape Coast Castle stands as one of the most significant historical landmarks in West Africa. Built by the Swedes in 1653 and later expanded by the British, this imposing structure served as a major trading post and later as a holding facility during the transatlantic slave trade. Today, it stands as a UNESCO World Heritage Site and a moving testament to resilience. Our guided tours take you through the dungeons, the "Door of No Return," and the museum, offering a powerful educational experience that connects visitors with an important chapter of world history.',
    highlights: [
      'UNESCO World Heritage Site',
      'Guided historical tour',
      'Museum access',
      'Door of No Return',
      'Educational experience',
    ],
    included: [
      'Professional English-speaking guide',
      'Entrance fees',
      'Museum access',
      'Bottled water',
      'Hotel pickup & drop-off (within Cape Coast)',
    ],
    image: '/images/sites/cape-coast.jpg',
    gallery: [
      '/images/sites/cape-coast-1.jpg',
      '/images/sites/cape-coast-2.jpg',
      '/images/sites/cape-coast-3.jpg',
    ],
    bestTime: 'November - March',
    groupSize: 'Up to 15 people',
    difficulty: 'Easy',
  },
};

// Fallback generator for any site ID
const getSiteById = (id: number): Site => {
  if (sitesData[id]) return sitesData[id];

  return {
    id,
    name: 'Ghana Heritage Site',
    region: 'Ghana',
    category: 'heritage',
    duration: '3-4 hours',
    rating: 4.8,
    price: 'From GHS 100',
    description: 'Experience the rich cultural and natural heritage of Ghana.',
    longDescription: "This exceptional site offers visitors a unique opportunity to immerse themselves in Ghana's vibrant culture and history. Our experienced guides ensure you get the most from your visit, sharing stories and insights that bring the destination to life.",
    highlights: [
      'Expert local guide',
      'Cultural immersion',
      'Photo opportunities',
      'Educational experience',
    ],
    included: [
      'Professional guide',
      'Entrance fees',
      'Bottled water',
      'Hotel pickup & drop-off',
    ],
    image: '/images/sites/default.jpg',
    gallery: [],
    bestTime: 'November - March',
    groupSize: 'Up to 12 people',
    difficulty: 'Easy',
  };
};

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  heritage: { bg: 'rgba(19, 158, 162, 0.12)', text: '#139EA2', label: 'Heritage' },
  nature: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', label: 'Nature' },
  culture: { bg: 'rgba(230, 166, 77, 0.15)', text: '#D4953A', label: 'Culture' },
  adventure: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6', label: 'Adventure' },
};

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = Number(params?.id);
  const site = getSiteById(siteId);
  const catColor = categoryColors[site.category]!;

  const [activeImage, setActiveImage] = useState(0);
  const [bookingDate, setBookingDate] = useState('');
  const [guests, setGuests] = useState(2);

  const images = [site.image, ...site.gallery].filter(Boolean);

  return (
    <ServiceTheme>
      <main className="site-detail-page">
        {/* ===== BREADCRUMB NAVIGATION ===== */}
        <nav className="detail-breadcrumb-nav" aria-label="Breadcrumb">
          <div className="detail-breadcrumb-container">

            <div className="detail-breadcrumb-trail">
              <Link href="/" className="detail-breadcrumb-btn">
                Home
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <Link href="/services/onsite-tourism" className="detail-breadcrumb-btn">
                Onsite Tourism
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <Link href="/services/onsite-tourism/all" className="detail-breadcrumb-btn">
                All Sites
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <span className="detail-breadcrumb-btn current">{site.name}</span>
            </div>
          </div>
        </nav>

        {/* ===== HERO GALLERY ===== */}
        <section className="detail-hero">
          <div className="detail-hero-image">
            <img
              src={images[activeImage]}
              alt={site.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%23139EA2'/%3E%3Ctext x='600' y='300' font-family='Inter' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                  site.name
                )}%3C/text%3E%3C/svg%3E`;
              }}
            />
            <div className="detail-hero-overlay" />

            <div className="detail-hero-badges">
              <span
                className="detail-category-badge"
                style={{ background: catColor.bg, color: catColor.text }}
              >
                {catColor.label}
              </span>
              <span className="detail-rating-badge">
                <FontAwesomeIcon icon={faStar} />
                {site.rating}
              </span>
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
              <h1 className="detail-title">{site.name}</h1>
              <div className="detail-meta-row">
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faLocationDot} />
                  {site.region}
                </span>
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faClock} />
                  {site.duration}
                </span>
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faUsers} />
                  {site.groupSize}
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
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
                    alt={`${site.name} ${idx + 1}`}
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
                <p className="detail-long-description">{site.longDescription}</p>
              </div>

              <div className="detail-section">
                <h2 className="detail-section-title">Highlights</h2>
                <div className="detail-highlights-grid">
                  {site.highlights.map((h, i) => (
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
                  {site.included.map((item, i) => (
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
                      <span className="info-value">{site.bestTime}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <div className="info-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div>
                      <span className="info-label">Group Size</span>
                      <span className="info-value">{site.groupSize}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <div className="info-icon">
                      <FontAwesomeIcon icon={faCompass} />
                    </div>
                    <div>
                      <span className="info-label">Difficulty</span>
                      <span className="info-value">{site.difficulty}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <div className="info-icon">
                      <FontAwesomeIcon icon={faShieldAlt} />
                    </div>
                    <div>
                      <span className="info-label">Safety</span>
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
                    <h4>Local Expertise</h4>
                    <p>Certified local guides with deep knowledge of Ghanaian culture</p>
                  </div>
                  <div className="why-item">
                    <FontAwesomeIcon icon={faHandshake} />
                    <h4>Community Support</h4>
                    <p>Your booking directly supports local communities and artisans</p>
                  </div>
                  <div className="why-item">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <h4>Safe & Reliable</h4>
                    <p>Fully insured tours with 24/7 support throughout your journey</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - BOOKING CARD */}
            <aside className="detail-sidebar">
              <div className="booking-card">
                <div className="booking-price-row">
                  <span className="booking-price">{site.price}</span>
                  <span className="booking-per-person">per person</span>
                </div>

                <div className="booking-divider" />

                <div className="booking-field">
                  <label>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    Select Date
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
                    Number of Guests
                  </label>
                  <div className="guest-selector">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="guest-btn"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="guest-count">{guests}</span>
                    <button
                      onClick={() => setGuests(guests + 1)}
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
                    GHS {(parseInt(site.price.replace(/\D/g, '')) * guests).toLocaleString()}
                  </span>
                </div>

                <button className="booking-submit">
                  Book This Tour
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>

                <p className="booking-note">
                  <FontAwesomeIcon icon={faShieldAlt} />
                  No charge until confirmed
                </p>

                <div className="booking-contact">
                  <p>Need help? <a href="/contact">Talk to us</a></p>
                </div>
              </div>

              <div className="quick-facts">
                <h3 className="quick-facts-title">Quick Facts</h3>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faMapMarkedAlt} />
                  <div>
                    <span className="qf-label">Region</span>
                    <span className="qf-value">{site.region}</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <span className="qf-label">Duration</span>
                    <span className="qf-value">{site.duration}</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faStar} />
                  <div>
                    <span className="qf-label">Rating</span>
                    <span className="qf-value">{site.rating} / 5</span>
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
            <h2 className="detail-cta-title">Explore More Ghanaian Sites</h2>
            <p className="detail-cta-text">
              Discover more unforgettable experiences across Ghana.
            </p>
            <Link href="/services/onsite-tourism/all" className="detail-cta-btn">
              View All Sites
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>

        {/* Back to Top Button */}
        <BackToTop accentColor="teal" />

        <style jsx>{`
          .site-detail-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== BREADCRUMB NAVIGATION ===== */
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

          /* Back button - rectangular */
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
            -webkit-backdrop-filter: blur(10px);
            font-family: inherit;
          }

          .detail-breadcrumb-back:hover {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #139EA2;
            transform: translateX(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .detail-breadcrumb-back:active {
            transform: translateX(-3px) scale(0.95);
          }

          /* Breadcrumb trail */
          .detail-breadcrumb-trail {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          /* Rectangular breadcrumb buttons */
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
            cursor: pointer;
            font-family: inherit;
          }

          .detail-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.5);
            color: #FFFFFF;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          /* Current page - highlighted */
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

          .detail-breadcrumb-btn.current:hover {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #0D7A7D;
            transform: none;
          }

          /* Chevron separator */
          .detail-breadcrumb-sep {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            flex-shrink: 0;
            user-select: none;
          }

          /* ===== HERO GALLERY ===== */
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
              rgba(0, 0, 0, 0.7) 100%
            );
          }

          .detail-hero-badges {
            position: absolute;
            top: 24px;
            left: 24px;
            display: flex;
            gap: 10px;
          }

          .detail-category-badge,
          .detail-rating-badge {
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

          .detail-rating-badge :global(svg) {
            font-size: 12px;
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

          .detail-meta-item :global(svg) {
            font-size: 14px;
          }

          /* Gallery Thumbs */
          .detail-gallery-thumbs {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: thin;
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
            border-color: var(--sp-primary);
            transform: scale(1.05);
          }

          .gallery-thumb:hover {
            border-color: var(--sp-primary);
          }

          /* ===== MAIN CONTENT ===== */
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
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

            .detail-breadcrumb-container {
              gap: 8px;
            }

            .detail-breadcrumb-back {
              width: 34px;
              height: 34px;
              font-size: 12px;
            }

            .detail-breadcrumb-trail {
              gap: 6px;
            }

            .detail-breadcrumb-btn {
              padding: 6px 12px;
              font-size: 0.75rem;
              border-radius: 8px;
            }

            .detail-breadcrumb-sep {
              font-size: 8px;
            }

            .detail-breadcrumb-btn.current {
              max-width: 160px;
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

            .detail-content {
              padding: 20px 20px 60px;
            }

            .detail-section {
              padding: 24px 20px;
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

            .gallery-thumb {
              width: 90px;
              height: 60px;
            }
          }

          @media (max-width: 400px) {
            .detail-breadcrumb-btn {
              padding: 5px 10px;
              font-size: 0.7rem;
            }

            .detail-breadcrumb-back {
              width: 30px;
              height: 30px;
              font-size: 11px;
            }

            .detail-breadcrumb-btn.current {
              max-width: 120px;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}