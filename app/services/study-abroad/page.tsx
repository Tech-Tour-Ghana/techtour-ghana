"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
  faArrowRight,
  faStar,
  faLocationDot,
  faClock,
  faFilter,
  faLanguage,
  faLayerGroup,
  faGraduationCap,
  faGlobeAmericas,
  faBookOpen,
  faFlask,
} from '@fortawesome/free-solid-svg-icons';
import ServiceHero from '@/components/ServiceHero';
import { ServiceTheme } from '@/components/ServiceTheme';

interface University {
  id: number;
  name: string;
  country: string;
  city: string;
  flag: string;
  ranking: number;
  tuition: string;
  duration: string;
  programs: string[];
  ielts: string;
  description: string;
  image: string;
  scholarship: boolean;
}

const universities: University[] = [
  {
    id: 1,
    name: 'University of Toronto',
    country: 'Canada',
    city: 'Toronto',
    flag: '🇨🇦',
    ranking: 21,
    tuition: 'CAD 45,000/yr',
    duration: '4 years',
    programs: ['Engineering', 'Business', 'Computer Science'],
    ielts: '6.5+',
    description: "Canada's top-ranked university, known for research excellence and diverse international community.",
    image: '/images/universities/toronto.jpg',
    scholarship: true,
  },
  {
    id: 2,
    name: 'University of Manchester',
    country: 'United Kingdom',
    city: 'Manchester',
    flag: '🇬🇧',
    ranking: 32,
    tuition: '£24,000/yr',
    duration: '3 years',
    programs: ['Medicine', 'Law', 'Engineering'],
    ielts: '6.5+',
    description: 'A Russell Group university with a rich history of academic excellence and innovation.',
    image: '/images/universities/manchester.jpg',
    scholarship: true,
  },
  {
    id: 3,
    name: 'Technical University of Munich',
    country: 'Germany',
    city: 'Munich',
    flag: '🇩🇪',
    ranking: 30,
    tuition: '€250/semester',
    duration: '3 years',
    programs: ['Engineering', 'Computer Science', 'Physics'],
    ielts: '6.5+',
    description: "Germany's top technical university with affordable tuition and world-class research.",
    image: '/images/universities/munich.jpg',
    scholarship: true,
  },
  {
    id: 4,
    name: 'University of Melbourne',
    country: 'Australia',
    city: 'Melbourne',
    flag: '🇦🇺',
    ranking: 14,
    tuition: 'AUD 42,000/yr',
    duration: '3 years',
    programs: ['Business', 'Arts', 'Science'],
    ielts: '6.5+',
    description: "Australia's leading university, offering a vibrant campus life in one of the world's most livable cities.",
    image: '/images/universities/melbourne.jpg',
    scholarship: true,
  },
  {
    id: 5,
    name: 'New York University',
    country: 'United States',
    city: 'New York',
    flag: '🇺🇸',
    ranking: 43,
    tuition: 'USD 58,000/yr',
    duration: '4 years',
    programs: ['Business', 'Arts', 'Law'],
    ielts: '7.0+',
    description: 'A global university located in the heart of Manhattan, offering unmatched opportunities.',
    image: '/images/universities/nyu.jpg',
    scholarship: false,
  },
  {
    id: 6,
    name: 'University of Cape Town',
    country: 'South Africa',
    city: 'Cape Town',
    flag: '🇿🇦',
    ranking: 173,
    tuition: 'ZAR 65,000/yr',
    duration: '3 years',
    programs: ['Engineering', 'Commerce', 'Health Sciences'],
    ielts: '6.0+',
    description: "Africa's top-ranked university, offering quality education with a unique cultural experience.",
    image: '/images/universities/uct.jpg',
    scholarship: true,
  },
];

const countries = [
  { id: 'all', label: 'All Countries', icon: faGlobeAmericas },
  { id: 'Canada', label: 'Canada', icon: faGraduationCap },
  { id: 'United Kingdom', label: 'UK', icon: faBookOpen },
  { id: 'Germany', label: 'Germany', icon: faFlask },
  { id: 'Australia', label: 'Australia', icon: faGlobeAmericas },
  { id: 'United States', label: 'USA', icon: faGraduationCap },
  { id: 'South Africa', label: 'South Africa', icon: faBookOpen },
];

const flagEmojis: Record<string, string> = {
  all: '🌍',
  Canada: '🇨🇦',
  'United Kingdom': '🇬🇧',
  Germany: '🇩🇪',
  Australia: '🇦🇺',
  'United States': '🇺🇸',
  'South Africa': '🇿🇦',
};

export default function StudyAbroadPage() {
  const [activeCountry, setActiveCountry] = useState('all');

  const filteredUniversities =
    activeCountry === 'all'
      ? universities
      : universities.filter((uni) => uni.country === activeCountry);

  return (
    <ServiceTheme>
      <main className="study-abroad-page">
        {/* ===== HERO ===== */}
        <ServiceHero
          title="Your Global"
          titleAccent="Education Journey"
          description="Pursue world-class education abroad with our comprehensive support. From university selection to visa processing and beyond, we guide you every step of the way."
          accentColor="orange"
        />

        {/* ===== INTRO STATS ===== */}
        <section className="intro-stats-section">
          <div className="intro-stats-container">
            <div className="intro-stat">
              <div className="intro-stat-value">500+</div>
              <div className="intro-stat-label">Partner Universities</div>
            </div>
            <div className="intro-stat">
              <div className="intro-stat-value">25+</div>
              <div className="intro-stat-label">Countries</div>
            </div>
            <div className="intro-stat">
              <div className="intro-stat-value">2K+</div>
              <div className="intro-stat-label">Students Placed</div>
            </div>
            <div className="intro-stat">
              <div className="intro-stat-value">95%</div>
              <div className="intro-stat-label">Visa Success Rate</div>
            </div>
          </div>
        </section>

        {/* ===== UNIVERSITIES SECTION ===== */}
        <section className="universities-section">
          <div className="universities-container">
            <div className="universities-header">
              <div className="universities-header-content">
                <span className="universities-label">Explore</span>
                <h2 className="universities-title">
                  Discover Your <span className="universities-title-accent">Perfect Match</span>
                </h2>
                <p className="universities-subtitle">
                  Explore top-ranked universities from around the world. Filter by country to find your ideal destination.
                </p>
              </div>
            </div>

            {/* ===== FILTER ===== */}
            <div className="universities-filter">
              {countries.map((country) => (
                <button
                  key={country.id}
                  className={`filter-btn ${activeCountry === country.id ? 'active' : ''}`}
                  onClick={() => setActiveCountry(country.id)}
                >
                  <FontAwesomeIcon icon={country.icon} />
                  <span>{country.label}</span>
                  {activeCountry === country.id && (
                    <span className="filter-count">
                      {country.id === 'all'
                        ? universities.length
                        : filteredUniversities.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ===== UNIVERSITIES GRID ===== */}
            <div className="universities-grid">
              {filteredUniversities.map((uni) => (
                <article key={uni.id} className="university-card">
                  <div className="university-image">
                    <img
                      src={uni.image}
                      alt={uni.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' viewBox='0 0 400 240'%3E%3Crect width='400' height='240' fill='%23E6A64D'/%3E%3Ctext x='200' y='120' font-family='Inter' font-size='20' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                          uni.name
                        )}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div className="university-image-overlay" />
                    <div className="university-image-badges">
                      <span className="university-flag-badge">
                        <span className="flag">{uni.flag}</span>
                        <span className="country-name">{uni.country}</span>
                      </span>
                      <span className="university-ranking-badge">
                        <FontAwesomeIcon icon={faStar} />
                        #{uni.ranking}
                      </span>
                    </div>
                    {uni.scholarship && (
                      <div className="university-scholarship-badge">
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                        Scholarships
                      </div>
                    )}
                  </div>

                  <div className="university-content">
                    <h3 className="university-name">{uni.name}</h3>
                    <p className="university-location">
                      <FontAwesomeIcon icon={faLocationDot} />
                      {uni.city}, {uni.country}
                    </p>

                    <p className="university-description">{uni.description}</p>

                    <div className="university-programs">
                      {uni.programs.map((program, idx) => (
                        <span key={idx} className="program-tag">
                          {program}
                        </span>
                      ))}
                    </div>

                    <div className="university-details">
                      <div className="university-detail">
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                        <div>
                          <span className="detail-label">Tuition</span>
                          <span className="detail-value">{uni.tuition}</span>
                        </div>
                      </div>
                      <div className="university-detail">
                        <FontAwesomeIcon icon={faClock} />
                        <div>
                          <span className="detail-label">Duration</span>
                          <span className="detail-value">{uni.duration}</span>
                        </div>
                      </div>
                      <div className="university-detail">
                        <FontAwesomeIcon icon={faLanguage} />
                        <div>
                          <span className="detail-label">IELTS</span>
                          <span className="detail-value">{uni.ielts}</span>
                        </div>
                      </div>
                    </div>

                    <div className="university-footer">
                      <span className="university-price">{uni.tuition}</span>
                      <Link
                        href={`/services/study-abroad/${uni.id}`}
                        className="university-cta"
                      >
                        View Details
                        <FontAwesomeIcon icon={faArrowRight} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}

              {/* ===== LOAD MORE AS GRID CARD (Aligned with Price) ===== */}
              <article className="university-card load-more-card">
                <Link href="/services/study-abroad/all" className="load-more-link">
                  <div className="load-more-card-content">
                    <div className="load-more-icon">
                      <FontAwesomeIcon icon={faLayerGroup} />
                    </div>
                    <h3 className="load-more-title">Load More Universities</h3>
                    <p className="load-more-desc">
                      Explore all {universities.length}+ top-ranked universities worldwide with advanced filters
                    </p>
                    <span className="load-more-cta">
                      View All Universities
                      <FontAwesomeIcon icon={faArrowRight} />
                    </span>
                  </div>
                </Link>
              </article>
            </div>

            {filteredUniversities.length === 0 && (
              <div className="universities-empty">
                <FontAwesomeIcon icon={faFilter} />
                <h3>No universities found</h3>
                <p>Try a different country</p>
              </div>
            )}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="study-cta">
          <div className="study-cta-bg" />
          <div className="study-cta-container">
            <h2 className="study-cta-title">Not Sure Where to Start?</h2>
            <p className="study-cta-text">
              Book a free consultation with our study abroad experts and get personalized guidance.
            </p>
            <Link href="/contact" className="study-cta-btn">
              Book Free Consultation
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>

        {/* ===== BACK TO TOP ===== */}
        <BackToTop accentColor="orange" />

        <style jsx>{`
          .study-abroad-page {
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
            color: #E6A64D;
            line-height: 1;
            letter-spacing: -0.02em;
          }

          .intro-stat-label {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            font-weight: 500;
            margin-top: 6px;
          }

          /* ===== UNIVERSITIES SECTION ===== */
          .universities-section {
            padding: 20px 32px 80px;
          }

          .universities-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .universities-header {
            margin-bottom: 40px;
          }

          .universities-header-content {
            max-width: 700px;
          }

          .universities-label {
            display: inline-block;
            color: #E6A64D;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .universities-title {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .universities-title-accent {
            color: #E6A64D;
          }

          .universities-subtitle {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            line-height: 1.7;
            margin: 0;
          }

          /* ===== FILTER ===== */
          .universities-filter {
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
            font-size: 13px;
            color: var(--sp-text-muted);
            transition: color 0.25s ease;
          }

          .filter-btn:hover {
            background: rgba(230, 166, 77, 0.08);
            color: #E6A64D;
          }

          .filter-btn:hover :global(svg) {
            color: #E6A64D;
          }

          .filter-btn.active {
            background: #E6A64D;
            color: #1A1A2E;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(230, 166, 77, 0.3);
          }

          .filter-btn.active :global(svg) {
            color: #1A1A2E;
          }

          .filter-count {
            background: rgba(26, 26, 46, 0.15);
            color: #1A1A2E;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 4px;
          }

          /* ===== UNIVERSITIES GRID ===== */
          .universities-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .university-card {
            background: var(--sp-bg-card);
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid var(--sp-border);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
          }

          .university-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--sp-shadow-lg);
            border-color: var(--sp-border-hover);
          }

          /* ===== IMAGE ===== */
          .university-image {
            position: relative;
            height: 200px;
            overflow: hidden;
            background: linear-gradient(135deg, #E6A64D, #D4953A);
          }

          .university-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .university-card:hover .university-image img {
            transform: scale(1.08);
          }

          .university-image-overlay {
            position: absolute;
            inset: 0;
            background: var(--sp-overlay-gradient);
          }

          .university-image-badges {
            position: absolute;
            top: 14px;
            left: 14px;
            right: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }

          .university-flag-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            color: #1A1A2E;
          }

          .university-flag-badge .flag {
            font-size: 16px;
            line-height: 1;
          }

          .university-ranking-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            color: #1A1A2E;
          }

          .university-ranking-badge :global(svg) {
            color: #E6A64D;
            font-size: 11px;
          }

          .university-scholarship-badge {
            position: absolute;
            bottom: 14px;
            right: 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(230, 166, 77, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            color: #1A1A2E;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .university-scholarship-badge :global(svg) {
            font-size: 11px;
          }

          /* ===== CONTENT ===== */
          .university-content {
            padding: 20px 22px 22px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .university-name {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 6px 0;
            letter-spacing: -0.01em;
            line-height: 1.3;
          }

          .university-location {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.78rem;
            color: var(--sp-text-muted);
            margin: 0 0 14px 0;
            font-weight: 500;
          }

          .university-location :global(svg) {
            color: #E6A64D;
            font-size: 11px;
          }

          .university-description {
            font-size: 0.875rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0 0 16px 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .university-programs {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 20px;
          }

          .program-tag {
            font-size: 0.7rem;
            color: var(--sp-tag-text);
            background: var(--sp-tag-bg);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
            border: 1px solid var(--sp-tag-border);
          }

          .university-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            padding: 14px 0;
            border-top: 1px solid var(--sp-border);
            border-bottom: 1px solid var(--sp-border);
            margin-bottom: 16px;
          }

          .university-detail {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            text-align: center;
          }

          .university-detail :global(svg) {
            color: #E6A64D;
            font-size: 13px;
            margin-bottom: 2px;
          }

          .detail-label {
            display: block;
            font-size: 0.62rem;
            color: var(--sp-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 600;
          }

          .detail-value {
            display: block;
            font-size: 0.72rem;
            color: var(--sp-text-primary);
            font-weight: 700;
            margin-top: 2px;
            line-height: 1.3;
          }

          /* ===== FOOTER (aligned with onsite-tourism) ===== */
          .university-footer {
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid var(--sp-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .university-price {
            font-size: 0.9rem;
            font-weight: 700;
            color: #E6A64D;
          }

          .university-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: #E6A64D;
            color: #1A1A2E;
            text-decoration: none;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 700;
            transition: all 0.25s ease;
            white-space: nowrap;
          }

          .university-cta:hover {
            background: #D4953A;
            transform: translateX(3px);
            box-shadow: 0 6px 16px rgba(230, 166, 77, 0.35);
          }

          .university-cta :global(svg) {
            font-size: 10px;
          }

          /* ===== LOAD MORE AS GRID CARD ===== */
          .load-more-card {
            background: linear-gradient(135deg, #E6A64D 0%, #D4953A 100%);
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
            color: #D4953A;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 700;
            margin-top: 8px;
            transition: all 0.3s ease;
          }

          .load-more-card:hover .load-more-cta {
            background: #139EA2;
            color: #FFFFFF;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(19, 158, 162, 0.4);
          }

          .load-more-cta :global(svg) {
            font-size: 12px;
            transition: transform 0.3s ease;
          }

          .load-more-card:hover .load-more-cta :global(svg) {
            transform: translateX(3px);
          }

          /* ===== EMPTY STATE ===== */
          .universities-empty {
            text-align: center;
            padding: 80px 20px;
            color: var(--sp-text-muted);
          }

          .universities-empty :global(svg) {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.3;
          }

          .universities-empty h3 {
            font-size: 1.2rem;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .universities-empty p {
            font-size: 0.9rem;
            margin: 0;
          }

          /* ===== CTA ===== */
          .study-cta {
            position: relative;
            padding: 80px 32px;
            overflow: hidden;
          }

          .study-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #E6A64D 0%, #D4953A 100%);
          }

          .study-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .study-cta-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .study-cta-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.7;
            margin: 0 0 28px 0;
          }

          .study-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: #139EA2;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 30px;
            font-size: 0.95rem;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: 0 8px 24px rgba(19, 158, 162, 0.3);
          }

          .study-cta-btn:hover {
            background: #0D7A7D;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(19, 158, 162, 0.4);
          }

          .study-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .study-cta-btn:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 992px) {
            .universities-grid {
              grid-template-columns: repeat(2, 1fr);
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
            .universities-section {
              padding: 20px 20px 60px;
            }
            .universities-grid {
              grid-template-columns: 1fr;
            }
            .universities-filter {
              width: 100%;
              overflow-x: auto;
              flex-wrap: nowrap;
              scrollbar-width: none;
            }
            .universities-filter::-webkit-scrollbar {
              display: none;
            }
            .filter-btn {
              flex-shrink: 0;
            }
            .study-cta {
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
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}