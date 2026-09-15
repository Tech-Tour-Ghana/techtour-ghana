"use client";

import React from 'react';

interface ServiceHeroProps {
  title: string;
  titleAccent: string;
  description: string;
  accentColor?: 'teal' | 'orange';
}

const ServiceHero: React.FC<ServiceHeroProps> = ({
  title,
  titleAccent,
  description,
  accentColor = 'teal',
}) => {
  const gradientFrom = accentColor === 'orange' ? '#E6A64D' : '#139EA2';
  const gradientTo = accentColor === 'orange' ? '#D4953A' : '#0D7A7D';
  const accentTextColor = accentColor === 'orange' ? '#FFFFFF' : '#E6A64D';

  return (
    <section className="service-hero">
      <div
        className="service-hero-bg"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        }}
      />

      <div className="service-hero-orb service-hero-orb-1" />
      <div className="service-hero-orb service-hero-orb-2" />

      <div className="service-hero-content">
        <div className="service-hero-container">
          <h1 className="service-title">
            {title}{' '}
            <span className="service-title-accent" style={{ color: accentTextColor }}>
              {titleAccent}
            </span>
          </h1>
          <p className="service-description">{description}</p>
        </div>
      </div>

      <div className="service-hero-wave">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path
            d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
            fill="var(--sp-bg-primary, #F9F9F9)"
          />
        </svg>
      </div>

      <style jsx>{`
        .service-hero {
          position: relative;
          min-height: 420px;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 120px 0 80px;
        }

        .service-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .service-hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.2;
          z-index: 1;
        }

        .service-hero-orb-1 {
          width: 400px;
          height: 400px;
          background: #E6A64D;
          top: -100px;
          right: -100px;
        }

        .service-hero-orb-2 {
          width: 300px;
          height: 300px;
          background: #FFFFFF;
          bottom: -50px;
          left: -50px;
        }

        .service-hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
        }

        .service-hero-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }

        .service-title {
          font-size: clamp(2.4rem, 5.5vw, 4rem);
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 20px 0;
          line-height: 1.1;
          letter-spacing: -0.02em;
          max-width: 900px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .service-title-accent {
          display: inline-block;
        }

        .service-description {
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          color: rgba(255, 255, 255, 0.95);
          max-width: 720px;
          line-height: 1.7;
          margin: 0;
          font-weight: 400;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .service-hero-wave {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 60px;
          z-index: 3;
        }

        .service-hero-wave svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        @media (max-width: 768px) {
          .service-hero {
            min-height: 360px;
            padding: 100px 0 60px;
          }
          .service-hero-container {
            padding: 0 20px;
          }
          .service-title {
            font-size: 2rem;
          }
          .service-description {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </section>
  );
};

export default ServiceHero;