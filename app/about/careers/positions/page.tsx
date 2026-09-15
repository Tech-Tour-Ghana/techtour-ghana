"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BackToTop from '@/components/BackToTop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faChevronRight,
  faArrowRight,
  faBriefcase,
  faLocationDot,
  faClock,
  faEnvelope,
  faCheckCircle,
  faBuilding,
  faUsers,
  faLayerGroup,
  faSearch,
  faTimes,
  faFilter,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceTheme } from '@/components/ServiceTheme';

/* ============================================================
   TYPES + DATA
   ============================================================ */

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  level: string;
  description: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  tags: string[];
}

const jobs: Job[] = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Accra, Ghana (Hybrid)',
    type: 'Full-time',
    level: 'Senior',
    description:
      'Build next-generation travel experiences using React, Next.js, and modern web technologies.',
    about:
      "We're looking for a Senior Frontend Engineer to lead the development of customer-facing experiences across TechTour Ghana's platform.",
    responsibilities: [
      'Lead development of customer-facing web applications using React and Next.js',
      'Mentor junior engineers and shape frontend best practices',
      'Collaborate with designers to build pixel-perfect, accessible interfaces',
      'Optimize performance and Core Web Vitals across all pages',
      'Contribute to our design system and component library',
    ],
    requirements: [
      '5+ years of professional frontend development experience',
      'Expert-level TypeScript and React proficiency',
      'Production experience with Next.js (App Router preferred)',
      'Strong understanding of web performance and accessibility',
      'Experience leading technical projects or small teams',
    ],
    niceToHave: [
      'Experience in travel, e-commerce, or marketplace products',
      'Familiarity with Tailwind CSS, styled-components, or CSS-in-JS',
      'Contributions to open-source projects',
    ],
    benefits: [
      'Competitive salary in GHS',
      'Hybrid work flexibility',
      'Learning budget for courses and conferences',
      'Travel perks across Ghana',
      'Health insurance for you and family',
    ],
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
    about:
      'As an Experience Designer, you will design journeys — both digital and physical — that connect travelers with authentic Ghanaian culture.',
    responsibilities: [
      'Design end-to-end traveler experiences, from inspiration to return',
      'Conduct user research and usability testing with real travelers',
      'Create wireframes, prototypes, and high-fidelity mockups in Figma',
      'Partner with operations to align digital and physical experiences',
      'Iterate on designs based on traveler feedback and analytics',
    ],
    requirements: [
      '3+ years of UX or product design experience',
      'Strong portfolio demonstrating end-to-end design process',
      'Proficiency in Figma and modern design tooling',
      'Excellent communication and stakeholder management skills',
      'Experience working cross-functionally with engineering',
    ],
    niceToHave: [
      'Experience designing for travel or hospitality',
      'Background in service design or systems thinking',
      'Understanding of accessibility standards (WCAG)',
    ],
    benefits: [
      'Competitive salary in GHS',
      'Hybrid work flexibility',
      'Learning budget for design courses and conferences',
      'Travel perks across Ghana',
      'Health insurance for you and family',
    ],
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
    about: 'Our partnership network is the backbone of TechTour Ghana.',
    responsibilities: [
      'Identify and onboard new partners across Ghana',
      'Maintain and deepen existing partner relationships',
      'Negotiate commission structures and partnership terms',
      'Collaborate with marketing to promote partner offerings',
      'Track partner performance and drive growth metrics',
    ],
    requirements: [
      '3+ years in B2B partnerships, sales, or business development',
      'Excellent relationship-building and communication skills',
      'Comfortable traveling within Ghana',
      'Strong negotiation and presentation abilities',
      'Data-driven approach to partnership management',
    ],
    niceToHave: [
      'Background in hospitality, travel, or tourism',
      'Existing network within the Ghanaian tourism industry',
      'Fluency in Twi, Ga, Ewe, or another local language',
    ],
    benefits: [
      'Competitive salary in GHS + commission',
      'On-site work with travel across regions',
      'Learning budget for industry conferences',
      'Travel perks across Ghana',
      'Health insurance for you and family',
    ],
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
    about:
      'As Marketing Specialist, you will craft campaigns that tell the story of TechTour Ghana to the world.',
    responsibilities: [
      'Plan and execute multi-channel marketing campaigns',
      'Own content strategy and social media presence',
      'Run A/B tests to optimize conversion and acquisition',
      'Collaborate with design on campaign assets',
      'Report on campaign performance and ROI',
    ],
    requirements: [
      '3+ years of digital marketing experience',
      'Strong writing and storytelling ability',
      'Experience with paid social, SEO, and email marketing',
      'Comfortable with analytics tools (GA4, Mixpanel, etc.)',
      'Self-starter comfortable in a remote-first setup',
    ],
    niceToHave: [
      'Experience marketing travel or cultural products',
      'Video editing skills',
      'Experience with influencer partnerships',
    ],
    benefits: [
      'Competitive salary in GHS',
      'Fully remote within Ghana',
      'Learning budget for marketing courses',
      'Travel perks across Ghana',
      'Health insurance for you and family',
    ],
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
    about: "You'll be the voice of TechTour Ghana to our travelers.",
    responsibilities: [
      'Respond to traveler inquiries via email, chat, and phone',
      'Coordinate with operations and guides on active bookings',
      'Handle escalations with calm professionalism',
      'Collect and act on traveler feedback',
      'Help build our knowledge base and FAQs',
    ],
    requirements: [
      'Excellent written and verbal communication',
      'Strong empathy and problem-solving mindset',
      'Comfortable with CRM and support tools',
      'Ability to work occasional evenings/weekends',
      'Genuine passion for travel and Ghanaian culture',
    ],
    niceToHave: [
      'Experience in hospitality or customer support',
      'Fluency in Twi, Ga, Ewe, or another local language',
      'Prior experience in a startup environment',
    ],
    benefits: [
      'Competitive entry-level salary in GHS',
      'Hybrid work flexibility',
      'Learning budget for career development',
      'Travel perks across Ghana',
      'Health insurance for you and family',
    ],
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
    about:
      "As our Data Analyst, you'll be the connective tissue between raw numbers and business strategy.",
    responsibilities: [
      'Build dashboards and reports for key stakeholders',
      'Analyze funnel, retention, and acquisition metrics',
      'Partner with product on experimentation and A/B tests',
      'Maintain our analytics infrastructure and event tracking',
      'Present insights to leadership regularly',
    ],
    requirements: [
      '3+ years as a data analyst or similar role',
      'Expert SQL skills',
      'Experience with Python or R for analysis',
      'Proficiency with BI tools (Metabase, Looker, etc.)',
      'Strong communication and storytelling with data',
    ],
    niceToHave: [
      'Experience with dbt or modern data stacks',
      'Background in marketplace or travel analytics',
      'Knowledge of A/B testing methodology',
    ],
    benefits: [
      'Competitive salary in GHS',
      'Fully remote within Ghana',
      'Learning budget for data courses',
      'Travel perks across Ghana',
      'Health insurance for you and family',
    ],
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
    about:
      "We're looking for a talented video creator to bring Ghana's beauty to life through cinematic storytelling.",
    responsibilities: [
      'Plan, shoot, and edit video content for social and web',
      'Travel to destinations across Ghana for on-location shoots',
      'Collaborate with marketing on creative direction',
      'Manage post-production workflow and asset library',
      'Stay on top of platform trends and formats',
    ],
    requirements: [
      '3+ years of video production experience',
      'Strong portfolio of short-form and long-form content',
      'Expertise with Adobe Premiere, Final Cut, or DaVinci',
      'Comfortable traveling and shooting on location',
      'Ability to work independently and hit deadlines',
    ],
    niceToHave: [
      'Drone piloting skills and license',
      'Experience with color grading and sound design',
      'Background in travel content or documentary work',
    ],
    benefits: [
      'Competitive contract rate',
      'Hybrid work with on-location shoots',
      'Equipment budget for gear',
      'Travel perks across Ghana',
      'Flexible project-based schedule',
    ],
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
    about:
      "Our internship program is designed to give you real responsibility from day one.",
    responsibilities: [
      'Contribute to production code with mentorship',
      'Participate in code reviews and team rituals',
      'Build a real project you can showcase in your portfolio',
      'Learn modern web development practices',
      'Collaborate with designers and product managers',
    ],
    requirements: [
      'Currently enrolled in a computer science or related program',
      'Basic knowledge of HTML, CSS, and JavaScript',
      'Eagerness to learn and receive feedback',
      'Available for a 3-6 month internship',
      'Based in or willing to relocate to Accra',
    ],
    niceToHave: [
      'Personal projects or GitHub portfolio',
      'Familiarity with React or Node.js',
      'Interest in the travel or tourism industry',
    ],
    benefits: [
      'Monthly stipend in GHS',
      'On-site mentorship and training',
      'Learning budget for courses',
      'Free travel experiences',
      'Pathway to full-time role',
    ],
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
    about:
      "You'll be the operational backbone behind our on-the-ground experiences.",
    responsibilities: [
      'Coordinate daily tour logistics and guide schedules',
      'Manage vendor relationships and bookings',
      'Handle on-the-day problem-solving with calm professionalism',
      'Maintain operational documentation and safety protocols',
      'Gather post-tour feedback and drive improvements',
    ],
    requirements: [
      '3+ years in operations, logistics, or tour coordination',
      'Excellent organizational and communication skills',
      'Comfortable working in a fast-paced environment',
      'Willing to travel across Ghana',
      'Strong attention to detail',
    ],
    niceToHave: [
      'Experience in tourism or hospitality',
      'Existing network of guides or vendors',
      'Fluency in local languages of the Central Region',
    ],
    benefits: [
      'Competitive salary in GHS',
      'On-site work in Cape Coast',
      'Learning budget for tourism courses',
      'Travel perks across Ghana',
      'Health insurance for you and family',
    ],
    tags: ['Logistics', 'Tourism', 'Coordination'],
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
   HOOKS
   ============================================================ */

const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dim');
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

const useIsMobile = (breakpoint = 992) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
};

/* ============================================================
   FILTER DROPDOWN
   ============================================================ */

interface DropdownProps {
  label: string;
  icon: any;
  options: { value: string; label: string; color?: string }[];
  value: string;
  onChange: (value: string) => void;
}

function FilterDropdown({
  label,
  icon,
  options,
  value,
  onChange,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = useIsDarkMode();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isFiltered = value !== 'all';
  const isActive = isFiltered || open;

  const surface = isDark ? '#1A1A1A' : '#FFFFFF';
  const surfaceAlt = isDark ? '#0F0F0F' : '#FAFAFA';
  const border = isActive
    ? '#139EA2'
    : isDark
    ? 'rgba(230, 166, 77, 0.15)'
    : 'rgba(19, 158, 162, 0.12)';
  const textPrimary = isDark ? '#FFFFFF' : '#1A1A2E';
  const textMuted = isDark ? '#9CA3AF' : '#6B7280';
  const accent = '#139EA2';

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
        zIndex: open ? 9999 : 'auto',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          height: 48,
          padding: '0 12px',
          background: isActive
            ? isDark
              ? 'rgba(19,158,162,0.08)'
              : 'rgba(19,158,162,0.04)'
            : surface,
          border: `1.5px solid ${border}`,
          borderRadius: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            borderRadius: 8,
            background: isActive ? accent : 'rgba(19,158,162,0.12)',
            color: isActive ? '#FFFFFF' : accent,
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          <FontAwesomeIcon icon={icon} style={{ fontSize: 12 }} />
        </span>

        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            flex: 1,
            minWidth: 0,
            textAlign: 'left',
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.7px',
              textTransform: 'uppercase',
              color: isActive ? accent : textMuted,
              lineHeight: 1,
              transition: 'color 0.2s ease',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isActive ? accent : textPrimary,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s ease',
            }}
          >
            {selected?.label || 'All'}
          </span>
        </span>

        <FontAwesomeIcon
          icon={faChevronDown}
          style={{
            fontSize: 10,
            color: isActive ? accent : textMuted,
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease, color 0.2s ease',
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: surface,
            border: `1px solid ${
              isDark ? 'rgba(230, 166, 77, 0.2)' : 'rgba(19, 158, 162, 0.15)'
            }`,
            borderRadius: 14,
            boxShadow: isDark
              ? '0 24px 56px rgba(0,0,0,0.65)'
              : '0 24px 56px rgba(0,0,0,0.16)',
            padding: 8,
            zIndex: 9999,
            maxHeight: 340,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  background: isSelected
                    ? 'rgba(19,158,162,0.1)'
                    : 'transparent',
                  border: 'none',
                  borderRadius: 9,
                  color: isSelected ? accent : textPrimary,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = surfaceAlt;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 12,
                    height: 12,
                    flexShrink: 0,
                  }}
                >
                  {opt.color ? (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: opt.color,
                        display: 'block',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: `1.5px solid ${border}`,
                        display: 'block',
                      }}
                    />
                  )}
                </span>

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label}
                </span>

                {isSelected && (
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    style={{ fontSize: 14, color: accent, flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SHARED TOOLBAR
   ============================================================ */

interface ToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  activeDept: string;
  setActiveDept: (v: string) => void;
  activeType: string;
  setActiveType: (v: string) => void;
  departmentOptions: { value: string; label: string; color?: string }[];
  typeOptions: { value: string; label: string }[];
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
}

function Toolbar({
  searchQuery,
  setSearchQuery,
  activeDept,
  setActiveDept,
  activeType,
  setActiveType,
  departmentOptions,
  typeOptions,
  hasActiveFilters,
  clearAllFilters,
}: ToolbarProps) {
  return (
    <div className="pt-toolbar">
      <div className="pt-search-wrap">
        <FontAwesomeIcon icon={faSearch} className="pt-search-icon" />
        <input
          type="text"
          className="pt-search-input"
          placeholder="Search positions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="pt-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      <div className="pt-filter-item">
        <FilterDropdown
          label="Department"
          icon={faFilter}
          options={departmentOptions}
          value={activeDept}
          onChange={setActiveDept}
        />
      </div>

      <div className="pt-filter-item">
        <FilterDropdown
          label="Job Type"
          icon={faBriefcase}
          options={typeOptions}
          value={activeType}
          onChange={setActiveType}
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className="pt-clear-btn"
          onClick={clearAllFilters}
          aria-label="Clear all filters"
        >
          <FontAwesomeIcon icon={faTimes} />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}

/* ============================================================
   JOB LIST
   ============================================================ */

interface JobListProps {
  jobs: Job[];
  selectedJobId: number;
  onSelect: (id: number) => void;
  clearAllFilters: () => void;
}

function JobList({
  jobs,
  selectedJobId,
  onSelect,
  clearAllFilters,
}: JobListProps) {
  return (
    <>
      <div className="positions-list-header">
        <span className="positions-list-label">
          <FontAwesomeIcon icon={faLayerGroup} />
          {jobs.length} Position{jobs.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="positions-list-scroll">
        {jobs.length > 0 ? (
          jobs.map((job) => {
            const isActive = job.id === selectedJobId;
            const deptColor = departmentColors[job.department] || '#139EA2';

            return (
              <button
                key={job.id}
                type="button"
                className={`positions-list-item ${
                  isActive ? 'is-active' : ''
                }`}
                onClick={() => onSelect(job.id)}
              >
                <span
                  className="positions-list-item-bar"
                  style={{ background: deptColor }}
                />
                <div className="positions-list-item-body">
                  <div className="positions-list-item-head">
                    <span
                      className="positions-list-item-dept"
                      style={{
                        background: `${deptColor}22`,
                        color: deptColor,
                      }}
                    >
                      {job.department}
                    </span>
                  </div>
                  <span className="positions-list-item-title">
                    {job.title}
                  </span>
                  <span className="positions-list-item-meta">
                    <FontAwesomeIcon icon={faLocationDot} />
                    {job.location}
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="positions-list-item-arrow"
                />
              </button>
            );
          })
        ) : (
          <div className="positions-list-empty">
            <FontAwesomeIcon icon={faSearch} />
            <p>No roles match your filters.</p>
            <button
              type="button"
              className="positions-list-empty-btn"
              onClick={clearAllFilters}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   JOB DETAILS
   ============================================================ */

function JobDetails({ job }: { job: Job }) {
  const deptColor = departmentColors[job.department] || '#139EA2';

  return (
    <>
      <div className="positions-detail-header">
        <div className="positions-detail-badges">
          <span
            className="positions-detail-dept"
            style={{
              background: `${deptColor}22`,
              color: deptColor,
            }}
          >
            {job.department}
          </span>
          <span className="positions-detail-type">{job.type}</span>
        </div>

        <h2 className="positions-detail-title">{job.title}</h2>

        <div className="positions-detail-meta">
          <span>
            <FontAwesomeIcon icon={faLocationDot} />
            {job.location}
          </span>
          <span>
            <FontAwesomeIcon icon={faBriefcase} />
            {job.level}
          </span>
          <span>
            <FontAwesomeIcon icon={faClock} />
            {job.type}
          </span>
        </div>

        <div className="positions-detail-apply-row">
          <a
            href={`mailto:careers@techtourghana.com?subject=Application: ${encodeURIComponent(
              job.title
            )}`}
            className="positions-detail-apply-btn"
          >
            Apply for this Role
            <FontAwesomeIcon icon={faArrowRight} />
          </a>
        </div>
      </div>

      <div className="positions-detail-body">
        <div className="positions-detail-block">
          <h3 className="positions-detail-block-title">
            <span className="positions-detail-block-icon">
              <FontAwesomeIcon icon={faBuilding} />
            </span>
            About the Role
          </h3>
          <p className="positions-detail-text">{job.about}</p>
        </div>

        <div className="positions-detail-block">
          <h3 className="positions-detail-block-title">
            <span className="positions-detail-block-icon">
              <FontAwesomeIcon icon={faUsers} />
            </span>
            What You&apos;ll Do
          </h3>
          <ul className="positions-detail-list">
            {job.responsibilities.map((item, i) => (
              <li key={i}>
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="positions-detail-block">
          <h3 className="positions-detail-block-title">
            <span className="positions-detail-block-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </span>
            What We&apos;re Looking For
          </h3>
          <ul className="positions-detail-list">
            {job.requirements.map((item, i) => (
              <li key={i}>
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {job.niceToHave.length > 0 && (
          <div className="positions-detail-block">
            <h3 className="positions-detail-block-title">
              <span className="positions-detail-block-icon positions-detail-block-icon--gold">
                <FontAwesomeIcon icon={faCheckCircle} />
              </span>
              Nice to Have
            </h3>
            <ul className="positions-detail-list positions-detail-list--gold">
              {job.niceToHave.map((item, i) => (
                <li key={i}>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="positions-detail-block">
          <h3 className="positions-detail-block-title">
            <span className="positions-detail-block-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </span>
            What We Offer
          </h3>
          <div className="positions-detail-benefits">
            {job.benefits.map((item, i) => (
              <span key={i} className="positions-detail-benefit">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="positions-detail-block">
          <h3 className="positions-detail-block-title">
            <span className="positions-detail-block-icon">
              <FontAwesomeIcon icon={faBriefcase} />
            </span>
            Skills
          </h3>
          <div className="positions-detail-tags">
            {job.tags.map((tag, i) => (
              <span key={i} className="positions-detail-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="positions-detail-footer">
        <a
          href={`mailto:careers@techtourghana.com?subject=Application: ${encodeURIComponent(
            job.title
          )}`}
          className="positions-detail-apply-btn"
        >
          <FontAwesomeIcon icon={faEnvelope} />
          Apply for {job.title}
          <FontAwesomeIcon icon={faArrowRight} />
        </a>
      </div>
    </>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function PositionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialId = Number(searchParams.get('job')) || jobs[0]!.id;
  const [selectedJobId, setSelectedJobId] = useState<number>(initialId);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDept, setActiveDept] = useState<string>('all');
  const [activeType, setActiveType] = useState<string>('all');

  const isMobile = useIsMobile();
  const detailPanelRef = useRef<HTMLElement>(null);
  const shouldScrollRef = useRef(false);

  const departmentOptions = useMemo(
    () => [
      { value: 'all', label: 'All Departments' },
      ...Array.from(new Set(jobs.map((j) => j.department))).map((dept) => ({
        value: dept,
        label: dept,
        color: departmentColors[dept] || '#139EA2',
      })),
    ],
    []
  );

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'All Types' },
      ...Array.from(new Set(jobs.map((j) => j.type))).map((type) => ({
        value: type,
        label: type,
      })),
    ],
    []
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          job.title.toLowerCase().includes(q) ||
          job.department.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.tags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (activeDept !== 'all' && job.department !== activeDept) return false;
      if (activeType !== 'all' && job.type !== activeType) return false;
      return true;
    });
  }, [searchQuery, activeDept, activeType]);

  const selectedJob =
    jobs.find((j) => j.id === selectedJobId) || filteredJobs[0] || jobs[0]!;

  useEffect(() => {
    if (
      filteredJobs.length > 0 &&
      !filteredJobs.find((j) => j.id === selectedJobId)
    ) {
      setSelectedJobId(filteredJobs[0]!.id);
    }
  }, [filteredJobs, selectedJobId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('job', String(selectedJobId));
    window.history.replaceState({}, '', url.toString());
  }, [selectedJobId]);

  useEffect(() => {
    if (!isMobile) return;
    if (!shouldScrollRef.current) return;
    if (!detailPanelRef.current) return;

    shouldScrollRef.current = false;

    requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [selectedJobId, isMobile]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveDept('all');
    setActiveType('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || activeDept !== 'all' || activeType !== 'all';

  const handleJobSelect = useCallback((jobId: number) => {
    shouldScrollRef.current = true;
    setSelectedJobId(jobId);
  }, []);

  return (
    <ServiceTheme>
      <main className="positions-page">
        {/* ============================================================
            HERO
            ============================================================ */}
        <section className="positions-hero">
          <div className="positions-hero-bg" />
          <div className="positions-hero-container">
            <nav className="positions-breadcrumb" aria-label="Breadcrumb">
              <button
                type="button"
                className="positions-breadcrumb-back"
                onClick={() => router.back()}
                aria-label="Go back"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>

              <div className="positions-breadcrumb-trail">
                <Link href="/" className="positions-breadcrumb-btn">
                  Home
                </Link>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="positions-breadcrumb-sep"
                />
                <Link href="/about/careers" className="positions-breadcrumb-btn">
                  Careers
                </Link>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="positions-breadcrumb-sep"
                />
                <span className="positions-breadcrumb-btn current">
                  Open Positions
                </span>
              </div>
            </nav>

            <span className="positions-hero-label">Open Positions</span>
            <h1 className="positions-hero-title">
              Find Your <span className="positions-hero-accent">Next Chapter</span>
            </h1>
            <p className="positions-hero-subtitle">
              {jobs.length} open roles across {departmentOptions.length - 1}{' '}
              departments. Browse, click, and discover the one that fits you.
            </p>
          </div>
        </section>

        {/* ============================================================
            SPLIT LAYOUT
            ============================================================ */}
        <section className="positions-split-section">
          <div className="positions-split-container">
            {isMobile ? (
              <>
                {/* MOBILE: Filters (1) → List (2) → Details (3) */}

                <div className="mobile-filters-first">
                  <Toolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeDept={activeDept}
                    setActiveDept={setActiveDept}
                    activeType={activeType}
                    setActiveType={setActiveType}
                    departmentOptions={departmentOptions}
                    typeOptions={typeOptions}
                    hasActiveFilters={hasActiveFilters}
                    clearAllFilters={clearAllFilters}
                  />
                </div>

                <aside className="positions-list-sidebar positions-list-sidebar--mobile">
                  <JobList
                    jobs={filteredJobs}
                    selectedJobId={selectedJobId}
                    onSelect={handleJobSelect}
                    clearAllFilters={clearAllFilters}
                  />
                </aside>

                <article
                  ref={detailPanelRef}
                  className="positions-detail-panel positions-detail-panel--mobile"
                >
                  <JobDetails job={selectedJob} />
                </article>
              </>
            ) : (
              <>
                {/* DESKTOP: Sidebar (list) + Main (toolbar + details) */}

                <aside className="positions-list-sidebar">
                  <JobList
                    jobs={filteredJobs}
                    selectedJobId={selectedJobId}
                    onSelect={setSelectedJobId}
                    clearAllFilters={clearAllFilters}
                  />
                </aside>

                <article className="positions-detail-panel">
                  <Toolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeDept={activeDept}
                    setActiveDept={setActiveDept}
                    activeType={activeType}
                    setActiveType={setActiveType}
                    departmentOptions={departmentOptions}
                    typeOptions={typeOptions}
                    hasActiveFilters={hasActiveFilters}
                    clearAllFilters={clearAllFilters}
                  />
                  <JobDetails job={selectedJob} />
                </article>
              </>
            )}
          </div>
        </section>

        {/* ============================================================
            CTA
            ============================================================ */}
        <section className="positions-cta">
          <div className="positions-cta-bg" />
          <div className="positions-cta-container">
            <h2 className="positions-cta-title">
              Don&apos;t See Your Perfect Role?
            </h2>
            <p className="positions-cta-text">
              We&apos;re always excited to meet talented people who share our
              vision. Send your CV and a note about what you&apos;d love to work
              on.
            </p>
            <div className="positions-cta-actions">
              <a
                href="mailto:careers@techtourghana.com?subject=Spontaneous Application"
                className="positions-cta-btn positions-cta-btn--primary"
              >
                Send Spontaneous Application
                <FontAwesomeIcon icon={faArrowRight} />
              </a>
              <Link
                href="/about/careers"
                className="positions-cta-btn positions-cta-btn--secondary"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to Careers
              </Link>
            </div>
          </div>
        </section>

        <BackToTop accentColor="teal" />

        {/* ============================================================
            GLOBAL STYLES
            ============================================================ */}
        <style jsx global>{`
          /* ============================================================
             PAGE SHELL
             ============================================================ */
          .positions-page {
            background: var(--sp-bg-primary);
            min-height: 100vh;
            color: var(--sp-text-primary);
            transition: background 0.4s ease, color 0.4s ease;
          }

          /* ============================================================
             HERO
             ============================================================ */
          .positions-hero {
            position: relative;
            overflow: hidden;
            padding: 60px 32px 56px;
            background: linear-gradient(135deg, #139ea2 0%, #0d7a7d 100%);
          }

          .positions-hero-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 20% 30%,
                rgba(230, 166, 77, 0.25) 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 80% 70%,
                rgba(255, 255, 255, 0.15) 0%,
                transparent 45%
              );
          }

          .positions-hero-container {
            position: relative;
            z-index: 2;
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .positions-breadcrumb {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            align-self: flex-start;
          }

          .positions-breadcrumb-back {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            cursor: pointer;
            transition: all 0.25s ease;
            font-size: 14px;
            flex-shrink: 0;
            backdrop-filter: blur(10px);
          }

          .positions-breadcrumb-back:hover {
            background: #ffffff;
            border-color: #ffffff;
            color: #139ea2;
            transform: translateX(-3px);
          }

          .positions-breadcrumb-trail {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .positions-breadcrumb-btn {
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

          .positions-breadcrumb-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.6);
            color: #ffffff;
          }

          .positions-breadcrumb-btn.current {
            background: #ffffff;
            border-color: #ffffff;
            color: #139ea2;
            font-weight: 700;
            cursor: default;
          }

          .positions-breadcrumb-sep {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            flex-shrink: 0;
          }

          .positions-hero-label {
            display: inline-block;
            padding: 7px 18px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 30px;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            align-self: flex-start;
          }

          .positions-hero-title {
            font-size: clamp(1.8rem, 4vw, 2.8rem);
            font-weight: 800;
            color: #ffffff;
            margin: 0;
            line-height: 1.15;
            letter-spacing: -0.02em;
          }

          .positions-hero-accent {
            color: #e6a64d;
          }

          .positions-hero-subtitle {
            font-size: clamp(0.9rem, 1.3vw, 1.05rem);
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            margin: 0;
            max-width: 720px;
          }

          /* ============================================================
             SPLIT LAYOUT
             ============================================================ */
          .positions-split-section {
            padding: 40px 32px 80px;
          }

          .positions-split-container {
            max-width: 1280px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 380px 1fr;
            gap: 28px;
            align-items: start;
          }

          /* ============================================================
             LEFT SIDEBAR
             ============================================================ */
          .positions-list-sidebar {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            overflow: hidden;
            position: sticky;
            top: 100px;
            max-height: calc(100vh - 130px);
            display: flex;
            flex-direction: column;
            box-shadow: var(--sp-shadow-md);
            z-index: 10;
          }

          .positions-list-header {
            padding: 18px 20px;
            border-bottom: 1px solid var(--sp-border);
            background: var(--sp-bg-secondary);
            flex-shrink: 0;
          }

          .positions-list-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--sp-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .positions-list-label svg {
            color: #139ea2;
            font-size: 12px;
          }

          .positions-list-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
            scrollbar-width: thin;
          }

          .positions-list-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .positions-list-scroll::-webkit-scrollbar-thumb {
            background: var(--sp-border);
            border-radius: 3px;
          }

          .positions-list-item {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 14px 14px 14px 18px;
            border: 1px solid transparent;
            background: transparent;
            border-radius: 12px;
            cursor: pointer;
            text-align: left;
            font-family: inherit;
            transition: all 0.2s ease;
            margin-bottom: 4px;
            overflow: hidden;
          }

          .positions-list-item-bar {
            position: absolute;
            left: 0;
            top: 8px;
            bottom: 8px;
            width: 3px;
            border-radius: 0 3px 3px 0;
            transition: width 0.2s ease;
          }

          .positions-list-item:hover {
            background: var(--sp-bg-secondary);
          }

          .positions-list-item.is-active {
            background: rgba(19, 158, 162, 0.08);
            border-color: rgba(19, 158, 162, 0.3);
          }

          .positions-list-item.is-active .positions-list-item-bar {
            width: 4px;
          }

          .positions-list-item-body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .positions-list-item-head {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .positions-list-item-dept {
            display: inline-flex;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            line-height: 1;
          }

          .positions-list-item-title {
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--sp-text-primary);
            line-height: 1.3;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .positions-list-item.is-active .positions-list-item-title {
            color: #139ea2;
          }

          .positions-list-item-meta {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.7rem;
            color: var(--sp-text-muted);
          }

          .positions-list-item-meta svg {
            font-size: 9px;
          }

          .positions-list-item-arrow {
            font-size: 10px;
            color: var(--sp-text-muted);
            flex-shrink: 0;
            opacity: 0;
            transition: all 0.2s ease;
          }

          .positions-list-item.is-active .positions-list-item-arrow,
          .positions-list-item:hover .positions-list-item-arrow {
            opacity: 1;
            color: #139ea2;
          }

          .positions-list-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--sp-text-muted);
          }

          .positions-list-empty svg {
            font-size: 32px;
            margin-bottom: 12px;
            opacity: 0.4;
          }

          .positions-list-empty p {
            font-size: 0.85rem;
            margin: 0 0 16px 0;
          }

          .positions-list-empty-btn {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            border-radius: 20px;
            background: #139ea2;
            border: none;
            color: #ffffff;
            font-size: 0.78rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s ease;
          }

          .positions-list-empty-btn:hover {
            background: #0d7a7d;
            transform: translateY(-1px);
          }

          /* ============================================================
             RIGHT PANEL
             ============================================================ */
          .positions-detail-panel {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            box-shadow: var(--sp-shadow-md);
            position: relative;
          }

          /* ============================================================
             TOOLBAR , dropdowns must float above the list
             ============================================================ */
          .pt-toolbar {
            padding: 16px 20px;
            background: var(--sp-bg-secondary, #FAFAFA);
            border-bottom: 1px solid var(--sp-border, rgba(19, 158, 162, 0.12));
            border-radius: 20px 20px 0 0;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: nowrap;
            position: relative;
            z-index: 50;
            overflow: visible;
          }
          [data-theme='dim'] .pt-toolbar {
            background: #0f0f0f;
            border-color: rgba(230, 166, 77, 0.15);
          }

          .pt-search-wrap {
            position: relative;
            flex: 1 1 auto;
            min-width: 180px;
            display: flex;
            align-items: center;
          }
          .pt-search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--sp-text-muted, #9ca3af);
            font-size: 13px;
            pointer-events: none;
            transition: color 0.2s ease;
          }
          .pt-search-input {
            width: 100%;
            padding: 0 36px 0 40px;
            height: 48px;
            border-radius: 12px;
            background: var(--sp-bg-card, #ffffff);
            border: 1.5px solid var(--sp-border, rgba(19, 158, 162, 0.12));
            color: var(--sp-text-primary, #1a1a2e);
            font-family: inherit;
            font-size: 0.87rem;
            font-weight: 500;
            transition: all 0.2s ease;
            outline: none;
            line-height: 1;
          }
          [data-theme='dim'] .pt-search-input {
            background: #1a1a1a;
            border-color: rgba(230, 166, 77, 0.15);
            color: #ffffff;
          }
          .pt-search-input::placeholder {
            color: var(--sp-text-muted, #9ca3af);
            font-weight: 400;
          }
          .pt-search-input:hover {
            border-color: rgba(19, 158, 162, 0.25);
          }
          [data-theme='dim'] .pt-search-input:hover {
            border-color: rgba(230, 166, 77, 0.3);
          }
          .pt-search-input:focus {
            border-color: #139ea2;
            box-shadow: 0 0 0 3px rgba(19, 158, 162, 0.15);
          }
          .pt-search-wrap:focus-within .pt-search-icon {
            color: #139ea2;
          }
          .pt-search-clear {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: none;
            background: rgba(0, 0, 0, 0.06);
            color: var(--sp-text-secondary, #4a4a4a);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            transition: background 0.2s ease;
          }
          .pt-search-clear:hover {
            background: rgba(0, 0, 0, 0.12);
          }
          [data-theme='dim'] .pt-search-clear {
            background: rgba(255, 255, 255, 0.1);
            color: #e5e7eb;
          }

          .pt-filter-item {
            flex: 0 0 auto;
            width: 200px;
          }

          .pt-clear-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 0 14px;
            height: 48px;
            border-radius: 12px;
            background: transparent;
            border: 1.5px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            font-family: inherit;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            line-height: 1;
            flex-shrink: 0;
          }
          .pt-clear-btn:hover {
            background: rgba(239, 68, 68, 0.08);
            border-color: #ef4444;
          }
          .pt-clear-btn svg {
            font-size: 10px;
          }

          /* ============================================================
             MOBILE FILTERS WRAPPER , must NOT clip dropdowns
             ============================================================ */
          .mobile-filters-first {
            background: var(--sp-bg-card);
            border: 1px solid var(--sp-border);
            border-radius: 20px;
            overflow: visible;
            box-shadow: var(--sp-shadow-md);
            position: relative;
            z-index: 100;
          }
          .mobile-filters-first .pt-toolbar {
            border-radius: 20px;
            border-bottom: none;
          }

          /* ============================================================
             DETAIL HEADER
             ============================================================ */
          .positions-detail-header {
            padding: 28px 32px 24px;
            border-bottom: 1px solid var(--sp-border);
          }

          .positions-detail-badges {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
          }

          .positions-detail-dept {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .positions-detail-type {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            background: rgba(19, 158, 162, 0.14);
            color: #139ea2;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          [data-theme='dim'] .positions-detail-type {
            background: rgba(19, 158, 162, 0.24);
            color: #5eead4;
          }

          .positions-detail-title {
            font-size: clamp(1.4rem, 2.5vw, 1.9rem);
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .positions-detail-meta {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            margin-bottom: 24px;
          }

          .positions-detail-meta span {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: var(--sp-text-secondary);
            font-weight: 500;
          }

          .positions-detail-meta svg {
            font-size: 12px;
            color: #139ea2;
          }

          .positions-detail-apply-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }

          .positions-detail-apply-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: #139ea2;
            color: #ffffff;
            text-decoration: none;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: 0 6px 18px rgba(19, 158, 162, 0.25);
          }

          .positions-detail-apply-btn:hover {
            background: #0d7a7d;
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(19, 158, 162, 0.35);
          }

          .positions-detail-apply-btn svg {
            font-size: 12px;
            transition: transform 0.25s ease;
          }

          .positions-detail-apply-btn:hover svg:last-child {
            transform: translateX(3px);
          }

          /* ============================================================
             BODY
             ============================================================ */
          .positions-detail-body {
            padding: 32px;
            display: flex;
            flex-direction: column;
            gap: 28px;
          }

          .positions-detail-block {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .positions-detail-block-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1rem;
            font-weight: 800;
            color: var(--sp-text-primary);
            margin: 0;
            letter-spacing: -0.01em;
          }

          .positions-detail-block-icon {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            background: rgba(19, 158, 162, 0.14);
            color: #139ea2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            flex-shrink: 0;
          }

          .positions-detail-block-icon--gold {
            background: rgba(230, 166, 77, 0.16);
            color: #b87418;
          }

          [data-theme='dim'] .positions-detail-block-icon--gold {
            background: rgba(230, 166, 77, 0.24);
            color: #fcd34d;
          }

          .positions-detail-text {
            font-size: 0.92rem;
            color: var(--sp-text-secondary);
            line-height: 1.75;
            margin: 0;
          }

          .positions-detail-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .positions-detail-list li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.9rem;
            color: var(--sp-text-secondary);
            line-height: 1.6;
          }

          .positions-detail-list li svg {
            color: #10b981;
            font-size: 14px;
            flex-shrink: 0;
            margin-top: 3px;
          }

          .positions-detail-list--gold li svg {
            color: #e6a64d;
          }

          .positions-detail-benefits {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .positions-detail-benefit {
            padding: 8px 14px;
            background: rgba(19, 158, 162, 0.08);
            border: 1px solid rgba(19, 158, 162, 0.18);
            border-radius: 20px;
            color: var(--sp-text-primary);
            font-size: 0.78rem;
            font-weight: 600;
          }

          [data-theme='dim'] .positions-detail-benefit {
            background: rgba(19, 158, 162, 0.14);
            border-color: rgba(19, 158, 162, 0.3);
            color: #ffffff;
          }

          .positions-detail-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .positions-detail-tag {
            padding: 6px 14px;
            background: var(--sp-tag-bg);
            border: 1px solid var(--sp-tag-border);
            border-radius: 12px;
            color: var(--sp-tag-text);
            font-size: 0.75rem;
            font-weight: 600;
          }

          [data-theme='dim'] .positions-detail-tag {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.1);
            color: #d1d5db;
          }

          .positions-detail-footer {
            padding: 20px 32px;
            border-top: 1px solid var(--sp-border);
            background: var(--sp-bg-secondary);
            border-radius: 0 0 20px 20px;
          }

          .positions-detail-footer .positions-detail-apply-btn {
            width: 100%;
            justify-content: center;
          }

          /* ============================================================
             CTA
             ============================================================ */
          .positions-cta {
            position: relative;
            padding: 72px 32px;
            overflow: hidden;
          }

          .positions-cta-bg {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #139ea2 0%, #0d7a7d 100%);
          }

          .positions-cta-container {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
          }

          .positions-cta-title {
            font-size: clamp(1.4rem, 3vw, 2rem);
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 12px 0;
            line-height: 1.25;
            letter-spacing: -0.02em;
          }

          .positions-cta-text {
            font-size: 0.95rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin: 0 0 28px 0;
          }

          .positions-cta-actions {
            display: flex;
            gap: 14px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .positions-cta-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 13px 26px;
            text-decoration: none;
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 700;
            transition: all 0.3s ease;
            border: 1.5px solid transparent;
            white-space: nowrap;
            line-height: 1;
          }

          .positions-cta-btn--primary {
            background: #e6a64d;
            color: #1a1a2e;
            border-color: #e6a64d;
            box-shadow: 0 8px 24px rgba(230, 166, 77, 0.3);
          }

          .positions-cta-btn--primary:hover {
            background: #d4953a;
            border-color: #d4953a;
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(230, 166, 77, 0.42);
          }

          .positions-cta-btn--secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(10px);
          }

          .positions-cta-btn--secondary:hover {
            background: #ffffff;
            color: #139ea2;
            transform: translateY(-3px);
          }

          .positions-cta-btn svg {
            font-size: 12px;
            transition: transform 0.3s ease;
          }

          .positions-cta-btn--primary:hover svg:last-child {
            transform: translateX(4px);
          }

          /* ============================================================
             RESPONSIVE , TABLET
             ============================================================ */
          @media (max-width: 992px) {
            .positions-split-container {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            /* Order: 1 = filters, 2 = list, 3 = details */
            .mobile-filters-first {
              order: 1;
              width: 100%;
            }

            .positions-list-sidebar--mobile {
              order: 2;
              width: 100%;
              position: relative;
              max-height: none;
              overflow: hidden;
              z-index: 5;
            }

            .positions-list-sidebar--mobile .positions-list-scroll {
              max-height: 520px;
              overflow-y: auto;
            }

            .positions-detail-panel--mobile {
              order: 3;
              width: 100%;
              scroll-margin-top: 90px;
              position: relative;
              z-index: 1;
            }
          }

          /* Shrink dropdowns on tablet (still one row) */
          @media (max-width: 992px) and (min-width: 721px) {
            .pt-filter-item {
              width: 170px;
            }
          }

          /* ============================================================
             RESPONSIVE , MOBILE
             ============================================================ */
          @media (max-width: 720px) {
            .pt-toolbar {
              flex-wrap: wrap;
              padding: 14px;
              gap: 10px;
              border-radius: 20px;
            }
            .pt-search-wrap {
              flex: 1 1 100%;
              min-width: 0;
            }
            .pt-filter-item {
              flex: 1 1 calc(50% - 5px);
              width: auto;
              min-width: 0;
            }
            .pt-clear-btn {
              flex: 1 1 100%;
              height: 44px;
            }
          }

          @media (max-width: 640px) {
            .positions-hero {
              padding: 40px 20px 40px;
            }

            .positions-breadcrumb {
              gap: 8px;
            }

            .positions-breadcrumb-back {
              width: 34px;
              height: 34px;
              font-size: 12px;
            }

            .positions-breadcrumb-btn {
              padding: 6px 12px;
              font-size: 0.72rem;
              border-radius: 8px;
            }

            .positions-breadcrumb-sep {
              font-size: 8px;
            }

            .positions-hero-label {
              font-size: 10px;
              padding: 6px 14px;
            }

            .positions-hero-title {
              font-size: 1.6rem;
            }

            .positions-hero-subtitle {
              font-size: 0.85rem;
            }

            .positions-split-section {
              padding: 24px 16px 60px;
            }

            .positions-detail-header {
              padding: 24px 20px 20px;
            }

            .positions-detail-title {
              font-size: 1.2rem;
            }

            .positions-detail-meta {
              gap: 12px;
              margin-bottom: 20px;
            }

            .positions-detail-meta span {
              font-size: 0.78rem;
            }

            .positions-detail-body {
              padding: 24px 20px;
              gap: 22px;
            }

            .positions-detail-block-title {
              font-size: 0.92rem;
            }

            .positions-detail-text {
              font-size: 0.85rem;
            }

            .positions-detail-list li {
              font-size: 0.82rem;
            }

            .positions-detail-apply-btn {
              padding: 12px 22px;
              font-size: 0.82rem;
              width: 100%;
              justify-content: center;
            }

            .positions-detail-footer {
              padding: 16px 20px;
            }

            .positions-cta {
              padding: 48px 20px;
            }

            .positions-cta-title {
              font-size: 1.3rem;
            }

            .positions-cta-actions {
              flex-direction: column;
            }

            .positions-cta-btn {
              width: 100%;
            }
          }
        `}</style>
      </main>
    </ServiceTheme>
  );
}