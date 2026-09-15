"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faFilter,
    faChevronDown,
    faChevronRight,
    faArrowRight,
    faStar,
    faLocationDot,
    faClock,
    faSearch,
    faTimes,
    faMapMarkedAlt,
    faUsers,
    faLeaf,
    faHandshake,
    faRoute,
} from '@fortawesome/free-solid-svg-icons';
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

const allSites: TourismSite[] = [
    {
        id: 1,
        name: 'Cape Coast Castle',
        region: 'Central Region',
        category: 'heritage',
        duration: '3-4 hours',
        rating: 4.9,
        price: 'From GHS 120',
        description: 'A UNESCO World Heritage Site and powerful reminder of the transatlantic slave trade.',
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
    {
        id: 7,
        name: 'Aburi Botanical Gardens',
        region: 'Eastern Region',
        category: 'nature',
        duration: '2-3 hours',
        rating: 4.5,
        price: 'From GHS 60',
        description: 'A serene botanical garden with a rich collection of tropical plants and sweeping views.',
        highlights: ['Botanical Garden', 'Guided Walks', 'Picnic Spots'],
        image: '/images/sites/aburi.jpg',
    },
    {
        id: 8,
        name: 'Nzulezu Stilt Village',
        region: 'Western Region',
        category: 'culture',
        duration: '5-6 hours',
        rating: 4.7,
        price: 'From GHS 150',
        description: 'A unique village built entirely on stilts over Lake Tadane, accessed only by canoe.',
        highlights: ['Canoe Tour', 'Stilt Village', 'Cultural Experience'],
        image: '/images/sites/nzulezu.jpg',
    },
    {
        id: 9,
        name: 'Paga Crocodile Ponds',
        region: 'Upper East Region',
        category: 'adventure',
        duration: '3-4 hours',
        rating: 4.5,
        price: 'From GHS 110',
        description: "A unique site where you can safely interact with friendly crocodiles in their natural habitat.",
        highlights: ['Crocodile Interaction', 'Paga Border', 'Cultural Village'],
        image: '/images/sites/paga.jpg',
    },
    {
        id: 10,
        name: 'Lake Bosomtwe',
        region: 'Ashanti Region',
        category: 'nature',
        duration: '4-5 hours',
        rating: 4.7,
        price: 'From GHS 85',
        description: "A natural meteorite crater lake, sacred to the Ashanti people and perfect for peaceful retreats.",
        highlights: ['Crater Lake', 'Boat Ride', 'Village Tour'],
        image: '/images/sites/bosomtwe.jpg',
    },
    {
        id: 11,
        name: 'Kintampo Waterfalls',
        region: 'Bono East Region',
        category: 'nature',
        duration: '3-4 hours',
        rating: 4.6,
        price: 'From GHS 75',
        description: 'Twin waterfalls surrounded by lush forest, with a canopy walkway nearby.',
        highlights: ['Twin Waterfalls', 'Canopy Walk', 'Swimming'],
        image: '/images/sites/kintampo.jpg',
    },
    {
        id: 12,
        name: 'Larabanga Mosque',
        region: 'Savannah Region',
        category: 'heritage',
        duration: '2 hours',
        rating: 4.8,
        price: 'From GHS 65',
        description: "The oldest mosque in Ghana, built in the Sudanese architectural style in the 13th century.",
        highlights: ['Ancient Mosque', 'Sudanese Architecture', 'Cultural Guide'],
        image: '/images/sites/larabanga.jpg',
    },
    {
        id: 13,
        name: 'Boabeng-Fiema Monkey Sanctuary',
        region: 'Bono East Region',
        category: 'nature',
        duration: '3-4 hours',
        rating: 4.5,
        price: 'From GHS 70',
        description: 'A sacred forest where monkeys live freely alongside villagers.',
        highlights: ['Monkey Watching', 'Sacred Forest', 'Village Tour'],
        image: '/images/sites/boabeng.jpg',
    },
    {
        id: 14,
        name: 'Kwame Nkrumah Mausoleum',
        region: 'Greater Accra',
        category: 'heritage',
        duration: '2 hours',
        rating: 4.7,
        price: 'From GHS 50',
        description: "The final resting place of Ghana's first president and a symbol of African independence.",
        highlights: ['Presidential Tomb', 'Museum', 'Historic Gardens'],
        image: '/images/sites/nkrumah.jpg',
    },
    {
        id: 15,
        name: 'Shai Hills Resource Reserve',
        region: 'Greater Accra',
        category: 'adventure',
        duration: '4-5 hours',
        rating: 4.6,
        price: 'From GHS 95',
        description: 'Rocky hills, savannah plains, and wildlife including baboons, antelopes, and over 175 bird species.',
        highlights: ['Safari Walk', 'Rock Climbing', 'Bird Watching'],
        image: '/images/sites/shai.jpg',
    },
    {
        id: 16,
        name: 'Ada Foah Estuary',
        region: 'Greater Accra',
        category: 'nature',
        duration: '5-6 hours',
        rating: 4.6,
        price: 'From GHS 130',
        description: 'Where the Volta River meets the Atlantic Ocean — perfect for boating and bird watching.',
        highlights: ['Boat Cruise', 'Beach Time', 'Estuary Wildlife'],
        image: '/images/sites/ada.jpg',
    },
    {
        id: 17,
        name: 'Tafi Atome Monkey Sanctuary',
        region: 'Volta Region',
        category: 'nature',
        duration: '3-4 hours',
        rating: 4.5,
        price: 'From GHS 80',
        description: 'A community-run sanctuary where mona monkeys interact freely with visitors.',
        highlights: ['Monkey Interaction', 'Nature Walk', 'Community Guide'],
        image: '/images/sites/tafi.jpg',
    },
    {
        id: 18,
        name: 'Sirigu Village & Art',
        region: 'Upper East Region',
        category: 'culture',
        duration: '4-5 hours',
        rating: 4.8,
        price: 'From GHS 105',
        description: 'Home to traditional mural art, pottery, and basketry crafted by women artisans for centuries.',
        highlights: ['Village Art', 'Pottery Class', 'Basketry Demo'],
        image: '/images/sites/sirigu.jpg',
    },
];

const allRegions = [
    { id: 'all', label: 'All Regions' },
    { id: 'Greater Accra', label: 'Greater Accra' },
    { id: 'Central Region', label: 'Central Region' },
    { id: 'Ashanti Region', label: 'Ashanti Region' },
    { id: 'Eastern Region', label: 'Eastern Region' },
    { id: 'Western Region', label: 'Western Region' },
    { id: 'Volta Region', label: 'Volta Region' },
    { id: 'Savannah Region', label: 'Savannah Region' },
    { id: 'Upper East Region', label: 'Upper East' },
    { id: 'Bono East Region', label: 'Bono East' },
];

const allCategories = [
    { id: 'all', label: 'All Types', icon: faMapMarkedAlt },
    { id: 'heritage', label: 'Heritage', icon: faUsers },
    { id: 'nature', label: 'Nature', icon: faLeaf },
    { id: 'culture', label: 'Culture', icon: faHandshake },
    { id: 'adventure', label: 'Adventure', icon: faRoute },
];

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
    heritage: { bg: 'rgba(19, 158, 162, 0.12)', text: '#139EA2', label: 'Heritage' },
    nature: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', label: 'Nature' },
    culture: { bg: 'rgba(230, 166, 77, 0.15)', text: '#D4953A', label: 'Culture' },
    adventure: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6', label: 'Adventure' },
};

export default function AllSitesPage() {
    const router = useRouter();
    const [activeRegion, setActiveRegion] = useState('all');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'rating' | 'name' | 'price'>('rating');
    const [showFilters, setShowFilters] = useState(false);

    const filteredSites = useMemo(() => {
        let sites = [...allSites];

        if (activeRegion !== 'all') {
            sites = sites.filter((s) => s.region === activeRegion);
        }

        if (activeCategory !== 'all') {
            sites = sites.filter((s) => s.category === activeCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            sites = sites.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.region.toLowerCase().includes(q) ||
                    s.description.toLowerCase().includes(q)
            );
        }

        if (sortBy === 'rating') {
            sites.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'name') {
            sites.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'price') {
            sites.sort(
                (a, b) =>
                    parseInt(a.price.replace(/\D/g, '')) -
                    parseInt(b.price.replace(/\D/g, ''))
            );
        }

        return sites;
    }, [activeRegion, activeCategory, searchQuery, sortBy]);

    const clearFilters = () => {
        setActiveRegion('all');
        setActiveCategory('all');
        setSearchQuery('');
        setSortBy('rating');
    };

    const hasActiveFilters =
        activeRegion !== 'all' ||
        activeCategory !== 'all' ||
        searchQuery.trim() !== '' ||
        sortBy !== 'rating';

    return (
        <ServiceTheme>
            <main className="all-sites-page">
                {/* ===== HEADER ===== */}
                <section className="all-header">
                    <div className="all-header-bg" />
                    <div className="all-header-container">
                        {/* Rectangular button breadcrumb navigation */}
                        <nav className="all-breadcrumb-nav" aria-label="Breadcrumb">
                        
                            <div className="all-breadcrumb-trail">
                                <Link href="/" className="all-breadcrumb-btn">
                                    Home
                                </Link>
                                <FontAwesomeIcon icon={faChevronRight} className="all-breadcrumb-sep" />
                                <Link href="/services/onsite-tourism" className="all-breadcrumb-btn">
                                    Onsite Tourism
                                </Link>
                                <FontAwesomeIcon icon={faChevronRight} className="all-breadcrumb-sep" />
                                <span className="all-breadcrumb-btn current">All Sites</span>
                            </div>
                        </nav>

                        <h1 className="all-title">
                            Explore All <span className="all-title-accent">Ghanaian Sites</span>
                        </h1>
                        <p className="all-subtitle">
                            {allSites.length} curated experiences across all regions of Ghana. Filter, search, and find your perfect destination.
                        </p>
                    </div>
                </section>

                {/* ===== FILTERS BAR ===== */}
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
                                    placeholder="Search sites, regions, or keywords..."
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
                                    <strong>{filteredSites.length}</strong>{' '}
                                    {filteredSites.length === 1 ? 'site' : 'sites'} found
                                </span>

                                <select
                                    className="sort-select"
                                    value={sortBy}
                                    onChange={(e) =>
                                        setSortBy(e.target.value as 'rating' | 'name' | 'price')
                                    }
                                >
                                    <option value="rating">Sort by: Rating</option>
                                    <option value="name">Sort by: Name</option>
                                    <option value="price">Sort by: Price</option>
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
                                        <FontAwesomeIcon icon={faLocationDot} />
                                        Region
                                    </label>
                                    <div className="filter-chips">
                                        {allRegions.map((region) => (
                                            <button
                                                key={region.id}
                                                className={`filter-chip ${activeRegion === region.id ? 'active' : ''
                                                    }`}
                                                onClick={() => setActiveRegion(region.id)}
                                            >
                                                {region.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="filter-group">
                                    <label className="filter-label">
                                        <FontAwesomeIcon icon={faFilter} />
                                        Category
                                    </label>
                                    <div className="filter-chips">
                                        {allCategories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                className={`filter-chip ${activeCategory === cat.id ? 'active' : ''
                                                    }`}
                                                onClick={() => setActiveCategory(cat.id)}
                                            >
                                                <FontAwesomeIcon icon={cat.icon} />
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== SITES GRID ===== */}
                <section className="all-sites-section">
                    <div className="all-sites-container">
                        {filteredSites.length > 0 ? (
                            <div className="all-sites-grid">
                                {filteredSites.map((site) => {
                                    const catColor = categoryColors[site.category]!;
                                    return (
                                        <article key={site.id} className="all-site-card">
                                            <div className="all-site-image">
                                                <img
                                                    src={site.image}
                                                    alt={site.name}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23139EA2'/%3E%3Ctext x='200' y='150' font-family='Inter' font-size='20' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                                                            site.name
                                                        )}%3C/text%3E%3C/svg%3E`;
                                                    }}
                                                />
                                                <div className="all-site-overlay" />
                                                <div className="all-site-badges">
                                                    <span
                                                        className="all-category-badge"
                                                        style={{
                                                            background: catColor.bg,
                                                            color: catColor.text,
                                                        }}
                                                    >
                                                        {catColor.label}
                                                    </span>
                                                    <span className="all-rating-badge">
                                                        <FontAwesomeIcon icon={faStar} />
                                                        {site.rating}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="all-site-content">
                                                <div className="all-site-meta">
                                                    <span>
                                                        <FontAwesomeIcon icon={faLocationDot} />
                                                        {site.region}
                                                    </span>
                                                    <span>
                                                        <FontAwesomeIcon icon={faClock} />
                                                        {site.duration}
                                                    </span>
                                                </div>

                                                <h3 className="all-site-name">{site.name}</h3>
                                                <p className="all-site-description">{site.description}</p>

                                                <div className="all-site-highlights">
                                                    {site.highlights.slice(0, 3).map((h, i) => (
                                                        <span key={i} className="all-highlight-tag">
                                                            {h}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="all-site-footer">
                                                    <span className="all-site-price">{site.price}</span>
                                                    <Link
                                                        href={`/services/onsite-tourism/${site.id}`}
                                                        className="all-site-cta"
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
                                <h3>No sites found</h3>
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
          .all-sites-page {
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

          /* ===== RECTANGULAR BUTTON BREADCRUMB NAVIGATION ===== */
          .all-breadcrumb-nav {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          /* Back button - subtle circular icon */
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
            -webkit-backdrop-filter: blur(10px);
          }

          .all-breadcrumb-back:hover {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #139EA2;
            transform: translateX(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .all-breadcrumb-back:active {
            transform: translateX(-3px) scale(0.95);
          }

          /* Breadcrumb trail */
          .all-breadcrumb-trail {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          /* Rectangular breadcrumb buttons */
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
            letter-spacing: 0.2px;
            cursor: pointer;
            font-family: inherit;
          }

          .all-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.5);
            color: #FFFFFF;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .all-breadcrumb-btn:active {
            transform: translateY(0);
          }

          /* Current page button - highlighted */
          .all-breadcrumb-btn.current {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #0D7A7D;
            font-weight: 700;
            cursor: default;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          }

          .all-breadcrumb-btn.current:hover {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #0D7A7D;
            transform: none;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          }

          /* Chevron separator between buttons */
          .all-breadcrumb-sep {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            flex-shrink: 0;
            user-select: none;
          }

          /* ===== TITLE & SUBTITLE ===== */
          .all-title {
            font-size: clamp(2rem, 4.5vw, 3rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.1;
            letter-spacing: -0.02em;
            max-width: 800px;
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

          /* ===== FILTERS BAR ===== */
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
            position: relative;
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
            color: #9CA3AF;
            font-size: 14px;
            pointer-events: none;
            transition: color 0.25s ease;
            z-index: 1;
          }

          .all-search-input {
            width: 100%;
            padding: 12px 44px 12px 44px;
            border-radius: 12px;
            font-family: inherit;
            font-size: 0.9rem;
            transition: all 0.25s ease;
            background: #FFFFFF;
            border: 1.5px solid rgba(19, 158, 162, 0.25);
            color: #1A1A2E;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          }

          .all-search-input::placeholder {
            color: #9CA3AF;
          }

          .all-search-input:hover {
            border-color: rgba(19, 158, 162, 0.5);
          }

          .all-search-input:focus {
            outline: none;
            border-color: #139EA2;
            background: #FFFFFF;
            box-shadow: 0 0 0 4px rgba(19, 158, 162, 0.15),
              0 1px 3px rgba(0, 0, 0, 0.04);
          }

          [data-theme="dim"] .all-search-input {
            background: rgba(255, 255, 255, 0.05);
            border: 1.5px solid rgba(230, 166, 77, 0.35);
            color: #FFFFFF;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }

          [data-theme="dim"] .all-search-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
          }

          [data-theme="dim"] .all-search-input:hover {
            border-color: rgba(230, 166, 77, 0.6);
            background: rgba(255, 255, 255, 0.07);
          }

          [data-theme="dim"] .all-search-input:focus {
            border-color: #E6A64D;
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 4px rgba(230, 166, 77, 0.2),
              0 1px 3px rgba(0, 0, 0, 0.3);
          }

          [data-theme="dim"] .all-search-wrapper .search-icon {
            color: rgba(230, 166, 77, 0.7);
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
            z-index: 1;
            background: rgba(0, 0, 0, 0.08);
            color: #4A4A4A;
          }

          .search-clear:hover {
            background: rgba(0, 0, 0, 0.15);
          }

          [data-theme="dim"] .search-clear {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
          }

          [data-theme="dim"] .search-clear:hover {
            background: rgba(230, 166, 77, 0.3);
            color: #FFFFFF;
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

          /* ===== SITES GRID ===== */
          .all-sites-section {
            padding: 40px 32px 80px;
          }

          .all-sites-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .all-sites-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .all-site-card {
            background: var(--sp-bg-card);
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid var(--sp-border);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
          }

          .all-site-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--sp-shadow-lg);
            border-color: var(--sp-border-hover);
          }

          .all-site-image {
            position: relative;
            height: 200px;
            overflow: hidden;
            background: linear-gradient(135deg, #139EA2, #0D7A7D);
          }

          .all-site-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .all-site-card:hover .all-site-image img {
            transform: scale(1.08);
          }

          .all-site-overlay {
            position: absolute;
            inset: 0;
            background: var(--sp-overlay-gradient);
          }

          .all-site-badges {
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

          .all-site-content {
            padding: 20px 22px 22px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .all-site-meta {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }

          .all-site-meta span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            color: var(--sp-text-muted);
            font-weight: 500;
          }

          .all-site-meta :global(svg) {
            font-size: 10px;
            color: #139EA2;
          }

          [data-theme="dim"] .all-site-meta :global(svg) {
            color: #E6A64D;
          }

          .all-site-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
            letter-spacing: -0.01em;
            line-height: 1.3;
          }

          .all-site-description {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0 0 14px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .all-site-highlights {
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

          .all-site-footer {
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid var(--sp-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .all-site-price {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--sp-primary);
          }

          .all-site-cta {
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

          .all-site-cta:hover {
            background: var(--sp-primary-dark);
            transform: translateX(3px);
          }

          .all-site-cta :global(svg) {
            font-size: 10px;
          }

          /* ===== EMPTY STATE ===== */
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
            .all-sites-grid {
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

            .all-breadcrumb-nav {
              gap: 8px;
              margin-bottom: 20px;
            }

            .all-breadcrumb-back {
              width: 34px;
              height: 34px;
              font-size: 12px;
            }

            .all-breadcrumb-trail {
              gap: 6px;
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

            .all-sites-section {
              padding: 24px 20px 60px;
            }

            .all-sites-grid {
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

          @media (max-width: 400px) {
            .filters-toggle {
              padding: 8px 12px;
              font-size: 0.75rem;
            }

            .all-search-input {
              padding: 10px 34px 10px 34px;
              font-size: 0.8rem;
            }

            .all-breadcrumb-btn {
              padding: 5px 10px;
              font-size: 0.7rem;
            }

            .all-breadcrumb-back {
              width: 30px;
              height: 30px;
              font-size: 11px;
            }
          }
        `}</style>
            </main>
        </ServiceTheme>
    );
}