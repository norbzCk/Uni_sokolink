import { useState } from 'react';
import { ApiError } from '../../api/client';
import type { InventoryItem, Product, StockMovement } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/use-api';

type InventoryPayload = { items: InventoryItem[]; products: Product[] };

export function SellerInventoryPage() {
  const { authRequest } = useAuth();
  const data = useApi<InventoryPayload>(async () => {
    const [inventory, catalogue] = await Promise.all([
      authRequest<{ items: InventoryItem[] }>('/inventory/seller/items'),
      authRequest<{ items: Product[] }>('/catalogue/seller/products'),
    ]);
    return { items: inventory.items, products: catalogue.items };
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, { delta: string; reason: string }>>({});
  const [thresholds, setThresholds] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<{ productId: string; movements: StockMovement[] } | null>(null);

  async function refresh() {
    const [inventory, catalogue] = await Promise.all([
      authRequest<{ items: InventoryItem[] }>('/inventory/seller/items'),
      authRequest<{ items: Product[] }>('/catalogue/seller/products'),
    ]);
    data.setData({ items: inventory.items, products: catalogue.items });
  }

  async function adjust(productId: string) {
    const entry = adjustments[productId];
    if (!entry) return;
    setBusy(productId + 'adjust');
    setError(null);
    try {
      await authRequest('/inventory/seller/items/' + productId + '/adjust', {
        method: 'POST',
        body: JSON.stringify({ quantityDelta: Number(entry.delta), reason: entry.reason.trim() }),
      });
      setAdjustments((current) => ({ ...current, [productId]: { delta: '', reason: '' } }));
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The stock adjustment could not be saved.');
    } finally {
      setBusy(null);
    }
  }

  async function saveSettings(productId: string) {
    const value = thresholds[productId];
    if (value === undefined) return;
    setBusy(productId + 'settings');
    setError(null);
    try {
      await authRequest('/inventory/seller/items/' + productId + '/settings', {
        method: 'PATCH',
        body: JSON.stringify({ lowStockThreshold: Number(value) }),
      });
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Stock settings could not be saved.');
    } finally {
      setBusy(null);
    }
  }

  async function showHistory(productId: string) {
    setError(null);
    try {
      const result = await authRequest<{ item: InventoryItem; movements: StockMovement[] }>(
        '/inventory/seller/items/' + productId + '/movements',
      );
      setHistory({ productId, movements: result.movements });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Stock history could not be loaded.');
    }
  }

  if (data.loading) return <LoadingState label="Loading inventory" />;
  if (data.error) return <ErrorState message={data.error} />;

  const productNames = new Map((data.data?.products ?? []).map((product) => [product.id, product.name]));
  const items = data.data?.items ?? [];

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">INVENTORY</p>
          <h1>Stock control</h1>
          <p className="muted">Reserved stock is held for placed orders. On-hand stock changes only when orders are delivered or you adjust it.</p>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {items.length === 0 ? (
        <div className="empty-panel">
          <h2>No stock items yet.</h2>
          <p className="muted">Stock is created when you add a product.</p>
        </div>
      ) : (
        <div className="inventory-list">
          {items.map((item) => {
            const adjustment = adjustments[item.productId] ?? { delta: '', reason: '' };
            const threshold = thresholds[item.productId] ?? String(item.lowStockThreshold);
            return (
              <article className={'inventory-card' + (item.lowStock ? ' low-stock' : '')} key={item.productId}>
                <div className="inventory-head">
                  <div>
                    <h2>{productNames.get(item.productId) ?? 'Product'}</h2>
                    <span className={'badge ' + (item.outOfStock ? 'badge-danger' : item.lowStock ? 'badge-warning' : 'badge-success')}>
                      {item.outOfStock ? 'Out of stock' : item.lowStock ? 'Low stock' : 'In stock'}
                    </span>
                  </div>
                  <div className="inventory-numbers">
                    <div><span>On hand</span><strong>{item.onHand}</strong></div>
                    <div><span>Reserved</span><strong>{item.reserved}</strong></div>
                    <div><span>Available</span><strong>{item.available}</strong></div>
                  </div>
                </div>

                <div className="inventory-actions">
                  <div className="inline-form">
                    <input
                      aria-label={'Stock adjustment for ' + (productNames.get(item.productId) ?? 'product')}
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
                      aria-label="Adjustment reason"
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
                      disabled={busy === item.productId + 'adjust' || !adjustment.delta || adjustment.reason.trim().length < 3}
                      onClick={() => adjust(item.productId)}
                    >
                      Adjust stock
                    </button>
                  </div>
                  <div className="inline-form">
                    <label className="inline-label">
                      Low stock alert
                      <input
                        type="number"
                        min={0}
                        value={threshold}
                        onChange={(event) =>
                          setThresholds((current) => ({ ...current, [item.productId]: event.target.value }))
                        }
                      />
                    </label>
                    <button className="button button-outline button-small" type="button" onClick={() => saveSettings(item.productId)}>
                      Save
                    </button>
                    <button className="button button-outline button-small" type="button" onClick={() => showHistory(item.productId)}>
                      History
                    </button>
                  </div>
                </div>

                {history?.productId === item.productId && (
                  <div className="movement-list">
                    {history.movements.length === 0 ? (
                      <p className="muted">No movements recorded.</p>
                    ) : (
                      history.movements.map((movement) => (
                        <div className="movement-row" key={movement.id}>
                          <span>{movement.type.toLowerCase()}</span>
                          <span className="muted">{movement.reason}</span>
                          <span>{movement.onHandDelta >= 0 ? '+' : ''}{movement.onHandDelta} on hand / {movement.reservedDelta >= 0 ? '+' : ''}{movement.reservedDelta} reserved</span>
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
    </div>
  );
}
