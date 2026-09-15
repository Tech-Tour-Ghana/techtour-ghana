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
  faFilter,
  faChevronDown,
  faHeart,
  faUmbrellaBeach,
  faHotel,
  faPlane,
  faMapSigns,
  faSpa,
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
  highlights: string[];
  image: string;
  badge?: string;
}

const allVacations: Vacation[] = [
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
  {
    id: 7,
    title: 'Zanzibar Beach Paradise',
    destination: 'Zanzibar',
    country: 'Tanzania',
    flag: '🇹🇿',
    type: 'beach',
    duration: '5 days / 4 nights',
    rating: 4.8,
    price: 'From GHS 12,000',
    description: 'Pristine beaches, spice tours, and Swahili culture in an island paradise.',
    highlights: ['White Sand Beaches', 'Spice Tours', 'Snorkeling'],
    image: '/images/vacations/zanzibar.jpg',
    badge: 'Hidden Gem',
  },
  {
    id: 8,
    title: 'Iceland Northern Lights',
    destination: 'Reykjavik',
    country: 'Iceland',
    flag: '🇮🇸',
    type: 'adventure',
    duration: '5 days / 4 nights',
    rating: 4.9,
    price: 'From GHS 28,000',
    description: 'Chase the aurora borealis, soak in geothermal lagoons, and explore glaciers.',
    highlights: ['Northern Lights', 'Blue Lagoon', 'Glacier Hiking'],
    image: '/images/vacations/iceland.jpg',
    badge: 'Once in a Lifetime',
  },
  {
    id: 9,
    title: 'Marrakech Cultural Journey',
    destination: 'Marrakech',
    country: 'Morocco',
    flag: '🇲🇦',
    type: 'city',
    duration: '4 days / 3 nights',
    rating: 4.6,
    price: 'From GHS 10,000',
    description: 'Vibrant souks, ancient medinas, and luxurious riads in the heart of Morocco.',
    highlights: ['Medina Tours', 'Luxury Riad', 'Atlas Mountains'],
    image: '/images/vacations/marrakech.jpg',
  },
  {
    id: 10,
    title: 'Bora Bora Overwater Dream',
    destination: 'Bora Bora',
    country: 'French Polynesia',
    flag: '🇵🇫',
    type: 'beach',
    duration: '8 days / 7 nights',
    rating: 5.0,
    price: 'From GHS 35,000',
    description: 'The ultimate overwater bungalow experience in the South Pacific.',
    highlights: ['Overwater Bungalow', 'Coral Gardens', 'Lagoon Tours'],
    image: '/images/vacations/borabora.jpg',
    badge: 'Ultra Luxury',
  },
  {
    id: 11,
    title: 'Swiss Alps Adventure',
    destination: 'Zermatt',
    country: 'Switzerland',
    flag: '🇨🇭',
    type: 'adventure',
    duration: '6 days / 5 nights',
    rating: 4.9,
    price: 'From GHS 24,000',
    description: 'Majestic peaks, scenic train rides, and alpine charm in every direction.',
    highlights: ['Matterhorn Views', 'Glacier Express', 'Alpine Hiking'],
    image: '/images/vacations/swissalps.jpg',
  },
  {
    id: 12,
    title: 'Serengeti Migration Safari',
    destination: 'Serengeti',
    country: 'Tanzania',
    flag: '🇹🇿',
    type: 'safari',
    duration: '7 days / 6 nights',
    rating: 4.9,
    price: 'From GHS 28,000',
    description: 'Follow the Great Migration across the legendary plains of the Serengeti.',
    highlights: ['Great Migration', 'Hot Air Balloon', 'Big Five'],
    image: '/images/vacations/serengeti.jpg',
    badge: 'Epic',
  },
];

const allCountries = [
  { id: 'all', label: 'All Countries' },
  { id: 'Maldives', label: 'Maldives' },
  { id: 'Kenya', label: 'Kenya' },
  { id: 'UAE', label: 'UAE' },
  { id: 'Greece', label: 'Greece' },
  { id: 'Indonesia', label: 'Indonesia' },
  { id: 'South Africa', label: 'South Africa' },
  { id: 'Tanzania', label: 'Tanzania' },
  { id: 'Iceland', label: 'Iceland' },
  { id: 'Morocco', label: 'Morocco' },
  { id: 'French Polynesia', label: 'French Polynesia' },
  { id: 'Switzerland', label: 'Switzerland' },
];

const allCategories = [
  { id: 'all', label: 'All Types', icon: faUmbrellaBeach },
  { id: 'beach', label: 'Beach', icon: faUmbrellaBeach },
  { id: 'safari', label: 'Safari', icon: faMapSigns },
  { id: 'city', label: 'City', icon: faHotel },
  { id: 'luxury', label: 'Luxury', icon: faSpa },
  { id: 'adventure', label: 'Adventure', icon: faPlane },
];

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  beach: { bg: 'rgba(19, 158, 162, 0.12)', text: '#139EA2', label: 'Beach' },
  safari: { bg: 'rgba(230, 166, 77, 0.15)', text: '#D4953A', label: 'Safari' },
  city: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6', label: 'City' },
  luxury: { bg: 'rgba(236, 72, 153, 0.12)', text: '#EC4899', label: 'Luxury' },
  adventure: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', label: 'Adventure' },
};

export default function AllVacationsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const filteredVacations = useMemo(() => {
    let items = [...allVacations];

    if (activeCategory !== 'all') {
      items = items.filter((v) => v.type === activeCategory);
    }

    if (activeCountry !== 'all') {
      items = items.filter((v) => v.country === activeCountry);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.destination.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'price') {
      items.sort(
        (a, b) =>
          parseInt(a.price.replace(/\D/g, '')) - parseInt(b.price.replace(/\D/g, ''))
      );
    }

    return items;
  }, [activeCategory, activeCountry, searchQuery, sortBy]);

  const clearFilters = () => {
    setActiveCategory('all');
    setActiveCountry('all');
    setSearchQuery('');
    setSortBy('rating');
  };

  const hasActiveFilters =
    activeCategory !== 'all' ||
    activeCountry !== 'all' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'rating';

  return (
    <ServiceTheme>
      <main className="all-vacations-page">
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
                <Link href="/services/dream-vacations" className="all-breadcrumb-btn">
                  Dream Vacations
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className="all-breadcrumb-sep" />
                <span className="all-breadcrumb-btn current">All Vacations</span>
              </div>
            </nav>

            <h1 className="all-title">
              All <span className="all-title-accent">Vacations</span>
            </h1>
            <p className="all-subtitle">
              {allVacations.length} curated all-inclusive packages across the world. Filter, search, and find your dream trip.
            </p>
          </div>
        </section>

        {/* ===== FILTERS ===== */}
        <section className="all-filters-section">
          <div className="all-filters-container">
            <div className="all-filters-top">
              <button
                className="filters-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FontAwesomeIcon icon={faFilter} />
                Filters
                {hasActiveFilters && <span className="filter-dot" />}
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`toggle-arrow ${showFilters ? 'open' : ''}`}
                />
              </button>

              <div className="all-search-wrapper">
                <input
                  type="text"
                  placeholder="Search destinations, countries, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <strong>{filteredVacations.length}</strong>{' '}
                  {filteredVacations.length === 1 ? 'vacation' : 'vacations'}
                </span>

                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'rating' | 'price' | 'name')
                  }
                >
                  <option value="rating">Sort by: Rating</option>
                  <option value="price">Sort by: Price</option>
                  <option value="name">Sort by: Name</option>
                </select>

                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <FontAwesomeIcon icon={faTimes} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="all-filters-body">
                <div className="filter-group">
                  <label className="filter-label">
                    <FontAwesomeIcon icon={faFilter} />
                    Category
                  </label>
                  <div className="filter-chips">
                    {allCategories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`filter-chip ${
                          activeCategory === cat.id ? 'active' : ''
                        }`}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        <FontAwesomeIcon icon={cat.icon} />
                        {cat.label}
                      </button>
                    ))}
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
                        onClick={() => setActiveCountry(country.id)}
                      >
                        {country.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== GRID ===== */}
        <section className="all-vacations-section">
          <div className="all-vacations-container">
            {filteredVacations.length > 0 ? (
              <div className="all-vacations-grid">
                {filteredVacations.map((vacation) => {
                  const catColor = categoryColors[vacation.type]!;
                  return (
                    <article key={vacation.id} className="all-vacation-card">
                      <div className="all-vacation-image">
                        <img
                          src={vacation.image}
                          alt={vacation.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Crect width='400' height='280' fill='%23139EA2'/%3E%3Ctext x='200' y='140' font-family='Inter' font-size='20' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                              vacation.title
                            )}%3C/text%3E%3C/svg%3E`;
                          }}
                        />
                        <div className="all-vacation-overlay" />

                        <div className="all-vacation-badges">
                          <span
                            className="all-category-badge"
                            style={{
                              background: catColor.bg,
                              color: catColor.text,
                            }}
                          >
                            {catColor.label}
                          </span>
                          {vacation.badge && (
                            <span className="all-promo-badge">
                              <FontAwesomeIcon icon={faHeart} />
                              {vacation.badge}
                            </span>
                          )}
                        </div>

                        <div className="all-vacation-bottom-badges">
                          <span className="all-flag">{vacation.flag}</span>
                          <span className="all-rating-badge">
                            <FontAwesomeIcon icon={faStar} />
                            {vacation.rating}
                          </span>
                        </div>
                      </div>

                      <div className="all-vacation-content">
                        <div className="all-vacation-meta">
                          <span>
                            <FontAwesomeIcon icon={faLocationDot} />
                            {vacation.destination}
                          </span>
                          <span>
                            <FontAwesomeIcon icon={faClock} />
                            {vacation.duration}
                          </span>
                        </div>

                        <h3 className="all-vacation-title">{vacation.title}</h3>
                        <p className="all-vacation-description">
                          {vacation.description}
                        </p>

                        <div className="all-vacation-highlights">
                          {vacation.highlights.slice(0, 3).map((h, i) => (
                            <span key={i} className="all-highlight-tag">
                              {h}
                            </span>
                          ))}
                        </div>

                        <div className="all-vacation-footer">
                          <div className="all-price-block">
                            {vacation.oldPrice && (
                              <span className="all-old-price">
                                {vacation.oldPrice}
                              </span>
                            )}
                            <span className="all-vacation-price">
                              {vacation.price}
                            </span>
                          </div>
                          <Link
                            href={`/services/dream-vacations/${vacation.id}`}
                            className="all-vacation-cta"
                          >
                            Book Now
                            <FontAwesomeIcon icon={faArrowRight} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="all-empty-state">
                <FontAwesomeIcon icon={faSearch} />
                <h3>No vacations found</h3>
                <p>Try adjusting your filters or search query</p>
                <button className="all-empty-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </section>

        <BackToTop accentColor="teal" />

        <style jsx>{`
          .all-vacations-page {
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
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .all-header-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 20% 50%,
                rgba(230, 166, 77, 0.2) 0%,
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
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.1);
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
            color: #139EA2;
            transform: translateX(-3px);
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
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.9);
          }

          .all-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.5);
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .all-breadcrumb-btn.current {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #0D7A7D;
            font-weight: 700;
            cursor: default;
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
            color: #E6A64D;
          }

          .all-subtitle {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            margin: 0;
            max-width: 600px;
          }

          /* ===== FILTERS ===== */
          .all-filters-section {
            background: var(--sp-bg-card);
            border-bottom: 1px solid var(--sp-border);
            padding: 16px 32px;
            position: sticky;
            top: 0;
            z-index: 50;
            transition: background 0.4s ease, border-color 0.4s ease;
          }

          .all-filters-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .all-filters-top {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 16px;
          }

          .filters-toggle {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 18px;
            background: var(--sp-primary-light);
            color: var(--sp-primary);
            border: none;
            border-radius: 10px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
            white-space: nowrap;
          }

          .filters-toggle:hover {
            background: var(--sp-primary);
            color: #FFFFFF;
          }

          .filter-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #E6A64D;
            margin-left: 2px;
          }

          .toggle-arrow {
            font-size: 10px;
            transition: transform 0.25s ease;
            margin-left: 4px;
          }

          .toggle-arrow.open {
            transform: rotate(180deg);
          }

          /* ===== SEARCH ===== */
          .all-search-wrapper {
            position: relative;
            width: 100%;
            max-width: 560px;
            margin: 0 auto;
          }

          .all-search-wrapper .search-icon {
            position: absolute;
            left: 18px;
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
            border-color: #139EA2;
            box-shadow: 0 0 0 4px rgba(19, 158, 162, 0.15);
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
          }

          .results-count {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            white-space: nowrap;
          }

          .results-count strong {
            color: var(--sp-primary);
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
            border-color: var(--sp-primary);
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
            white-space: nowrap;
          }

          .clear-filters-btn:hover {
            border-color: #EF4444;
            color: #EF4444;
          }

          .all-filters-body {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--sp-border);
            display: flex;
            flex-direction: column;
            gap: 24px;
            animation: filterSlideIn 0.25s ease;
          }

          @keyframes filterSlideIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
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
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--sp-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .filter-label :global(svg) {
            color: var(--sp-primary);
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

          .filter-chip :global(svg) {
            font-size: 11px;
            opacity: 0.7;
          }

          .filter-chip:hover {
            border-color: var(--sp-primary);
            color: var(--sp-primary);
          }

          .filter-chip.active {
            background: var(--sp-primary);
            border-color: var(--sp-primary);
            color: #FFFFFF;
            font-weight: 600;
          }

          .filter-chip.active :global(svg) {
            opacity: 1;
          }

          /* ===== GRID ===== */
          .all-vacations-section {
            padding: 40px 32px 80px;
          }

          .all-vacations-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .all-vacations-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .all-vacation-card {
            background: var(--sp-bg-card);
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid var(--sp-border);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
          }

          .all-vacation-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--sp-shadow-lg);
            border-color: var(--sp-border-hover);
          }

          .all-vacation-image {
            position: relative;
            height: 220px;
            overflow: hidden;
            background: linear-gradient(135deg, #139EA2, #0D7A7D);
          }

          .all-vacation-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .all-vacation-card:hover .all-vacation-image img {
            transform: scale(1.08);
          }

          .all-vacation-overlay {
            position: absolute;
            inset: 0;
            background: var(--sp-overlay-gradient);
          }

          .all-vacation-badges {
            position: absolute;
            top: 14px;
            left: 14px;
            right: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }

          .all-category-badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
          }

          .all-promo-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px;
            background: rgba(230, 166, 77, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            color: #1A1A2E;
            letter-spacing: 0.3px;
            text-transform: uppercase;
          }

          .all-promo-badge :global(svg) {
            font-size: 9px;
          }

          .all-vacation-bottom-badges {
            position: absolute;
            bottom: 14px;
            left: 14px;
            right: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .all-flag {
            font-size: 24px;
            line-height: 1;
            filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
          }

          .all-rating-badge {
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

          .all-rating-badge :global(svg) {
            color: #E6A64D;
            font-size: 10px;
          }

          .all-vacation-content {
            padding: 20px 22px 22px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .all-vacation-meta {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }

          .all-vacation-meta span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            color: var(--sp-text-muted);
            font-weight: 500;
          }

          .all-vacation-meta :global(svg) {
            font-size: 10px;
            color: #139EA2;
          }

          .all-vacation-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
            letter-spacing: -0.01em;
            line-height: 1.3;
          }

          .all-vacation-description {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0 0 14px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .all-vacation-highlights {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 18px;
          }

          .all-highlight-tag {
            font-size: 0.68rem;
            color: var(--sp-tag-text);
            background: var(--sp-tag-bg);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
            border: 1px solid var(--sp-tag-border);
          }

          .all-vacation-footer {
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid var(--sp-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .all-price-block {
            display: flex;
            flex-direction: column;
            line-height: 1.1;
          }

          .all-old-price {
            font-size: 0.7rem;
            color: var(--sp-text-muted);
            text-decoration: line-through;
            margin-bottom: 2px;
          }

          .all-vacation-price {
            font-size: 0.9rem;
            font-weight: 700;
            color: #139EA2;
          }

          .all-vacation-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: var(--sp-primary);
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 10px;
            font-size: 0.78rem;
            font-weight: 600;
            transition: all 0.25s ease;
            white-space: nowrap;
          }

          .all-vacation-cta:hover {
            background: var(--sp-primary-dark);
            transform: translateX(3px);
          }

          .all-vacation-cta :global(svg) {
            font-size: 10px;
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
            background: var(--sp-primary);
            color: #FFFFFF;
            border: none;
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
          }

          .all-empty-btn:hover {
            background: var(--sp-primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(19, 158, 162, 0.3);
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 992px) {
            .all-vacations-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .all-filters-section {
              padding: 14px 20px;
            }
            .all-filters-top {
              grid-template-columns: auto 1fr auto;
              gap: 12px;
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
              padding: 12px 16px;
              position: relative;
            }
            .all-filters-top {
              grid-template-columns: auto 1fr;
              grid-template-areas:
                'filters search'
                'right right';
              gap: 10px;
            }
            .filters-toggle {
              grid-area: filters;
              padding: 10px 14px;
              font-size: 0.8rem;
            }
            .all-search-wrapper {
              grid-area: search;
              max-width: none;
              margin: 0;
            }
            .all-search-input {
              padding: 10px 38px 10px 38px;
              font-size: 0.85rem;
            }
            .all-search-wrapper .search-icon {
              left: 14px;
              font-size: 13px;
            }
            .search-clear {
              right: 10px;
              width: 22px;
              height: 22px;
              font-size: 10px;
            }
            .all-filters-right {
              grid-area: right;
              width: 100%;
              justify-content: space-between;
              margin-top: 4px;
            }

            .all-vacations-section {
              padding: 24px 20px 60px;
            }
            .all-vacations-grid {
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