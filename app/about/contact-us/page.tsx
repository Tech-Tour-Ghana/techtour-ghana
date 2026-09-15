"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faPhone,
  faLocationDot,
  faClock,
  faArrowRight,
  faCheckCircle,
  faPaperPlane,
  faHeadset,
  faHandshake,
  faBriefcase,
  faGlobeAfrica,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook,
  faInstagram,
  faTwitter,
  faLinkedin,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';
import { createBrowserClient } from '@/lib/supabase/client';

const contactMethods = [
  {
    icon: faEnvelope,
    title: 'Email Us',
    description: 'We typically respond within 24 hours',
    value: 'hello@techtourghana.com',
    href: 'mailto:hello@techtourghana.com',
  },
  {
    icon: faPhone,
    title: 'Call Us',
    description: 'Mon-Fri, 8AM - 6PM GMT',
    value: '+233 (0) 30 123 4567',
    href: 'tel:+233301234567',
  },
  {
    icon: faLocationDot,
    title: 'Visit Us',
    description: 'Our head office',
    value: 'Accra, Ghana',
    href: '#',
  },
  {
    icon: faHeadset,
    title: '24/7 Support',
    description: 'For active bookings only',
    value: 'support@techtourghana.com',
    href: 'mailto:support@techtourghana.com',
  },
];

const departmentContacts = [
  {
    icon: faHandshake,
    title: 'Partnerships',
    email: 'partners@techtourghana.com',
    description: 'For hotels, operators, artisans, and organizations',
  },
  {
    icon: faBriefcase,
    title: 'Careers',
    email: 'careers@techtourghana.com',
    description: 'For job applications and career inquiries',
  },
  {
    icon: faGlobeAfrica,
    title: 'Media & Press',
    email: 'press@techtourghana.com',
    description: 'For press releases and media inquiries',
  },
];

const socialLinks = [
  { icon: faFacebook, href: '#', label: 'Facebook' },
  { icon: faInstagram, href: '#', label: 'Instagram' },
  { icon: faTwitter, href: '#', label: 'Twitter' },
  { icon: faLinkedin, href: '#', label: 'LinkedIn' },
  { icon: faYoutube, href: '#', label: 'YouTube' },
];

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserClient();
    const { error } = await supabase.from('contact_messages').insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
    });
    // ponytail: no select() after insert, there is no select policy for anon
    if (error) {
      console.error('Failed to send contact message:', error);
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <ServiceTheme>
      <main className="contact-page">
        {/* ===== HERO , COMPACT ===== */}
        <section className="contact-hero">
          <div className="contact-hero-bg" />
          <div className="contact-hero-container">
            <span className="contact-hero-label">Contact Us</span>
            <h1 className="contact-hero-title">
              Let's Start a <br />
              <span className="contact-hero-accent">Conversation</span>
            </h1>
            <p className="contact-hero-subtitle">
              Have a question, an idea, or a dream trip in mind? Our team is here to help — reach
              out and we'll be in touch shortly.
            </p>
          </div>
        </section>

        {/* ===== CONTACT METHODS ===== */}
        <section className="contact-methods-section">
          <div className="contact-methods-container">
            <div className="contact-methods-grid">
              {contactMethods.map((method, idx) => (
                <a key={idx} href={method.href} className="contact-method-card">
                  <div className="contact-method-icon">
                    <FontAwesomeIcon icon={method.icon} />
                  </div>
                  <h3 className="contact-method-title">{method.title}</h3>
                  <p className="contact-method-description">{method.description}</p>
                  <span className="contact-method-value">{method.value}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FORM + INFO ===== */}
        <section className="contact-form-section">
          <div className="contact-form-container">
            <div className="contact-form-grid">
              {/* INFO SIDE */}
              <div className="contact-info">
                <span className="section-label">Get in Touch</span>
                <h2 className="section-title">
                  Send Us a <span className="section-title-accent">Message</span>
                </h2>
                <p className="contact-info-text">
                  Whether you're planning a trip, seeking a partnership, or just curious about
                  what we do — we'd love to hear from you.
                </p>

                <div className="contact-info-blocks">
                  <div className="contact-info-block">
                    <div className="contact-info-block-icon">
                      <FontAwesomeIcon icon={faLocationDot} />
                    </div>
                    <div>
                      <h4>Head Office</h4>
                      <p>Airport City, Accra</p>
                      <p>Greater Accra Region, Ghana</p>
                    </div>
                  </div>

                  <div className="contact-info-block">
                    <div className="contact-info-block-icon">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div>
                      <h4>Office Hours</h4>
                      <p>Monday - Friday: 8AM - 6PM GMT</p>
                      <p>Saturday: 9AM - 2PM GMT</p>
                    </div>
                  </div>
                </div>

                {/* Department contacts */}
                <div className="contact-departments">
                  <h4 className="contact-departments-title">Department Contacts</h4>
                  {departmentContacts.map((dept, idx) => (
                    <a
                      key={idx}
                      href={`mailto:${dept.email}`}
                      className="contact-department"
                    >
                      <div className="contact-department-icon">
                        <FontAwesomeIcon icon={dept.icon} />
                      </div>
                      <div>
                        <span className="contact-department-title">{dept.title}</span>
                        <span className="contact-department-email">{dept.email}</span>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Social links */}
                <div className="contact-socials">
                  <span className="contact-socials-label">Follow Us</span>
                  <div className="contact-socials-row">
                    {socialLinks.map((social, idx) => (
                      <a
                        key={idx}
                        href={social.href}
                        aria-label={social.label}
                        className="contact-social-btn"
                      >
                        <FontAwesomeIcon icon={social.icon} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* FORM SIDE */}
              <div className="contact-form-wrapper">
                {submitted ? (
                  <div className="contact-form-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <h3>Message Sent!</h3>
                    <p>Thank you for reaching out. We'll respond within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="contact-form-row">
                      <div className="contact-form-field">
                        <label>Your Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Full name"
                        />
                      </div>
                      <div className="contact-form-field">
                        <label>Email *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="you@email.com"
                        />
                      </div>
                    </div>

                    <div className="contact-form-row">
                      <div className="contact-form-field">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+233 ..."
                        />
                      </div>
                      <div className="contact-form-field">
                        <label>Subject *</label>
                        <select
                          required
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({ ...formData, subject: e.target.value })
                          }
                        >
                          <option value="">Select a topic</option>
                          <option value="booking">Trip Inquiry / Booking</option>
                          <option value="partnership">Partnership</option>
                          <option value="support">Support</option>
                          <option value="careers">Careers</option>
                          <option value="press">Media / Press</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="contact-form-field">
                      <label>Your Message *</label>
                      <textarea
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us how we can help..."
                      />
                    </div>

                    <button type="submit" className="contact-form-submit">
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="contact-cta">
          <div className="contact-cta-bg" />
          <div className="contact-cta-container">
            <h2 className="contact-cta-title">Ready to Explore Ghana?</h2>
            <p className="contact-cta-text">
              Browse our experiences or plan a custom trip with our travel specialists.
            </p>
            <div className="contact-cta-actions">
              <Link href="/services/onsite-tourism" className="contact-cta-btn primary">
                Browse Experiences
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              <Link href="/services/dream-vacations" className="contact-cta-btn secondary">
                View Dream Vacations
              </Link>
            </div>
          </div>
        </section>

        <BackToTop accentColor="teal" />

        <style jsx>{`
          .contact-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ===== HERO , COMPACT ===== */
          .contact-hero {
            position: relative;
            overflow: hidden;
            padding: 64px 32px 56px;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .contact-hero-bg {
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

          .contact-hero-container {
            position: relative;
            z-index: 2;
            max-width: 900px;
            margin: 0 auto;
            text-align: center;
          }

          .contact-hero-label {
            display: inline-block;
            padding: 7px 18px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 30px;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 18px;
          }

          .contact-hero-title {
            font-size: clamp(1.8rem, 4vw, 2.8rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 14px 0;
            line-height: 1.15;
            letter-spacing: -0.02em;
          }

          .contact-hero-accent {
            color: #E6A64D;
          }

          .contact-hero-subtitle {
            font-size: clamp(0.9rem, 1.4vw, 1.05rem);
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            margin: 0 auto;
            max-width: 620px;
          }

          /* ===== CONTACT METHODS , COMPACT ===== */
          .contact-methods-section {
            padding: 0 32px;
            margin-top: -32px;
            margin-bottom: 48px;
            position: relative;
            z-index: 10;
          }

          .contact-methods-container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .contact-methods-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }

          .contact-method-card {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 14px;
            padding: 18px 14px;
            text-align: center;
            text-decoration: none;
            color: inherit;
            box-shadow: var(--sp-shadow-md);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .contact-method-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--sp-shadow-lg);
            border-color: rgba(19, 158, 162, 0.4);
          }

          .contact-method-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(19, 158, 162, 0.12);
            color: #139EA2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
          }

          .contact-method-card:hover .contact-method-icon {
            background: #139EA2;
            color: #FFFFFF;
            transform: scale(1.08) rotate(5deg);
          }

          .contact-method-title {
            font-size: 0.92rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 4px 0;
          }

          .contact-method-description {
            font-size: 0.75rem;
            color: var(--sp-text-muted);
            margin: 0 0 6px 0;
            line-height: 1.4;
          }

          .contact-method-value {
            font-size: 0.78rem;
            font-weight: 700;
            color: #139EA2;
            word-break: break-word;
            line-height: 1.3;
          }

          /* ===== FORM SECTION , COMPACT ===== */
          .contact-form-section {
            padding: 24px 32px 64px;
          }

          .contact-form-container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .contact-form-grid {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 40px;
            align-items: start;
          }

          .section-label {
            display: inline-block;
            color: #139EA2;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
          }

          .section-title {
            font-size: clamp(1.5rem, 3vw, 2rem);
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 12px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .section-title-accent {
            color: #139EA2;
          }

          .contact-info-text {
            font-size: 0.92rem;
            color: var(--sp-text-secondary);
            line-height: 1.65;
            margin: 0 0 24px 0;
          }

          .contact-info-blocks {
            display: flex;
            flex-direction: column;
            gap: 14px;
            margin-bottom: 24px;
          }

          .contact-info-block {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .contact-info-block-icon {
            width: 40px;
            height: 40px;
            border-radius: 11px;
            background: rgba(19, 158, 162, 0.12);
            color: #139EA2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
          }

          .contact-info-block h4 {
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 3px 0;
          }

          .contact-info-block p {
            font-size: 0.8rem;
            color: var(--sp-text-secondary);
            margin: 0;
            line-height: 1.45;
          }

          /* Departments */
          .contact-departments {
            padding: 16px;
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 14px;
            margin-bottom: 24px;
          }

          .contact-departments-title {
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 12px 0;
          }

          .contact-department {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 9px;
            text-decoration: none;
            color: inherit;
            transition: all 0.25s ease;
          }

          .contact-department:hover {
            background: rgba(19, 158, 162, 0.06);
          }

          .contact-department-icon {
            width: 32px;
            height: 32px;
            border-radius: 9px;
            background: rgba(230, 166, 77, 0.12);
            color: #E6A64D;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            flex-shrink: 0;
          }

          .contact-department-title {
            display: block;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin-bottom: 2px;
          }

          .contact-department-email {
            display: block;
            font-size: 0.75rem;
            color: #139EA2;
            font-weight: 600;
          }

          /* Socials */
          .contact-socials {
            padding-top: 20px;
            border-top: 1px solid var(--sp-border);
          }

          .contact-socials-label {
            display: block;
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--sp-text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }

          .contact-socials-row {
            display: flex;
            gap: 8px;
          }

          .contact-social-btn {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--sp-tag-bg);
            border: 1px solid var(--sp-tag-border);
            color: var(--sp-text-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            text-decoration: none;
            transition: all 0.25s ease;
          }

          .contact-social-btn:hover {
            background: #139EA2;
            border-color: #139EA2;
            color: #FFFFFF;
            transform: translateY(-2px);
          }

          /* Form */
          .contact-form-wrapper {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 18px;
            padding: 26px;
            box-shadow: var(--sp-shadow-md);
            position: sticky;
            top: 100px;
          }

          .contact-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 14px;
          }

          .contact-form-field {
            margin-bottom: 14px;
          }

          .contact-form-field label {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--sp-text-secondary);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .contact-form-field input,
          .contact-form-field select,
          .contact-form-field textarea {
            width: 100%;
            padding: 11px 13px;
            border: 1.5px solid var(--sp-border);
            border-radius: 10px;
            background: var(--sp-bg-input);
            color: var(--sp-text-primary);
            font-family: inherit;
            font-size: 0.88rem;
            transition: all 0.25s ease;
          }

          .contact-form-field textarea {
            resize: vertical;
            min-height: 110px;
          }

          .contact-form-field input:focus,
          .contact-form-field select:focus,
          .contact-form-field textarea:focus {
            outline: none;
            border-color: #139EA2;
            box-shadow: 0 0 0 3px rgba(19, 158, 162, 0.15);
          }

          .contact-form-submit {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 12px;
            background: #139EA2;
            color: #FFFFFF;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
            font-family: inherit;
            margin-top: 6px;
          }

          .contact-form-submit:hover {
            background: #0D7A7D;
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(19, 158, 162, 0.3);
          }

          .contact-form-success {
            text-align: center;
            padding: 50px 20px;
          }

          .contact-form-success :global(svg) {
            font-size: 48px;
            color: #10B981;
            margin-bottom: 16px;
          }

          .contact-form-success h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            margin: 0 0 8px 0;
          }

          .contact-form-success p {
            font-size: 0.9rem;
            color: var(--sp-text-secondary);
            margin: 0;
          }

          /* ===== CTA ===== */
          .contact-cta {
            position: relative;
            padding: 64px 32px;
            overflow: hidden;
          }

          .contact-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%);
          }

          .contact-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .contact-cta-title {
            font-size: clamp(1.4rem, 3vw, 2rem);
            font-weight: 800;
            color: #FFFFFF;
            margin: 0 0 10px 0;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .contact-cta-text {
            font-size: 0.95rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            margin: 0 0 26px 0;
          }

          .contact-cta-actions {
            display: flex;
            gap: 14px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .contact-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 700;
            transition: all 0.3s ease;
          }

          .contact-cta-btn.primary {
            background: #E6A64D;
            color: #1A1A2E;
            box-shadow: 0 8px 24px rgba(230, 166, 77, 0.3);
          }

          .contact-cta-btn.primary:hover {
            background: #D4953A;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.4);
          }

          .contact-cta-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(10px);
          }

          .contact-cta-btn.secondary:hover {
            background: #FFFFFF;
            color: #139EA2;
            transform: translateY(-3px);
          }

          .contact-cta-btn :global(svg) {
            transition: transform 0.3s ease;
          }

          .contact-cta-btn.primary:hover :global(svg) {
            transform: translateX(4px);
          }

          /* ===== RESPONSIVE ===== */

          /* Tablet , form stacks, methods 2-col */
          @media (max-width: 992px) {
            .contact-methods-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 14px;
            }
            .contact-form-grid {
              grid-template-columns: 1fr;
              gap: 28px;
            }
            .contact-form-wrapper {
              position: static;
            }
          }

          /* Mobile */
          @media (max-width: 640px) {
            .contact-hero {
              padding: 44px 20px 44px;
            }

            .contact-hero-label {
              font-size: 10px;
              padding: 6px 14px;
              margin-bottom: 14px;
            }

            .contact-hero-title {
              font-size: 1.6rem;
              margin-bottom: 12px;
            }

            .contact-hero-subtitle {
              font-size: 0.85rem;
              line-height: 1.55;
            }

            /* ============================================================
               CONTACT METHODS , 2×2 GRID ON MOBILE
               ============================================================ */
            .contact-methods-section {
              padding: 0 16px;
              margin-top: -24px;
              margin-bottom: 32px;
            }

            .contact-methods-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }

            .contact-method-card {
              padding: 14px 10px;
              border-radius: 12px;
            }

            .contact-method-icon {
              width: 38px;
              height: 38px;
              border-radius: 10px;
              font-size: 15px;
              margin-bottom: 8px;
            }

            .contact-method-title {
              font-size: 0.82rem;
              margin-bottom: 3px;
            }

            .contact-method-description {
              font-size: 0.68rem;
              margin-bottom: 4px;
              line-height: 1.35;
            }

            .contact-method-value {
              font-size: 0.7rem;
              line-height: 1.25;
            }

            /* ============================================================
               FORM SECTION , TIGHT
               ============================================================ */
            .contact-form-section {
              padding: 12px 16px 44px;
            }

            .contact-form-grid {
              gap: 20px;
            }

            .section-label {
              font-size: 10px;
              margin-bottom: 8px;
            }

            .section-title {
              font-size: 1.4rem;
              margin-bottom: 10px;
            }

            .contact-info-text {
              font-size: 0.85rem;
              margin-bottom: 20px;
            }

            .contact-info-blocks {
              gap: 12px;
              margin-bottom: 20px;
            }

            .contact-info-block-icon {
              width: 36px;
              height: 36px;
              font-size: 14px;
              border-radius: 10px;
            }

            .contact-info-block h4 {
              font-size: 0.82rem;
            }

            .contact-info-block p {
              font-size: 0.75rem;
            }

            .contact-departments {
              padding: 14px;
              border-radius: 12px;
              margin-bottom: 20px;
            }

            .contact-department {
              padding: 7px 8px;
              gap: 9px;
            }

            .contact-department-icon {
              width: 30px;
              height: 30px;
              font-size: 12px;
            }

            .contact-department-title {
              font-size: 0.75rem;
            }

            .contact-department-email {
              font-size: 0.7rem;
            }

            .contact-social-btn {
              width: 34px;
              height: 34px;
              font-size: 13px;
            }

            /* Form */
            .contact-form-wrapper {
              padding: 20px 16px;
              border-radius: 16px;
            }

            .contact-form-row {
              grid-template-columns: 1fr;
              gap: 0;
              margin-bottom: 0;
            }

            .contact-form-field {
              margin-bottom: 14px;
            }

            .contact-form-field label {
              font-size: 0.72rem;
            }

            .contact-form-field input,
            .contact-form-field select,
            .contact-form-field textarea {
              padding: 10px 12px;
              font-size: 0.85rem;
            }

            .contact-form-submit {
              padding: 13px;
              font-size: 0.85rem;
            }

            /* CTA */
            .contact-cta {
              padding: 48px 20px;
            }

            .contact-cta-title {
              font-size: 1.3rem;
            }

            .contact-cta-text {
              font-size: 0.85rem;
            }

            .contact-cta-actions {
              flex-direction: column;
            }

            .contact-cta-btn {
              justify-content: center;
              padding: 12px 20px;
              font-size: 0.85rem;
            }
          }

          /* Extra small phones */
          @media (max-width: 380px) {
            .contact-method-card {
              padding: 12px 8px;
            }

            .contact-method-icon {
              width: 34px;
              height: 34px;
              font-size: 14px;
            }

            .contact-method-title {
              font-size: 0.75rem;
            }

            .contact-method-description {
              font-size: 0.62rem;
            }

            .contact-method-value {
              font-size: 0.65rem;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}