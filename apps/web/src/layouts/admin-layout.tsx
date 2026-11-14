import { Link, NavLink, Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <section className="workspace-shell">
      <aside className="workspace-nav" aria-label="Administration workspace">
        <p className="eyebrow">ADMINISTRATION</p>
        <p className="workspace-label">Platform operations</p>
        <NavLink to="/admin" end>Overview</NavLink>
        <NavLink to="/admin/sellers">Seller applications</NavLink>
        <NavLink to="/admin/products">Product moderation</NavLink>
        <Link className="workspace-back" to="/products">← Marketplace</Link>
      </aside>
      <div className="workspace-content"><Outlet /></div>
    </section>
  );
}
