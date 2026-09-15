'use client';

import React, { useState, useEffect } from 'react';
import './Loading.css';

interface LoadingProps {
  fullPage?: boolean;
  onComplete?: () => void;
}

const Loading = ({ fullPage = true, onComplete }: LoadingProps) => {
  const [isDimMode, setIsDimMode] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDimMode(savedTheme === 'dim');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDimMode(prefersDark);
    }

    // Auto-hide after 3 seconds if onComplete is provided (for inline usage)
    if (onComplete) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 400); // Wait for fade out animation
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  if (!isVisible && !fullPage) {
    return null;
  }

  if (fullPage) {
    return (
      <div className={`loading-container ${isDimMode ? 'dim' : 'bright'}`}>
        <div className="loading-content">
          <div className="loading-logo">
            <span className="loading-logo-text">TECHTOUR</span>
            <span className="loading-logo-accent">GHANA</span>
          </div>
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner-ring"></div>
          </div>
          <p className="loading-text">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-inline ${isDimMode ? 'dim' : 'bright'}`}>
      <div className="loading-spinner-ring small"></div>
    </div>
  );
};

export default Loading;