"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

interface BackToTopProps {
  threshold?: number;      // Scroll distance before showing (px)
  scrollTarget?: number;   // Where to scroll to (px)
  accentColor?: 'teal' | 'orange';
  position?: 'right' | 'left';
}

const BackToTop: React.FC<BackToTopProps> = ({
  threshold = 400,
  scrollTarget = 0,
  accentColor = 'teal',
  position = 'right',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth',
    });
  };

  const colorFrom = accentColor === 'orange' ? '#E6A64D' : '#139EA2';
  const colorTo = accentColor === 'orange' ? '#D4953A' : '#0D7A7D';
  const shadowColor =
    accentColor === 'orange'
      ? 'rgba(230, 166, 77, 0.4)'
      : 'rgba(19, 158, 162, 0.4)';

  return (
    <button
      className={`back-to-top ${isVisible ? 'visible' : ''} ${position}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      style={{
        background: `linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 100%)`,
        boxShadow: isVisible ? `0 8px 24px ${shadowColor}` : 'none',
      }}
    >
      <FontAwesomeIcon icon={faArrowUp} />
      <span className="back-to-top-tooltip">Back to top</span>

      <style jsx>{`
        .back-to-top {
          position: fixed;
          bottom: 32px;
          z-index: 998;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          color: #FFFFFF;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px) scale(0.8);
          padding: 0;
        }

        .back-to-top.right {
          right: 32px;
        }

        .back-to-top.left {
          left: 32px;
        }

        .back-to-top.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        .back-to-top:hover {
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 12px 32px rgba(19, 158, 162, 0.5) !important;
        }

        .back-to-top:active {
          transform: translateY(-2px) scale(1);
        }

        .back-to-top:focus,
        .back-to-top:focus-visible {
          outline: none;
          box-shadow: 0 8px 24px rgba(19, 158, 162, 0.4);
        }

        /* Tooltip */
        .back-to-top-tooltip {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 12px;
          background: #1A1A2E;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          transition: all 0.25s ease;
          pointer-events: none;
          font-family: 'Inter', sans-serif;
        }

        .back-to-top-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          right: 16px;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #1A1A2E;
        }

        .back-to-top:hover .back-to-top-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .back-to-top {
            width: 44px;
            height: 44px;
            font-size: 15px;
          }

          .back-to-top.right {
            right: 20px;
          }

          .back-to-top.left {
            left: 20px;
          }

          .back-to-top {
            bottom: 24px;
          }

          .back-to-top-tooltip {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .back-to-top {
            transition: opacity 0.2s ease, visibility 0.2s ease;
          }
        }
      `}</style>
    </button>
  );
};

export default BackToTop;