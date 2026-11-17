import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, Menu, ShieldCheck, Users, X } from 'lucide-react';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/sellers', label: 'Seller applications', icon: Users, end: false },
  { to: '/admin/products', label: 'Product moderation', icon: ShieldCheck, end: false },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <section className="workspace-shell">
      <aside className={'workspace-nav' + (open ? ' open' : '')} aria-label="Administration workspace">
        <div className="workspace-nav-head">
          <p className="eyebrow">ADMINISTRATION</p>
          <p className="workspace-label">Platform operations</p>
          <button className="icon-button workspace-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} end={link.end}>
              <Icon size={16} />
              {link.label}
            </NavLink>
          );
        })}
        <Link className="workspace-back" to="/search"><ArrowLeft size={15} /> Marketplace</Link>
      </aside>
      {open && <button className="workspace-backdrop" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <div className="workspace-main">
        <div className="workspace-topbar">
          <button className="icon-button workspace-menu" type="button" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <strong>Administration</strong>
          <Link className="text-link" to="/admin/products">Review products</Link>
        </div>
        <div className="workspace-content"><Outlet /></div>
      </div>
    </section>
  );
}
