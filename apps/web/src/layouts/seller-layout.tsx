import { Link, NavLink, Outlet } from 'react-router-dom';

export function SellerLayout() {
  return (
    <section className="workspace-shell">
      <aside className="workspace-nav" aria-label="Seller workspace">
        <p className="eyebrow">SELLER WORKSPACE</p>
        <p className="workspace-label">Your business space</p>
        <NavLink to="/seller" end>Overview</NavLink>
        <NavLink to="/seller/orders">Orders</NavLink>
        <NavLink to="/seller/products">Products</NavLink>
        <NavLink to="/seller/inventory">Inventory</NavLink>
        <NavLink to="/seller/storefront">Storefront</NavLink>
        <Link className="workspace-back" to="/products">← Marketplace</Link>
      </aside>
      <div className="workspace-content"><Outlet /></div>
    </section>
  );
}
