import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faGear } from '@fortawesome/free-solid-svg-icons';

import { formatEta, type MaintenanceSettings } from '@/lib/maintenance';
import './maintenance.css';

/**
 * The maintenance page. Rendered full screen for visitors and, with `preview`,
 * inside a frame in the admin so what is typed there is exactly what visitors see.
 */
export default function MaintenanceView({ settings, preview = false }: { settings: MaintenanceSettings; preview?: boolean }) {
  const { title, message, eta, contactEmail } = settings;
  const etaInFuture = !!eta && new Date(eta).getTime() > Date.now();

  return (
    <main className={`mm-root${preview ? ' mm-preview' : ''}`}>
      <span className="mm-blob mm-blob-a" aria-hidden />
      <span className="mm-blob mm-blob-b" aria-hidden />
      <span className="mm-blob mm-blob-c" aria-hidden />

      <section className="mm-card" aria-labelledby="mm-title">
        <div className="mm-brand" aria-label="TechTour Ghana">
          <span>TECHTOUR</span>
          <span className="mm-brand-sub">GHANA</span>
        </div>

        <div>
          <span className="mm-badge" aria-hidden>
            <FontAwesomeIcon icon={faGear} className="mm-gear" />
          </span>
        </div>

        <div>
          <span className="mm-chip"><span className="mm-dot" aria-hidden />Scheduled maintenance</span>
        </div>

        <h1 id="mm-title" className="mm-title">{title}</h1>
        {message && <p className="mm-message">{message}</p>}

        {etaInFuture && eta && (
          <div>
            <div className="mm-eta">
              <FontAwesomeIcon icon={faClock} className="mm-eta-icon" aria-hidden />
              <div>
                <span className="mm-eta-label">Expected back</span>
                <time className="mm-eta-time" dateTime={eta}>{formatEta(eta)}</time>
              </div>
            </div>
          </div>
        )}

        <div className="mm-progress" role="presentation" />

        {contactEmail && (
          <p className="mm-contact">
            Need help in the meantime? <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        )}

        <p className="mm-foot">© {new Date().getFullYear()} TechTour Ghana</p>
      </section>
    </main>
  );
}
