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
  faGraduationCap,
  faBookOpen,
  faUserGraduate,
  faAward,
  faMoneyBillWave,
  faLanguage,
  faBuilding,
  faChartLine,
  faFlask,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';

type IntakeLevel = 'undergraduate' | 'graduate' | 'phd';

interface Intake {
  level: IntakeLevel;
  label: string;
  duration: string;
  tuition: string;
  description: string;
  requirements: string[];
  deadlines: string[];
}

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
  longDescription: string;
  image: string;
  gallery: string[];
  scholarship: boolean;
  acceptanceRate: string;
  studentPopulation: string;
  intakes: Intake[];
  highlights: string[];
  facilities: string[];
}

const universitiesData: Record<number, University> = {
  1: {
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
    longDescription: "The University of Toronto is a globally top-ranked public research university in Toronto, Ontario, Canada. It was founded in 1827 and is the oldest university in the province of Ontario. U of T offers over 700 undergraduate and 200 graduate programs across three campuses. The university is consistently ranked among the top 25 universities worldwide and is known for its groundbreaking research, including the discovery of insulin and the development of the first practical electron microscope. With over 90,000 students from more than 160 countries, U of T provides a truly global education experience.",
    image: '/images/universities/toronto.jpg',
    gallery: [
      '/images/universities/toronto-1.jpg',
      '/images/universities/toronto-2.jpg',
      '/images/universities/toronto-3.jpg',
    ],
    scholarship: true,
    acceptanceRate: '43%',
    studentPopulation: '90,000+',
    highlights: [
      'Top 25 globally ranked',
      'Over 700 programs',
      '160+ nationalities',
      'World-class research',
      'Strong industry connections',
    ],
    facilities: [
      'Modern libraries',
      'Research labs',
      'Sports facilities',
      'Student housing',
      'Career services',
    ],
    intakes: [
      {
        level: 'undergraduate',
        label: 'Undergraduate',
        duration: '4 years',
        tuition: 'CAD 45,000/yr',
        description: 'Comprehensive bachelor degrees across arts, science, engineering, and business.',
        requirements: [
          'High school diploma with strong grades',
          'IELTS 6.5+ or TOEFL 100+',
          'Personal statement',
          'Letters of recommendation',
          'Supplementary application (some programs)',
        ],
        deadlines: ['January 15 (Fall intake)', 'September 1 (Winter intake)'],
      },
      {
        level: 'graduate',
        label: 'Graduate / Masters',
        duration: '1-2 years',
        tuition: 'CAD 35,000/yr',
        description: 'Advanced professional and research master programs.',
        requirements: [
          "Bachelor's degree with good standing",
          'IELTS 7.0+ or TOEFL 100+',
          'Statement of purpose',
          '2-3 letters of recommendation',
          'CV/Resume',
          'GRE/GMAT (some programs)',
        ],
        deadlines: ['December 1 - January 15 (Fall)', 'July 1 (Winter)'],
      },
      {
        level: 'phd',
        label: 'PhD / Doctorate',
        duration: '4-6 years',
        tuition: 'Funded (often waived)',
        description: 'Research-intensive doctoral programs with full funding opportunities.',
        requirements: [
          "Master's degree in relevant field",
          'IELTS 7.0+ or TOEFL 100+',
          'Research proposal',
          '3 letters of recommendation',
          'Publications (preferred)',
          'Interview with faculty',
        ],
        deadlines: ['December 1 (Fall)', 'June 1 (Winter)'],
      },
    ],
  },
};

// Fallback generator
const getUniversityById = (id: number): University => {
  if (universitiesData[id]) return universitiesData[id];

  return {
    id,
    name: 'Global University',
    country: 'International',
    city: 'City',
    flag: '🌍',
    ranking: 100,
    tuition: 'From $20,000/yr',
    duration: '3-4 years',
    programs: ['Business', 'Engineering', 'Arts'],
    ielts: '6.5+',
    description: 'A world-class university offering diverse programs for international students.',
    longDescription:
      'This prestigious university offers a wide range of programs for international students. With state-of-the-art facilities, world-renowned faculty, and a vibrant campus life, it provides an ideal environment for academic excellence and personal growth. Students from over 100 countries call this university home, creating a truly global learning community.',
    image: '/images/universities/default.jpg',
    gallery: [],
    scholarship: true,
    acceptanceRate: '50%',
    studentPopulation: '30,000+',
    highlights: [
      'Globally recognized degrees',
      'International student support',
      'Modern campus',
      'Research opportunities',
      'Strong alumni network',
    ],
    facilities: [
      'Libraries',
      'Research centers',
      'Sports complex',
      'Student housing',
      'Health services',
    ],
    intakes: [
      {
        level: 'undergraduate',
        label: 'Undergraduate',
        duration: '3-4 years',
        tuition: 'From $20,000/yr',
        description: 'Bachelor degree programs across various disciplines.',
        requirements: [
          'High school diploma',
          'IELTS 6.5+ or equivalent',
          'Personal statement',
          'Letters of recommendation',
        ],
        deadlines: ['January 15 (Fall)', 'September 1 (Spring)'],
      },
      {
        level: 'graduate',
        label: 'Graduate / Masters',
        duration: '1-2 years',
        tuition: 'From $25,000/yr',
        description: 'Advanced master programs for career advancement.',
        requirements: [
          "Bachelor's degree",
          'IELTS 6.5+ or equivalent',
          'Statement of purpose',
          '2-3 letters of recommendation',
          'CV/Resume',
        ],
        deadlines: ['December 1 (Fall)', 'July 1 (Spring)'],
      },
      {
        level: 'phd',
        label: 'PhD / Doctorate',
        duration: '3-5 years',
        tuition: 'Funded (often waived)',
        description: 'Research-focused doctoral programs.',
        requirements: [
          "Master's degree",
          'IELTS 7.0+ or equivalent',
          'Research proposal',
          '3 letters of recommendation',
        ],
        deadlines: ['December 1 (Fall)', 'June 1 (Spring)'],
      },
    ],
  };
};

export default function UniversityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uniId = Number(params?.id);
  const uni = getUniversityById(uniId);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedIntake, setSelectedIntake] = useState<IntakeLevel>('undergraduate');
  const [startDate, setStartDate] = useState('');
  const [consultationName, setConsultationName] = useState('');

  const images = [uni.image, ...uni.gallery].filter(Boolean);
  const currentIntake = uni.intakes.find((i) => i.level === selectedIntake)!;

  return (
    <ServiceTheme>
      <main className="uni-detail-page">
        {/* ===== BREADCRUMB ===== */}
        <nav className="detail-breadcrumb-nav" aria-label="Breadcrumb">
          <div className="detail-breadcrumb-container">

            <div className="detail-breadcrumb-trail">
              <Link href="/" className="detail-breadcrumb-btn">
                Home
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <Link href="/services/study-abroad" className="detail-breadcrumb-btn">
                Study Abroad
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <Link href="/services/study-abroad/all" className="detail-breadcrumb-btn">
                All Universities
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="detail-breadcrumb-sep" />
              <span className="detail-breadcrumb-btn current">{uni.name}</span>
            </div>
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <section className="detail-hero">
          <div className="detail-hero-image">
            <img
              src={images[activeImage]}
              alt={uni.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%23E6A64D'/%3E%3Ctext x='600' y='300' font-family='Inter' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
                  uni.name
                )}%3C/text%3E%3C/svg%3E`;
              }}
            />
            <div className="detail-hero-overlay" />

            <div className="detail-hero-badges">
              <span className="detail-flag-badge">
                <span className="flag">{uni.flag}</span>
                <span>{uni.country}</span>
              </span>
              <span className="detail-ranking-badge">
                <FontAwesomeIcon icon={faStar} />
                Ranked #{uni.ranking}
              </span>
              {uni.scholarship && (
                <span className="detail-scholarship-badge">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                  Scholarships Available
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
              <h1 className="detail-title">{uni.name}</h1>
              <div className="detail-meta-row">
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faLocationDot} />
                  {uni.city}, {uni.country}
                </span>
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faChartLine} />
                  Acceptance Rate: {uni.acceptanceRate}
                </span>
                <span className="detail-meta-item">
                  <FontAwesomeIcon icon={faUsers} />
                  {uni.studentPopulation} Students
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
                    alt={`${uni.name} ${idx + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23E6A64D'/%3E%3C/svg%3E`;
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
            {/* LEFT */}
            <div className="detail-main">
              {/* About */}
              <div className="detail-section">
                <h2 className="detail-section-title">About {uni.name}</h2>
                <p className="detail-long-description">{uni.longDescription}</p>
              </div>

              {/* Intake Selection */}
              <div className="detail-section intake-section">
                <h2 className="detail-section-title">
                  <FontAwesomeIcon icon={faGraduationCap} className="title-icon" />
                  Choose Your Intake
                </h2>
                <p className="intake-subtitle">
                  Select the level of study you're applying for to see specific requirements,
                  tuition, and deadlines.
                </p>

                <div className="intake-tabs">
                  {uni.intakes.map((intake) => (
                    <button
                      key={intake.level}
                      className={`intake-tab ${
                        selectedIntake === intake.level ? 'active' : ''
                      }`}
                      onClick={() => setSelectedIntake(intake.level)}
                    >
                      <FontAwesomeIcon
                        icon={
                          intake.level === 'undergraduate'
                            ? faBookOpen
                            : intake.level === 'graduate'
                            ? faUserGraduate
                            : faFlask
                        }
                      />
                      {intake.label}
                    </button>
                  ))}
                </div>

                <div className="intake-panel">
                  <div className="intake-header">
                    <div className="intake-icon-large">
                      <FontAwesomeIcon
                        icon={
                          currentIntake.level === 'undergraduate'
                            ? faBookOpen
                            : currentIntake.level === 'graduate'
                            ? faUserGraduate
                            : faFlask
                        }
                      />
                    </div>
                    <div>
                      <h3 className="intake-title">{currentIntake.label}</h3>
                      <p className="intake-description">{currentIntake.description}</p>
                    </div>
                  </div>

                  <div className="intake-meta">
                    <div className="intake-meta-item">
                      <FontAwesomeIcon icon={faClock} />
                      <div>
                        <span className="intake-meta-label">Duration</span>
                        <span className="intake-meta-value">
                          {currentIntake.duration}
                        </span>
                      </div>
                    </div>
                    <div className="intake-meta-item">
                      <FontAwesomeIcon icon={faMoneyBillWave} />
                      <div>
                        <span className="intake-meta-label">Tuition</span>
                        <span className="intake-meta-value">
                          {currentIntake.tuition}
                        </span>
                      </div>
                    </div>
                    <div className="intake-meta-item">
                      <FontAwesomeIcon icon={faLanguage} />
                      <div>
                        <span className="intake-meta-label">IELTS</span>
                        <span className="intake-meta-value">{uni.ielts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="intake-columns">
                    <div className="intake-column">
                      <h4 className="intake-column-title">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Requirements
                      </h4>
                      <ul className="intake-list">
                        {currentIntake.requirements.map((req, i) => (
                          <li key={i}>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="intake-column">
                      <h4 className="intake-column-title">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        Application Deadlines
                      </h4>
                      <ul className="intake-list deadlines">
                        {currentIntake.deadlines.map((dl, i) => (
                          <li key={i}>
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{dl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programs */}
              <div className="detail-section">
                <h2 className="detail-section-title">Popular Programs</h2>
                <div className="programs-grid">
                  {uni.programs.map((program, i) => (
                    <div key={i} className="program-card">
                      <div className="program-icon">
                        <FontAwesomeIcon icon={faBookOpen} />
                      </div>
                      <div>
                        <h4 className="program-name">{program}</h4>
                        <p className="program-desc">
                          World-class faculty and research opportunities
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="detail-section">
                <h2 className="detail-section-title">Why Choose {uni.name}?</h2>
                <div className="detail-highlights-grid">
                  {uni.highlights.map((h, i) => (
                    <div key={i} className="detail-highlight-item">
                      <FontAwesomeIcon icon={faAward} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div className="detail-section">
                <h2 className="detail-section-title">Campus Facilities</h2>
                <div className="detail-highlights-grid">
                  {uni.facilities.map((f, i) => (
                    <div key={i} className="detail-highlight-item">
                      <FontAwesomeIcon icon={faBuilding} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Book With Us */}
              <div className="detail-section">
                <h2 className="detail-section-title">Why Apply Through TechTour Ghana</h2>
                <div className="detail-why-grid">
                  <div className="why-item">
                    <FontAwesomeIcon icon={faGlobeAfrica} />
                    <h4>Expert Guidance</h4>
                    <p>Certified education consultants with years of experience</p>
                  </div>
                  <div className="why-item">
                    <FontAwesomeIcon icon={faHandshake} />
                    <h4>End-to-End Support</h4>
                    <p>From application to visa and pre-departure preparation</p>
                  </div>
                  <div className="why-item">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <h4>High Success Rate</h4>
                    <p>95% visa success rate with our proven process</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Application Card */}
            <aside className="detail-sidebar">
              <div className="booking-card">
                <div className="booking-header">
                  <span className="booking-label">Start Your Application</span>
                  <span className="booking-price">{currentIntake.tuition}</span>
                </div>

                <div className="booking-divider" />

                <div className="booking-field">
                  <label>
                    <FontAwesomeIcon icon={faGraduationCap} />
                    Intake Level
                  </label>
                  <select
                    className="booking-select"
                    value={selectedIntake}
                    onChange={(e) =>
                      setSelectedIntake(e.target.value as IntakeLevel)
                    }
                  >
                    {uni.intakes.map((intake) => (
                      <option key={intake.level} value={intake.level}>
                        {intake.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="booking-field">
                  <label>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="booking-field">
                  <label>
                    <FontAwesomeIcon icon={faUsers} />
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={consultationName}
                    onChange={(e) => setConsultationName(e.target.value)}
                  />
                </div>

                <div className="booking-total">
                  <span className="total-label">Consultation</span>
                  <span className="total-value">Free</span>
                </div>

                <button className="booking-submit">
                  Book Free Consultation
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>

                <p className="booking-note">
                  <FontAwesomeIcon icon={faShieldAlt} />
                  No commitment — 100% free consultation
                </p>

                <div className="booking-contact">
                  <p>
                    Need help? <a href="/contact">Talk to an advisor</a>
                  </p>
                </div>
              </div>

              {/* Quick Facts */}
              <div className="quick-facts">
                <h3 className="quick-facts-title">Quick Facts</h3>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faStar} />
                  <div>
                    <span className="qf-label">World Ranking</span>
                    <span className="qf-value">#{uni.ranking}</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faMapMarkedAlt} />
                  <div>
                    <span className="qf-label">Location</span>
                    <span className="qf-value">
                      {uni.city}, {uni.country}
                    </span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faLanguage} />
                  <div>
                    <span className="qf-label">IELTS Requirement</span>
                    <span className="qf-value">{uni.ielts}</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faChartLine} />
                  <div>
                    <span className="qf-label">Acceptance Rate</span>
                    <span className="qf-value">{uni.acceptanceRate}</span>
                  </div>
                </div>
                <div className="quick-fact">
                  <FontAwesomeIcon icon={faUsers} />
                  <div>
                    <span className="qf-label">Students</span>
                    <span className="qf-value">{uni.studentPopulation}</span>
                  </div>
                </div>
                {uni.scholarship && (
                  <div className="quick-fact highlight">
                    <FontAwesomeIcon icon={faMoneyBillWave} />
                    <div>
                      <span className="qf-label">Scholarships</span>
                      <span className="qf-value">Available</span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="detail-cta">
          <div className="detail-cta-container">
            <h2 className="detail-cta-title">Explore More Universities</h2>
            <p className="detail-cta-text">
              Discover more top-ranked universities around the world.
            </p>
            <Link href="/services/study-abroad/all" className="detail-cta-btn">
              View All Universities
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>

        <BackToTop accentColor="orange" />

        <style jsx>{`
          .uni-detail-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== BREADCRUMB ===== */
          .detail-breadcrumb-nav {
            background: linear-gradient(135deg, #E6A64D 0%, #D4953A 100%);
            padding: 20px 32px;
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
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.15);
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
            color: #D4953A;
            transform: translateX(-3px);
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
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.12);
            color: rgba(255, 255, 255, 0.95);
          }

          .detail-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.6);
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .detail-breadcrumb-btn.current {
            background: #FFFFFF;
            border-color: #FFFFFF;
            color: #D4953A;
            font-weight: 700;
            cursor: default;
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
            background: linear-gradient(135deg, #E6A64D, #D4953A);
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

          .detail-flag-badge,
          .detail-ranking-badge,
          .detail-scholarship-badge {
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
            color: #1A1A2E;
          }

          .detail-flag-badge .flag {
            font-size: 16px;
          }

          .detail-ranking-badge {
            background: rgba(230, 166, 77, 0.95);
          }

          .detail-scholarship-badge {
            background: rgba(19, 158, 162, 0.95);
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
            background: #E6A64D;
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
            border-color: #E6A64D;
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
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 20px 0;
            letter-spacing: -0.01em;
          }

          .title-icon {
            color: #E6A64D;
            font-size: 1.1rem;
          }

          .detail-long-description {
            font-size: 1rem;
            color: var(--sp-text-secondary);
            line-height: 1.75;
            margin: 0;
          }

          /* ===== INTAKE ===== */
          .intake-subtitle {
            font-size: 0.9rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: -8px 0 20px 0;
          }

          .intake-tabs {
            display: flex;
            gap: 8px;
            padding: 6px;
            background: var(--sp-tag-bg);
            border-radius: 14px;
            border: 1px solid var(--sp-tag-border);
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .intake-tab {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 16px;
            background: transparent;
            border: none;
            border-radius: 10px;
            color: var(--sp-text-secondary);
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
            white-space: nowrap;
          }

          .intake-tab:hover {
            color: #E6A64D;
          }

          .intake-tab.active {
            background: #E6A64D;
            color: #1A1A2E;
            box-shadow: 0 4px 12px rgba(230, 166, 77, 0.3);
          }

          .intake-panel {
            background: var(--sp-tag-bg);
            border: 1px solid var(--sp-tag-border);
            border-radius: 16px;
            padding: 24px;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .intake-header {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
          }

          .intake-icon-large {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: rgba(230, 166, 77, 0.15);
            color: #E6A64D;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            flex-shrink: 0;
          }

          .intake-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 4px 0;
          }

          .intake-description {
            font-size: 0.875rem;
            color: var(--sp-text-secondary);
            margin: 0;
            line-height: 1.5;
          }

          .intake-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            padding: 16px;
            background: var(--sp-bg-card);
            border-radius: 12px;
            border: 1px solid var(--sp-border);
            margin-bottom: 20px;
          }

          .intake-meta-item {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .intake-meta-item :global(svg) {
            width: 36px;
            height: 36px;
            padding: 9px;
            border-radius: 10px;
            background: rgba(230, 166, 77, 0.12);
            color: #E6A64D;
            font-size: 14px;
            flex-shrink: 0;
          }

          .intake-meta-label {
            display: block;
            font-size: 0.7rem;
            color: var(--sp-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 600;
            margin-bottom: 2px;
          }

          .intake-meta-value {
            display: block;
            font-size: 0.9rem;
            color: var(--sp-text-primary);
            font-weight: 700;
          }

          .intake-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .intake-column-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 12px 0;
          }

          .intake-column-title :global(svg) {
            color: #E6A64D;
            font-size: 12px;
          }

          .intake-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .intake-list li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            line-height: 1.5;
          }

          .intake-list li :global(svg) {
            color: #10B981;
            font-size: 13px;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .intake-list.deadlines li :global(svg) {
            color: #E6A64D;
          }

          /* ===== PROGRAMS ===== */
          .programs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 14px;
          }

          .program-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px;
            background: var(--sp-tag-bg);
            border: 1px solid var(--sp-tag-border);
            border-radius: 14px;
            transition: all 0.25s ease;
          }

          .program-card:hover {
            border-color: rgba(230, 166, 77, 0.5);
            transform: translateY(-2px);
          }

          .program-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(230, 166, 77, 0.12);
            color: #E6A64D;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }

          .program-name {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 2px 0;
          }

          .program-desc {
            font-size: 0.78rem;
            color: var(--sp-text-muted);
            margin: 0;
            line-height: 1.4;
          }

          /* Highlights */
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

          /* Why */
          .detail-why-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
            color: #E6A64D;
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

          .booking-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 8px;
          }

          .booking-label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--sp-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .booking-price {
            font-size: 1.3rem;
            font-weight: 800;
            color: #E6A64D;
            letter-spacing: -0.02em;
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
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--sp-text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .booking-field label :global(svg) {
            color: #E6A64D;
            font-size: 11px;
          }

          .booking-field input,
          .booking-select {
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

          .booking-field input:focus,
          .booking-select:focus {
            outline: none;
            border-color: #E6A64D;
            box-shadow: 0 0 0 3px rgba(230, 166, 77, 0.15);
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
            font-size: 1.2rem;
            font-weight: 800;
            color: #10B981;
          }

          .booking-submit {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: #E6A64D;
            color: #1A1A2E;
            font-size: 0.95rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
            font-family: inherit;
          }

          .booking-submit:hover {
            background: #D4953A;
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(230, 166, 77, 0.3);
          }

          .booking-submit :global(svg) {
            transition: transform 0.3s ease;
            font-size: 12px;
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
            color: #E6A64D;
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
            background: rgba(230, 166, 77, 0.12);
            color: #E6A64D;
            font-size: 14px;
            flex-shrink: 0;
          }

          .quick-fact.highlight :global(svg) {
            background: rgba(16, 185, 129, 0.12);
            color: #10B981;
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
            background: linear-gradient(135deg, #E6A64D 0%, #D4953A 100%);
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
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.7;
            margin: 0 0 28px 0;
          }

          .detail-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: #1A1A2E;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 30px;
            font-size: 0.95rem;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          }

          .detail-cta-btn:hover {
            background: #0F0F1F;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
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
            .intake-columns {
              grid-template-columns: 1fr;
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

            .detail-content {
              padding: 20px 20px 60px;
            }
            .detail-section {
              padding: 24px 20px;
            }
            .intake-tab {
              font-size: 0.75rem;
              padding: 10px 12px;
            }
            .intake-tab :global(svg) {
              font-size: 12px;
            }
            .intake-panel {
              padding: 18px;
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