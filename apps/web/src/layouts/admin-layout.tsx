import { Link, Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <section className="workspace-shell">
      <aside className="workspace-nav" aria-label="Administration workspace">
        <p className="eyebrow">ADMINISTRATION</p>
        <p className="workspace-label">Platform operations</p>
        <Link to="/admin">Overview</Link>
        <span className="nav-muted">Restricted to authorized administrators.</span>
      </aside>
      <div className="workspace-content"><Outlet /></div>
    </section>
  );
}
