import { Link, useLocation } from 'react-router-dom';
import { Bike, Clock, MapPin, PackageCheck, Wallet } from 'lucide-react';

const sections: Record<string, { title: string; copy: string }> = {
  '/delivery/assignments': {
    title: 'Assignments',
    copy: 'Delivery dispatch is not connected to the marketplace yet, so there are no assignments to accept.',
  },
  '/delivery/coverage': {
    title: 'Coverage',
    copy: 'Coverage preferences will be available when delivery dispatch is connected. SokoLink currently uses campus pickup and seller-arranged delivery.',
  },
  '/delivery/earnings': {
    title: 'Earnings',
    copy: 'Delivery payouts will appear here once partner delivery is available.',
  },
};

export function DeliveryDashboardPage() {
  const { pathname } = useLocation();
  const section = sections[pathname];

  if (section) {
    return (
      <div className="workspace-entry">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">DELIVERY PARTNER</p>
            <h1>{section.title}</h1>
            <p className="muted">{section.copy}</p>
          </div>
          <Link className="button button-outline" to="/delivery">Back to overview</Link>
        </div>
        <div className="empty-panel">
          <h2>Nothing here yet</h2>
          <p className="muted">
            Partner delivery is not part of the current marketplace. Contact support if you were
            expecting access to delivery jobs.
          </p>
          <Link className="button button-outline" to="/contact">Contact support</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-entry">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">DELIVERY PARTNER</p>
          <h1>Delivery overview</h1>
          <p className="muted">Partner delivery is not available in the current marketplace.</p>
        </div>
        <span className="badge badge-warning">Setup pending</span>
      </div>
      <div className="stat-grid">
        <article className="stat-card">
          <span>Active assignments</span>
          <strong>—</strong>
          <span className="muted small-note">Dispatch not connected</span>
        </article>
        <article className="stat-card">
          <span>Delivered today</span>
          <strong>—</strong>
          <span className="muted small-note">No partner runs recorded</span>
        </article>
        <article className="stat-card">
          <span>Coverage area</span>
          <strong>—</strong>
          <span className="muted small-note">Coverage setup pending</span>
        </article>
        <article className="stat-card">
          <span>Earnings</span>
          <strong>—</strong>
          <span className="muted small-note">Payouts not available</span>
        </article>
      </div>
      <div className="info-grid">
        <article className="account-card">
          <Bike size={22} className="info-icon" />
          <h2>Delivery jobs</h2>
          <p className="muted">
            Orders currently use campus pickup or seller-arranged delivery. Partner dispatch is not
            connected to the marketplace API yet.
          </p>
          <Link className="text-link" to="/delivery/assignments">View assignments →</Link>
        </article>
        <article className="account-card">
          <MapPin size={22} className="info-icon" />
          <h2>Coverage</h2>
          <p className="muted">Coverage settings will open when dispatch is available.</p>
          <Link className="text-link" to="/delivery/coverage">Manage coverage →</Link>
        </article>
        <article className="account-card">
          <Wallet size={22} className="info-icon" />
          <h2>Earnings</h2>
          <p className="muted">Delivery fees and payouts will be tracked per completed order.</p>
          <Link className="text-link" to="/delivery/earnings">View earnings →</Link>
        </article>
        <article className="account-card">
          <PackageCheck size={22} className="info-icon" />
          <h2>Proof of delivery</h2>
          <p className="muted">Handoff confirmations will be available with dispatch integration.</p>
        </article>
      </div>
      <p className="muted small-note">
        <Clock size={13} /> Questions? <Link className="text-link" to="/contact">Contact SokoLink support</Link>.
      </p>
    </div>
  );
}
