"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faLocationDot,
  faArrowRight,
  faHeart,
  faRocket,
  faUsers,
  faLightbulb,
  faLeaf,
  faGraduationCap,
  faCoffee,
  faLaptopHouse,
  faPlane,
  faEnvelope,
  faHandshake,
  faGlobeAfrica,
  faTableCellsLarge,
  faList,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';
import './careers.css';

/* ============================================================
   TYPES
   ============================================================ */

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  level: string;
  description: string;
  tags: string[];
}

type ViewMode = 'grid' | 'list';

/* ============================================================
   DATA
   ============================================================ */

const openPositions: Job[] = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Accra, Ghana (Hybrid)',
    type: 'Full-time',
    level: 'Senior',
    description:
      'Build next-generation travel experiences using React, Next.js, and modern web technologies.',
    tags: ['React', 'Next.js', 'TypeScript'],
  },
  {
    id: 2,
    title: 'Experience Designer',
    department: 'Product',
    location: 'Accra, Ghana (Hybrid)',
    type: 'Full-time',
    level: 'Mid-Senior',
    description:
      'Craft unforgettable travel itineraries and digital experiences for our global customers.',
    tags: ['UX', 'Travel', 'Figma'],
  },
  {
    id: 3,
    title: 'Partnership Manager',
    department: 'Business Development',
    location: 'Accra, Ghana (On-site)',
    type: 'Full-time',
    level: 'Mid-Level',
    description:
      'Build and nurture relationships with hotels, tour operators, and artisans across Ghana.',
    tags: ['B2B', 'Sales', 'Tourism'],
  },
  {
    id: 4,
    title: 'Marketing Specialist',
    department: 'Marketing',
    location: 'Remote (Ghana)',
    type: 'Full-time',
    level: 'Mid-Level',
    description:
      'Drive brand awareness and customer acquisition through creative campaigns and storytelling.',
    tags: ['Content', 'Social', 'SEO'],
  },
  {
    id: 5,
    title: 'Customer Success Associate',
    department: 'Operations',
    location: 'Accra, Ghana (Hybrid)',
    type: 'Full-time',
    level: 'Entry-Level',
    description:
      'Ensure every traveler has an exceptional journey from booking to return.',
    tags: ['Support', 'Travel', 'Customer Care'],
  },
  {
    id: 6,
    title: 'Data Analyst',
    department: 'Engineering',
    location: 'Remote (Ghana)',
    type: 'Full-time',
    level: 'Mid-Level',
    description:
      'Turn data into insights that drive product, marketing, and operational decisions.',
    tags: ['SQL', 'Analytics', 'Python'],
  },
  {
    id: 7,
    title: 'Content Creator (Video)',
    department: 'Marketing',
    location: 'Accra, Ghana (Hybrid)',
    type: 'Contract',
    level: 'Mid-Level',
    description:
      "Produce captivating video content showcasing Ghana's destinations and experiences.",
    tags: ['Video', 'Editing', 'Storytelling'],
  },
  {
    id: 8,
    title: 'Software Engineering Intern',
    department: 'Engineering',
    location: 'Accra, Ghana (On-site)',
    type: 'Internship',
    level: 'Student',
    description:
      'Learn from senior engineers while contributing to real projects and features.',
    tags: ['Learning', 'React', 'Node.js'],
  },
  {
    id: 9,
    title: 'Tour Operations Coordinator',
    department: 'Operations',
    location: 'Cape Coast, Central Region',
    type: 'Full-time',
    level: 'Mid-Level',
    description:
      'Coordinate on-the-ground tour logistics and support our network of certified guides.',
    tags: ['Logistics', 'Tourism', 'Coordination'],
  },
];

const whyJoinUs = [
  {
    icon: faLightbulb,
    title: 'Innovation First',
    description:
      'We embrace bold ideas and modern technology to shape the future of African travel.',
  },
  {
    icon: faLeaf,
    title: 'Sustainable Impact',
    description:
      'Every project we build contributes to the long-term good of Ghanaian communities.',
  },
  {
    icon: faRocket,
    title: 'Move Fast, Think Deep',
    description:
      'We ship quickly but thoughtfully — because quality always matters more than speed.',
  },
  {
    icon: faGlobeAfrica,
    title: 'Global Reach, Local Soul',
    description:
      'Work on products used by travelers worldwide — powered by Ghanaian creativity and care.',
  },
];

const perks = [
  {
    icon: faLaptopHouse,
    title: 'Flexible Work',
    description: 'Hybrid and remote options for most roles.',
  },
  {
    icon: faGraduationCap,
    title: 'Learning Budget',
    description: 'Annual stipend for courses, books, and conferences.',
  },
  {
    icon: faPlane,
    title: 'Travel Perks',
    description: 'Discounted and free trips across Ghana and beyond.',
  },
  {
    icon: faHeart,
    title: 'Health Coverage',
    description: 'Comprehensive medical insurance for you and family.',
  },
  {
    icon: faCoffee,
    title: 'Great Culture',
    description: 'Collaborative, inclusive, mission-driven team.',
  },
  {
    icon: faUsers,
    title: 'Team Retreats',
    description: 'Regular team offsites and experiences together.',
  },
];

const departmentColors: Record<string, string> = {
  Engineering: '#139EA2',
  Product: '#E6A64D',
  Marketing: '#8B5CF6',
  'Business Development': '#10B981',
  Operations: '#EC4899',
};

/* ============================================================
   PAGE
   ============================================================ */

export default function CareersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const previewJobs = openPositions.slice(0, 6);

  return (
    <ServiceTheme>
      <main className="careers-page">
        {/* ============================================================
            HERO
            ============================================================ */}
        <section className="careers-hero">
          <div className="careers-hero-bg" />
          <div className="careers-hero-container">
            <span className="careers-hero-label">Careers</span>
            <h1 className="careers-hero-title">
              Build the Future of <br />
              <span className="careers-hero-accent">African Tourism</span>
            </h1>
            <p className="careers-hero-subtitle">
              Join a mission-driven team using technology to celebrate Ghana&apos;s
              culture and create sustainable economic impact.
            </p>

            <div className="careers-hero-actions">
              <a
                href="#positions"
                className="careers-hero-btn careers-hero-btn--primary"
              >
                <span>View Open Roles</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </a>
              <Link
                href="/about/our-team"
                className="careers-hero-btn careers-hero-btn--secondary"
              >
                <FontAwesomeIcon icon={faUsers} />
                <span>Meet the Team</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            STATS
            ============================================================ */}
        <section className="careers-stats-section">
          <div className="careers-stats-container">
            <div className="careers-stat">
              <div className="careers-stat-value">{openPositions.length}</div>
              <div className="careers-stat-label">Open Positions</div>
            </div>
            <div className="careers-stat">
              <div className="careers-stat-value">6</div>
              <div className="careers-stat-label">Departments</div>
            </div>
            <div className="careers-stat">
              <div className="careers-stat-value">100%</div>
              <div className="careers-stat-label">Mission-Driven</div>
            </div>
            <div className="careers-stat">
              <div className="careers-stat-value">GH</div>
              <div className="careers-stat-label">Based in Ghana</div>
            </div>
          </div>
        </section>

        {/* ============================================================
            WHY JOIN US
            ============================================================ */}
        <section className="careers-why-section">
          <div className="careers-container">
            <header className="careers-section-header">
              <span className="careers-section-label">Why Join Us</span>
              <h2 className="careers-section-title">
                More Than a <span className="careers-section-accent">Job</span>
              </h2>
              <p className="careers-section-subtitle">
                A chance to build something meaningful — with people who care
                deeply about the work and each other.
              </p>
            </header>

            <div className="careers-why-grid">
              {whyJoinUs.map((value, idx) => (
                <div key={idx} className="careers-why-card">
                  <div className="careers-why-icon">
                    <FontAwesomeIcon icon={value.icon} />
                  </div>
                  <h3 className="careers-why-title">{value.title}</h3>
                  <p className="careers-why-text">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            PERKS
            ============================================================ */}
        <section className="careers-perks-section">
          <div className="careers-container">
            <header className="careers-section-header">
              <span className="careers-section-label">Perks &amp; Benefits</span>
              <h2 className="careers-section-title">
                What We <span className="careers-section-accent">Offer</span>
              </h2>
            </header>

            <div className="careers-perks-grid">
              {perks.map((perk, idx) => (
                <div key={idx} className="careers-perk-card">
                  <div className="careers-perk-icon">
                    <FontAwesomeIcon icon={perk.icon} />
                  </div>
                  <h3 className="careers-perk-title">{perk.title}</h3>
                  <p className="careers-perk-text">{perk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            OPEN POSITIONS
            ============================================================ */}
        <section id="positions" className="careers-positions-section">
          <div className="careers-container">
            <div className="careers-positions-top">
              <header className="careers-positions-heading">
                <span className="careers-section-label">Now Hiring</span>
                <h2 className="careers-section-title">
                  Open <span className="careers-section-accent">Positions</span>
                </h2>
                <p className="careers-positions-subtitle">
                  {openPositions.length} roles across our growing team. Find the
                  one that fits you.
                </p>
              </header>

              <div
                className="careers-view-toggle"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  className={`careers-view-btn ${
                    viewMode === 'grid' ? 'is-active' : ''
                  }`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <FontAwesomeIcon icon={faTableCellsLarge} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  className={`careers-view-btn ${
                    viewMode === 'list' ? 'is-active' : ''
                  }`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <FontAwesomeIcon icon={faList} />
                  <span>List</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' && (
              <div className="careers-grid">
                {previewJobs.map((job) => (
                  <JobGridCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="careers-list">
                {previewJobs.map((job) => (
                  <JobListItem key={job.id} job={job} />
                ))}
              </div>
            )}

            <div className="careers-viewall-wrap">
              <Link
                href="/about/careers/positions"
                className="careers-viewall-btn"
              >
                <span>View All {openPositions.length} Positions</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            FINAL CTA
            ============================================================ */}
        <section className="careers-final-cta">
          <div className="careers-final-cta-bg" />
          <div className="careers-final-cta-container">
            <div className="careers-final-cta-grid">
              <div className="careers-final-cta-col">
                <div className="careers-final-cta-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <h3 className="careers-final-cta-title">
                  Don&apos;t See Your Perfect Role?
                </h3>
                <p className="careers-final-cta-text">
                  We&apos;re always excited to meet talented people who share our
                  vision. Send your CV and a note about what you&apos;d love to
                  work on.
                </p>
                <a
                  href="mailto:careers@techtourghana.com?subject=Spontaneous Application"
                  className="careers-final-cta-btn"
                >
                  <span>Send Spontaneous Application</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </a>
              </div>

              <div className="careers-final-cta-divider" aria-hidden="true" />

              <div className="careers-final-cta-col">
                <div className="careers-final-cta-icon careers-final-cta-icon--gold">
                  <FontAwesomeIcon icon={faHandshake} />
                </div>
                <h3 className="careers-final-cta-title">
                  Ready to Make an Impact?
                </h3>
                <p className="careers-final-cta-text">
                  Explore our open roles or reach out to learn more about life
                  at TechTour Ghana.
                </p>
                <div className="careers-final-cta-actions">
                  <a href="#positions" className="careers-final-cta-btn">
                    <span>See All Roles</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </a>
                  <Link
                    href="/about/contact-us"
                    className="careers-final-cta-btn"
                  >
                    <span>Contact Us</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BackToTop accentColor="teal" />
      </main>
    </ServiceTheme>
  );
}

/* ============================================================
   JOB GRID CARD
   ============================================================ */

function JobGridCard({ job }: { job: Job }) {
  const deptColor = departmentColors[job.department] || '#139EA2';
  const typeClass = `type-${job.type
    .replace(/[^a-z]/gi, '')
    .toLowerCase()}`;

  return (
    <Link
      href={`/about/careers/positions?job=${job.id}`}
      className="job-grid-card"
      style={{ ['--accent' as any]: deptColor }}
    >
      <header className="job-grid-card__head">
        <span
          className="job-badge job-badge--dept"
          style={{ background: `${deptColor}22`, color: deptColor }}
        >
          {job.department}
        </span>
        <span className={`job-badge job-badge--type ${typeClass}`}>
          {job.type}
        </span>
      </header>

      <h3 className="job-grid-card__title">{job.title}</h3>
      <p className="job-grid-card__desc">{job.description}</p>

      <div className="job-grid-card__meta">
        <span>
          <FontAwesomeIcon icon={faLocationDot} />
          {job.location}
        </span>
        <span>
          <FontAwesomeIcon icon={faBriefcase} />
          {job.level}
        </span>
      </div>

      <div className="job-grid-card__tags">
        {job.tags.slice(0, 3).map((tag, i) => (
          <span key={i} className="job-tag">
            {tag}
          </span>
        ))}
      </div>

      <span className="job-grid-card__cta">
        <span>View Details</span>
        <FontAwesomeIcon icon={faArrowRight} />
      </span>
    </Link>
  );
}

/* ============================================================
   JOB LIST ITEM
   ============================================================ */

function JobListItem({ job }: { job: Job }) {
  const deptColor = departmentColors[job.department] || '#139EA2';
  const typeClass = `type-${job.type
    .replace(/[^a-z]/gi, '')
    .toLowerCase()}`;

  return (
    <Link
      href={`/about/careers/positions?job=${job.id}`}
      className="job-list-item"
      style={{ ['--accent' as any]: deptColor }}
    >
      <span className="job-list-item__bar" aria-hidden="true" />

      <div className="job-list-item__body">
        <header className="job-list-item__head">
          <span
            className="job-badge job-badge--dept"
            style={{ background: `${deptColor}22`, color: deptColor }}
          >
            {job.department}
          </span>
          <span className={`job-badge job-badge--type ${typeClass}`}>
            {job.type}
          </span>
        </header>

        <h3 className="job-list-item__title">{job.title}</h3>
        <p className="job-list-item__desc">{job.description}</p>

        <div className="job-list-item__meta">
          <span>
            <FontAwesomeIcon icon={faLocationDot} />
            {job.location}
          </span>
          <span>
            <FontAwesomeIcon icon={faBriefcase} />
            {job.level}
          </span>
          <span className="job-list-item__tags-inline">
            {job.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="job-tag">
                {tag}
              </span>
            ))}
          </span>
        </div>
      </div>

      <span className="job-list-item__cta">
        <span>View Details</span>
        <FontAwesomeIcon icon={faChevronRight} />
      </span>
    </Link>
  );
}