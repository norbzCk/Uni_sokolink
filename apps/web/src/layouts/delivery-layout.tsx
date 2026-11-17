import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, Bike, ClipboardList, LayoutDashboard, MapPin } from 'lucide-react';

export function DeliveryLayout() {
  return (
    <section className="workspace-shell">
      <aside className="workspace-nav" aria-label="Delivery workspace">
        <p className="eyebrow">DELIVERY PARTNER</p>
        <p className="workspace-label">Delivery desk</p>
        <NavLink to="/delivery" end>
          <LayoutDashboard size={16} /> Overview
        </NavLink>
        <NavLink to="/delivery/assignments">
          <ClipboardList size={16} /> Assignments
        </NavLink>
        <NavLink to="/delivery/coverage">
          <MapPin size={16} /> Coverage
        </NavLink>
        <NavLink to="/delivery/earnings">
          <Bike size={16} /> Earnings
        </NavLink>
        <Link className="workspace-back" to="/">
          <ArrowLeft size={14} /> Marketplace
        </Link>
      </aside>
      <div className="workspace-content">
        <Outlet />
      </div>
    </section>
  );
}
