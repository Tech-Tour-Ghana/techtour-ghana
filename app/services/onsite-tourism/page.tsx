"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMapMarkedAlt,
    faUsers,
    faLeaf,
    faHandshake,
    faRoute,
    faArrowRight,
    faClock,
    faLocationDot,
    faStar,
    faFilter,
    faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import ServiceHero from '@/components/ServiceHero';
import { ServiceTheme } from '@/components/ServiceTheme';

interface TourismSite {
    id: number;
    name: string;
    region: string;
    category: 'heritage' | 'nature' | 'culture' | 'adventure';
    duration: string;
    rating: number;
    price: string;
    description: string;
    highlights: string[];
    image: string;
}

const tourismSites: TourismSite[] = [
    {
        id: 1,
        name: 'Cape Coast Castle',
        region: 'Central Region',
        category: 'heritage',
        duration: '3-4 hours',
        rating: 4.9,
        price: 'From GHS 120',
        description: 'A UNESCO World Heritage Site and powerful reminder of the transatlantic slave trade, offering guided tours through history.',
        highlights: ['UNESCO Heritage', 'Guided Tour', 'Museum Access'],
        image: '/images/sites/cape-coast.jpg',
    },
    {
        id: 2,
        name: 'Kakum National Park',
        region: 'Central Region',
        category: 'nature',
        duration: '4-5 hours',
        rating: 4.8,
        price: 'From GHS 90',
        description: 'Walk among the treetops on the famous canopy walkway, suspended 40 meters above the forest floor.',
        highlights: ['Canopy Walk', 'Bird Watching', 'Nature Trails'],
        image: '/images/sites/kakum.jpg',
    },
    {
        id: 3,
        name: 'Mole National Park',
        region: 'Savannah Region',
        category: 'nature',
        duration: '2-3 days',
        rating: 4.7,
        price: 'From GHS 450',
        description: "Ghana's largest wildlife reserve, home to elephants, antelopes, and over 300 bird species.",
        highlights: ['Wildlife Safari', 'Walking Safari', 'Lodge Stay'],
        image: '/images/sites/mole.jpg',
    },
    {
        id: 4,
        name: 'Elmina Castle',
        region: 'Central Region',
        category: 'heritage',
        duration: '2-3 hours',
        rating: 4.9,
        price: 'From GHS 100',
        description: 'The oldest European building in Sub-Saharan Africa, offering profound historical tours.',
        highlights: ['Oldest Castle', 'Guided Tour', 'Historic Museum'],
        image: '/images/sites/elmina.jpg',
    },
    {
        id: 5,
        name: 'Wli Waterfalls',
        region: 'Volta Region',
        category: 'nature',
        duration: '3-4 hours',
        rating: 4.8,
        price: 'From GHS 80',
        description: "Ghana's highest waterfall, surrounded by lush tropical forest and hundreds of fruit bats.",
        highlights: ['Waterfall Trek', 'Bat Colony', 'Swimming'],
        image: '/images/sites/wli.jpg',
    },
    {
        id: 6,
        name: 'Jamestown & Nkrumah Memorial',
        region: 'Greater Accra',
        category: 'culture',
        duration: '2-3 hours',
        rating: 4.6,
        price: 'From GHS 70',
        description: "Explore the historic Jamestown district and the final resting place of Ghana's first president.",
        highlights: ['Historic District', 'Presidential Tomb', 'Local Art Scene'],
        image: '/images/sites/jamestown.jpg',
    },
];

const categories = [
    { id: 'all', label: 'All Sites', icon: faMapMarkedAlt },
    { id: 'heritage', label: 'Heritage', icon: faUsers },
    { id: 'nature', label: 'Nature', icon: faLeaf },
    { id: 'culture', label: 'Culture', icon: faHandshake },
    { id: 'adventure', label: 'Adventure', icon: faRoute },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
    heritage: { bg: 'rgba(19, 158, 162, 0.12)', text: '#139EA2' },
    nature: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981' },
    culture: { bg: 'rgba(230, 166, 77, 0.15)', text: '#D4953A' },
    adventure: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6' },
};

export default function OnsiteTourismPage() {
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredSites =
        activeCategory === 'all'
            ? tourismSites
            : tourismSites.filter((site) => site.category === activeCategory);

    return (
        <ServiceTheme>
            <main className="onsite-tourism-page">
                <ServiceHero
                    title="Experience Ghana"
                    titleAccent="In Person"
                    description="Immerse yourself in the sights, sounds, and soul of Ghana through curated onsite tours. From historic castles to vibrant markets, we connect you with authentic cultural experiences."
                    accentColor="teal"
                />

                <section className="intro-stats-section">
                    <div className="intro-stats-container">
                        <div className="intro-stat">
                            <div className="intro-stat-value">50+</div>
                            <div className="intro-stat-label">Curated Sites</div>
                        </div>
                        <div className="intro-stat">
                            <div className="intro-stat-value">10K+</div>
                            <div className="intro-stat-label">Happy Travelers</div>
                        </div>
                        <div className="intro-stat">
                            <div className="intro-stat-value">200+</div>
                            <div className="intro-stat-label">Local Guides</div>
                        </div>
                        <div className="intro-stat">
                            <div className="intro-stat-value">98%</div>
                            <div className="intro-stat-label">Satisfaction</div>
                        </div>
                    </div>
                </section>

                <section className="sites-section">
                    <div className="sites-container">
                        <div className="sites-header">
                            <div className="sites-header-content">
                                <span className="sites-label">Explore</span>
                                <h2 className="sites-title">
                                    Discover Ghana's <span className="sites-title-accent">Finest Sites</span>
                                </h2>
                                <p className="sites-subtitle">
                                    From UNESCO heritage sites to hidden natural wonders, find the experience that speaks to you.
                                </p>
                            </div>
                        </div>

                        <div className="sites-filter">
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
                                            {cat.id === 'all' ? tourismSites.length : filteredSites.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="sites-grid">
                            {filteredSites.map((site) => {
                                const catColor = categoryColors[site.category]!;
                                return (
                                    <article key={site.id} className="site-card">
                                        <div className="site-image">
                                            <img
                                                src={site.image}
                                                alt={site.name}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23139EA2'/%3E%3Ctext x='200' y='150' font-family='Inter' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                                                        site.name
                                                    )}%3C/text%3E%3C/svg%3E`;
                                                }}
                                            />
                                            <div className="site-image-overlay" />
                                            <div className="site-image-badges">
                                                <span
                                                    className="site-category-badge"
                                                    style={{ background: catColor.bg, color: catColor.text }}
                                                >
                                                    {site.category.charAt(0).toUpperCase() + site.category.slice(1)}
                                                </span>
                                                <span className="site-rating-badge">
                                                    <FontAwesomeIcon icon={faStar} />
                                                    {site.rating}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="site-content">
                                            <div className="site-meta">
                                                <span className="site-meta-item">
                                                    <FontAwesomeIcon icon={faLocationDot} />
                                                    {site.region}
                                                </span>
                                                <span className="site-meta-item">
                                                    <FontAwesomeIcon icon={faClock} />
                                                    {site.duration}
                                                </span>
                                            </div>

                                            <h3 className="site-name">{site.name}</h3>
                                            <p className="site-description">{site.description}</p>

                                            <div className="site-highlights">
                                                {site.highlights.map((highlight, idx) => (
                                                    <span key={idx} className="site-highlight">
                                                        {highlight}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="site-footer">
                                                <span className="site-price">{site.price}</span>
                                                <Link
                                                    href={`/services/onsite-tourism/${site.id}`}
                                                    className="site-cta"
                                                >
                                                    Book Now
                                                    <FontAwesomeIcon icon={faArrowRight} />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}

                            {/* ===== LOAD MORE AS GRID CARD (Aligned with Price) ===== */}
                            <article className="site-card load-more-card">
                                <Link href="/services/onsite-tourism/all" className="load-more-link">
                                    <div className="load-more-card-content">
                                        <div className="load-more-icon">
                                            <FontAwesomeIcon icon={faLayerGroup} />
                                        </div>
                                        <h3 className="load-more-title">Load More Sites</h3>
                                        <p className="load-more-desc">
                                            Explore all 18+ curated experiences across Ghana with advanced filters
                                        </p>
                                        <span className="load-more-cta">
                                            View All Sites
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        </span>
                                    </div>
                                </Link>
                            </article>
                        </div>

                        {filteredSites.length === 0 && (
                            <div className="sites-empty">
                                <FontAwesomeIcon icon={faFilter} />
                                <h3>No sites found</h3>
                                <p>Try a different category</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="onsite-cta">
                    <div className="onsite-cta-bg" />
                    <div className="onsite-cta-container">
                        <h2 className="onsite-cta-title">Can't Find What You're Looking For?</h2>
                        <p className="onsite-cta-text">
                            Tell us your dream experience and we'll craft a custom itinerary just for you.
                        </p>
                        <Link href="/about/contact-us" className="onsite-cta-btn">
                            Request Custom Tour
                            <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                    </div>
                </section>

                {/* ✅ Back to Top Button */}
                <BackToTop accentColor="teal" />

                <style jsx>{`
          .onsite-tourism-page {
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

          /* ===== SITES SECTION ===== */
          .sites-section {
            padding: 20px 32px 80px;
          }

          .sites-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .sites-header {
            margin-bottom: 40px;
          }

          .sites-header-content {
            max-width: 700px;
          }

          .sites-label {
            display: inline-block;
            color: #139EA2;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .sites-title {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .sites-title-accent {
            color: #139EA2;
          }

          .sites-subtitle {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            line-height: 1.7;
            margin: 0;
          }

          /* ===== FILTER ===== */
          .sites-filter {
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

          /* ===== SITES GRID ===== */
          .sites-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .site-card {
            background: var(--sp-bg-card);
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid var(--sp-border);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
          }

          .site-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--sp-shadow-lg);
            border-color: var(--sp-border-hover);
          }

          /* ===== IMAGE ===== */
          .site-image {
            position: relative;
            height: 220px;
            overflow: hidden;
            background: linear-gradient(135deg, #139EA2, #0D7A7D);
          }

          .site-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .site-card:hover .site-image img {
            transform: scale(1.08);
          }

          .site-image-overlay {
            position: absolute;
            inset: 0;
            background: var(--sp-overlay-gradient);
          }

          .site-image-badges {
            position: absolute;
            top: 14px;
            left: 14px;
            right: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }

          .site-category-badge {
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
          }

          .site-rating-badge {
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

          .site-rating-badge :global(svg) {
            color: #E6A64D;
            font-size: 11px;
          }

          /* ===== CONTENT ===== */
          .site-content {
            padding: 20px 22px 22px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .site-meta {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }

          .site-meta-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.78rem;
            color: var(--sp-text-muted);
            font-weight: 500;
          }

          .site-meta-item :global(svg) {
            font-size: 11px;
            color: #139EA2;
          }

          .site-name {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 10px 0;
            letter-spacing: -0.01em;
            line-height: 1.3;
          }

          .site-description {
            font-size: 0.875rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0 0 16px 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .site-highlights {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 20px;
          }

          .site-highlight {
            font-size: 0.7rem;
            color: var(--sp-tag-text);
            background: var(--sp-tag-bg);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
            border: 1px solid var(--sp-tag-border);
          }

          .site-footer {
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid var(--sp-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .site-price {
            font-size: 0.9rem;
            font-weight: 700;
            color: #139EA2;
          }

          .site-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: #139EA2;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 600;
            transition: all 0.25s ease;
          }

          .site-cta:hover {
            background: #0D7A7D;
            transform: translateX(3px);
          }

          .site-cta :global(svg) {
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
          .sites-empty {
            text-align: center;
            padding: 80px 20px;
            color: var(--sp-text-muted);
          }

          .sites-empty :global(svg) {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.3;
          }

          .sites-empty h3 {
            font-size: 1.2rem;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .sites-empty p {
            font-size: 0.9rem;
            margin: 0;
          }

          /* ===== CTA ===== */
          .onsite-cta {
            position: relative;
            padding: 80px 32px;
            overflow: hidden;
          }

          .onsite-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .onsite-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .onsite-cta-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .onsite-cta-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 0 28px 0;
          }

          .onsite-cta-btn {
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

          .onsite-cta-btn:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .onsite-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .onsite-cta-btn:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== RESPONSIVE ===== */
          @media (max-width: 992px) {
            .sites-grid {
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
            .sites-section {
              padding: 20px 20px 60px;
            }
            .sites-grid {
              grid-template-columns: 1fr;
            }
            .sites-filter {
              width: 100%;
              overflow-x: auto;
              flex-wrap: nowrap;
              scrollbar-width: none;
            }
            .sites-filter::-webkit-scrollbar {
              display: none;
            }
            .filter-btn {
              flex-shrink: 0;
            }
            .onsite-cta {
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