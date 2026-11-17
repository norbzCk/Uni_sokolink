import { Link, useLocation } from 'react-router-dom';
import { Bike, Clock, MapPin, PackageCheck, Wallet } from 'lucide-react';

const sections: Record<string, { title: string; copy: string }> = {
  '/delivery/assignments': {
    title: 'Assignments',
    copy: 'Accepted delivery jobs will appear here once dispatch is connected to the delivery partner network.',
  },
  '/delivery/coverage': {
    title: 'Coverage',
    copy: 'Set the campus and Dar es Salaam areas you can cover. Dispatch will match nearby orders to you.',
  },
  '/delivery/earnings': {
    title: 'Earnings',
    copy: 'Completed delivery fees and payout summaries will appear here after your first delivered order.',
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
          <p className="muted">This workspace is ready for delivery dispatch integration.</p>
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
          <p className="muted">Track assignments, coverage and earnings in one place.</p>
        </div>
        <span className="badge badge-warning">Setup pending</span>
      </div>
      <div className="stat-grid">
        <article className="stat-card">
          <span>Active assignments</span>
          <strong>0</strong>
          <span className="muted small-note">Awaiting dispatch connection</span>
        </article>
        <article className="stat-card">
          <span>Delivered today</span>
          <strong>0</strong>
          <span className="muted small-note">No completed runs yet</span>
        </article>
        <article className="stat-card">
          <span>Coverage area</span>
          <strong>Dar</strong>
          <span className="muted small-note">Campus and nearby areas</span>
        </article>
        <article className="stat-card">
          <span>Earnings</span>
          <strong>TSh 0</strong>
          <span className="muted small-note">Payouts after delivery</span>
        </article>
      </div>
      <div className="info-grid">
        <article className="account-card">
          <Bike size={22} className="info-icon" />
          <h2>Accept delivery jobs</h2>
          <p className="muted">
            Delivery dispatch is not connected to the marketplace API yet. Your profile and coverage
            preferences are ready.
          </p>
        </article>
        <article className="account-card">
          <MapPin size={22} className="info-icon" />
          <h2>Set your coverage</h2>
          <p className="muted">Choose the areas you can reach between classes and around campus.</p>
          <Link className="text-link" to="/delivery/coverage">Manage coverage →</Link>
        </article>
        <article className="account-card">
          <Wallet size={22} className="info-icon" />
          <h2>Get paid</h2>
          <p className="muted">Delivery fees are tracked per completed order and shown in earnings.</p>
        </article>
        <article className="account-card">
          <PackageCheck size={22} className="info-icon" />
          <h2>Proof of delivery</h2>
          <p className="muted">Mark orders delivered and add a handoff note for the buyer and seller.</p>
        </article>
      </div>
      <p className="muted small-note">
        <Clock size={13} /> This workspace is a UI shell until delivery endpoints are added.
      </p>
    </div>
  );
}
