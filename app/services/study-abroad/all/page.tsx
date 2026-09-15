"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faChevronRight,
  faArrowRight,
  faStar,
  faLocationDot,
  faClock,
  faSearch,
  faTimes,
  faMoneyBillWave,
  faLanguage,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
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

const allUniversities: University[] = [
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
  {
    id: 7,
    name: 'Trinity College Dublin',
    country: 'Ireland',
    city: 'Dublin',
    flag: '🇮🇪',
    ranking: 81,
    tuition: '€20,000/yr',
    duration: '4 years',
    programs: ['Arts', 'Business', 'Engineering'],
    ielts: '6.5+',
    description: "Ireland's oldest and most prestigious university, offering a rich academic tradition.",
    image: '/images/universities/trinity.jpg',
    scholarship: true,
  },
  {
    id: 8,
    name: 'Khalifa University',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    flag: '🇦🇪',
    ranking: 202,
    tuition: 'AED 75,000/yr',
    duration: '4 years',
    programs: ['Engineering', 'Science', 'Computing'],
    ielts: '6.5+',
    description: 'A research-intensive university with full scholarships available for international students.',
    image: '/images/universities/khalifa.jpg',
    scholarship: true,
  },
  {
    id: 9,
    name: 'Waseda University',
    country: 'Japan',
    city: 'Tokyo',
    flag: '🇯🇵',
    ranking: 199,
    tuition: 'JPY 1,200,000/yr',
    duration: '4 years',
    programs: ['Business', 'Engineering', 'Political Science'],
    ielts: '6.0+',
    description: "Japan's leading private university, offering English-taught programs and scholarships.",
    image: '/images/universities/waseda.jpg',
    scholarship: true,
  },
  {
    id: 10,
    name: 'University of Amsterdam',
    country: 'Netherlands',
    city: 'Amsterdam',
    flag: '🇳🇱',
    ranking: 53,
    tuition: '€16,000/yr',
    duration: '3 years',
    programs: ['Social Sciences', 'Economics', 'Law'],
    ielts: '6.5+',
    description: 'A leading European research university with a strong international focus.',
    image: '/images/universities/amsterdam.jpg',
    scholarship: true,
  },
  {
    id: 11,
    name: 'ETH Zurich',
    country: 'Switzerland',
    city: 'Zurich',
    flag: '🇨🇭',
    ranking: 7,
    tuition: 'CHF 1,500/semester',
    duration: '3 years',
    programs: ['Engineering', 'Science', 'Mathematics'],
    ielts: '7.0+',
    description: "Switzerland's premier science and technology university, consistently ranked among the world's best.",
    image: '/images/universities/eth.jpg',
    scholarship: true,
  },
  {
    id: 12,
    name: 'Peking University',
    country: 'China',
    city: 'Beijing',
    flag: '🇨🇳',
    ranking: 17,
    tuition: 'CNY 30,000/yr',
    duration: '4 years',
    programs: ['Engineering', 'Business', 'Humanities'],
    ielts: '6.5+',
    description: "China's most prestigious university, offering world-class education and extensive scholarship opportunities.",
    image: '/images/universities/peking.jpg',
    scholarship: true,
  },
];

const allCountries = [
  { id: 'all', label: 'All Countries' },
  { id: 'Canada', label: 'Canada' },
  { id: 'United Kingdom', label: 'UK' },
  { id: 'Germany', label: 'Germany' },
  { id: 'Australia', label: 'Australia' },
  { id: 'United States', label: 'USA' },
  { id: 'South Africa', label: 'South Africa' },
  { id: 'Ireland', label: 'Ireland' },
  { id: 'Japan', label: 'Japan' },
  { id: 'Netherlands', label: 'Netherlands' },
  { id: 'Switzerland', label: 'Switzerland' },
  { id: 'China', label: 'China' },
];

export default function AllUniversitiesPage() {
  const router = useRouter();
  const [activeCountry, setActiveCountry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'ranking' | 'name' | 'tuition'>('ranking');
  const [visibleCount, setVisibleCount] = useState(9);

  const filteredUniversities = useMemo(() => {
    let unis = [...allUniversities];

    if (activeCountry !== 'all') {
      unis = unis.filter((u) => u.country === activeCountry);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      unis = unis.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'ranking') {
      unis.sort((a, b) => a.ranking - b.ranking);
    } else if (sortBy === 'name') {
      unis.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'tuition') {
      unis.sort(
        (a, b) =>
          parseInt(a.tuition.replace(/\D/g, '')) -
          parseInt(b.tuition.replace(/\D/g, ''))
      );
    }

    return unis;
  }, [activeCountry, searchQuery, sortBy]);

  const visibleUniversities = filteredUniversities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredUniversities.length;

  const clearFilters = () => {
    setActiveCountry('all');
    setSearchQuery('');
    setSortBy('ranking');
    setVisibleCount(9);
  };

  const hasActiveFilters =
    activeCountry !== 'all' || searchQuery.trim() !== '' || sortBy !== 'ranking';

  return (
    <ServiceTheme>
      <main className="all-unis-page">
        {/* ===== HEADER ===== */}
        <section className="all-header">
          <div className="all-header-bg" />
          <div className="all-header-container">
            <nav className="all-breadcrumb-nav" aria-label="Breadcrumb">

              <div className="all-breadcrumb-trail">
                <Link href="/" className="all-breadcrumb-btn">
                  Home
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className="all-breadcrumb-sep" />
                <Link href="/services/study-abroad" className="all-breadcrumb-btn">
                  Study Abroad
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className="all-breadcrumb-sep" />
                <span className="all-breadcrumb-btn current">All Universities</span>
              </div>
            </nav>

            <h1 className="all-title">
              All <span className="all-title-accent">Universities</span>
            </h1>
            <p className="all-subtitle">
              {allUniversities.length} top-ranked universities across 12 countries. Find your perfect match.
            </p>
          </div>
        </section>

        {/* ===== FILTERS ===== */}
        <section className="all-filters-section">
          <div className="all-filters-container">
            <div className="all-filters-top">
              <div className="all-search-wrapper">
                <input
                  type="text"
                  placeholder="Search universities, countries, or cities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(9);
                  }}
                  className="all-search-input"
                />
                {searchQuery && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>

              <div className="all-filters-right">
                <span className="results-count">
                  <strong>{filteredUniversities.length}</strong>{' '}
                  {filteredUniversities.length === 1 ? 'university' : 'universities'}
                </span>

                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'ranking' | 'name' | 'tuition')
                  }
                >
                  <option value="ranking">Sort by: Ranking</option>
                  <option value="name">Sort by: Name</option>
                  <option value="tuition">Sort by: Tuition</option>
                </select>

                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <FontAwesomeIcon icon={faTimes} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <FontAwesomeIcon icon={faLocationDot} />
                Country
              </label>
              <div className="filter-chips">
                {allCountries.map((country) => (
                  <button
                    key={country.id}
                    className={`filter-chip ${
                      activeCountry === country.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      setActiveCountry(country.id);
                      setVisibleCount(9);
                    }}
                  >
                    {country.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== GRID ===== */}
        <section className="all-unis-section">
          <div className="all-unis-container">
            {filteredUniversities.length > 0 ? (
              <>
                <div className="all-unis-grid">
                  {visibleUniversities.map((uni) => (
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
                        <div className="university-flag-badge">
                          <span className="flag">{uni.flag}</span>
                          <span className="country">{uni.country}</span>
                        </div>
                        {uni.scholarship && (
                          <div className="university-scholarship-badge">
                            <FontAwesomeIcon icon={faMoneyBillWave} />
                            Scholarships
                          </div>
                        )}
                      </div>

                      <div className="university-content">
                        <div className="university-ranking">
                          <FontAwesomeIcon icon={faStar} />
                          <span>Ranked #{uni.ranking} Worldwide</span>
                        </div>

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

                        <Link
                          href={`/services/study-abroad/${uni.id}`}
                          className="university-cta"
                        >
                          View Details
                          <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {hasMore && (
                  <div className="all-unis-load-more">
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCount((prev) => prev + 9)}
                    >
                      <FontAwesomeIcon icon={faChevronDown} />
                      Load More Universities
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="all-empty-state">
                <FontAwesomeIcon icon={faSearch} />
                <h3>No universities found</h3>
                <p>Try adjusting your filters or search query</p>
                <button className="all-empty-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </section>

        <BackToTop accentColor="orange" />

        <style jsx>{`
          .all-unis-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== HEADER ===== */
          .all-header {
            position: relative;
            overflow: hidden;
            padding: 60px 32px 40px;
            background: linear-gradient(135deg, #E6A64D 0%, #D4953A 100%);
          }

          .all-header-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 20% 50%,
                rgba(19, 158, 162, 0.25) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 50%,
                rgba(255, 255, 255, 0.15) 0%,
                transparent 50%
              );
          }

          .all-header-container {
            position: relative;
            z-index: 2;
            max-width: 1280px;
            margin: 0 auto;
          }

          /* ===== BREADCRUMB ===== */
          .all-breadcrumb-nav {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .all-breadcrumb-back {
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
          }

          .all-breadcrumb-back:hover {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #D4953A;
            transform: translateX(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .all-breadcrumb-trail {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .all-breadcrumb-btn {
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
            letter-spacing: 0.2px;
          }

          .all-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.6);
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .all-breadcrumb-btn.current {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #D4953A;
            font-weight: 700;
            cursor: default;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          }

          .all-breadcrumb-btn.current:hover {
            background: #FFFFFF;
            color: #D4953A;
            transform: none;
          }

          .all-breadcrumb-sep {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            flex-shrink: 0;
          }

          .all-title {
            font-size: clamp(2rem, 4.5vw, 3rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.1;
            letter-spacing: -0.02em;
          }

          .all-title-accent {
            color: #1A1A2E;
          }

          .all-subtitle {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.6;
            margin: 0;
            max-width: 600px;
          }

          /* ===== FILTERS ===== */
          .all-filters-section {
            background: var(--sp-bg-card);
            border-bottom: 1px solid var(--sp-border);
            padding: 20px 32px;
            position: sticky;
            top: 0;
            z-index: 30;
            transition: background 0.4s ease, border-color 0.4s ease;
          }

          .all-filters-container {
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .all-filters-top {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }

          .all-search-wrapper {
            position: relative;
            flex: 1;
            min-width: 240px;
            max-width: 560px;
          }

          .all-search-wrapper .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--sp-text-muted);
            font-size: 14px;
            pointer-events: none;
          }

          .all-search-input {
            width: 100%;
            padding: 12px 44px 12px 44px;
            border-radius: 12px;
            font-family: inherit;
            font-size: 0.9rem;
            transition: all 0.25s ease;
            background: var(--sp-bg-input);
            border: 1.5px solid var(--sp-border);
            color: var(--sp-text-primary);
          }

          .all-search-input::placeholder {
            color: var(--sp-text-muted);
          }

          .all-search-input:focus {
            outline: none;
            border-color: #E6A64D;
            box-shadow: 0 0 0 4px rgba(230, 166, 77, 0.15);
          }

          .search-clear {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            transition: all 0.2s ease;
            background: rgba(0, 0, 0, 0.08);
            color: var(--sp-text-secondary);
          }

          .search-clear:hover {
            background: rgba(0, 0, 0, 0.15);
          }

          .all-filters-right {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
            margin-left: auto;
          }

          .results-count {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            white-space: nowrap;
          }

          .results-count strong {
            color: #E6A64D;
            font-weight: 700;
          }

          .sort-select {
            padding: 8px 14px;
            border: 1px solid var(--sp-border);
            border-radius: 10px;
            background: var(--sp-bg-input);
            color: var(--sp-text-primary);
            font-family: inherit;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .sort-select:focus {
            outline: none;
            border-color: #E6A64D;
          }

          .clear-filters-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border: 1px solid var(--sp-border);
            border-radius: 10px;
            background: transparent;
            color: var(--sp-text-secondary);
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
          }

          .clear-filters-btn:hover {
            border-color: #EF4444;
            color: #EF4444;
          }

          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .filter-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--sp-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .filter-label :global(svg) {
            color: #E6A64D;
            font-size: 12px;
          }

          .filter-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .filter-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: var(--sp-tag-bg);
            border: 1px solid var(--sp-tag-border);
            border-radius: 20px;
            color: var(--sp-text-secondary);
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            white-space: nowrap;
          }

          .filter-chip:hover {
            border-color: #E6A64D;
            color: #E6A64D;
          }

          .filter-chip.active {
            background: #E6A64D;
            border-color: #E6A64D;
            color: #1A1A2E;
            font-weight: 600;
          }

          /* ===== GRID ===== */
          .all-unis-section {
            padding: 40px 32px 80px;
          }

          .all-unis-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .all-unis-grid {
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
            border-color: rgba(230, 166, 77, 0.4);
          }

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
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.1) 0%,
              rgba(0, 0, 0, 0.4) 100%
            );
          }

          .university-flag-badge {
            position: absolute;
            top: 14px;
            left: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: #1A1A2E;
          }

          .university-flag-badge .flag {
            font-size: 16px;
            line-height: 1;
          }

          .university-scholarship-badge {
            position: absolute;
            top: 14px;
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

          .university-content {
            padding: 22px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .university-ranking {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #E6A64D;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .university-ranking :global(svg) {
            font-size: 10px;
          }

          .university-name {
            font-size: 1.1rem;
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
            font-size: 0.8rem;
            color: var(--sp-text-muted);
            margin: 0 0 14px 0;
            font-weight: 500;
          }

          .university-location :global(svg) {
            color: #E6A64D;
            font-size: 10px;
          }

          .university-description {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0 0 14px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .university-programs {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 18px;
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
            gap: 12px;
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
            font-size: 14px;
            margin-bottom: 2px;
          }

          .detail-label {
            display: block;
            font-size: 0.65rem;
            color: var(--sp-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 600;
          }

          .detail-value {
            display: block;
            font-size: 0.75rem;
            color: var(--sp-text-primary);
            font-weight: 700;
            margin-top: 2px;
          }

          .university-cta {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 20px;
            background: #E6A64D;
            color: #1A1A2E;
            text-decoration: none;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 700;
            transition: all 0.25s ease;
            margin-top: auto;
          }

          .university-cta:hover {
            background: #D4953A;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(230, 166, 77, 0.3);
          }

          .university-cta :global(svg) {
            font-size: 12px;
            transition: transform 0.25s ease;
          }

          .university-cta:hover :global(svg) {
            transform: translateX(3px);
          }

          /* ===== LOAD MORE ===== */
          .all-unis-load-more {
            display: flex;
            justify-content: center;
            margin-top: 48px;
          }

          .load-more-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 32px;
            background: var(--sp-bg-card);
            color: #E6A64D;
            border: 1.5px solid rgba(230, 166, 77, 0.3);
            border-radius: 30px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
          }

          .load-more-btn:hover {
            background: #E6A64D;
            color: #1A1A2E;
            border-color: #E6A64D;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(230, 166, 77, 0.3);
          }

          /* ===== EMPTY ===== */
          .all-empty-state {
            text-align: center;
            padding: 100px 20px;
            color: var(--sp-text-muted);
          }

          .all-empty-state :global(svg) {
            font-size: 56px;
            margin-bottom: 20px;
            opacity: 0.3;
          }

          .all-empty-state h3 {
            font-size: 1.4rem;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .all-empty-state p {
            font-size: 0.95rem;
            margin: 0 0 24px 0;
          }

          .all-empty-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: #E6A64D;
            color: #1A1A2E;
            border: none;
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
          }

          .all-empty-btn:hover {
            background: #D4953A;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(230, 166, 77, 0.3);
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 992px) {
            .all-unis-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .results-count {
              display: none;
            }
          }

          @media (max-width: 640px) {
            .all-header {
              padding: 32px 20px 30px;
            }
            .all-breadcrumb-back {
              width: 34px;
              height: 34px;
              font-size: 12px;
            }
            .all-breadcrumb-btn {
              padding: 6px 12px;
              font-size: 0.75rem;
              border-radius: 8px;
            }
            .all-breadcrumb-sep {
              font-size: 8px;
            }

            .all-filters-section {
              padding: 16px 20px;
              position: relative;
              top: 0;
            }
            .all-filters-top {
              flex-direction: column;
              align-items: stretch;
            }
            .all-search-wrapper {
              max-width: none;
            }
            .all-filters-right {
              margin-left: 0;
              flex-wrap: wrap;
            }

            .all-unis-section {
              padding: 24px 20px 60px;
            }
            .all-unis-grid {
              grid-template-columns: 1fr;
            }

            .filter-chips {
              flex-wrap: nowrap;
              overflow-x: auto;
              padding-bottom: 4px;
              scrollbar-width: none;
            }
            .filter-chips::-webkit-scrollbar {
              display: none;
            }
            .filter-chip {
              flex-shrink: 0;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}