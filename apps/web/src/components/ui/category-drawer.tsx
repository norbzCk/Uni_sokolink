import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { Category } from '../../api/marketplace';

export function CategoryDrawer({
  open,
  categories,
  onClose,
}: {
  open: boolean;
  categories: Category[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <button className="overlay" type="button" aria-label="Close categories" onClick={onClose} />
      <aside className="drawer" aria-label="Browse categories">
        <div className="drawer-head">
          <h2>Shop by category</h2>
          <button className="drawer-close" type="button" onClick={onClose} aria-label="Close categories">
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body">
          <p className="drawer-section">Marketplace</p>
          {categories.map((category) => (
            <Link key={category.id} to={'/c/' + category.slug} onClick={onClose}>
              {category.name}
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
                {category.productCount}
              </span>
            </Link>
          ))}
          <p className="drawer-section">For sellers</p>
          <Link to="/sell" onClick={onClose}>Sell on SokoLink</Link>
          <Link to="/seller" onClick={onClose}>Seller workspace</Link>
          <p className="drawer-section">Help</p>
          <Link to="/help" onClick={onClose}>Help centre</Link>
          <Link to="/policies/refunds" onClick={onClose}>Refunds and returns</Link>
        </div>
      </aside>
    </>
  );
}
