import { Link, Outlet } from 'react-router-dom';

export function SellerLayout() {
  return (
    <section className="workspace-shell">
      <aside className="workspace-nav" aria-label="Seller workspace">
        <p className="eyebrow">SELLER WORKSPACE</p>
        <p className="workspace-label">Your business space</p>
        <Link to="/seller">Overview</Link>
        <span className="nav-muted">More tools will appear as they become available.</span>
      </aside>
      <div className="workspace-content"><Outlet /></div>
    </section>
  );
}
