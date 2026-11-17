import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';

const LINKS = [
  { to: '/seller', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/seller/products', label: 'Products', icon: Package, end: false },
  { to: '/seller/inventory', label: 'Inventory', icon: Boxes, end: false },
  { to: '/seller/storefront', label: 'Storefront', icon: Store, end: false },
];

export function SellerLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <section className="workspace-shell">
      <aside className={'workspace-nav' + (open ? ' open' : '')} aria-label="Seller workspace">
        <div className="workspace-nav-head">
          <p className="eyebrow">SELLER WORKSPACE</p>
          <p className="workspace-label">Your business space</p>
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
          <strong>Seller workspace</strong>
          <Link className="text-link" to="/seller/products/new">Add product</Link>
        </div>
        <div className="workspace-content"><Outlet /></div>
      </div>
    </section>
  );
}
