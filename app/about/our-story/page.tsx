"use client";

import React from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRocket,
  faBullseye,
  faEye,
  faHeart,
  faLeaf,
  faUsers,
  faHandshake,
  faLightbulb,
  faGlobeAfrica,
  faArrowRight,
  faQuoteLeft,
  faCheckCircle,
  faSeedling,
  faMountain,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';

export default function OurStoryPage() {
  return (
    <ServiceTheme>
      <main className="our-story-page">
        {/* ===== HERO ===== */}
        <section className="story-hero">
          <div className="story-hero-bg" />
          <div className="story-hero-container">
            <span className="story-hero-label">Our Story</span>
            <h1 className="story-hero-title">
              Redefining African Tourism <br />
              <span className="story-hero-accent">Through Innovation</span>
            </h1>
            <p className="story-hero-subtitle">
              From a bold idea to Ghana's premier tech-enabled tourism platform — this is how we're
              reshaping the way the world experiences African culture.
            </p>
          </div>
        </section>

        {/* ===== INTRO QUOTE ===== */}
        <section className="story-quote-section">
          <div className="story-quote-container">
            <div className="story-quote-mark">
              <FontAwesomeIcon icon={faQuoteLeft} />
            </div>
            <blockquote className="story-quote">
              We believe that Ghana's rich cultural heritage deserves a stage that matches its
              magnificence — one powered by innovation, driven by community, and built for the
              future.
            </blockquote>
            <p className="story-quote-author">— The TechTour Ghana Team</p>
          </div>
        </section>

        {/* ===== OUR HISTORY ===== */}
        <section className="story-history-section">
          <div className="story-history-container">
            <div className="story-history-header">
              <span className="section-label">Our Journey</span>
              <h2 className="section-title">
                A Story of <span className="section-title-accent">Purpose & Progress</span>
              </h2>
            </div>

            <div className="story-history-content">
              <p className="story-paragraph">
                TechTour Ghana was born from a simple but powerful observation: Africa's tourism
                industry was rich in culture, history, and natural beauty — yet too often, local
                communities and artisans were left on the sidelines of its economic success.
              </p>

              <p className="story-paragraph">
                We saw an opportunity to change that. By combining <strong>innovative technology</strong> with
                a deep respect for Ghanaian heritage, we set out to build a platform that didn't
                just showcase Ghana to the world — it <strong>elevated the Ghanaian people</strong> who make
                its culture so vibrant.
              </p>

              <p className="story-paragraph">
                What began as a small initiative to digitize local artisan marketplaces has grown
                into a comprehensive tourism ecosystem. Today, we offer:
              </p>

              <div className="story-offerings">
                <div className="story-offering">
                  <div className="story-offering-icon">
                    <FontAwesomeIcon icon={faGlobeAfrica} />
                  </div>
                  <div>
                    <h4>Virtual Reality Tours</h4>
                    <p>Immersive digital experiences that bring Ghana's wonders to the world</p>
                  </div>
                </div>
                <div className="story-offering">
                  <div className="story-offering-icon">
                    <FontAwesomeIcon icon={faHeart} />
                  </div>
                  <div>
                    <h4>All-Inclusive Travel Packages</h4>
                    <p>Curated journeys that blend luxury, culture, and authenticity</p>
                  </div>
                </div>
                <div className="story-offering">
                  <div className="story-offering-icon">
                    <FontAwesomeIcon icon={faHandshake} />
                  </div>
                  <div>
                    <h4>Digital Artisan Marketplace</h4>
                    <p>Connecting local craftspeople directly with a global audience</p>
                  </div>
                </div>
                <div className="story-offering">
                  <div className="story-offering-icon">
                    <FontAwesomeIcon icon={faLeaf} />
                  </div>
                  <div>
                    <h4>Sustainable Economic Impact</h4>
                    <p>Every booking reinvests into the communities we serve</p>
                  </div>
                </div>
              </div>

              <p className="story-paragraph">
                Our growth has been guided by one unwavering principle: <strong>tourism should
                benefit everyone it touches</strong> — from the traveler who discovers something new,
                to the artisan who finds a global market, to the community that thrives because of
                it.
              </p>
            </div>
          </div>
        </section>

        {/* ===== MISSION & VISION (Side-by-Side) ===== */}
        <section className="story-mv-section">
          <div className="story-mv-container">
            <div className="story-mv-header">
              <span className="section-label">Our Purpose</span>
              <h2 className="section-title">
                Mission & <span className="section-title-accent">Vision</span>
              </h2>
              <p className="section-subtitle">
                The two pillars that guide everything we build, create, and share with the world.
              </p>
            </div>

            <div className="story-mv-grid">
              {/* LEFT: Mission + Vision Cards stacked */}
              <div className="story-mv-left">
                {/* Mission Card */}
                <div className="story-mv-card story-mv-card--mission">
                  <div className="story-mv-icon">
                    <FontAwesomeIcon icon={faBullseye} />
                  </div>
                  <div className="story-mv-body">
                    <span className="story-mv-label">Mission</span>
                    <h3 className="story-mv-title">Our Mission</h3>
                    <p className="story-mv-text">
                      To redefine African tourism through technology that uplifts, connects, and
                      inspires. We exist to create authentic cultural experiences that empower
                      Ghanaian communities, support local artisans, and showcase the true beauty
                      of Africa to the world — all powered by innovation that honors heritage.
                    </p>
                  </div>
                </div>

                {/* Vision Card */}
                <div className="story-mv-card story-mv-card--vision">
                  <div className="story-mv-icon">
                    <FontAwesomeIcon icon={faEye} />
                  </div>
                  <div className="story-mv-body">
                    <span className="story-mv-label">Vision</span>
                    <h3 className="story-mv-title">Our Vision</h3>
                    <p className="story-mv-text">
                      A world where African tourism is a catalyst for sustainable prosperity. We
                      envision a future where every traveler's journey through Africa contributes
                      directly to the well-being of local communities — where culture is
                      celebrated, artisans are empowered, and innovation serves as a bridge
                      between heritage and progress.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: Image only, no background */}
              <div className="story-mv-visual">
                <img
                  src="/images/logo-40x40.png"
                  alt="TechTour Ghana"
                  className="story-mv-visual-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== VALUES ===== */}
        <section className="story-values-section">
          <div className="story-values-container">
            <div className="story-values-header">
              <span className="section-label">What We Stand For</span>
              <h2 className="section-title">
                Our Core <span className="section-title-accent">Values</span>
              </h2>
              <p className="section-subtitle">
                These principles guide every decision we make, every experience we craft, and every
                partnership we build.
              </p>
            </div>

            <div className="story-values-grid">
              <div className="story-value-card">
                <div className="story-value-icon">
                  <FontAwesomeIcon icon={faHeart} />
                </div>
                <h4>Authenticity</h4>
                <p>We champion genuine cultural experiences that honor Ghana's true story.</p>
              </div>
              <div className="story-value-card">
                <div className="story-value-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <h4>Community Impact</h4>
                <p>Every booking creates tangible value for local people and artisans.</p>
              </div>
              <div className="story-value-card">
                <div className="story-value-icon">
                  <FontAwesomeIcon icon={faLeaf} />
                </div>
                <h4>Sustainability</h4>
                <p>We build for the long-term well-being of people and planet.</p>
              </div>
              <div className="story-value-card">
                <div className="story-value-icon">
                  <FontAwesomeIcon icon={faLightbulb} />
                </div>
                <h4>Innovation</h4>
                <p>We use technology as a bridge between heritage and future.</p>
              </div>
              <div className="story-value-card">
                <div className="story-value-icon">
                  <FontAwesomeIcon icon={faHandshake} />
                </div>
                <h4>Integrity</h4>
                <p>We do what we say, and we say what we mean — always.</p>
              </div>
              <div className="story-value-card">
                <div className="story-value-icon">
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                <h4>Excellence</h4>
                <p>We set the standard for African tourism, then raise it again.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== MILESTONES ===== */}
        <section className="story-milestones-section">
          <div className="story-milestones-container">
            <div className="story-milestones-header">
              <span className="section-label">Milestones</span>
              <h2 className="section-title">
                Moments That <span className="section-title-accent">Shaped Us</span>
              </h2>
            </div>

            <div className="story-milestones-timeline">
              <div className="story-milestone">
                <div className="story-milestone-dot">
                  <FontAwesomeIcon icon={faSeedling} />
                </div>
                <div className="story-milestone-content">
                  <span className="story-milestone-year">The Beginning</span>
                  <h4>TechTour Ghana is Founded</h4>
                  <p>
                    A small team with a big vision sets out to reimagine how Ghana is experienced
                    by travelers around the world.
                  </p>
                </div>
              </div>

              <div className="story-milestone">
                <div className="story-milestone-dot">
                  <FontAwesomeIcon icon={faGlobeAfrica} />
                </div>
                <div className="story-milestone-content">
                  <span className="story-milestone-year">Growth</span>
                  <h4>Digital Marketplace Launch</h4>
                  <p>
                    We launch our artisan marketplace, giving hundreds of local craftspeople a
                    global stage for the first time.
                  </p>
                </div>
              </div>

              <div className="story-milestone">
                <div className="story-milestone-dot">
                  <FontAwesomeIcon icon={faMountain} />
                </div>
                <div className="story-milestone-content">
                  <span className="story-milestone-year">Expansion</span>
                  <h4>National Tour Network</h4>
                  <p>
                    Our onsite tourism network expands to all 16 regions of Ghana, connecting
                    travelers to heritage, nature, and culture.
                  </p>
                </div>
              </div>

              <div className="story-milestone">
                <div className="story-milestone-dot">
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                <div className="story-milestone-content">
                  <span className="story-milestone-year">Today</span>
                  <h4>A Premier African Tourism Platform</h4>
                  <p>
                    Thousands of travelers served. Hundreds of artisans empowered. One clear
                    mission: redefining what African tourism can be.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="story-cta">
          <div className="story-cta-bg" />
          <div className="story-cta-container">
            <h2 className="story-cta-title">Be Part of Our Story</h2>
            <p className="story-cta-text">
              Whether you're a traveler, artisan, or partner — there's a place for you in the
              TechTour Ghana journey.
            </p>
            <div className="story-cta-actions">
              <Link href="/contact" className="story-cta-btn primary">
                Get in Touch
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              <Link href="/about/our-team" className="story-cta-btn secondary">
                Meet the Team
              </Link>
            </div>
          </div>
        </section>

        <BackToTop accentColor="teal" />

        <style jsx>{`
          .our-story-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== HERO ===== */
          .story-hero {
            position: relative;
            overflow: hidden;
            padding: 100px 32px 80px;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .story-hero-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 15% 30%,
                rgba(230, 166, 77, 0.25) 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 85% 70%,
                rgba(255, 255, 255, 0.15) 0%,
                transparent 45%
              );
          }

          .story-hero-container {
            position: relative;
            z-index: 2;
            max-width: 900px;
            margin: 0 auto;
            text-align: center;
          }

          .story-hero-logo {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
          }

          .story-hero-logo img {
            filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.25));
            border-radius: 16px;
          }

          .story-hero-label {
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

          .story-hero-title {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 20px 0;
            line-height: 1.15;
            letter-spacing: -0.02em;
          }

          .story-hero-accent {
            color: #E6A64D;
          }

          .story-hero-subtitle {
            font-size: clamp(1rem, 1.5vw, 1.15rem);
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 auto;
            max-width: 700px;
          }

          /* ===== QUOTE ===== */
          .story-quote-section {
            padding: 80px 32px;
          }

          .story-quote-container {
            max-width: 900px;
            margin: 0 auto;
            text-align: center;
            position: relative;
          }

          .story-quote-mark {
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

          .story-quote {
            font-size: clamp(1.2rem, 2.2vw, 1.6rem);
            font-weight: 600;
            color: var(--sp-text-primary);
            line-height: 1.5;
            margin: 0 0 20px 0;
            letter-spacing: -0.01em;
            font-style: italic;
          }

          .story-quote-author {
            font-size: 0.9rem;
            color: var(--sp-text-muted);
            margin: 0;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          /* ===== HISTORY ===== */
          .story-history-section {
            padding: 20px 32px 80px;
          }

          .story-history-container {
            max-width: 900px;
            margin: 0 auto;
          }

          .story-history-header {
            text-align: center;
            margin-bottom: 48px;
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
            max-width: 600px;
          }

          .story-paragraph {
            font-size: 1.05rem;
            color: var(--sp-text-secondary);
            line-height: 1.85;
            margin: 0 0 24px 0;
          }

          .story-paragraph strong {
            color: var(--sp-text-primary);
            font-weight: 700;
          }

          .story-offerings {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin: 32px 0;
          }

          .story-offering {
            display: flex;
            gap: 16px;
            padding: 20px;
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 16px;
            transition: all 0.3s ease;
          }

          .story-offering:hover {
            transform: translateY(-4px);
            border-color: rgba(19, 158, 162, 0.3);
            box-shadow: var(--sp-shadow-md);
          }

          .story-offering-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(19, 158, 162, 0.12);
            color: #139EA2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
          }

          .story-offering h4 {
            font-size: 1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 4px 0;
          }

          .story-offering p {
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            margin: 0;
            line-height: 1.5;
          }

          /* ===== MISSION & VISION (Side-by-Side) ===== */
          .story-mv-section {
            padding: 40px 32px 80px;
          }

          .story-mv-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .story-mv-header {
            text-align: center;
            margin-bottom: 56px;
          }

          .story-mv-grid {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 56px;
            align-items: center;
          }

          .story-mv-left {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .story-mv-card {
            display: flex;
            gap: 20px;
            padding: 32px 28px;
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            transition: all 0.3s ease;
          }

          .story-mv-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--sp-shadow-md);
          }

          .story-mv-card--mission:hover {
            border-color: rgba(19, 158, 162, 0.4);
          }

          .story-mv-card--vision:hover {
            border-color: rgba(230, 166, 77, 0.4);
          }

          .story-mv-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            flex-shrink: 0;
          }

          .story-mv-card--mission .story-mv-icon {
            background: rgba(19, 158, 162, 0.12);
            color: #139EA2;
          }

          .story-mv-card--vision .story-mv-icon {
            background: rgba(230, 166, 77, 0.15);
            color: #E6A64D;
          }

          .story-mv-body {
            flex: 1;
          }

          .story-mv-label {
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .story-mv-card--mission .story-mv-label {
            color: #139EA2;
          }

          .story-mv-card--vision .story-mv-label {
            color: #E6A64D;
          }

          .story-mv-title {
            font-size: 1.4rem;
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 12px 0;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .story-mv-text {
            font-size: 0.95rem;
            color: var(--sp-text-secondary);
            line-height: 1.75;
            margin: 0;
          }

          /* ===== Image Only (No Background) ===== */
          .story-mv-visual {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .story-mv-visual-img {
            width: 100%;
            max-width: 420px;
            height: auto;
            object-fit: contain;
            filter: drop-shadow(0 20px 48px rgba(19, 158, 162, 0.25));
          }

          /* ===== VALUES ===== */
          .story-values-section {
            padding: 80px 32px;
            background: var(--sp-bg-secondary);
            border-top: 1px solid var(--sp-border);
            border-bottom: 1px solid var(--sp-border);
          }

          .story-values-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .story-values-header {
            text-align: center;
            margin-bottom: 48px;
          }

          .story-values-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .story-value-card {
            padding: 32px 24px;
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            text-align: center;
            transition: all 0.3s ease;
          }

          .story-value-card:hover {
            transform: translateY(-6px);
            border-color: rgba(19, 158, 162, 0.4);
            box-shadow: var(--sp-shadow-lg);
          }

          .story-value-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            border-radius: 16px;
            background: rgba(19, 158, 162, 0.12);
            color: #139EA2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            transition: all 0.3s ease;
          }

          .story-value-card:hover .story-value-icon {
            background: #139EA2;
            color: #FFFFFF;
            transform: scale(1.1) rotate(5deg);
          }

          .story-value-card h4 {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .story-value-card p {
            font-size: 0.9rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0;
          }

          /* ===== MILESTONES ===== */
          .story-milestones-section {
            padding: 80px 32px;
          }

          .story-milestones-container {
            max-width: 900px;
            margin: 0 auto;
          }

          .story-milestones-header {
            text-align: center;
            margin-bottom: 56px;
          }

          .story-milestones-timeline {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          .story-milestones-timeline::before {
            content: '';
            position: absolute;
            left: 28px;
            top: 20px;
            bottom: 20px;
            width: 2px;
            background: linear-gradient(180deg, #139EA2 0%, #E6A64D 100%);
            opacity: 0.25;
          }

          .story-milestone {
            display: flex;
            gap: 24px;
            align-items: flex-start;
            position: relative;
          }

          .story-milestone-dot {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--sp-bg-card);
            border: 2px solid #139EA2;
            color: #139EA2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
            z-index: 1;
            transition: all 0.3s ease;
          }

          .story-milestone:hover .story-milestone-dot {
            background: #139EA2;
            color: #FFFFFF;
            transform: scale(1.1);
            box-shadow: 0 8px 24px rgba(19, 158, 162, 0.35);
          }

          .story-milestone-content {
            padding-top: 4px;
          }

          .story-milestone-year {
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            color: #E6A64D;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .story-milestone-content h4 {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .story-milestone-content p {
            font-size: 0.95rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
            margin: 0;
          }

          /* ===== CTA ===== */
          .story-cta {
            position: relative;
            padding: 80px 32px;
            overflow: hidden;
          }

          .story-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .story-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .story-cta-title {
            font-size: clamp(1.6rem, 3.5vw, 2.2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .story-cta-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 0 32px 0;
          }

          .story-cta-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .story-cta-btn {
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

          .story-cta-btn.primary {
            background: #E6A64D;
            color: #1A1A2E;
            box-shadow: 0 8px 24px rgba(230, 166, 77, 0.3);
          }

          .story-cta-btn.primary:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .story-cta-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(10px);
          }

          .story-cta-btn.secondary:hover {
            background: #FFFFFF;
            color: #139EA2;
            transform: translateY(-3px);
          }

          .story-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .story-cta-btn.primary:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== RESPONSIVE ===== */

          /* Tablet */
          @media (max-width: 992px) {
            .story-offerings {
              grid-template-columns: 1fr;
            }

            .story-mv-grid {
              grid-template-columns: 1fr;
              gap: 32px;
            }

            .story-mv-visual {
              order: -1;
              padding: 0;
            }

            .story-mv-visual-img {
              max-width: 320px;
              margin: 0 auto;
            }

            .story-values-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          /* Mobile */
          @media (max-width: 640px) {
            .story-hero {
              padding: 60px 20px 50px;
            }

            .story-quote-section,
            .story-history-section,
            .story-values-section,
            .story-milestones-section {
              padding: 50px 20px;
            }

            .story-mv-section {
              padding: 30px 20px 50px;
            }

            .story-mv-card {
              flex-direction: column;
              align-items: flex-start;
              padding: 24px 20px;
              gap: 16px;
            }

            .story-mv-icon {
              width: 56px;
              height: 56px;
              font-size: 22px;
            }

            .story-mv-title {
              font-size: 1.25rem;
            }

            .story-mv-text {
              font-size: 0.9rem;
            }

            .story-mv-visual-img {
              max-width: 220px;
            }

            /* Core Values: 2 x 2 grid on mobile */
            .story-values-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }

            .story-value-card {
              padding: 20px 14px;
              border-radius: 16px;
            }

            .story-value-icon {
              width: 48px;
              height: 48px;
              font-size: 20px;
              margin-bottom: 12px;
              border-radius: 12px;
            }

            .story-value-card h4 {
              font-size: 0.9rem;
              margin-bottom: 6px;
            }

            .story-value-card p {
              font-size: 0.75rem;
              line-height: 1.45;
            }

            .story-cta {
              padding: 60px 20px;
            }

            .story-cta-actions {
              flex-direction: column;
            }

            .story-cta-btn {
              justify-content: center;
            }
          }

          /* Very small phones - keep 2 columns but tighter */
          @media (max-width: 380px) {
            .story-values-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }

            .story-value-card {
              padding: 16px 10px;
            }

            .story-value-card h4 {
              font-size: 0.82rem;
            }

            .story-value-card p {
              font-size: 0.7rem;
            }

            .story-value-icon {
              width: 42px;
              height: 42px;
              font-size: 18px;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}