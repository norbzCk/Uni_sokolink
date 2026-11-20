import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import type {
  InventoryAnalytics,
  InventoryItem,
  Product,
  StockMovement,
} from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import { RankedBars, StockHealthDonut, TrendChart } from '../../components/charts';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/use-api';

type InventoryPayload = {
  items: InventoryItem[];
  products: Product[];
  analytics: InventoryAnalytics;
};
type InventoryRange = 7 | 30 | 90;
type InventoryFilter = 'all' | 'attention' | 'out' | 'healthy';
type InventorySort = 'updated' | 'name' | 'available' | 'onHand';

const RANGES: InventoryRange[] = [7, 30, 90];

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback;
}

export function SellerInventoryPage() {
  const { authRequest } = useAuth();
  const [range, setRange] = useState<InventoryRange>(30);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, { delta: string; reason: string }>>({});
  const [thresholds, setThresholds] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<{ productId: string; movements: StockMovement[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [sort, setSort] = useState<InventorySort>('updated');

  async function loadPayload(selectedRange: InventoryRange): Promise<InventoryPayload> {
    const [inventory, catalogue, analytics] = await Promise.all([
      authRequest<{ items: InventoryItem[] }>('/inventory/seller/items'),
      authRequest<{ items: Product[] }>('/catalogue/seller/products'),
      authRequest<InventoryAnalytics>(`/inventory/seller/analytics?days=${selectedRange}`),
    ]);
    return { items: inventory.items, products: catalogue.items, analytics };
  }

  const data = useApi<InventoryPayload>(() => loadPayload(range), [range]);

  function setBusyKey(key: string, active: boolean) {
    setBusy((current) => {
      const next = new Set(current);
      if (active) next.add(key);
      else next.delete(key);
      return [...next];
    });
  }

  async function refresh() {
    data.setData(await loadPayload(range));
  }

  async function adjust(productId: string) {
    const entry = adjustments[productId];
    if (!entry) return;
    const quantityDelta = Number(entry.delta);
    const reason = entry.reason.trim();
    if (!Number.isInteger(quantityDelta) || quantityDelta === 0 || Math.abs(quantityDelta) > 1_000_000 || reason.length < 3) {
      setError('Enter a non-zero whole quantity and a reason of at least 3 characters.');
      return;
    }
    setBusyKey(productId + 'adjust', true);
    setError(null);
    try {
      await authRequest('/inventory/seller/items/' + productId + '/adjust', {
        method: 'POST',
        body: JSON.stringify({ quantityDelta, reason }),
      });
      setAdjustments((current) => ({ ...current, [productId]: { delta: '', reason: '' } }));
      setHistory(null);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught, 'The stock adjustment could not be saved.'));
    } finally {
      setBusyKey(productId + 'adjust', false);
    }
  }

  async function saveSettings(productId: string) {
    const value = thresholds[productId];
    if (value === undefined) return;
    const lowStockThreshold = Number(value);
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 100_000) {
      setError('Enter a low-stock threshold between 0 and 100,000.');
      return;
    }
    setBusyKey(productId + 'settings', true);
    setError(null);
    try {
      await authRequest('/inventory/seller/items/' + productId + '/settings', {
        method: 'PATCH',
        body: JSON.stringify({ lowStockThreshold }),
      });
      setHistory(null);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught, 'Stock settings could not be saved.'));
    } finally {
      setBusyKey(productId + 'settings', false);
    }
  }

  async function showHistory(productId: string) {
    setError(null);
    setLoadingHistory(productId);
    try {
      const result = await authRequest<{ item: InventoryItem; movements: StockMovement[] }>(
        '/inventory/seller/items/' + productId + '/movements',
      );
      setHistory({ productId, movements: result.movements });
    } catch (caught) {
      setError(errorMessage(caught, 'Stock history could not be loaded.'));
    } finally {
      setLoadingHistory(null);
    }
  }

  if (data.loading) return <LoadingState label="Loading inventory" />;
  if (data.error) return <ErrorState message={data.error} />;

  const products = data.data?.products ?? [];
  const items = data.data?.items ?? [];
  const analytics = data.data?.analytics ?? null;
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const productUnits = new Map(products.map((product) => [product.id, product.unit]));
  const searchTerm = search.trim().toLowerCase();
  const attentionCount = items.filter((item) => item.lowStock).length;
  const outCount = items.filter((item) => item.outOfStock).length;
  const healthyCount = items.length - attentionCount;
  const filteredItems = [...items]
    .filter((item) => {
      const name = productNames.get(item.productId) ?? '';
      if (searchTerm && !name.toLowerCase().includes(searchTerm)) return false;
      if (filter === 'attention') return item.lowStock;
      if (filter === 'out') return item.outOfStock;
      if (filter === 'healthy') return !item.lowStock;
      return true;
    })
    .sort((left, right) => {
      if (sort === 'name') {
        return (productNames.get(left.productId) ?? '').localeCompare(productNames.get(right.productId) ?? '');
      }
      if (sort === 'available') return right.available - left.available;
      if (sort === 'onHand') return right.onHand - left.onHand;
      return 0;
    });
  const rankedProducts = (analytics?.topMoved ?? []).map((entry) => ({
    id: entry.productId,
    label: productNames.get(entry.productId) ?? 'Product',
    value: entry.stockOut + entry.stockIn,
    detail: `${entry.movements} movements · ${entry.stockOut} out · ${entry.stockIn} in`,
  }));

  return (
    <div className="inventory-page">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">INVENTORY INTELLIGENCE</p>
          <h1>Stock control</h1>
          <p className="muted">
            Track stock health, review movement trends, and keep reserved stock safe for placed orders.
          </p>
        </div>
        <div className="inventory-heading-actions">
          <button className="button button-outline button-small" type="button" onClick={() => refresh()}>
            Refresh data
          </button>
          <Link className="button button-primary button-small" to="/seller/products/new">
            Add product
          </Link>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="stat-grid">
        <article className="stat-card">
          <span>Available units</span>
          <strong>{analytics?.summary.available ?? 0}</strong>
          <span className="muted">Ready for new orders</span>
        </article>
        <article className="stat-card">
          <span>Needs attention</span>
          <strong>{analytics?.summary.lowStockProducts ?? 0}</strong>
          <Link className="text-link" to="/seller/inventory" onClick={() => setFilter('attention')}>
            Review stock alerts
          </Link>
        </article>
        <article className="stat-card">
          <span>Reserved units</span>
          <strong>{analytics?.summary.reserved ?? 0}</strong>
          <span className="muted">Held for placed orders</span>
        </article>
        <article className="stat-card">
          <span>Stock out · {range}d</span>
          <strong>{analytics?.summary.stockOut ?? 0}</strong>
          <span className="muted">{analytics?.summary.movementCount ?? 0} ledger movements</span>
        </article>
      </div>

      <div className="inventory-dashboard">
        <article className="account-card chart-card chart-card-primary">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">MOVEMENT TREND</p>
              <h2>Stock in versus stock out</h2>
            </div>
            <div className="segmented compact" role="group" aria-label="Analytics period">
              {RANGES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={range === value}
                  className={range === value ? 'active' : ''}
                  onClick={() => setRange(value)}
                >
                  {value} days
                </button>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-swatch swatch-in" aria-hidden="true" /> Stock in</span>
            <span><i className="legend-swatch swatch-out" aria-hidden="true" /> Stock out</span>
            <span className="muted">Net change: {analytics?.summary.netOnHand ?? 0} units</span>
          </div>
          <TrendChart points={analytics?.trend ?? []} />
        </article>

        <article className="account-card chart-card chart-card-health">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">STOCK HEALTH</p>
              <h2>Catalogue coverage</h2>
            </div>
          </div>
          <StockHealthDonut
            healthy={analytics?.summary.healthyProducts ?? 0}
            low={analytics?.summary.lowStockProducts ?? 0}
            out={analytics?.summary.outOfStockProducts ?? 0}
          />
        </article>

        <article className="account-card chart-card chart-card-wide">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">PRODUCT ACTIVITY</p>
              <h2>Fastest moving products</h2>
            </div>
            <span className="muted">Ranked by stock movement in the selected period</span>
          </div>
          <RankedBars items={rankedProducts} />
        </article>
      </div>

      <section className="inventory-management">
        <div className="inventory-toolbar">
          <div>
            <h2>Stock items</h2>
            <p className="muted">Adjust stock, tune alerts, and audit every movement.</p>
          </div>
          <div className="inventory-controls">
            <input
              type="search"
              aria-label="Search inventory"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Sort inventory"
              value={sort}
              onChange={(event) => setSort(event.target.value as InventorySort)}
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name A-Z</option>
              <option value="available">Available stock</option>
              <option value="onHand">On-hand stock</option>
            </select>
          </div>
        </div>

        <div className="segmented inventory-filters" role="group" aria-label="Stock filter">
          <button
            type="button"
            aria-pressed={filter === 'all'}
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === 'attention'}
            className={filter === 'attention' ? 'active' : ''}
            onClick={() => setFilter('attention')}
          >
            Needs attention ({attentionCount})
          </button>
          <button
            type="button"
            aria-pressed={filter === 'out'}
            className={filter === 'out' ? 'active' : ''}
            onClick={() => setFilter('out')}
          >
            Out of stock ({outCount})
          </button>
          <button
            type="button"
            aria-pressed={filter === 'healthy'}
            className={filter === 'healthy' ? 'active' : ''}
            onClick={() => setFilter('healthy')}
          >
            Healthy ({healthyCount})
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-panel">
            <h2>No stock items yet.</h2>
            <p className="muted">Stock is created when you add an approved product.</p>
            <Link className="button button-primary" to="/seller/products/new">Add your first product</Link>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-panel">
            <h2>No matching stock items.</h2>
            <p className="muted">Try a different search or stock filter.</p>
          </div>
        ) : (
          <div className="inventory-list">
            {filteredItems.map((item) => {
              const name = productNames.get(item.productId) ?? 'Product';
              const unit = productUnits.get(item.productId) ?? item.unit;
              const adjustment = adjustments[item.productId] ?? { delta: '', reason: '' };
              const threshold = thresholds[item.productId] ?? String(item.lowStockThreshold);
              const meterMax = Math.max(item.onHand, item.lowStockThreshold * 2, 1);
              const availableWidth = Math.min((Math.max(item.available, 0) / meterMax) * 100, 100);
              const thresholdLeft = Math.min((item.lowStockThreshold / meterMax) * 100, 100);
              return (
                <article
                  className={'inventory-card' + (item.lowStock ? ' low-stock' : '') + (item.outOfStock ? ' out-of-stock' : '')}
                  key={item.productId}
                >
                  <div className="inventory-head">
                    <div>
                      <h2>{name}</h2>
                      <span className="muted inventory-subtitle">{unit} · alert at {item.lowStockThreshold}</span>
                      <div>
                        <span className={'badge ' + (item.outOfStock ? 'badge-danger' : item.lowStock ? 'badge-warning' : 'badge-success')}>
                          {item.outOfStock ? 'Out of stock' : item.lowStock ? 'Low stock' : 'Healthy'}
                        </span>
                      </div>
                    </div>
                    <div className="inventory-numbers">
                      <div><span>On hand</span><strong>{item.onHand}</strong></div>
                      <div><span>Reserved</span><strong>{item.reserved}</strong></div>
                      <div><span>Available</span><strong>{item.available}</strong></div>
                    </div>
                  </div>

                  <div
                    className="stock-meter"
                    role="img"
                    aria-label={`${item.available} of ${item.onHand} units available, alert threshold ${item.lowStockThreshold}`}
                  >
                    <span className="stock-meter-fill" style={{ width: `${availableWidth}%` }} />
                    <span className="stock-meter-threshold" style={{ left: `${thresholdLeft}%` }} />
                  </div>

                  <div className="inventory-actions">
                    <div className="inline-form">
                      <input
                        aria-label={'Stock adjustment for ' + name}
                        type="number"
                        placeholder="+/- quantity"
                        value={adjustment.delta}
                        onChange={(event) =>
                          setAdjustments((current) => ({
                            ...current,
                            [item.productId]: { ...adjustment, delta: event.target.value },
                          }))
                        }
                      />
                      <input
                        aria-label={'Adjustment reason for ' + name}
                        placeholder="Reason for adjustment"
                        value={adjustment.reason}
                        onChange={(event) =>
                          setAdjustments((current) => ({
                            ...current,
                            [item.productId]: { ...adjustment, reason: event.target.value },
                          }))
                        }
                      />
                      <button
                        className="button button-primary button-small"
                        type="button"
                        aria-busy={busy.includes(item.productId + 'adjust')}
                        disabled={
                          busy.includes(item.productId + 'adjust') ||
                          !adjustment.delta ||
                          adjustment.reason.trim().length < 3
                        }
                        onClick={() => adjust(item.productId)}
                      >
                        {busy.includes(item.productId + 'adjust') ? 'Adjusting…' : 'Adjust stock'}
                      </button>
                    </div>
                    <div className="inline-form">
                      <label className="inline-label">
                        Low stock alert
                        <input
                          aria-label={'Low stock threshold for ' + name}
                          type="number"
                          min={0}
                          max={100000}
                          value={threshold}
                          onChange={(event) =>
                            setThresholds((current) => ({ ...current, [item.productId]: event.target.value }))
                          }
                        />
                      </label>
                      <button
                        className="button button-outline button-small"
                        type="button"
                        aria-busy={busy.includes(item.productId + 'settings')}
                        disabled={busy.includes(item.productId + 'settings')}
                        onClick={() => saveSettings(item.productId)}
                      >
                        {busy.includes(item.productId + 'settings') ? 'Saving…' : 'Save alert'}
                      </button>
                      <button
                        className="button button-outline button-small"
                        type="button"
                        aria-busy={loadingHistory === item.productId}
                        disabled={loadingHistory === item.productId}
                        onClick={() => showHistory(item.productId)}
                      >
                        {loadingHistory === item.productId ? 'Loading…' : 'History'}
                      </button>
                    </div>
                  </div>

                  {history?.productId === item.productId && (
                    <div className="movement-list">
                      <div className="movement-list-head">
                        <strong>Movement history · {name}</strong>
                        <button className="link-button" type="button" onClick={() => setHistory(null)}>
                          Close history
                        </button>
                      </div>
                      {history.movements.length === 0 ? (
                        <p className="muted">No movements recorded.</p>
                      ) : (
                        history.movements.map((movement) => (
                          <div className="movement-row" key={movement.id}>
                            <span><span className={'badge badge-neutral movement-badge'}>{movement.type.toLowerCase()}</span></span>
                            <span className="muted">{movement.reason}</span>
                            <span>
                              {movement.onHandDelta >= 0 ? '+' : ''}{movement.onHandDelta} on hand /
                              {movement.reservedDelta >= 0 ? '+' : ''}{movement.reservedDelta} reserved
                            </span>
                            <span className="muted">{formatDateTime(movement.createdAt)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
