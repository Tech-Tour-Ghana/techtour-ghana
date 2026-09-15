// components/Footer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  /*   faFacebookF,
    faInstagram,
    faLinkedinIn,
    faYoutube,
    faTiktok,
    faWhatsapp,
    faTwitter, */
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faClock,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookF as faFacebookBrand,
  faInstagram as faInstagramBrand,
  faLinkedinIn as faLinkedinBrand,
  faYoutube as faYoutubeBrand,
  faTiktok as faTiktokBrand,
  faWhatsapp as faWhatsappBrand,
  faTwitter as faTwitterBrand
} from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

// Types for API data
interface FooterFeature {
  icon: string;
  title: string;
  description: string;
}

interface FooterQuickLink {
  label: string;
  url: string;
}

interface FooterQuickLinksData {
  services: FooterQuickLink[];
  destinations: FooterQuickLink[];
  company: FooterQuickLink[];
  support: FooterQuickLink[];
}

interface FooterContact {
  icon: string;
  text: string;
}

interface SocialLink {
  platform: string;
  icon: string;
  url: string;
  color: string;
}

interface LegalLink {
  label: string;
  url: string;
}

interface FooterSettings {
  company_name: string;
  tagline: string;
  copyright_text: string;
  newsletter_placeholder: string;
  newsletter_button: string;
  newsletter_note: string;
}

import { createBrowserClient } from '@/lib/supabase/client';

// Helper to get FontAwesome brand icon for social platforms
const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  const icons: Record<string, any> = {
    'facebook': faFacebookBrand,
    'instagram': faInstagramBrand,
    'linkedin': faLinkedinBrand,
    'youtube': faYoutubeBrand,
    'tiktok': faTiktokBrand,
    'whatsapp': faWhatsappBrand,
    'twitter': faTwitterBrand,
  };
  return icons[p] || faFacebookBrand;
};

// Helper to get FontAwesome icon for contact items
const getContactIcon = (icon: string) => {
  const iconMap: Record<string, any> = {
    '': faMapMarkerAlt,
    '': faPhone,
    '': faEnvelope,
    '': faClock,
  };
  return iconMap[icon] || null;
};

// Helper to format phone number for tel: link
const formatPhoneForLink = (text: string) => {
  const numbers = text.replace(/[^\d+]/g, '');
  return numbers;
};

// Helper to extract email
const extractEmail = (text: string) => {
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  return emailMatch ? emailMatch[0] : text;
};

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterSuccessMsg, setNewsletterSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDimMode, setIsDimMode] = useState(false);

  // State for API data
  const [footerFeatures, setFooterFeatures] = useState<FooterFeature[]>([]);
  const [quickLinks, setQuickLinks] = useState<FooterQuickLinksData>({
    services: [],
    destinations: [],
    company: [],
    support: []
  });
  const [contacts, setContacts] = useState<FooterContact[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all footer data from API
  useEffect(() => {
    const fetchFooterData = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createBrowserClient();
        const [
          featuresRes,
          quickLinksRes,
          contactsRes,
          socialRes,
          legalRes,
          settingsRes
        ] = await Promise.all([
          supabase.from('footer_features').select('icon, title, description').order('sort_order'),
          supabase.from('footer_quick_links').select('category, label, url').order('sort_order'),
          supabase.from('footer_contacts').select('icon, text').order('sort_order'),
          supabase.from('social_links').select('platform, icon, url, color').order('sort_order'),
          supabase.from('legal_links').select('label, url').order('sort_order'),
          supabase.from('footer_settings').select('company_name, tagline, copyright_text, newsletter_placeholder, newsletter_button, newsletter_note').limit(1).maybeSingle(),
        ]);

        // Process each response individually
        if (!featuresRes.error) {
          setFooterFeatures(featuresRes.data);
        }
        if (!quickLinksRes.error) {
          const grouped: FooterQuickLinksData = { services: [], destinations: [], company: [], support: [] };
          for (const { category, label, url } of quickLinksRes.data) {
            grouped[category].push({ label, url });
          }
          setQuickLinks(grouped);
        }
        if (!contactsRes.error) {
          setContacts(contactsRes.data);
        }
        if (!socialRes.error) {
          setSocialLinks(socialRes.data);
        }
        if (!legalRes.error) {
          setLegalLinks(legalRes.data);
        }
        if (!settingsRes.error && settingsRes.data) {
          setSettings(settingsRes.data);
        }
      } catch (error) {
        console.error('Error fetching footer data:', error);
        setError('Failed to load footer content');
      } finally {
        setLoading(false);
      }
    };
    fetchFooterData();
  }, []);

  // Theme detection
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDimMode(savedTheme === 'dim');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDimMode(prefersDark);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          setIsDimMode(newTheme === 'dim');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError('');
    setNewsletterSuccessMsg('');
    setIsSubmitting(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newsletterEmail.trim() || !emailRegex.test(newsletterEmail)) {
      setNewsletterError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      // No .select() after the insert: anonymous users have no select policy.
      const { error: insertError } = await createBrowserClient()
        .from('newsletter_subscribers')
        .insert({ email: newsletterEmail.trim(), source: 'footer' });

      if (!insertError) {
        setNewsletterSubmitted(true);
        setNewsletterSuccessMsg('Thank you for subscribing! Check your email for a welcome message.');
        setNewsletterEmail('');
        setTimeout(() => {
          setNewsletterSubmitted(false);
          setNewsletterSuccessMsg('');
        }, 8000);
      } else if (insertError.code === '23505') {
        setNewsletterError('This email is already subscribed.');
      } else {
        setNewsletterError('Subscription failed. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterError('Network error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render contact item with appropriate link
  const renderContactItem = (contact: FooterContact, index: number) => {
    const text = contact.text;
    const icon = contact.icon;
    const faIcon = getContactIcon(icon);

    // Phone number
    if (text.includes('+233') || text.match(/[\d\s\+-]{10,}/)) {
      const phoneLink = `tel:${formatPhoneForLink(text)}`;
      return (
        <div className="contact-item-wide" key={index}>
          {faIcon ? (
            <FontAwesomeIcon icon={faIcon} className="contact-icon-svg" />
          ) : (
            <span className="contact-emoji">{icon}</span>
          )}
          <a href={phoneLink} className="contact-link">{text}</a>
        </div>
      );
    }

    // Email address
    if (text.includes('@')) {
      const email = extractEmail(text);
      return (
        <div className="contact-item-wide" key={index}>
          {faIcon ? (
            <FontAwesomeIcon icon={faIcon} className="contact-icon-svg" />
          ) : (
            <span className="contact-emoji">{icon}</span>
          )}
          <a href={`mailto:${email}`} className="contact-link">{text}</a>
        </div>
      );
    }

    // Regular text (address, hours)
    return (
      <div className="contact-item-wide" key={index}>
        {faIcon ? (
          <FontAwesomeIcon icon={faIcon} className="contact-icon-svg" />
        ) : (
          <span className="contact-emoji">{icon}</span>
        )}
        <span>{text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <footer className={`footer ${isDimMode ? 'dim' : 'bright'}`}>
        <div className="footer-wide-container">
          <div className="loading-spinner"></div>
        </div>
      </footer>
    );
  }

  if (error) {
    return (
      <footer className={`footer ${isDimMode ? 'dim' : 'bright'}`}>
        <div className="footer-wide-container">
          <div className="footer-error">
            <p>{error}</p>
          </div>
        </div>
      </footer>
    );
  }

  const quickLinkSections = [
    { key: 'services' as const, title: 'Services' },
    { key: 'destinations' as const, title: 'Destinations' },
    { key: 'company' as const, title: 'Company' },
    { key: 'support' as const, title: 'Support' },
  ];

  // Check if any quick link section has data
  const hasQuickLinks = quickLinkSections.some(
    section => quickLinks[section.key] && quickLinks[section.key].length > 0
  );

  // Check if contacts exist
  const hasContacts = contacts && contacts.length > 0;

  // Check if social links exist
  const hasSocialLinks = socialLinks && socialLinks.length > 0;

  // Check if legal links exist
  const hasLegalLinks = legalLinks && legalLinks.length > 0;

  // Check if features exist
  const hasFeatures = footerFeatures && footerFeatures.length > 0;

  return (
    <footer className={`footer ${isDimMode ? 'dim' : 'bright'}`}>
      <div className="footer-glow"></div>
      <div className="footer-wide-container">
        {/* Top Features Section - Dynamically rendered */}
        {/* {hasFeatures && (
          <div className="footer-features-wide">
            {footerFeatures.map((feature, index) => (
              <div className="footer-feature-wide" key={index}>
                <div className="feature-emoji-display">{feature.icon}</div>
                <div className="feature-content-wide">
                  <h4 className="feature-title-wide">{feature.title}</h4>
                  <p className="feature-description-wide">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        )} */}

        {/* Main Footer Content */}
        <div className="footer-main-wide">
          {/* Brand & Contact Section */}
          <div className="footer-brand-wide">
            <div className="footer-logo-wide">
              <span className="logo-main-wide">TECHTOUR</span>
              <span className="logo-sub-wide">GHANA</span>
            </div>
            <p className="footer-tagline-wide">
              {settings?.tagline || 'Your gateway to authentic Ghanaian experiences.'}
            </p>

            {hasContacts && (
              <div className="contact-info-wide">
                <h4 className="contact-title-wide">
                  <span className="contact-title-line"></span>
                  Get In Touch
                </h4>
                <div className="contact-list">
                  {contacts.map((contact, index) => renderContactItem(contact, index))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Links Grid - Only show if there's data */}
          {hasQuickLinks && (
            <div className="footer-links-wide">
              {quickLinkSections.map((section) => {
                const links = quickLinks[section.key];
                if (!links || links.length === 0) return null;

                return (
                  <div className="footer-links-section-wide" key={section.key}>
                    <h4 className="links-section-title-wide">{section.title}</h4>
                    <ul className="footer-links-list-wide">
                      {links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <Link href={link.url} className="footer-link-wide">
                            <span className="link-dot"></span>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Newsletter & Social Section */}
          <div className="footer-newsletter-wide">
            <h4 className="newsletter-title-wide">
              <span className="newsletter-title-line"></span>
              Stay Updated
            </h4>
            <p className="newsletter-subtitle-wide">
              Subscribe to our newsletter for exclusive offers and travel inspiration
            </p>

            {/* Newsletter Form */}
            <form className="newsletter-form-wide" onSubmit={handleNewsletterSubmit}>
              <div className="newsletter-input-group-wide">
                <input
                  type="email"
                  placeholder={settings?.newsletter_placeholder || "Enter your email address"}
                  className="newsletter-input-wide"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="submit"
                  className="newsletter-btn-wide"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner-ring"></span>
                      Sending...
                    </span>
                  ) : (
                    `${settings?.newsletter_button || 'Subscribe'} `
                  )}
                </button>
              </div>

              {newsletterError && (
                <div className="newsletter-error-wide">
                  <span className="error-icon">✕</span>
                  <span>{newsletterError}</span>
                </div>
              )}

              {newsletterSubmitted && newsletterSuccessMsg && (
                <div className="newsletter-success-wide">
                  <span className="success-icon">✓</span>
                  <span>{newsletterSuccessMsg}</span>
                </div>
              )}

              <p className="newsletter-note-wide">
                {settings?.newsletter_note || 'By subscribing, you agree to our Privacy Policy.'}
              </p>
            </form>

            {/* Social Media Section - Only show if there's data */}
            {hasSocialLinks && (
              <div className="social-section-wide">
                <div className="social-header">
                  <h5 className="social-title-wide">Connect With Us</h5>
                  <span className="social-divider"></span>
                </div>
                <p className="social-subtitle">Follow us on social media for daily inspiration</p>
                <div className="social-icons-circle">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      className="social-icon-circle"
                      style={{ backgroundColor: social.color }}
                      aria-label={social.platform}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon icon={getSocialIcon(social.platform)} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="footer-bottom-wide">
          <div className="footer-bottom-content-wide">
            <div className="copyright-wide">
              <span className="copyright-icon">©</span>
              {new Date().getFullYear()} {settings?.company_name || 'TechTour Ghana'}. {settings?.copyright_text || 'All rights reserved.'}
            </div>

            {hasLegalLinks && (
              <div className="legal-links-wide">
                {legalLinks.map((link, index) => (
                  <Link href={link.url} key={index} className="legal-link-wide">
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;