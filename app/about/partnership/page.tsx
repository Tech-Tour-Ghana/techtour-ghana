"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHandshake,
  faHotel,
  faPlane,
  faUniversity,
  faBuilding,
  faGlobeAfrica,
  faChalkboardTeacher,
  faArrowRight,
  faCheckCircle,
  faUsers,
  faChartLine,
  faLightbulb,
  faHeart,
  faShieldAlt,
  faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';

/* ============================================================
   PARTNER TYPES
   ============================================================ */

interface PartnerType {
  slug: string;             // ← used for /about/partnership/[slug]
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  image: string;            // ← NEW: card image
  count: number;            // ← NEW: partners count
}

const partnerTypes: PartnerType[] = [
  {
    slug: 'hotels',
    icon: faHotel,
    title: 'Hotels & Resorts',
    description: 'List your property on our platform and reach thousands of travelers worldwide.',
    benefits: [
      'Global visibility to international travelers',
      'Dedicated partner dashboard',
      'Competitive commission structure',
      'Marketing support & promotion',
    ],
    image: '/images/partners/hotels.jpg',
    count: 42,
  },
  {
    slug: 'tour-operators',
    icon: faPlane,
    title: 'Tour Operators & Guides',
    description: 'Join our network of certified local experts delivering unforgettable experiences.',
    benefits: [
      'Steady stream of bookings',
      'Training & certification support',
      'Insurance & liability coverage',
      'Fair, transparent payouts',
    ],
    image: '/images/partners/tour-operators.jpg',
    count: 58,
  },
  {
    slug: 'artisans',
    icon: faBuilding,
    title: 'Artisans & Creators',
    description: 'Sell your crafts on our digital marketplace and reach a global audience.',
    benefits: [
      'Zero listing fees',
      'Professional product photography',
      'International shipping support',
      'Brand storytelling assistance',
    ],
    image: '/images/partners/artisans.jpg',
    count: 120,
  },
  {
    slug: 'educational',
    icon: faUniversity,
    title: 'Educational Institutions',
    description: 'Partner with us for study abroad programs, cultural exchanges, and research.',
    benefits: [
      'Custom educational itineraries',
      'Student support services',
      'Cultural immersion programs',
      'Research collaboration opportunities',
    ],
    image: '/images/partners/education.jpg',
    count: 24,
  },
  {
    slug: 'ngos',
    icon: faGlobeAfrica,
    title: 'NGOs & Community Organizations',
    description: 'Collaborate on sustainable tourism initiatives that benefit local communities.',
    benefits: [
      'Community development funding',
      'Shared impact measurement',
      'Joint grant applications',
      'Capacity building programs',
    ],
    image: '/images/partners/ngos.jpg',
    count: 18,
  },
  {
    slug: 'travel-agencies',
    icon: faChalkboardTeacher,
    title: 'Travel Agencies',
    description: 'Add TechTour Ghana experiences to your portfolio with our B2B platform.',
    benefits: [
      'Wholesale partner rates',
      'White-label options',
      'Dedicated account manager',
      'Co-marketing opportunities',
    ],
    image: '/images/partners/travel-agencies.jpg',
    count: 31,
  },
];

/* ============================================================
   BENEFITS
   ============================================================ */

const partnerBenefits = [
  {
    icon: faChartLine,
    title: 'Revenue Growth',
    description: 'Access a growing market of international travelers seeking authentic African experiences.',
  },
  {
    icon: faUsers,
    title: 'Global Reach',
    description: 'Tap into our marketing engine that reaches travelers across 5 continents.',
  },
  {
    icon: faLightbulb,
    title: 'Tech Infrastructure',
    description: 'Use our booking systems, analytics, and payment processing — all built for tourism.',
  },
  {
    icon: faHeart,
    title: 'Community Impact',
    description: 'Be part of a mission that reinvests in Ghanaian communities and artisans.',
  },
  {
    icon: faShieldAlt,
    title: 'Trusted Brand',
    description: 'Partner with a platform that travelers and communities trust and recommend.',
  },
  {
    icon: faHandshake,
    title: 'Dedicated Support',
    description: 'Every partner gets a dedicated success manager and 24/7 technical support.',
  },
];

/* ============================================================
   STEPS
   ============================================================ */

const steps = [
  {
    number: '01',
    title: 'Apply Online',
    description: 'Fill out our simple partnership application form with details about your business.',
  },
  {
    number: '02',
    title: 'Verification',
    description: 'Our team reviews your application and verifies your business credentials.',
  },
  {
    number: '03',
    title: 'Onboarding',
    description: 'Meet your dedicated success manager and set up your partner dashboard.',
  },
  {
    number: '04',
    title: 'Go Live',
    description: 'Your offerings go live on the TechTour Ghana platform. Start earning!',
  },
];

/* ============================================================
   PAGE COMPONENT
   ============================================================ */

export default function PartnershipPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    type: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', company: '', type: '', message: '' });
    }, 4000);
  };

  return (
    <ServiceTheme>
      <main className="partnership-page">
        {/* ===== HERO ===== */}
        <section className="partnership-hero">
          <div className="partnership-hero-bg" />
          <div className="partnership-hero-container">
            <span className="partnership-hero-label">Partnerships</span>
            <h1 className="partnership-hero-title">
              Grow With <br />
              <span className="partnership-hero-accent">TechTour Ghana</span>
            </h1>
            <p className="partnership-hero-subtitle">
              Join a network of hotels, artisans, tour operators, and organizations building the
              future of African tourism — together.
            </p>
            <div className="partnership-hero-actions">
              <a href="#apply" className="partnership-hero-btn primary">
                Become a Partner
                <FontAwesomeIcon icon={faArrowRight} />
              </a>
              <a href="#types" className="partnership-hero-btn secondary">
                Explore Partnership Types
              </a>
            </div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="partnership-stats-section">
          <div className="partnership-stats-container">
            <div className="partnership-stat">
              <div className="partnership-stat-value">200+</div>
              <div className="partnership-stat-label">Active Partners</div>
            </div>
            <div className="partnership-stat">
              <div className="partnership-stat-value">16</div>
              <div className="partnership-stat-label">Regions Covered</div>
            </div>
            <div className="partnership-stat">
              <div className="partnership-stat-value">10K+</div>
              <div className="partnership-stat-label">Bookings Delivered</div>
            </div>
            <div className="partnership-stat">
              <div className="partnership-stat-value">98%</div>
              <div className="partnership-stat-label">Partner Satisfaction</div>
            </div>
          </div>
        </section>

        {/* ===== PARTNER TYPES ===== */}
        <section id="types" className="partnership-types-section">
          <div className="partnership-types-container">
            <div className="section-header">
              <span className="section-label">Who We Partner With</span>
              <h2 className="section-title">
                Partnership <span className="section-title-accent">Opportunities</span>
              </h2>
              <p className="section-subtitle">
                Whatever your industry, if you share our vision for authentic, impactful tourism,
                there's a place for you in our ecosystem.
              </p>
            </div>

            <div className="partnership-types-grid">
              {partnerTypes.map((type) => (
                <article key={type.slug} className="partnership-type-card">
                  {/* Image header */}
                  <div className="partnership-type-image">
                    <img
                      src={type.image}
                      alt={type.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="partnership-type-image-overlay" />
                    <div className="partnership-type-image-badge">
                      <FontAwesomeIcon icon={type.icon} />
                      <span>{type.count}+ Partners</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="partnership-type-body">
                    <h3 className="partnership-type-title">{type.title}</h3>
                    <p className="partnership-type-description">{type.description}</p>

                    <ul className="partnership-type-benefits">
                      {type.benefits.map((benefit, i) => (
                        <li key={i}>
                          <FontAwesomeIcon icon={faCheckCircle} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/about/partnership/${type.slug}`}
                      className="partnership-type-cta"
                    >
                      View {type.title.split(' ')[0]} Partners
                      <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== QUOTE ===== */}
        <section className="partnership-quote-section">
          <div className="partnership-quote-container">
            <div className="partnership-quote-mark">
              <FontAwesomeIcon icon={faQuoteLeft} />
            </div>
            <blockquote className="partnership-quote">
              Our partners aren't just vendors — they're co-creators of a new era of African
              tourism. Every partnership strengthens the ecosystem for everyone.
            </blockquote>
            <p className="partnership-quote-author">— Yaw Darko, Head of Partnerships</p>
          </div>
        </section>

        {/* ===== BENEFITS ===== */}
        <section className="partnership-benefits-section">
          <div className="partnership-benefits-container">
            <div className="section-header">
              <span className="section-label">Why Partner With Us</span>
              <h2 className="section-title">
                The TechTour <span className="section-title-accent">Advantage</span>
              </h2>
              <p className="section-subtitle">
                More than a listing platform — a true growth partner invested in your success.
              </p>
            </div>

            <div className="partnership-benefits-grid">
              {partnerBenefits.map((benefit, idx) => (
                <div key={idx} className="partnership-benefit-card">
                  <div className="partnership-benefit-icon">
                    <FontAwesomeIcon icon={benefit.icon} />
                  </div>
                  <h4 className="partnership-benefit-title">{benefit.title}</h4>
                  <p className="partnership-benefit-text">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="partnership-steps-section">
          <div className="partnership-steps-container">
            <div className="section-header">
              <span className="section-label">How It Works</span>
              <h2 className="section-title">
                Your Path to <span className="section-title-accent">Partnership</span>
              </h2>
              <p className="section-subtitle">
                Four simple steps from application to going live on our platform.
              </p>
            </div>

            <div className="partnership-steps-grid">
              {steps.map((step, idx) => (
                <div key={idx} className="partnership-step">
                  <div className="partnership-step-number">{step.number}</div>
                  <h4 className="partnership-step-title">{step.title}</h4>
                  <p className="partnership-step-text">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== APPLICATION FORM ===== */}
        <section id="apply" className="partnership-apply-section">
          <div className="partnership-apply-container">
            <div className="partnership-apply-grid">
              <div className="partnership-apply-info">
                <span className="section-label">Apply Now</span>
                <h2 className="section-title">
                  Ready to <span className="section-title-accent">Partner?</span>
                </h2>
                <p className="partnership-apply-text">
                  Fill out the form and our partnership team will be in touch within 48 hours.
                </p>

                <div className="partnership-apply-details">
                  <div className="partnership-apply-detail">
                    <div className="partnership-apply-detail-icon">
                      <FontAwesomeIcon icon={faHandshake} />
                    </div>
                    <div>
                      <span className="partnership-apply-detail-label">Direct Support</span>
                      <span className="partnership-apply-detail-value">
                        partners@techtourghana.com
                      </span>
                    </div>
                  </div>
                  <div className="partnership-apply-detail">
                    <div className="partnership-apply-detail-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div>
                      <span className="partnership-apply-detail-label">Phone</span>
                      <span className="partnership-apply-detail-value">
                        +233 (0) 30 123 4567
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="partnership-form">
                {submitted ? (
                  <div className="partnership-form-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <h3>Application Received!</h3>
                    <p>Our partnership team will be in touch within 48 hours.</p>
                  </div>
                ) : (
                  <>
                    <div className="partnership-form-row">
                      <div className="partnership-form-field">
                        <label>Your Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Full name"
                        />
                      </div>
                      <div className="partnership-form-field">
                        <label>Email *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="you@company.com"
                        />
                      </div>
                    </div>

                    <div className="partnership-form-row">
                      <div className="partnership-form-field">
                        <label>Company / Organization *</label>
                        <input
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) =>
                            setFormData({ ...formData, company: e.target.value })
                          }
                          placeholder="Company name"
                        />
                      </div>
                      <div className="partnership-form-field">
                        <label>Partnership Type *</label>
                        <select
                          required
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                        >
                          <option value="">Select type</option>
                          {partnerTypes.map((type, i) => (
                            <option key={i} value={type.title}>
                              {type.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="partnership-form-field">
                      <label>Tell us about your business</label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Brief description of your business and how you'd like to partner with us..."
                      />
                    </div>

                    <button type="submit" className="partnership-form-submit">
                      Submit Application
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </section>

        <BackToTop accentColor="teal" />

        <style jsx>{`
          .partnership-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== HERO ===== */
          .partnership-hero {
            position: relative;
            overflow: hidden;
            padding: 100px 32px 80px;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .partnership-hero-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 20% 30%,
                rgba(230, 166, 77, 0.3) 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 80% 70%,
                rgba(255, 255, 255, 0.15) 0%,
                transparent 45%
              );
          }

          .partnership-hero-container {
            position: relative;
            z-index: 2;
            max-width: 900px;
            margin: 0 auto;
            text-align: center;
          }

          .partnership-hero-label {
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

          .partnership-hero-title {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 20px 0;
            line-height: 1.15;
            letter-spacing: -0.02em;
          }

          .partnership-hero-accent {
            color: #E6A64D;
          }

          .partnership-hero-subtitle {
            font-size: clamp(1rem, 1.5vw, 1.15rem);
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 auto 32px;
            max-width: 700px;
          }

          .partnership-hero-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .partnership-hero-btn {
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

          .partnership-hero-btn.primary {
            background: #E6A64D;
            color: #1A1A2E;
            box-shadow: 0 8px 24px rgba(230, 166, 77, 0.3);
          }

          .partnership-hero-btn.primary:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .partnership-hero-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(10px);
          }

          .partnership-hero-btn.secondary:hover {
            background: #FFFFFF;
            color: #139EA2;
            transform: translateY(-3px);
          }

          .partnership-hero-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .partnership-hero-btn.primary:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== STATS ===== */
          .partnership-stats-section {
            padding: 0 32px;
            margin-top: -40px;
            margin-bottom: 60px;
            position: relative;
            z-index: 10;
          }

          .partnership-stats-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }

          .partnership-stat {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 16px;
            padding: 24px 20px;
            text-align: center;
            box-shadow: var(--sp-shadow-md);
            transition: all 0.3s ease;
          }

          .partnership-stat:hover {
            transform: translateY(-4px);
            box-shadow: var(--sp-shadow-lg);
            border-color: rgba(19, 158, 162, 0.4);
          }

          .partnership-stat-value {
            font-size: 2rem;
            font-weight: 800;
            color: #139EA2;
            line-height: 1;
            letter-spacing: -0.02em;
          }

          .partnership-stat-label {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            font-weight: 500;
            margin-top: 6px;
          }

          /* ===== SECTION HEADERS ===== */
          .section-header {
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
            max-width: 640px;
          }

          /* ===== PARTNER TYPES ===== */
          .partnership-types-section {
            padding: 40px 32px 80px;
          }

          .partnership-types-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .partnership-types-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .partnership-type-card {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
          }

          .partnership-type-card:hover {
            transform: translateY(-6px);
            border-color: rgba(19, 158, 162, 0.4);
            box-shadow: var(--sp-shadow-lg);
          }

          /* Image */
          .partnership-type-image {
            position: relative;
            height: 180px;
            overflow: hidden;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .partnership-type-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            display: block;
          }

          .partnership-type-card:hover .partnership-type-image img {
            transform: scale(1.06);
          }

          .partnership-type-image-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.05) 0%,
              rgba(0, 0, 0, 0.35) 100%
            );
            pointer-events: none;
          }

          .partnership-type-image-badge {
            position: absolute;
            bottom: 12px;
            left: 12px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 14px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            color: #1A1A2E;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          }

          .partnership-type-image-badge :global(svg) {
            color: #139EA2;
            font-size: 12px;
          }

          /* Body */
          .partnership-type-body {
            padding: 24px 24px 26px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .partnership-type-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 10px 0;
            line-height: 1.3;
          }

          .partnership-type-description {
            font-size: 0.9rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0 0 18px 0;
          }

          .partnership-type-benefits {
            list-style: none;
            padding: 0;
            margin: 0 0 20px 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .partnership-type-benefits li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.82rem;
            color: var(--sp-text-secondary);
            line-height: 1.45;
          }

          .partnership-type-benefits li :global(svg) {
            color: #10B981;
            font-size: 13px;
            flex-shrink: 0;
            margin-top: 3px;
          }

          /* Card CTA */
          .partnership-type-cta {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 18px;
            background: #139EA2;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 700;
            transition: all 0.25s ease;
            margin-top: auto;
          }

          .partnership-type-cta:hover {
            background: #0D7A7D;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(19, 158, 162, 0.3);
          }

          .partnership-type-cta :global(svg) {
            font-size: 11px;
            transition: transform 0.25s ease;
          }

          .partnership-type-cta:hover :global(svg) {
            transform: translateX(3px);
          }

          /* ===== QUOTE ===== */
          .partnership-quote-section {
            padding: 60px 32px;
            background: var(--sp-bg-secondary);
            border-top: 1px solid var(--sp-border);
            border-bottom: 1px solid var(--sp-border);
          }

          .partnership-quote-container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }

          .partnership-quote-mark {
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

          .partnership-quote {
            font-size: clamp(1.15rem, 2vw, 1.5rem);
            font-weight: 600;
            color: var(--sp-text-primary);
            line-height: 1.55;
            margin: 0 0 20px 0;
            letter-spacing: -0.01em;
            font-style: italic;
          }

          .partnership-quote-author {
            font-size: 0.9rem;
            color: var(--sp-text-muted);
            margin: 0;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          /* ===== BENEFITS ===== */
          .partnership-benefits-section {
            padding: 80px 32px;
          }

          .partnership-benefits-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .partnership-benefits-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .partnership-benefit-card {
            padding: 28px 22px;
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 16px;
            transition: all 0.3s ease;
          }

          .partnership-benefit-card:hover {
            transform: translateY(-4px);
            border-color: rgba(230, 166, 77, 0.4);
            box-shadow: var(--sp-shadow-md);
          }

          .partnership-benefit-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            background: rgba(230, 166, 77, 0.12);
            color: #E6A64D;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            margin-bottom: 16px;
          }

          .partnership-benefit-title {
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .partnership-benefit-text {
            font-size: 0.875rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0;
          }

          /* ===== STEPS ===== */
          .partnership-steps-section {
            padding: 80px 32px;
            background: var(--sp-bg-secondary);
            border-top: 1px solid var(--sp-border);
            border-bottom: 1px solid var(--sp-border);
          }

          .partnership-steps-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .partnership-steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
          }

          .partnership-step {
            text-align: center;
            padding: 24px 16px;
          }

          .partnership-step-number {
            width: 72px;
            height: 72px;
            margin: 0 auto 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
            color: #FFFFFF;
            font-size: 1.5rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(19, 158, 162, 0.3);
          }

          .partnership-step-title {
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 10px 0;
          }

          .partnership-step-text {
            font-size: 0.875rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0;
          }

          /* ===== APPLY ===== */
          .partnership-apply-section {
            padding: 80px 32px;
          }

          .partnership-apply-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .partnership-apply-grid {
            display: grid;
            grid-template-columns: 1fr 1.3fr;
            gap: 48px;
            align-items: start;
          }

          .partnership-apply-info {
            position: sticky;
            top: 100px;
          }

          .partnership-apply-text {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            line-height: 1.7;
            margin: 16px 0 32px;
          }

          .partnership-apply-details {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .partnership-apply-detail {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px;
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 14px;
          }

          .partnership-apply-detail-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(19, 158, 162, 0.12);
            color: #139EA2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }

          .partnership-apply-detail-label {
            display: block;
            font-size: 0.7rem;
            color: var(--sp-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 600;
            margin-bottom: 3px;
          }

          .partnership-apply-detail-value {
            display: block;
            font-size: 0.9rem;
            color: var(--sp-text-primary);
            font-weight: 600;
          }

          /* ===== FORM ===== */
          .partnership-form {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            padding: 32px;
            box-shadow: var(--sp-shadow-md);
          }

          .partnership-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          .partnership-form-field {
            margin-bottom: 16px;
          }

          .partnership-form-field label {
            display: block;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--sp-text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .partnership-form-field input,
          .partnership-form-field select,
          .partnership-form-field textarea {
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

          .partnership-form-field textarea {
            resize: vertical;
            min-height: 100px;
          }

          .partnership-form-field input:focus,
          .partnership-form-field select:focus,
          .partnership-form-field textarea:focus {
            outline: none;
            border-color: #139EA2;
            box-shadow: 0 0 0 3px rgba(19, 158, 162, 0.15);
          }

          .partnership-form-submit {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: #139EA2;
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
            margin-top: 8px;
          }

          .partnership-form-submit:hover {
            background: #0D7A7D;
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(19, 158, 162, 0.3);
          }

          .partnership-form-submit :global(svg) {
            transition: transform 0.3s ease;
          }

          .partnership-form-submit:hover :global(svg) {
            transform: translateX(4px);
          }

          .partnership-form-success {
            text-align: center;
            padding: 40px 20px;
          }

          .partnership-form-success :global(svg) {
            font-size: 56px;
            color: #10B981;
            margin-bottom: 20px;
          }

          .partnership-form-success h3 {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .partnership-form-success p {
            font-size: 0.95rem;
            color: var(--sp-text-secondary);
            margin: 0;
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 992px) {
            .partnership-types-grid,
            .partnership-benefits-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .partnership-steps-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .partnership-apply-grid {
              grid-template-columns: 1fr;
              gap: 32px;
            }
            .partnership-apply-info {
              position: static;
            }
            .partnership-stats-container {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          /* ============================================================
             MOBILE , 2×2 GRID FOR BENEFITS + STEPS
             ============================================================ */
          @media (max-width: 640px) {
            .partnership-hero {
              padding: 60px 20px 50px;
            }

            .partnership-types-section,
            .partnership-benefits-section,
            .partnership-steps-section,
            .partnership-apply-section {
              padding: 50px 16px;
            }

            /* Partner types stay single column on mobile
               (they have lots of content , benefits list, image, button) */
            .partnership-types-grid {
              grid-template-columns: 1fr;
              gap: 20px;
            }

            /* Benefits , 2×2 grid on mobile */
            .partnership-benefits-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }

            .partnership-benefit-card {
              padding: 18px 14px;
              border-radius: 14px;
            }

            .partnership-benefit-icon {
              width: 44px;
              height: 44px;
              font-size: 18px;
              margin-bottom: 12px;
              border-radius: 12px;
            }

            .partnership-benefit-title {
              font-size: 0.9rem;
              margin-bottom: 6px;
            }

            .partnership-benefit-text {
              font-size: 0.75rem;
              line-height: 1.45;
            }

            /* Steps , 2×2 grid on mobile */
            .partnership-steps-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }

            .partnership-step {
              padding: 18px 12px;
            }

            .partnership-step-number {
              width: 52px;
              height: 52px;
              font-size: 1.05rem;
              margin-bottom: 14px;
            }

            .partnership-step-title {
              font-size: 0.88rem;
              margin-bottom: 6px;
            }

            .partnership-step-text {
              font-size: 0.72rem;
              line-height: 1.45;
            }

            .partnership-form-row {
              grid-template-columns: 1fr;
            }

            .partnership-form {
              padding: 24px 20px;
            }

            .partnership-hero-actions {
              flex-direction: column;
            }

            .partnership-hero-btn {
              justify-content: center;
            }
          }

          /* Extra small phones */
          @media (max-width: 380px) {
            .partnership-benefits-grid,
            .partnership-steps-grid {
              gap: 10px;
            }

            .partnership-benefit-card {
              padding: 16px 12px;
            }

            .partnership-benefit-title {
              font-size: 0.82rem;
            }

            .partnership-benefit-text {
              font-size: 0.7rem;
            }

            .partnership-step {
              padding: 16px 10px;
            }

            .partnership-step-number {
              width: 46px;
              height: 46px;
              font-size: 0.95rem;
            }

            .partnership-step-title {
              font-size: 0.8rem;
            }

            .partnership-step-text {
              font-size: 0.68rem;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}